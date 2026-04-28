import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';

const ADMIN_ROLES = ['executive_admin', 'fund_admin', 'investor_relations', 'admin'];

@Injectable()
export class NotificationsService {
  private static columnCheck: { [key: string]: boolean } | null = null;

  private async checkColumns(): Promise<{ [key: string]: boolean }> {
    if (NotificationsService.columnCheck) return NotificationsService.columnCheck;

    try {
      const result = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name IN ('message', 'related_id', 'related_type')
      `);
      const existingColumns = result.rows.map(r => r.column_name);
      NotificationsService.columnCheck = {
        message: existingColumns.includes('message'),
        related_id: existingColumns.includes('related_id'),
        related_type: existingColumns.includes('related_type')
      };
      return NotificationsService.columnCheck;
    } catch (err) {
      console.warn('[NotificationService] Failed to check columns, assuming legacy schema:', err);
      return { message: false, related_id: false, related_type: false };
    }
  }

  async createNotification(data: {
    userId?: string;
    targetRoles?: string[];
    targetRole?: string;
    title: string;
    description?: string;
    message?: string;
    type: string;
    link?: string;
    relatedId?: string;
    relatedType?: string;
  }) {
    const { userId, title, description, message, type, link, relatedId, relatedType } = data;
    const columns = await this.checkColumns();

    const roles: (string | null)[] = data.targetRoles
      ? data.targetRoles
      : data.targetRole
        ? [data.targetRole]
        : [null];

    try {
      const insertPromises = roles.map((role) => {
        // Build query dynamically based on existing columns
        const fields = ['user_id', 'target_role', 'title', 'description', 'type', 'link'];
        const placeholders = ['$1', '$2', '$3', '$4', '$5', '$6'];
        const values = [userId || null, role, title, description || null, type, link || null];

        if (columns.message) {
          fields.push('message');
          placeholders.push(`$${values.length + 1}`);
          values.push(message || description || title);
        }
        if (columns.related_id) {
          fields.push('related_id');
          placeholders.push(`$${values.length + 1}`);
          values.push(relatedId || '00000000-0000-0000-0000-000000000000');
        }
        if (columns.related_type) {
          fields.push('related_type');
          placeholders.push(`$${values.length + 1}`);
          values.push(relatedType || type || 'general');
        }

        const query = `INSERT INTO notifications (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
        return db.query(query, values);
      });

      const results = await Promise.all(insertPromises);
      return results.map((r) => r.rows[0]);
    } catch (error) {
      console.error('❌ Error creating notifications:', error);
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  async getNotifications(userId: string, role: string) {
    try {
      const result = await db.query(
        `SELECT * FROM notifications
         WHERE (user_id = $1 OR target_role = $2)
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId, role]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  async markAsRead(id: string, userId: string, role: string) {
    try {
      const result = await db.query(
        `UPDATE notifications
         SET is_read = TRUE, updated_at = NOW()
         WHERE id = $1 AND (user_id = $2 OR target_role = $3)
         RETURNING *`,
        [id, userId, role]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw new InternalServerErrorException('Failed to update notification');
    }
  }

  async markAllAsRead(userId: string, role: string) {
    try {
      await db.query(
        `UPDATE notifications
         SET is_read = TRUE, updated_at = NOW()
         WHERE is_read = FALSE AND (user_id = $1 OR target_role = $2)`,
        [userId, role]
      );
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw new InternalServerErrorException('Failed to mark all as read');
    }
  }

  async getUnreadCount(userId: string, role: string) {
    try {
      const result = await db.query(
        `SELECT COUNT(*) FROM notifications
         WHERE is_read = FALSE AND (user_id = $1 OR target_role = $2)`,
        [userId, role]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      throw new InternalServerErrorException('Failed to fetch unread count');
    }
  }
}
