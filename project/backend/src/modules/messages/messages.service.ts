import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(private readonly notificationsService: NotificationsService) { }

  async getConversations(userId: string) {
    try {
      const query = `
        SELECT 
          c.*,
          cp.unread_count,
          cp.is_admin as is_creator,
          (
            SELECT json_agg(json_build_object(
              'id', p_user.id,
              'name', COALESCE(p_inv.full_name, p_staff.full_name, p_users.first_name || ' ' || p_users.last_name),
              'avatar', COALESCE(p_inv.profile_image_url, p_staff.profile_image_url, p_users.profile_image_url)
            ))
            FROM conversation_participants cp_inner
            LEFT JOIN investors p_inv ON cp_inner.user_id = p_inv.id
            LEFT JOIN staff p_staff ON cp_inner.user_id = p_staff.id
            LEFT JOIN users p_users ON cp_inner.user_id = p_users.id
            JOIN (SELECT id FROM users UNION SELECT id FROM investors UNION SELECT id FROM staff) p_user ON cp_inner.user_id = p_user.id
            WHERE cp_inner.conversation_id = c.id
          ) as participants
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = $1
        ORDER BY c.updated_at DESC
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error: any) {
      console.error('❌ Error fetching conversations:', error);
      throw new InternalServerErrorException('Failed to fetch conversations');
    }
  }

  async getConversationMessages(conversationId: string) {
    try {
      const query = `
        SELECT m.*, 
               COALESCE(i.full_name, s.full_name, u.first_name || ' ' || u.last_name, 'System User') as sender_name,
               COALESCE(i.profile_image_url, s.profile_image_url, u.profile_image_url) as sender_avatar
        FROM messages m
        LEFT JOIN investors i ON m.sender_id = i.id
        LEFT JOIN staff s ON m.sender_id = s.id
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `;
      const result = await db.query(query, [conversationId]);
      return result.rows;
    } catch (error: any) {
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
        const conv = await this.getOrCreateConversation(senderId, [recipientId]);
        conversationId = conv.id;
      }

      if (!conversationId) {
        throw new InternalServerErrorException('Conversation ID is required');
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

      // 3. Update unread counts for ALL other participants
      await db.query(`
        UPDATE conversation_participants 
        SET unread_count = unread_count + 1 
        WHERE conversation_id = $1 AND user_id != $2
      `, [conversationId, senderId]);

      // 4. Update last message preview
      await db.query('UPDATE conversations SET last_message = $1, updated_at = NOW() WHERE id = $2', [
        content ? content.substring(0, 100) : 'Sent a file',
        conversationId
      ]);

      return message;
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  async getOrCreateConversation(senderId: string, participantIds: string[], groupName?: string, groupImageUrl?: string) {
    try {
      const allParticipants = Array.from(new Set([senderId, ...participantIds]));
      const isGroup = allParticipants.length > 2 || !!groupName;

      // 0. Identify sender role
      const senderRoleRes = await db.query(`
        SELECT role FROM staff WHERE id = $1
        UNION ALL
        SELECT role FROM users WHERE id = $1
        UNION ALL
        SELECT role FROM investors WHERE id = $1
      `, [senderId]);
      const senderRole = senderRoleRes.rows[0]?.role;

      // Identify investor_id and admin_id if possible
      let investor_id: string | null = null;
      let admin_id: string | null = null;
      for (const pId of allParticipants) {
        if (pId === senderId) continue; // Skip self for restriction check

        const userRes = await db.query(`
          SELECT 'investor' as role, assigned_accountant_id FROM investors WHERE id = $1
          UNION ALL
          SELECT role, null as assigned_accountant_id FROM staff WHERE id = $1
          UNION ALL
          SELECT role, null as assigned_accountant_id FROM users WHERE id = $1
        `, [pId]);

        if ((userRes.rowCount ?? 0) > 0) {
          const { role, assigned_accountant_id } = userRes.rows[0];

          // --- Accountant Restriction ---
          if (senderRole === 'accountant') {
            if (role !== 'investor' || assigned_accountant_id !== senderId) {
              throw new Error('Accountants can only message their assigned investors');
            }
          }
          // ------------------------------

          if (role === 'investor') {
            investor_id = pId;
          } else if (['staff', 'admin', 'executive_admin', 'fund_admin', 'investor_relations', 'accountant'].includes(role)) {
            if (!admin_id) admin_id = pId;
          }
        }
      }

      // 1. If not a group, try to find existing 1-on-1
      if (!isGroup && allParticipants.length === 2) {
        const p1 = allParticipants[0];
        const p2 = allParticipants[1];
        const existingConvRes = await db.query(`
          SELECT c.id 
          FROM conversations c
          JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
          JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
          WHERE c.is_group = FALSE 
            AND cp1.user_id = $1 
            AND cp2.user_id = $2
          LIMIT 1
        `, [p1, p2]);

        if ((existingConvRes.rowCount ?? 0) > 0) {
          return existingConvRes.rows[0];
        }
      }

      // 2. Create new conversation
      const newConvRes = await db.query(
        'INSERT INTO conversations (is_group, group_name, group_image_url, created_by, last_message, investor_id, admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [isGroup, groupName || null, groupImageUrl || null, senderId, 'New conversation started', investor_id, admin_id]
      );
      const conversationId = newConvRes.rows[0].id;

      // 3. Add participants
      const participantPromises = allParticipants.map(userId =>
        db.query(
          'INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ($1, $2, $3)',
          [conversationId, userId, userId === senderId]
        )
      );
      await Promise.all(participantPromises);

      return newConvRes.rows[0];
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to start conversation: ' + (error.message || error));
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const result = await db.query(`
        SELECT SUM(unread_count) as total
        FROM conversation_participants
        WHERE user_id = $1
      `, [userId]);
      return { count: parseInt(result.rows[0].total || '0') };
    } catch (error: any) {
      console.error('❌ Error fetching unread count:', error);
      return { count: 0 };
    }
  }

  async markAsRead(conversationId: string, userId: string) {
    try {
      await db.query(`
        UPDATE conversation_participants 
        SET unread_count = 0 
        WHERE conversation_id = $1 AND user_id = $2
      `, [conversationId, userId]);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error marking messages as read:', error);
      throw new InternalServerErrorException('Failed to mark messages as read');
    }
  }

  async deleteConversation(conversationId: string, userId: string) {
    try {
      // Check if user is the creator or an admin
      const checkRes = await db.query(
        'SELECT created_by FROM conversations WHERE id = $1',
        [conversationId]
      );
      if (checkRes.rowCount === 0) throw new NotFoundException('Conversation not found');

      if (checkRes.rows[0].created_by !== userId) {
        throw new Error('Unauthorized to delete this conversation');
      }

      await db.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error deleting conversation:', error);
      throw new InternalServerErrorException(error.message || 'Failed to delete conversation');
    }
  }

  async leaveConversation(conversationId: string, userId: string) {
    try {
      await db.query('DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [conversationId, userId]);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error leaving conversation:', error);
      throw new InternalServerErrorException('Failed to leave conversation');
    }
  }

  async removeParticipant(conversationId: string, targetUserId: string, requester: any) {
    const requesterId = typeof requester === 'string' ? requester : (requester.userId || requester.id);
    const isStaff = requester && typeof requester !== 'string' && ['admin', 'executive_admin', 'staff'].includes(requester.role);
    try {
      // Check if it is a group chat
      const convRes = await db.query(
        'SELECT is_group, created_by FROM conversations WHERE id = $1',
        [conversationId]
      );
      if (convRes.rowCount === 0) throw new NotFoundException('Conversation not found');
      if (!convRes.rows[0].is_group) {
        throw new Error('Cannot remove participants from a 1-on-1 conversation');
      }

      // Check if requester is admin of the conversation OR the creator
      const checkAdminRes = await db.query(
        'SELECT is_admin FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
        [conversationId, requesterId]
      );

      const isCreator = convRes.rows[0].created_by === requesterId;
      const isAdmin = (checkAdminRes.rowCount ?? 0) > 0 && checkAdminRes.rows[0].is_admin;

      if (!isAdmin && !isCreator && !isStaff) {
        throw new Error('Unauthorized to remove members');
      }

      await db.query('DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [conversationId, targetUserId]);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error removing participant:', error);
      throw new InternalServerErrorException(error.message || 'Failed to remove participant');
    }
  }

  async addParticipants(conversationId: string, participantIds: string[], requester: any, groupName?: string, groupImageUrl?: string) {
    const requesterId = typeof requester === 'string' ? requester : (requester.userId || requester.id);
    const isStaff = requester && typeof requester !== 'string' && ['admin', 'executive_admin', 'staff'].includes(requester.role);
    try {
      // Check if it is a group chat
      const convRes = await db.query(
        'SELECT is_group, created_by FROM conversations WHERE id = $1',
        [conversationId]
      );
      if (convRes.rowCount === 0) throw new NotFoundException('Conversation not found');
      const isGroup = convRes.rows[0].is_group;

      // Check if requester is admin of the conversation OR the creator
      const checkAdminRes = await db.query(
        'SELECT is_admin FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
        [conversationId, requesterId]
      );

      const isParticipant = (checkAdminRes.rowCount ?? 0) > 0;
      const isCreator = convRes.rows[0].created_by === requesterId;
      const isAdmin = isParticipant && checkAdminRes.rows[0].is_admin;

      // Authorization: 
      // - Admins and creators can always add members.
      // - In 1-on-1 chats, either participant can add members (which converts it to a group).
      if (!isAdmin && !isCreator && !isStaff) {
        if (isGroup || !isParticipant) {
          throw new Error('Unauthorized to add members');
        }
      }

      // If it's a 1-on-1 conversation, convert it to a group chat and update name/avatar if provided
      const updates = [];
      const values = [];

      if (!isGroup) {
        updates.push('is_group = TRUE');
      }

      if (groupName) {
        updates.push(`group_name = $${values.length + 2}`);
        values.push(groupName);
      }

      if (groupImageUrl) {
        updates.push(`group_image_url = $${values.length + 2}`);
        values.push(groupImageUrl);
      }

      if (updates.length > 0) {
        await db.query(
          `UPDATE conversations SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1`,
          [conversationId, ...values]
        );
      }

      const participantPromises = participantIds.map(async (userId) => {
        const existingRes = await db.query(
          'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
          [conversationId, userId]
        );

        if (existingRes.rowCount === 0) {
          return db.query(
            'INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ($1, $2, $3)',
            [conversationId, userId, false]
          );
        }
      });

      await Promise.all(participantPromises);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error adding participants:', error);
      throw new InternalServerErrorException(error.message || 'Failed to add participants');
    }
  }

  async sendBulkMessage(senderId: string, data: { investorIds: string[]; content: string }) {
    const { investorIds, content } = data;
    let sentCount = 0;
    let failedCount = 0;

    for (const investorId of investorIds) {
      try {
        await this.sendMessage(senderId, {
          content: content,
          recipientId: investorId,
        });
        sentCount++;
      } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('❌ Error reacting to message:', error);
      throw new InternalServerErrorException('Failed to react to message');
    }
  }
  async getAvailableUsers(userId: string) {
    try {
      // 1. Identify requester role
      const requesterRes = await db.query(`
        SELECT role FROM investors WHERE id = $1
        UNION
        SELECT role FROM staff WHERE id = $1
        UNION
        SELECT role FROM users WHERE id = $1
      `, [userId]);

      if (requesterRes.rowCount === 0) return [];
      const requesterRole = requesterRes.rows[0].role;
      const isInvestor = requesterRole === 'investor';

      let users: any[] = [];

      if (isInvestor) {
        // 1. Get investor's assigned staff IDs
        const invRes = await db.query('SELECT assigned_ir_id, assigned_accountant_id FROM investors WHERE id = $1', [userId]);
        const { assigned_ir_id, assigned_accountant_id } = invRes.rows[0] || {};

        // 2. Fetch executive admins from users table
        const adminUsersRes = await db.query(
          "SELECT id, first_name || ' ' || last_name as full_name, role, profile_image_url FROM users WHERE role = 'executive_admin' AND status = 'active'"
        );

        // 3. Fetch assigned IR and Accountant from staff table
        const assignedStaffIds = [assigned_ir_id, assigned_accountant_id].filter(Boolean);
        let staffResRows: any[] = [];
        if (assignedStaffIds.length > 0) {
          const staffRes = await db.query(
            "SELECT id, full_name, role, profile_image_url FROM staff WHERE id = ANY($1) AND status = 'active'",
            [assignedStaffIds]
          );
          staffResRows = staffRes.rows;
        }

        users = [
          ...staffResRows.map(r => ({ ...r, type: 'staff' })),
          ...adminUsersRes.rows.map(r => ({ ...r, type: 'admin' }))
        ];
      } else {
        // Staff/Admins branch
        let investorsRes;

        if (requesterRole === 'accountant') {
          // Accountants can only message their assigned investors
          investorsRes = await db.query(
            'SELECT id, full_name, role, profile_image_url FROM investors WHERE status = \'active\' AND assigned_accountant_id = $1',
            [userId]
          );

          // Per request "only message their assigned investors", we omit other staff/admins for accountants
          users = [
            ...investorsRes.rows.map(r => ({ ...r, type: 'investor' }))
          ];
        } else {
          // Other staff/admins can talk to everyone
          investorsRes = await db.query('SELECT id, full_name, role, profile_image_url FROM investors WHERE status = \'active\'');
          const staffRes = await db.query('SELECT id, full_name, role, profile_image_url FROM staff WHERE status = \'active\' AND id != $1', [userId]);
          const adminUsersRes = await db.query('SELECT id, first_name || \' \' || last_name as full_name, role, profile_image_url FROM users WHERE id != $1', [userId]);

          users = [
            ...investorsRes.rows.map(r => ({ ...r, type: 'investor' })),
            ...staffRes.rows.map(r => ({ ...r, type: 'staff' })),
            ...adminUsersRes.rows.map(r => ({ ...r, type: 'admin' }))
          ];
        }
      }

      // De-duplicate by ID (just in case)
      const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
      return uniqueUsers;
    } catch (error: any) {
      console.error('❌ Error fetching available users:', error);
      throw new InternalServerErrorException('Failed to fetch available users');
    }
  }
}
