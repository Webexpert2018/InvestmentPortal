import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../config/database';

const ADMIN_ROLES = ['executive_admin', 'fund_admin', 'investor_relations', 'admin'];

@Injectable()
export class NotificationsService {
  /**
   * Creates one notification row per target role so each role
   * has its own independent is_read state (separate blue dot).
   */
  async createNotification(data: {
    userId?: string;
    targetRoles?: string[];   // multiple roles → one row each
    targetRole?: string;      // single role (legacy / convenience)
    title: string;
    description?: string;
    type: string;
    link?: string;
  }) {
    const { userId, title, description, type, link } = data;

    // Resolve the list of roles to insert for
    const roles: (string | null)[] = data.targetRoles
      ? data.targetRoles
      : data.targetRole
      ? [data.targetRole]
      : [null]; // null = no role filter (show to everyone)

    try {
      const insertPromises = roles.map((role) =>
        db.query(
          `INSERT INTO notifications (user_id, target_role, title, description, type, link)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [userId || null, role, title, description || null, type, link || null]
        )
      );
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
