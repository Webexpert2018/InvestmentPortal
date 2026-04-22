import { Injectable, ForbiddenException } from '@nestjs/common';
import { db } from '../../config/database';
import { EmailService } from '../email/email.service';

@Injectable()
export class CrmService {
  constructor(private emailService: EmailService) {}

  async getActiveInvestors(requestingUserRole: string) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can access CRM data');
    }

    const result = await db.query(`
      SELECT 
        id, 
        full_name as "fullName", 
        email, 
        phone, 
        created_at as "dateJoined",
        status
      FROM investors
      WHERE status = 'active'
      ORDER BY created_at DESC
    `);

    return result.rows;
  }

  async sendBulkEmail(
    requestingUserRole: string,
    investorIds: string[],
    subject: string,
    message: string
  ) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can send bulk emails');
    }

    if (!investorIds || investorIds.length === 0) {
      return { success: false, message: 'No investors selected' };
    }

    // Fetch email and names for the selected IDs
    const result = await db.query(`
      SELECT email, full_name as "fullName"
      FROM investors
      WHERE id = ANY($1) AND status = 'active'
    `, [investorIds]);

    const investors = result.rows;
    const sentTo = [];
    const failed = [];

    for (const investor of investors) {
      try {
        await this.emailService.sendCustomEmail(
          investor.email,
          investor.fullName,
          subject,
          message
        );
        sentTo.push(investor.email);
      } catch (error) {
        console.error(`Failed to send bulk email to ${investor.email}:`, error);
        failed.push(investor.email);
      }
    }

    return {
      success: true,
      sentCount: sentTo.length,
      failedCount: failed.length,
      failedEmails: failed
    };
  }
}
