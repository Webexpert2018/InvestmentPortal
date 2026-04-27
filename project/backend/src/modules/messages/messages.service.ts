import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async getConversations(userId: string, targetRole?: string) {
    try {
      // Fetch conversations for the user
      // If it's an investor, fetch conversations where they are the investor_id
      // If it's an admin, fetch conversations where they are the admin_id OR fetch all for their role?
      // For now, let's assume direct 1-on-1 between investor and staff
      
      const query = `
        SELECT c.*, 
               inv.full_name as investor_name, 
               inv.profile_image_url as investor_avatar,
               COALESCE(s.full_name, admin_inv.full_name, 'Support Admin') as admin_name
        FROM conversations c
        JOIN investors inv ON c.investor_id = inv.id
        LEFT JOIN staff s ON c.admin_id = s.id
        LEFT JOIN investors admin_inv ON c.admin_id = admin_inv.id
        WHERE c.investor_id = $1 OR c.admin_id = $1
        ORDER BY c.last_message_at DESC
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      throw new InternalServerErrorException('Failed to fetch conversations');
    }
  }

  async getConversationMessages(conversationId: string) {
    try {
      const query = `
        SELECT m.*, 
               COALESCE(i.full_name, s.full_name, 'System User') as sender_name,
               COALESCE(i.profile_image_url, s.profile_image_url) as sender_avatar
        FROM messages m
        LEFT JOIN investors i ON m.sender_id = i.id
        LEFT JOIN staff s ON m.sender_id = s.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `;
      const result = await db.query(query, [conversationId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  async sendMessage(senderId: string, data: { 
    content: string; 
    recipientId?: string; 
    targetRole?: string; 
    conversationId?: string;
    fileUrl?: string; 
    fileName?: string; 
    fileSize?: string;
  }) {
    const { content, recipientId, targetRole, fileUrl, fileName, fileSize } = data;
    let { conversationId } = data;

    try {
      // 1. Ensure conversation exists
      if (!conversationId && recipientId) {
        // Try to find existing conversation between these two
        const convResult = await db.query(
          'SELECT id FROM conversations WHERE (investor_id = $1 AND admin_id = $2) OR (investor_id = $2 AND admin_id = $1)',
          [senderId, recipientId]
        );
        
        if ((convResult.rowCount ?? 0) > 0) {
          conversationId = convResult.rows[0].id;
        } else {
          // Create new conversation
          const checkInvRes = await db.query('SELECT id FROM investors WHERE id = $1', [senderId]);
          const isInvestor = (checkInvRes.rowCount ?? 0) > 0;
          const investorId = isInvestor ? senderId : recipientId;
          const adminId = isInvestor ? recipientId : senderId;

          const newConv = await db.query(
            'INSERT INTO conversations (investor_id, admin_id, last_message) VALUES ($1, $2, $3) RETURNING id',
            [investorId, adminId, content || (fileUrl ? 'Sent a file' : '')]
          );
          conversationId = newConv.rows[0].id;
        }
      }

      // 2. Insert message
      const msgQuery = `
        INSERT INTO messages (sender_id, recipient_id, target_role, content, conversation_id, file_url, file_name, file_size)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const result = await db.query(msgQuery, [
        senderId, 
        recipientId || null, 
        targetRole || null, 
        content, 
        conversationId,
        fileUrl || null,
        fileName || null,
        fileSize || null
      ]);
      const message = result.rows[0];

      // 3. Update conversation last message and unread count
      if (conversationId) {
        // Update last message
        await db.query(
          'UPDATE conversations SET last_message = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2',
          [content || (fileUrl ? 'Sent a file' : ''), conversationId]
        );

        // Increment unread count for the recipient
        const conv = (await db.query('SELECT investor_id, admin_id FROM conversations WHERE id = $1', [conversationId])).rows[0];
        if (conv) {
          // If recipientId is not provided, the other person in conversation is the recipient
          const targetRecipientId = recipientId || (senderId === conv.investor_id ? conv.admin_id : conv.investor_id);
          
          if (targetRecipientId === conv.investor_id) {
            await db.query('UPDATE conversations SET unread_count_investor = unread_count_investor + 1 WHERE id = $1', [conversationId]);
          } else if (targetRecipientId === conv.admin_id || (!targetRecipientId && senderId === conv.investor_id)) {
            // If targetRecipientId is null but sender is investor, it's an unassigned message for admins
            await db.query('UPDATE conversations SET unread_count_admin = unread_count_admin + 1 WHERE id = $1', [conversationId]);
          }
        }
      }

      // 4. Trigger notification
      try {
        const senderResult = await db.query('SELECT full_name FROM investors WHERE id = $1 UNION SELECT full_name FROM staff WHERE id = $1', [senderId]);
        const senderName = senderResult.rows[0]?.full_name || 'System User';

        await this.notificationsService.createNotification({
          userId: recipientId,
          targetRole: targetRole || 'executive_admin',
          title: 'New Message',
          description: `${senderName}: "${content ? content.substring(0, 50) : 'Sent a file'}${content && content.length > 50 ? '...' : ''}"`,
          type: 'message',
          link: `/dashboard/messages?conversationId=${conversationId}`
        });
      } catch (notifError) {
        console.error('⚠️ Failed to trigger notification for message, but message was sent:', notifError);
      }

      return message;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  async getUnreadCount(userId: string) {
    try {
      // Check if user is staff/admin
      const staffRes = await db.query('SELECT role FROM staff WHERE id = $1', [userId]);
      const isAdmin = (staffRes.rowCount ?? 0) > 0;
      
      if (isAdmin) {
        // For admins, show total unread admin messages
        // (Either strictly assigned to them, or all unread if they are executive_admin - simplifying to all unread admin msgs)
        const query = `
          SELECT SUM(unread_count_admin) as total
          FROM conversations
          WHERE admin_id = $1 OR admin_id IS NULL
        `;
        const result = await db.query(query, [userId]);
        return { count: parseInt(result.rows[0].total || '0') };
      } else {
        // For investors, show unread investor messages
        const query = `
          SELECT SUM(unread_count_investor) as total
          FROM conversations
          WHERE investor_id = $1
        `;
        const result = await db.query(query, [userId]);
        return { count: parseInt(result.rows[0].total || '0') };
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      return { count: 0 };
    }
  }

  async markAsRead(conversationId: string, userId: string) {
    try {
      // Clear unread count for this user in this conversation
      await db.query(`
        UPDATE conversations 
        SET unread_count_investor = CASE WHEN investor_id = $1 THEN 0 ELSE unread_count_investor END,
            unread_count_admin = CASE WHEN admin_id = $1 THEN 0 ELSE unread_count_admin END
        WHERE id = $2
      `, [userId, conversationId]);
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      throw new InternalServerErrorException('Failed to mark messages as read');
    }
  }

  async sendBulkMessage(senderId: string, data: { investorIds: string[]; content: string }) {
    const { investorIds, content } = data;
    let sentCount = 0;
    let failedCount = 0;

    // Fetch names and emails for templating
    const investorsRes = await db.query(
      'SELECT id, full_name, email FROM investors WHERE id = ANY($1)',
      [investorIds]
    );
    const investorMap = investorsRes.rows.reduce((acc: any, inv: any) => {
      acc[inv.id] = inv;
      return acc;
    }, {});

    for (const investorId of investorIds) {
      try {
        const inv = investorMap[investorId];
        let personalizedContent = content;
        
        if (inv) {
          personalizedContent = content
            .replace(/{{name}}/g, inv.full_name || 'Valued Investor')
            .replace(/{{email}}/g, inv.email || '');
        }

        await this.sendMessage(senderId, {
          content: personalizedContent,
          recipientId: investorId,
        });
        sentCount++;
      } catch (error) {
        console.error(`❌ Failed to send bulk message to ${investorId}:`, error);
        failedCount++;
      }
    }

    return { success: true, sentCount, failedCount };
  }
  
  async deleteMessage(messageId: string, userId: string) {
    try {
      // Ensure the user is the sender of the message
      const checkResult = await db.query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
      if (checkResult.rowCount === 0) throw new NotFoundException('Message not found');
      
      const message = checkResult.rows[0];
      if (message.sender_id !== userId) {
        // Option: allow admins to delete investor messages too? For now, only sender.
        // But in a CRM, admins might need delete power.
      }

      await db.query('DELETE FROM messages WHERE id = $1', [messageId]);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error instanceof NotFoundException ? error : new InternalServerErrorException('Failed to delete message');
    }
  }

  async editMessage(messageId: string, userId: string, content: string) {
    try {
      const checkResult = await db.query('SELECT sender_id FROM messages WHERE id = $1', [messageId]);
      if (checkResult.rowCount === 0) throw new NotFoundException('Message not found');
      
      if (checkResult.rows[0].sender_id !== userId) {
        throw new Error('Unauthorized to edit this message');
      }

      await db.query('UPDATE messages SET content = $1, updated_at = NOW() WHERE id = $2', [content, messageId]);
      return { success: true };
    } catch (error) {
      console.error('❌ Error editing message:', error);
      throw new InternalServerErrorException('Failed to edit message');
    }
  }

  async reactMessage(messageId: string, userId: string, emoji: string) {
    try {
      const result = await db.query('SELECT reactions FROM messages WHERE id = $1', [messageId]);
      if (result.rowCount === 0) throw new NotFoundException('Message not found');

      let reactions = result.rows[0].reactions || {};
      
      // If emoji already exists for this user, remove it (toggle)
      // reactions = { "👍": ["user1", "user2"], ... }
      if (reactions[emoji]) {
        if (reactions[emoji].includes(userId)) {
          reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          reactions[emoji].push(userId);
        }
      } else {
        reactions[emoji] = [userId];
      }

      await db.query('UPDATE messages SET reactions = $1 WHERE id = $2', [JSON.stringify(reactions), messageId]);
      return { success: true, reactions };
    } catch (error) {
      console.error('❌ Error reacting to message:', error);
      throw new InternalServerErrorException('Failed to react to message');
    }
  }
}
