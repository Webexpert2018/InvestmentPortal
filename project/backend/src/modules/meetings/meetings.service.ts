import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Client } from 'pg';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class MeetingsService {
  private pgClient: Client;

  constructor(
    private configService: ConfigService,
    private emailService: EmailService
  ) {
    this.pgClient = new Client({
      connectionString: this.configService.get<string>('DATABASE_URL'),
    });
    this.pgClient.connect()
      .then(() => {
        this.pgClient.query('ALTER TABLE meetings ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE').catch(err => {
          console.error('Failed to add is_edited column:', err);
        });
      })
      .catch(err => console.error('MeetingsService DB Connection Error', err));
  }

  async getAvailableUsers(user: any) {
    try {
      const isInvestor = user.role === 'investor';
      
      if (isInvestor) {
        const result = await this.pgClient.query(`
          SELECT 
            i.assigned_ir_id,
            COALESCE(s1.full_name, u1.first_name || ' ' || u1.last_name) as assigned_ir_name,
            COALESCE(s1.email, u1.email) as assigned_ir_email,
            i.assigned_accountant_id,
            COALESCE(s2.full_name, u2.first_name || ' ' || u2.last_name) as assigned_accountant_name,
            COALESCE(s2.email, u2.email) as assigned_accountant_email
          FROM investors i
          LEFT JOIN staff s1 ON i.assigned_ir_id = s1.id
          LEFT JOIN users u1 ON i.assigned_ir_id = u1.id
          LEFT JOIN staff s2 ON i.assigned_accountant_id = s2.id
          LEFT JOIN users u2 ON i.assigned_accountant_id = u2.id
          WHERE i.id = $1
        `, [user.userId]);

        const assigned = result.rows[0];
        const available = [];
        if (assigned?.assigned_ir_id && assigned.assigned_ir_email) {
          available.push({ id: assigned.assigned_ir_id, name: assigned.assigned_ir_name, role: 'investor_relations', type: 'staff' });
        }
        if (assigned?.assigned_accountant_id && assigned.assigned_accountant_email) {
          available.push({ id: assigned.assigned_accountant_id, name: assigned.assigned_accountant_name, role: 'accountant', type: 'staff' });
        }
        return available;
      } else {
        // Enforce role-based restrictions
        let isIR = ['investor_relations', 'relations_associate'].includes(user.role);
        let isAccountant = user.role === 'accountant';
        
        if (!isIR || !isAccountant) {
          const staffMember = await this.pgClient.query(`SELECT role FROM staff WHERE id = $1`, [user.userId]);
          if (staffMember.rows.length > 0) {
            const dbRole = staffMember.rows[0].role;
            if (!isIR) isIR = ['investor_relations', 'relations_associate'].includes(dbRole);
            if (!isAccountant) isAccountant = dbRole === 'accountant';
          }
        }

        if (isIR) {
          const assignedInvestors = await this.pgClient.query(`
            SELECT id, full_name as name, role, 'investor' as type 
            FROM investors 
            WHERE assigned_ir_id = $1 AND status != 'prospect'
          `, [user.userId]);
          return assignedInvestors.rows;
        } else if (isAccountant) {
          const assignedInvestors = await this.pgClient.query(`
            SELECT id, full_name as name, role, 'investor' as type 
            FROM investors 
            WHERE assigned_accountant_id = $1 AND status != 'prospect'
          `, [user.userId]);
          return assignedInvestors.rows;
        } else if (['executive_admin', 'fund_admin', 'admin'].includes(user.role)) {
          const staffResult = await this.pgClient.query(`SELECT id, full_name as name, role, 'staff' as type FROM staff WHERE id != $1 AND status = 'active'`, [user.userId]);
          const investorResult = await this.pgClient.query(`SELECT id, full_name as name, role, 'investor' as type FROM investors WHERE status != 'prospect'`);
          return [...staffResult.rows, ...investorResult.rows];
        } else {
          // Fallback / accountant / other roles
          const assignedInvestors = await this.pgClient.query(`
            SELECT id, full_name as name, role, 'investor' as type 
            FROM investors 
            WHERE (assigned_ir_id = $1 OR assigned_accountant_id = $1) AND status != 'prospect'
          `, [user.userId]);
          
          const staffResult = await this.pgClient.query(`SELECT id, full_name as name, role, 'staff' as type FROM staff WHERE id != $1 AND status = 'active'`, [user.userId]);
          return [...staffResult.rows, ...assignedInvestors.rows];
        }
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch available users');
    }
  }

  async createMeeting(user: any, dto: { title: string, description?: string, scheduled_date: string, duration_minutes?: number, meeting_link?: string, participant_ids: string[] }) {
    if (!dto.participant_ids || dto.participant_ids.length === 0) {
      throw new BadRequestException('At least one participant is required');
    }

    const scheduledDate = new Date(dto.scheduled_date);
    const now = new Date();
    if (scheduledDate < new Date(now.getTime() - 60000)) {
      throw new BadRequestException('Cannot schedule a meeting for a past date');
    }

    try {
      await this.pgClient.query('BEGIN');
      
      const organizerType = user.role === 'investor' ? 'investor' : 'staff';
      
      const meetingResult = await this.pgClient.query(`
        INSERT INTO meetings (organizer_id, organizer_type, title, description, scheduled_date, duration_minutes, meeting_link)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [user.userId, organizerType, dto.title, dto.description || null, dto.scheduled_date, dto.duration_minutes || 30, dto.meeting_link || null]);

      const meetingId = meetingResult.rows[0].id;

      for (const participantId of dto.participant_ids) {
        const staffCheck = await this.pgClient.query('SELECT id FROM staff WHERE id = $1', [participantId]);
        const pType = staffCheck.rows.length > 0 ? 'staff' : 'investor';

        await this.pgClient.query(`
          INSERT INTO meeting_participants (meeting_id, participant_id, participant_type, status)
          VALUES ($1, $2, $3, 'pending')
        `, [meetingId, participantId, pType]);
      }

      await this.pgClient.query('COMMIT');
      return meetingResult.rows[0];
    } catch (error) {
      await this.pgClient.query('ROLLBACK');
      console.error(error);
      throw new InternalServerErrorException('Failed to schedule meeting');
    }
  }

  async getMyMeetings(user: any) {
    try {
      const result = await this.pgClient.query(`
        SELECT 
          m.id, m.title, m.description, m.scheduled_date, m.duration_minutes, m.meeting_link, m.organizer_id, m.organizer_type, m.is_edited,
          (
            SELECT json_agg(json_build_object(
              'id', mp.participant_id, 
              'type', mp.participant_type, 
              'status', mp.status,
              'name', COALESCE(s.full_name, i.full_name, u.first_name || ' ' || u.last_name)
            ))
            FROM meeting_participants mp
            LEFT JOIN staff s ON mp.participant_id = s.id AND mp.participant_type = 'staff'
            LEFT JOIN investors i ON mp.participant_id = i.id AND mp.participant_type = 'investor'
            LEFT JOIN users u ON mp.participant_id = u.id
            WHERE mp.meeting_id = m.id
          ) as participants,
          COALESCE(os.full_name, oi.full_name, ou.first_name || ' ' || ou.last_name) as organizer_name
        FROM meetings m
        LEFT JOIN staff os ON m.organizer_id = os.id AND m.organizer_type = 'staff'
        LEFT JOIN investors oi ON m.organizer_id = oi.id AND m.organizer_type = 'investor'
        LEFT JOIN users ou ON m.organizer_id = ou.id
        WHERE m.organizer_id = $1 OR m.id IN (SELECT meeting_id FROM meeting_participants WHERE participant_id = $1)
        ORDER BY m.scheduled_date DESC
      `, [user.userId]);

      return result.rows;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch meetings');
    }
  }

  async updateMeetingStatus(user: any, meetingId: string, status: 'accepted' | 'rejected') {
    try {
      const participantCheck = await this.pgClient.query(`
        SELECT id FROM meeting_participants WHERE meeting_id = $1 AND participant_id = $2
      `, [meetingId, user.userId]);

      if (participantCheck.rows.length === 0) {
        throw new ForbiddenException('You are not a participant in this meeting');
      }

      await this.pgClient.query(`
        UPDATE meeting_participants SET status = $1 WHERE meeting_id = $2 AND participant_id = $3
      `, [status, meetingId, user.userId]);

      return { success: true, status };
    } catch (error) {
      console.error(error);
      if (error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Failed to update status');
    }
  }

  async getPendingMeetingsCount(user: any) {
    try {
      const result = await this.pgClient.query(`
        SELECT COUNT(*)::int as count 
        FROM meeting_participants mp
        JOIN meetings m ON mp.meeting_id = m.id
        WHERE mp.participant_id = $1 
          AND mp.status = 'pending'
          AND m.scheduled_date >= NOW()
      `, [user.userId]);
      return { count: result.rows[0].count };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch pending meetings count');
    }
  }

  @Cron('0 8 * * *')
  async handleDailyMeetingReminders() {
    console.log('Running daily meeting reminders...');
    try {
      const meetingsToday = await this.pgClient.query(`
        SELECT m.id, m.title, m.scheduled_date, m.meeting_link, m.organizer_id, m.organizer_type,
               COALESCE(os.full_name, oi.full_name) as organizer_name,
               COALESCE(ou.email, oi.email) as organizer_email
        FROM meetings m
        LEFT JOIN staff os ON m.organizer_id = os.id AND m.organizer_type = 'staff'
        LEFT JOIN users ou ON m.organizer_id = ou.id AND m.organizer_type = 'staff'
        LEFT JOIN investors oi ON m.organizer_id = oi.id AND m.organizer_type = 'investor'
        WHERE DATE(m.scheduled_date AT TIME ZONE 'UTC') = DATE(CURRENT_DATE AT TIME ZONE 'UTC')
      `);

      for (const meeting of meetingsToday.rows) {
        const participants = await this.pgClient.query(`
          SELECT mp.participant_id, mp.participant_type, mp.status,
                 COALESCE(s.full_name, i.full_name) as name,
                 COALESCE(u.email, i.email) as email
          FROM meeting_participants mp
          LEFT JOIN staff s ON mp.participant_id = s.id AND mp.participant_type = 'staff'
          LEFT JOIN users u ON mp.participant_id = u.id AND mp.participant_type = 'staff'
          LEFT JOIN investors i ON mp.participant_id = i.id AND mp.participant_type = 'investor'
          WHERE mp.meeting_id = $1 AND mp.status != 'rejected'
        `, [meeting.id]);

        const allEmails = [meeting.organizer_email, ...participants.rows.map(p => p.email)].filter(Boolean);
        const uniqueEmails = [...new Set(allEmails)];

        const meetingTime = new Date(meeting.scheduled_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        for (const email of uniqueEmails) {
          const content = `
            <p>You have a meeting scheduled for today.</p>
            <p><strong>Title:</strong> ${meeting.title}</p>
            <p><strong>Time:</strong> ${meetingTime}</p>
            <p><strong>Organizer:</strong> ${meeting.organizer_name}</p>
            ${meeting.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${meeting.meeting_link}">${meeting.meeting_link}</a></p>` : '<p>No meeting link provided.</p>'}
          `;
          await this.emailService.sendEmail(email, `Meeting Today: ${meeting.title}`, content);
        }
      }
    } catch (error) {
      console.error('Failed to run daily meeting reminders cron:', error);
    }
  }

  async updateMeeting(user: any, meetingId: string, dto: { title: string, description?: string, scheduled_date: string, duration_minutes?: number, meeting_link?: string, participant_ids: string[] }) {
    if (!dto.participant_ids || dto.participant_ids.length === 0) {
      throw new BadRequestException('At least one participant is required');
    }

    const scheduledDate = new Date(dto.scheduled_date);
    const now = new Date();
    if (scheduledDate < new Date(now.getTime() - 60000)) {
      throw new BadRequestException('Cannot schedule a meeting for a past date');
    }

    try {
      const meetingCheck = await this.pgClient.query('SELECT organizer_id FROM meetings WHERE id = $1', [meetingId]);
      if (meetingCheck.rows.length === 0) {
        throw new NotFoundException('Meeting not found');
      }
      if (meetingCheck.rows[0].organizer_id !== user.userId) {
        throw new ForbiddenException('Only the meeting organizer can edit the meeting');
      }

      await this.pgClient.query('BEGIN');

      await this.pgClient.query(`
        UPDATE meetings 
        SET title = $1, description = $2, scheduled_date = $3, duration_minutes = $4, meeting_link = $5, is_edited = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [dto.title, dto.description || null, dto.scheduled_date, dto.duration_minutes || 30, dto.meeting_link || null, meetingId]);

      const currentParticipantsResult = await this.pgClient.query('SELECT participant_id FROM meeting_participants WHERE meeting_id = $1', [meetingId]);
      const currentParticipantIds = currentParticipantsResult.rows.map(row => row.participant_id);

      const toDelete = currentParticipantIds.filter(id => !dto.participant_ids.includes(id));
      if (toDelete.length > 0) {
        await this.pgClient.query('DELETE FROM meeting_participants WHERE meeting_id = $1 AND participant_id = ANY($2)', [meetingId, toDelete]);
      }

      for (const participantId of dto.participant_ids) {
        if (currentParticipantIds.includes(participantId)) {
          await this.pgClient.query(`
            UPDATE meeting_participants 
            SET status = 'pending', updated_at = CURRENT_TIMESTAMP
            WHERE meeting_id = $1 AND participant_id = $2
          `, [meetingId, participantId]);
        } else {
          const staffCheck = await this.pgClient.query('SELECT id FROM staff WHERE id = $1', [participantId]);
          const pType = staffCheck.rows.length > 0 ? 'staff' : 'investor';

          await this.pgClient.query(`
            INSERT INTO meeting_participants (meeting_id, participant_id, participant_type, status)
            VALUES ($1, $2, $3, 'pending')
          `, [meetingId, participantId, pType]);
        }
      }

      await this.pgClient.query('COMMIT');
      return { success: true };
    } catch (error) {
      await this.pgClient.query('ROLLBACK');
      console.error(error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update meeting');
    }
  }
}
