import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class TwilioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(TwilioGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Frontend client connected for Twilio: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Frontend client disconnected: ${client.id}`);
  }

  broadcastTranscription(callSid: string, text: string, track: string) {
    this.server.emit('twilio_transcript', {
      callSid,
      text,
      track,
    });
  }
}
