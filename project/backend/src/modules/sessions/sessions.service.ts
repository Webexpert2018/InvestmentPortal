import { Injectable } from '@nestjs/common';
import { db } from '../../config/database';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class SessionsService {
  async createSession(userId: string, userRole: string, userAgent: string, ipAddress: string) {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    
    let deviceName = `${browser.name || 'Unknown Browser'} on ${os.name || 'Unknown OS'}`;
    if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.includes('localhost')) {
      deviceName += ' (Localhost)';
    }
    
    // For location, we would ideally use a GeoIP service. 
    // For now, we'll just set it to 'Unknown' or parse from IP if we had a service.
    const location = 'Unknown Location'; 

    const result = await db.query(
      `INSERT INTO user_sessions (user_id, user_role, device_name, location, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, userRole, deviceName, location, ipAddress]
    );

    return result.rows[0];
  }

  async getSessions(userId: string, currentSessionId?: string) {
    const result = await db.query(
      `SELECT id, device_name as name, 
              last_active,
              created_at
       FROM user_sessions 
       WHERE user_id = $1 AND is_revoked = FALSE
       ORDER BY last_active DESC`,
      [userId]
    );

    return result.rows.map(session => {
      const isCurrent = session.id === currentSessionId;
      const lastActive = new Date(session.last_active);
      const createdAt = new Date(session.created_at);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
      
      let subtitle = '';
      if (isCurrent) {
        subtitle = 'ACTIVE NOW';
      } else if (diffInHours < 1) {
        const diffInMins = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
        subtitle = diffInMins <= 0 ? 'Just now' : `${diffInMins} minutes ago`;
      } else if (diffInHours < 24) {
        subtitle = `${diffInHours} hours ago`;
      } else {
        subtitle = lastActive.toLocaleDateString();
      }

      // Format login time
      const loginTime = createdAt.toISOString();

      return {
        id: session.id,
        name: session.name,
        subtitle: subtitle,
        activeNow: isCurrent,
        last_active: session.last_active,
        signedInAt: loginTime
      };
    });
  }

  async revokeSession(sessionId: string, userId: string) {
    await db.query(
      'UPDATE user_sessions SET is_revoked = TRUE WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    return { success: true };
  }

  async updateLastActive(sessionId: string) {
    await db.query(
      'UPDATE user_sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
      [sessionId]
    );
  }
}
