import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async sendMessage(senderId: string, data: { content: string; recipientId?: string; targetRole?: string }) {
    const { content, recipientId, targetRole } = data;
    try {
      const query = `
        INSERT INTO messages (sender_id, recipient_id, target_role, content)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await db.query(query, [senderId, recipientId || null, targetRole || null, content]);
      const message = result.rows[0];

      // Trigger notification
      // Fetch sender name
      const senderResult = await db.query('SELECT full_name FROM investors WHERE id = $1', [senderId]);
      const senderName = senderResult.rows[0]?.full_name || 'An Investor';

      await this.notificationsService.createNotification({
        userId: recipientId,
        targetRole: targetRole || 'executive_admin', // Default to executive_admin if no role specified
        title: 'Investor Message Received',
        description: `${senderName}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        type: 'message',
        link: `/dashboard/investor/${senderId}`
      });

      return message;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  async getMessagesForUser(userId: string, role: string) {
    try {
      const query = `
        SELECT m.*, i.full_name as sender_name 
        FROM messages m
        LEFT JOIN investors i ON m.sender_id = i.id
        WHERE m.recipient_id = $1 OR m.target_role = $2 OR m.target_role IS NULL
        ORDER BY m.created_at ASC
      `;
      const result = await db.query(query, [userId, role]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }
}
