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
        i.id, 
        i.full_name as "fullName", 
        COALESCE(
          CASE WHEN (i.parent_id IS NOT NULL OR i.investor_type IN ('minor', 'entity')) THEN COALESCE(parent.email, parent_user.email) ELSE NULL END,
          i.email
        ) as email,
        i.email as "generatedEmail",
        COALESCE(parent.email, parent_user.email) as "parentEmail",
        COALESCE(parent.full_name, parent_user.first_name || ' ' || parent_user.last_name) as "parentName",
        i.parent_id as "parentId",
        i.investor_type as "investorType",
        (CASE WHEN (i.parent_id IS NOT NULL OR i.investor_type IN ('minor', 'entity')) THEN true ELSE false END) as "isSubaccount",
        COALESCE(i.phone, parent.phone) as phone, 
        i.created_at as "dateJoined",
        i.status,
        COALESCE(
          (SELECT json_agg(DISTINCT fund_id) FROM investments WHERE user_id = i.id),
          '[]'
        ) as "fundIds"
      FROM investors i
      LEFT JOIN investors parent ON i.parent_id = parent.id
      LEFT JOIN users parent_user ON parent.id = parent_user.id
      WHERE i.status = 'active'
      ORDER BY i.created_at DESC
    `);

    return result.rows;
  }

  async getFunds() {
    const result = await db.query(`
      SELECT id, name FROM funds WHERE status ILIKE 'active' ORDER BY name ASC
    `);
    return result.rows;
  }

  async sendBulkEmail(
    requestingUserRole: string,
    investorIds: string[],
    subject: string,
    message: string,
    triggeredByUserId?: string,
  ) {
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    if (!adminRoles.includes(requestingUserRole)) {
      throw new ForbiddenException('Only admins can send bulk emails');
    }

    if (!investorIds || investorIds.length === 0) {
      return { success: false, message: 'No investors selected' };
    }

    // Fetch email and names for the selected IDs, routing subaccount emails to parent account
    const result = await db.query(`
      SELECT 
        i.id, 
        i.full_name as "fullName",
        i.email as "ownEmail",
        i.parent_id as "parentId",
        i.investor_type as "investorType",
        COALESCE(
          CASE WHEN (i.parent_id IS NOT NULL OR i.investor_type IN ('minor', 'entity')) THEN COALESCE(parent.email, parent_user.email) ELSE NULL END,
          i.email
        ) as email,
        COALESCE(parent.email, parent_user.email) as "parentEmail",
        COALESCE(parent.full_name, parent_user.first_name || ' ' || parent_user.last_name) as "parentFullName",
        parent.id as "parentInvestorId"
      FROM investors i
      LEFT JOIN investors parent ON i.parent_id = parent.id
      LEFT JOIN users parent_user ON parent.id = parent_user.id
      WHERE i.id = ANY($1) AND i.status = 'active'
    `, [investorIds]);

    const investors = result.rows;
    const sentTo = [];
    const failed = [];

    for (const investor of investors) {
      try {
        const isSub = Boolean(investor.parentId || ['minor', 'entity'].includes(investor.investorType));
        const targetEmail = investor.email; // Resolved to parent email for subaccounts

        await this.emailService.sendCustomEmail(
          targetEmail,
          investor.fullName,
          subject,
          message,
          {
            recipientUserId: isSub ? (investor.parentInvestorId || investor.id) : investor.id,
            recipientName: investor.fullName,
            triggeredByUserId,
            relatedEntityType: 'INVESTOR',
            relatedEntityId: investor.id,
            metadata: {
              isSubaccount: isSub,
              subaccountId: isSub ? investor.id : undefined,
              subaccountName: isSub ? investor.fullName : undefined,
              investorType: investor.investorType,
              parentEmail: isSub ? investor.parentEmail : undefined,
              parentName: isSub ? investor.parentFullName : undefined,
              ownGeneratedEmail: investor.ownEmail,
            },
          }
        );
        sentTo.push(targetEmail);
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
