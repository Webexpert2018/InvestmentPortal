import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RealtimeTranscriptionService } from './realtime-transcription.service';

// TODO: replace '*' with your actual frontend origin before production,
// and add auth (e.g. verify the socket's user owns sessionId) before
// trusting start_transcription / audio_chunk events.
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RingCentralGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RingCentralGateway.name);

  // Tracks which sessionIds this socket started, so we can clean up
  // OpenAI sessions if the browser tab closes/crashes mid-call.
  private socketSessions = new Map<string, Set<string>>();

  constructor(private readonly realtimeTranscription: RealtimeTranscriptionService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected for live transcription: ${client.id}`);
    this.socketSessions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // End any realtime sessions this socket owned so we don't leak
    // open OpenAI WebSocket connections (and keep paying for them).
    const sessions = this.socketSessions.get(client.id);
    if (sessions) {
      for (const sessionId of sessions) {
        this.realtimeTranscription.endSession(sessionId);
      }
      this.socketSessions.delete(client.id);
    }
  }

  @SubscribeMessage('start_transcription')
  handleStartTranscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    this.logger.log(`Received start_transcription for ${sessionId}`);

    this.realtimeTranscription.startSession(
      sessionId,
      // onDelta — partial text as it streams in
      (text: string) => {
        client.emit('transcript_delta', { sessionId, text });
      },
      // onCompleted — finalized text for one utterance
      (text: string) => {
        client.emit('transcript_chunk', { sessionId, text });
      },
      // onError
      (message: string) => {
        client.emit('transcription_error', { sessionId, message });
      },
    );

    this.socketSessions.get(client.id)?.add(sessionId);
  }

  /**
   * Expects raw PCM16 mono 24kHz audio, base64-encoded, sent frequently
   * (e.g. every 100-250ms) rather than as discrete .webm blobs. This
   * replaces the old 'audio_chunk' handler that hit whisper-1 per chunk.
   */
  @SubscribeMessage('audio_chunk')
  handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; audio: string },
  ) {
    try {
      this.realtimeTranscription.appendAudio(data.sessionId, data.audio);
    } catch (error: any) {
      this.logger.error(`Error forwarding audio chunk: ${error.message}`, error.stack);
    }
  }

  @SubscribeMessage('commit_audio')
  handleCommitAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    this.realtimeTranscription.commitAudio(data.sessionId);
  }

  @SubscribeMessage('stop_transcription')
  handleStopTranscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    this.realtimeTranscription.endSession(data.sessionId);
    this.socketSessions.get(client.id)?.delete(data.sessionId);
  }
}