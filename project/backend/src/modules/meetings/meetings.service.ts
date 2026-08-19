import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Client } from 'pg';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { Cron } from '@nestjs/schedule';
import { google } from 'googleapis';

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
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setUTCHours(23, 59, 59, 999);

      const meetingsToday = await this.pgClient.query(`
        SELECT m.id, m.title, m.scheduled_date, m.meeting_link, m.organizer_id, m.organizer_type,
               COALESCE(os.full_name, oi.full_name, ou.first_name || ' ' || ou.last_name) as organizer_name,
               COALESCE(ou.email, oi.email) as organizer_email
        FROM meetings m
        LEFT JOIN staff os ON m.organizer_id = os.id AND m.organizer_type = 'staff'
        LEFT JOIN users ou ON m.organizer_id = ou.id AND m.organizer_type = 'staff'
        LEFT JOIN investors oi ON m.organizer_id = oi.id AND m.organizer_type = 'investor'
        WHERE m.scheduled_date >= $1 AND m.scheduled_date <= $2
      `, [startOfToday, endOfToday]);

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

  // --- Google Calendar OAuth & API Integration ---

  private getOAuth2Client() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI') || process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google OAuth environment variables (CLIENT_ID, SECRET, REDIRECT_URI) are not configured.');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  async getGoogleAuthUrl(userId: string) {
    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      state: userId,
    });
  }

  async handleGoogleCallback(userId: string, code: string) {
    const oauth2Client = this.getOAuth2Client();
    try {
      const { tokens } = await oauth2Client.getToken(code);

      const expiryDate = tokens.expiry_date ? BigInt(tokens.expiry_date) : null;

      await this.pgClient.query(`
        INSERT INTO google_tokens (user_id, access_token, refresh_token, expiry_date, token_type, scope, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = COALESCE(EXCLUDED.refresh_token, google_tokens.refresh_token),
          expiry_date = COALESCE(EXCLUDED.expiry_date, google_tokens.expiry_date),
          token_type = EXCLUDED.token_type,
          scope = EXCLUDED.scope,
          updated_at = CURRENT_TIMESTAMP
      `, [
        userId,
        tokens.access_token,
        tokens.refresh_token || null,
        expiryDate,
        tokens.token_type || null,
        tokens.scope || null
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error exchanging Google authorization code:', error);
      throw new InternalServerErrorException('Failed to complete Google Calendar authentication');
    }
  }

  async getGoogleTokenStatus(userId: string) {
    const result = await this.pgClient.query(`
      SELECT user_id, updated_at FROM google_tokens WHERE user_id = $1
    `, [userId]);
    return { connected: result.rows.length > 0 };
  }

  private async getAuthenticatedClient(userId: string) {
    const oauth2Client = this.getOAuth2Client();
    const result = await this.pgClient.query(`
      SELECT access_token, refresh_token, expiry_date FROM google_tokens WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Google Calendar account not connected. Please login first.');
    }

    const { access_token, refresh_token, expiry_date } = result.rows[0];

    oauth2Client.setCredentials({
      access_token,
      refresh_token,
      expiry_date: expiry_date ? Number(expiry_date) : undefined,
    });

    // Check if token is expired or close to expiry (within 5 minutes)
    const isExpired = expiry_date && (Number(expiry_date) - Date.now() < 300000);

    if (isExpired && refresh_token) {
      try {
        console.log('🔄 Access token expired. Refreshing token...');
        const { credentials } = await oauth2Client.refreshAccessToken();

        await this.pgClient.query(`
          UPDATE google_tokens SET
            access_token = $1,
            expiry_date = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $3
        `, [credentials.access_token, credentials.expiry_date ? BigInt(credentials.expiry_date) : null, userId]);

        oauth2Client.setCredentials(credentials);
      } catch (err) {
        console.error('Failed to refresh Google token:', err);
      }
    }

    return oauth2Client;
  }

  async createGoogleEvent(
    userId: string,
    dto: { title: string; description?: string; scheduledDate: string; durationMinutes?: number; attendeeEmails?: string[]; location?: string }
  ) {
    const oauth2Client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDate = new Date(dto.scheduledDate);
    const duration = dto.durationMinutes || 30;
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const hasAttendees = dto.attendeeEmails && dto.attendeeEmails.length > 0;
    const attendees = dto.attendeeEmails ? dto.attendeeEmails.map(email => ({ email })) : [];

    try {
      // Fetch organizer email
      const userResult = await this.pgClient.query('SELECT email FROM users WHERE id = $1', [userId]);
      const organizerEmail = userResult.rows[0]?.email || 'system@localhost';

      const requestBody: any = {
        summary: dto.title,
        description: dto.description || '',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'UTC',
        },
        attendees,
        guestsCanSeeOtherGuests: false,
      };

      if (dto.location) {
        requestBody.location = dto.location;
      } else {
        requestBody.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        };
      }

      // 1. Create event on Google Calendar
      const eventResponse = await calendar.events.insert({
        calendarId: 'primary',
        sendUpdates: hasAttendees ? 'all' : 'none',
        conferenceDataVersion: dto.location ? 0 : 1,
        requestBody,
      });

      const googleEventId = eventResponse.data.id;
      const meetingLink = dto.location || eventResponse.data.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video'
      )?.uri || null;

      // 2. Register sandbox meeting in google_calendar_events database table
      const dbInsert = await this.pgClient.query(`
        INSERT INTO google_calendar_events (organizer_email, google_event_id, title, description, scheduled_date, duration_minutes, meeting_link, html_link, attendee_email, attendee_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', '')
        RETURNING *
      `, [
        organizerEmail,
        googleEventId,
        dto.title,
        dto.description || null,
        dto.scheduledDate,
        duration,
        meetingLink,
        eventResponse.data.htmlLink
      ]);

      // 3. Register attendees in database
      if (hasAttendees && dto.attendeeEmails) {
        for (const email of dto.attendeeEmails) {
          await this.pgClient.query(`
            INSERT INTO google_calendar_event_attendees (google_event_id, email, status)
            VALUES ($1, $2, 'needsAction')
            ON CONFLICT (google_event_id, email) DO NOTHING
          `, [googleEventId, email]);
        }
      }

      return {
        success: true,
        meetingId: dbInsert.rows[0].id,
        googleEventId,
        htmlLink: eventResponse.data.htmlLink,
        meetingLink,
      };
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new InternalServerErrorException('Failed to create calendar event and send invite');
    }
  }

  async addAttendeeToGoogleEvent(userId: string, googleEventId: string, attendeeEmail: string) {
    const oauth2Client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // 1. Fetch current event to get existing attendees
      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      const event = response.data;
      let attendees = event.attendees || [];

      // Add the new attendee if not already present
      if (!attendees.some(a => a.email?.toLowerCase() === attendeeEmail.toLowerCase())) {
        attendees.push({ email: attendeeEmail });
      }

      // 2. Update on Google Calendar (sends invite email to the new guest)
      const updatedEvent = await calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
        requestBody: {
          ...event,
          attendees,
          guestsCanSeeOtherGuests: false,
        },
      });

      // 3. Update database record
      await this.pgClient.query(`
        INSERT INTO google_calendar_event_attendees (google_event_id, email, status)
        VALUES ($1, $2, 'needsAction')
        ON CONFLICT (google_event_id, email) DO UPDATE SET status = 'needsAction', updated_at = CURRENT_TIMESTAMP
      `, [googleEventId, attendeeEmail]);

      return {
        success: true,
        attendees: updatedEvent.data.attendees,
      };
    } catch (error) {
      console.error('Failed to invite attendee:', error);
      throw new InternalServerErrorException('Failed to add attendee and send invitation');
    }
  }

  async getGoogleCalendarEvents(userId: string) {
    try {
      const userResult = await this.pgClient.query('SELECT email FROM users WHERE id = $1', [userId]);
      const organizerEmail = userResult.rows[0]?.email || 'system@localhost';

      // Self-healing: Migrates legacy attendee_email entries from parent table to google_calendar_event_attendees subtable
      const legacyEvents = await this.pgClient.query(`
        SELECT google_event_id, attendee_email, attendee_status 
        FROM google_calendar_events 
        WHERE attendee_email IS NOT NULL AND attendee_email != ''
      `);
      for (const row of legacyEvents.rows) {
        await this.pgClient.query(`
          INSERT INTO google_calendar_event_attendees (google_event_id, email, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (google_event_id, email) DO NOTHING
        `, [row.google_event_id, row.attendee_email, row.attendee_status || 'needsAction']);
      }

      const result = await this.pgClient.query(`
        SELECT gce.*, 
               COALESCE(
                 (
                   SELECT json_agg(json_build_object('email', gca.email, 'status', gca.status))
                   FROM google_calendar_event_attendees gca
                   WHERE gca.google_event_id = gce.google_event_id
                 ), '[]'::json
               ) as attendees
        FROM google_calendar_events gce
        WHERE gce.organizer_email = $1 
        ORDER BY gce.scheduled_date DESC
      `, [organizerEmail]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching Google calendar events list:', error);
      throw new InternalServerErrorException('Failed to fetch scheduled events');
    }
  }

  async getGoogleEventStatus(userId: string, googleEventId: string) {
    const oauth2Client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      const event = response.data;

      // Check if this event belongs to a webinar
      const webinarRes = await this.pgClient.query(
        `SELECT id FROM webinars WHERE google_event_id = $1`,
        [googleEventId]
      );
      const webinarId = webinarRes.rows[0]?.id;

      // Sync status to database for all attendees returned by Google
      for (const attendee of event.attendees || []) {
        if (attendee.email) {
          await this.pgClient.query(`
            INSERT INTO google_calendar_event_attendees (google_event_id, email, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (google_event_id, email) DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP
          `, [googleEventId, attendee.email, attendee.responseStatus || 'needsAction']);

          if (webinarId) {
            const prospectRes = await this.pgClient.query(
              `SELECT apollo_id FROM doctor_prospects WHERE email = $1`,
              [attendee.email]
            );
            if (prospectRes.rows.length > 0) {
              const prospectId = prospectRes.rows[0].apollo_id;
              let dbStatus = 'registered';
              if (attendee.responseStatus === 'accepted') dbStatus = 'accepted';
              else if (attendee.responseStatus === 'declined') dbStatus = 'declined';
              else if (attendee.responseStatus === 'tentative') dbStatus = 'tentative';

              await this.pgClient.query(`
                UPDATE webinar_attendees 
                SET status = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE webinar_id = $2 AND prospect_id = $3 AND status != 'attended'
              `, [dbStatus, webinarId, prospectId]);
            }
          }
        }
      }

      return {
        id: event.id,
        status: event.status,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        attendees: event.attendees || [],
      };
    } catch (error) {
      console.error('Error fetching Google calendar event status:', error);
      throw new InternalServerErrorException('Failed to retrieve event status');
    }
  }

  async respondToGoogleEvent(
    userId: string,
    googleEventId: string,
    attendeeEmail: string,
    responseStatus: 'accepted' | 'declined' | 'tentative'
  ) {
    const oauth2Client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // 1. Fetch current event to get the attendees array
      const eventResponse = await calendar.events.get({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      const event = eventResponse.data;
      let attendees = event.attendees || [];

      // Update response status for the attendee
      const attendeeIndex = attendees.findIndex(a => a.email?.toLowerCase() === attendeeEmail.toLowerCase());
      if (attendeeIndex !== -1) {
        attendees[attendeeIndex].responseStatus = responseStatus;
      } else {
        // If not found in the list, add them
        attendees.push({ email: attendeeEmail, responseStatus });
      }

      // 2. Update the event on Google Calendar
      const updatedEvent = await calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
        requestBody: {
          ...event,
          attendees,
          guestsCanSeeOtherGuests: false,
        },
      });

      // 3. Update status locally in google_calendar_event_attendees table
      await this.pgClient.query(`
        INSERT INTO google_calendar_event_attendees (google_event_id, email, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (google_event_id, email) DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP
      `, [googleEventId, attendeeEmail, responseStatus]);

      return {
        success: true,
        attendees: updatedEvent.data.attendees,
      };
    } catch (error) {
      console.error('Error updating Google event response:', error);
      throw new InternalServerErrorException('Failed to update event RSVP status');
    }
  }

  async updateGoogleEventDetails(
    userId: string,
    googleEventId: string,
    dto: { title: string; description?: string; scheduledDate: string; durationMinutes?: number; location?: string }
  ) {
    const oauth2Client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDate = new Date(dto.scheduledDate);
    const duration = dto.durationMinutes || 30;
    const endDate = new Date(startDate.getTime() + duration * 60000);

    try {
      // 1. Fetch current event
      const eventResponse = await calendar.events.get({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      const event = eventResponse.data;

      const requestBody: any = {
        ...event,
        summary: dto.title,
        description: dto.description || '',
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'UTC',
        },
      };

      if (dto.location) {
        requestBody.location = dto.location;
      }

      // 2. Update details
      const updatedEvent = await calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
        requestBody,
      });

      // 3. Update local DB google_calendar_events record
      if (dto.location) {
        await this.pgClient.query(`
          UPDATE google_calendar_events 
          SET title = $1, description = $2, scheduled_date = $3, duration_minutes = $4, meeting_link = $6
          WHERE google_event_id = $5
        `, [dto.title, dto.description || null, dto.scheduledDate, duration, googleEventId, dto.location]);
      } else {
        await this.pgClient.query(`
          UPDATE google_calendar_events 
          SET title = $1, description = $2, scheduled_date = $3, duration_minutes = $4
          WHERE google_event_id = $5
        `, [dto.title, dto.description || null, dto.scheduledDate, duration, googleEventId]);
      }

      return {
        success: true,
        event: updatedEvent.data,
      };
    } catch (error) {
      console.error('Failed to update Google event details:', error);
      throw new InternalServerErrorException('Failed to update calendar event details');
    }
  }

  async updateGoogleEventReminders(
    userId: string,
    googleEventId: string,
    reminderOffsets: number[]
  ) {
    const oauth2Client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const overrides = reminderOffsets.map(mins => ({
      method: 'email',
      minutes: mins
    }));

    try {
      const eventResponse = await calendar.events.get({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      const event = eventResponse.data;

      const updatedEvent = await calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
        requestBody: {
          ...event,
          reminders: {
            useDefault: false,
            overrides
          }
        }
      });

      return {
        success: true,
        event: updatedEvent.data
      };
    } catch (error) {
      console.error('Failed to update Google event reminders:', error);
      throw new InternalServerErrorException('Failed to update calendar event reminders');
    }
  }
}
