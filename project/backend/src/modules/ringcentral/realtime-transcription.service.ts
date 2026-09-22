import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

interface LiveSession {
  ws: WebSocket;
  ready: boolean;
  // Buffer audio that arrives before the OpenAI session confirms it's ready,
  // so we don't drop the first ~100-300ms of the call.
  pendingAudio: string[];
  chunkCount?: number;
  commitInterval?: NodeJS.Timeout;
  initTimeout?: NodeJS.Timeout;
  debugAudioBuffer?: Buffer[];
  debugAudioChunks?: number;
  debugWavSaved?: boolean;
}

/**
 * Manages one persistent OpenAI Realtime (gpt-live-transcribe) WebSocket
 * session per active call. Replaces the old per-chunk REST-to-Whisper
 * approach: audio is appended continuously to a single stream, so there
 * are no WebM container-header issues and no out-of-order chunk problem.
 */
@Injectable()
export class RealtimeTranscriptionService {
  private readonly logger = new Logger(RealtimeTranscriptionService.name);
  private sessions = new Map<string, LiveSession>();

  constructor(private configService: ConfigService) { }

  /**
   * Opens a new realtime transcription session for a call.
   * onDelta is called with incremental (partial) transcript text.
   * onCompleted is called with the finalized text for one utterance/turn.
   */
  startSession(
    sessionId: string,
    onDelta: (text: string) => void,
    onCompleted: (text: string) => void,
    onError: (err: string) => void,
  ) {
    if (this.sessions.has(sessionId)) {
      this.logger.warn(`Session ${sessionId} already active, ignoring duplicate start`);
      return;
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      onError('OPENAI_API_KEY is not configured');
      return;
    }

    // Using your strict custom endpoint for gpt-live-transcribe
    const ws = new WebSocket('wss://api.openai.com/v1/realtime?intent=transcription', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const session: LiveSession = { ws, ready: false, pendingAudio: [] };
    this.sessions.set(sessionId, session);

    ws.on('open', () => {
      this.logger.log(`Realtime session opened for call ${sessionId}`);

      // Since your custom model does not support turn_detection, we MUST 
      // manually commit the audio buffer every 3 seconds to force transcription
      session.commitInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
        }
      }, 3000);
      
      const configPayload = {
        type: 'session.update',
        session: {
          type: 'transcription',
          audio: {
            input: {
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              transcription: {
                model: 'gpt-live-transcribe',
              },
              turn_detection: null,
            },
          },
        },
      };

      this.logger.debug(`[CONFIG] Sending session.update payload: ${JSON.stringify(configPayload, null, 2)}`);
      ws.send(JSON.stringify(configPayload));
    });

    ws.on('message', (raw: WebSocket.RawData) => {
      let event: any;
      try {
        event = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // Log all transcription-related events or unknown events to discover the exact schema
      if (
        event.type?.includes('transcription') || 
        event.type?.includes('item') || 
        event.type?.includes('response') || 
        event.type?.includes('error') ||
        event.type === 'session.updated'
      ) {
        // Truncate base64 audio data if present so we don't flood the terminal
        const safeEvent = { ...event };
        if (safeEvent.delta && safeEvent.delta.length > 50) safeEvent.delta = '[TRUNCATED_AUDIO]';
        if (safeEvent.audio) safeEvent.audio = '[TRUNCATED_AUDIO]';
        
        this.logger.verbose(`[OPENAI_EVENT] ${JSON.stringify(safeEvent)}`);
      }

      switch (event.type) {
        case 'session.updated':
          // Session config accepted — safe to start streaming audio now.
          this.logger.log(`Session ${sessionId} confirmed ready by OpenAI`);
          session.ready = true;
          for (const audio of session.pendingAudio) {
            ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio }));
          }
          session.pendingAudio = [];
          break;

        case 'conversation.item.input_audio_transcription.delta':
          this.logger.debug(`Delta for ${sessionId}: ${event.delta}`);
          if (event.delta) onDelta(event.delta);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          this.logger.log(`Completed transcript for ${sessionId}: [${event.transcript}]`);
          if (event.transcript) onCompleted(event.transcript);
          break;

        case 'error':
          if (event.error?.code === 'input_audio_buffer_commit_empty') {
            break;
          }
          this.logger.error(`OpenAI realtime error for ${sessionId}: ${JSON.stringify(event.error)}`);
          onError(event.error?.message || 'Unknown realtime API error');
          break;


        default:
          // Other event types (input_audio_buffer.speech_started, etc.) are
          // informational — log them (except the noisy append ack) so it's
          // obvious in the logs whether OpenAI is actually reaching the
          // transcription stage, not just accepting audio.
          if (event.type !== 'input_audio_buffer.append') {
            this.logger.log(`OpenAI Event: ${event.type}`);
          }
          break;
      }
    });

    ws.on('error', (err) => {
      this.logger.error(`WebSocket error for session ${sessionId}: ${err.message}`, err.stack);
      if (session.commitInterval) clearInterval(session.commitInterval);
      onError(err.message);
    });

    ws.on('close', (code, reason) => {
      this.logger.log(`Realtime session closed for call ${sessionId}: ${code} ${reason.toString()}`);
      if (session.commitInterval) clearInterval(session.commitInterval);
      this.sessions.delete(sessionId);
    });

    // Safety net: if OpenAI never confirms the session (bad config, auth
    // issue, outage), don't let pendingAudio grow forever — bail out after
    // 5s so the frontend gets a clear error instead of silent data loss.
    setTimeout(() => {
      const current = this.sessions.get(sessionId);
      if (current && !current.ready) {
        this.logger.error(`Session ${sessionId} never became ready after 5s, aborting`);
        onError('Transcription session failed to initialize in time');
        if (current.ws.readyState === WebSocket.OPEN) {
          current.ws.close(1000, 'init timeout');
        }
        this.sessions.delete(sessionId);
      }
    }, 5000);
  }

  /**
   * Appends a chunk of raw PCM16 audio (base64-encoded, 24kHz mono) to an
   * active session. Safe to call frequently (e.g. every 100-250ms).
   */
  appendAudio(sessionId: string, base64Pcm16: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`appendAudio called with no active session: ${sessionId}`);
      return;
    }

    if (!session.ready) {
      // Session config hasn't been acknowledged yet — buffer briefly
      // rather than dropping audio.
      session.pendingAudio.push(base64Pcm16);
      return;
    }

    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64Pcm16 }));

      session.chunkCount = (session.chunkCount || 0) + 1;
      
      // WAV capture diagnostic (approx 8.5 seconds of audio = 50 chunks at ~170ms each)
      if (!session.debugWavSaved) {
        if (!session.debugAudioBuffer) session.debugAudioBuffer = [];
        
        const buf = Buffer.from(base64Pcm16, 'base64');
        session.debugAudioBuffer.push(buf);
        
        if (session.debugAudioBuffer.length === 15) {
          session.debugWavSaved = true;
          const totalBuffer = Buffer.concat(session.debugAudioBuffer);
          
          let min = 32767;
          let max = -32768;
          let sumSq = 0;
          
          const samples = totalBuffer.length / 2;
          for (let i = 0; i < totalBuffer.length; i += 2) {
            const val = totalBuffer.readInt16LE(i);
            if (val < min) min = val;
            if (val > max) max = val;
            sumSq += val * val;
          }
          
          const rms = Math.sqrt(sumSq / samples);
          const duration = samples / 24000;
          
          this.logger.log(`[PCM Diagnostic] Captured ${totalBuffer.length} bytes (${duration.toFixed(2)} sec)`);
          this.logger.log(`[PCM Diagnostic] Min: ${min}, Max: ${max}, Peak: ${Math.max(Math.abs(min), Math.abs(max))}, RMS: ${rms.toFixed(2)}`);
          
          try {
            const fs = require('fs');
            const path = require('path');
            const wavPath = path.join(process.cwd(), `debug_audio_${sessionId}.wav`);
            
            const wavHeader = Buffer.alloc(44);
            wavHeader.write('RIFF', 0);
            wavHeader.writeUInt32LE(36 + totalBuffer.length, 4);
            wavHeader.write('WAVE', 8);
            wavHeader.write('fmt ', 12);
            wavHeader.writeUInt32LE(16, 16);
            wavHeader.writeUInt16LE(1, 20);
            wavHeader.writeUInt16LE(1, 22);
            wavHeader.writeUInt32LE(24000, 24);
            wavHeader.writeUInt32LE(24000 * 2, 28);
            wavHeader.writeUInt16LE(2, 32);
            wavHeader.writeUInt16LE(16, 34);
            wavHeader.write('data', 36);
            wavHeader.writeUInt32LE(totalBuffer.length, 40);

            fs.writeFileSync(wavPath, Buffer.concat([wavHeader, totalBuffer]));
            this.logger.log(`[PCM Diagnostic] Saved WAV to ${wavPath}. Please play this file to verify it contains human speech.`);
          } catch (e: any) {
            this.logger.error(`[PCM Diagnostic] Failed to save WAV: ${e.message}`);
          }
        }
      }

      if (session.chunkCount % 20 === 0) {
        // Diagnostic: check whether what we're sending is actually silence.
        const buf = Buffer.from(base64Pcm16, 'base64');
        const samples = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
        let maxAbs = 0;
        for (let i = 0; i < samples.length; i++) {
          const abs = Math.abs(samples[i]);
          if (abs > maxAbs) maxAbs = abs;
        }
        this.logger.debug(
          `Forwarded ${session.chunkCount} audio chunks to OpenAI for session ${sessionId} (last chunk peak amplitude: ${maxAbs}/32767)`,
        );
      }
    }
  }

  commitAudio(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session && session.ws.readyState === WebSocket.OPEN) {
      this.logger.log(`Frontend VAD triggered commit for session ${sessionId}`);
      session.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    }
  }

  endSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.commitInterval) clearInterval(session.commitInterval);

    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.close(1000, 'call ended');
    }
    this.sessions.delete(sessionId);
  }

  isActive(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}