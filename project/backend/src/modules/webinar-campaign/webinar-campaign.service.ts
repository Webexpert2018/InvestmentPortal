import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { db } from '../../config/database';
import { EmailService } from '../email/email.service';

export interface DoctorProspectDto {
  id: string;
  fullName: string;
  specialty: string;
  organization: string;
  location: string;
  email: string;
  phone: string;
  status: 'pending_apollo' | 'ai_copy_ready' | 'sent' | 'interested' | 'not_interested' | 'error';
  isAlreadyEnriched?: boolean;
  emailStatus?: string;
  stage?: string;
  apolloId?: string;
  apollo_id?: string;
  name?: string;
  full_name?: string;
}

@Injectable()
export class WebinarCampaignService {
  private readonly logger = new Logger(WebinarCampaignService.name);

  constructor(
    private emailService: EmailService,
    private configService: ConfigService
  ) { }

  async searchApollo(
    specialties: string,
    locations: string,
    seniorities: string,
    count: number = 50
  ): Promise<DoctorProspectDto[]> {
    this.logger.log(`[Apollo Search]: Checking database for existing prospects before returning search results...`);

    const titlesArray = specialties
      ? specialties.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Orthopedic Surgery', 'Cardiovascular Disease', 'Dermatology'];

    const locationsArray = locations
      ? locations.split(',').map((l) => l.trim()).filter(Boolean)
      : ['Austin, TX', 'Chicago, IL', 'Miami, FL'];

    // 5 High-Quality Mock Profiles for testing / free plan demonstration
    const rawProfiles: DoctorProspectDto[] = [
      {
        id: '66d7f2c85b1234567890abcd',
        fullName: 'Dr. David Wiebe, MD',
        specialty: titlesArray[0] || 'Orthopedic Surgery',
        organization: 'Austin Spine & Joint Surgery Center',
        location: locationsArray[0] || 'Austin, TX',
        email: 'Email via Bulk Match Required',
        phone: 'Phone via Bulk Match Required',
        status: 'ai_copy_ready',
      },
      {
        id: '66d7f2c85b1234567890abce',
        fullName: 'Dr. Sarah Jenkins, MD',
        specialty: titlesArray.length > 1 ? titlesArray[1] : 'Cardiovascular Disease',
        organization: 'Midwest Heart & Vascular Institute',
        location: locationsArray.length > 1 ? locationsArray[1] : 'Chicago, IL',
        email: 'Email via Bulk Match Required',
        phone: 'Phone via Bulk Match Required',
        status: 'ai_copy_ready',
      },
      {
        id: '66d7f2c85b1234567890abcf',
        fullName: 'Dr. Marcus Vance, MD',
        specialty: titlesArray.length > 2 ? titlesArray[2] : 'Dermatology & Aesthetics',
        organization: 'Vance Dermatology Group',
        location: locationsArray.length > 2 ? locationsArray[2] : 'Miami, FL',
        email: 'Email via Bulk Match Required',
        phone: 'Phone via Bulk Match Required',
        status: 'ai_copy_ready',
      },
      {
        id: '66d7f2c85b1234567890abd0',
        fullName: 'Dr. Elena Rostova, MD',
        specialty: 'Neurology & Neurosurgery',
        organization: 'Pacific Neuro & Spine Clinic',
        location: 'San Francisco, CA',
        email: 'Email via Bulk Match Required',
        phone: 'Phone via Bulk Match Required',
        status: 'ai_copy_ready',
      },
      {
        id: '66d7f2c85b1234567890abd1',
        fullName: 'Dr. Robert Thorne, DMD',
        specialty: 'Oral & Maxillofacial Surgery',
        organization: 'Thorne Surgical & Implant Center',
        location: 'Dallas, TX',
        email: 'Email via Bulk Match Required',
        phone: 'Phone via Bulk Match Required',
        status: 'ai_copy_ready',
      },
    ];

    let profilesToCheck = [...rawProfiles];

    // =========================================================================
    // REAL APOLLO.IO API SEARCH IMPLEMENTATION (COMMENTED OUT FOR FREE PLAN MODE)
    // When you upgrade your Apollo plan to paid, uncomment the block below to run live API queries:
    // =========================================================================
    /*
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) {
      throw new HttpException(
        'APOLLO_API_KEY is not configured in your backend .env file. Please add APOLLO_API_KEY=your_key to your backend .env file.',
        HttpStatus.BAD_REQUEST
      );
    }

    const senioritiesArray = seniorities
      ? seniorities.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Owner', 'Partner', 'Senior', 'MD'];

    const targetCount = count && !isNaN(count) && count > 0 ? Number(count) : 50;

    const payload = {
      api_key: apiKey,
      person_titles: titlesArray,
      person_locations: locationsArray,
      person_seniorities: senioritiesArray,
      page: 1,
      per_page: targetCount,
    };

    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey,
    };

    let responseData: any = null;

    try {
      this.logger.log(`Calling Apollo API search endpoint https://api.apollo.io/api/v1/mixed_people/api_search with per_page=${targetCount}`);
      const response = await axios.post(
        'https://api.apollo.io/api/v1/mixed_people/api_search',
        payload,
        { headers, timeout: 15000 }
      );
      responseData = response.data;
    } catch (error: any) {
      this.logger.warn(`Primary endpoint api_search returned error (${error?.response?.status}). Attempting fallback /v1/mixed_people/search...`);
      try {
        const fallbackResponse = await axios.post(
          'https://api.apollo.io/v1/mixed_people/search',
          payload,
          { headers, timeout: 15000 }
        );
        responseData = fallbackResponse.data;
      } catch (fallbackError: any) {
        const errMsg =
          fallbackError?.response?.data?.message ||
          fallbackError?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error.message ||
          'Failed to connect to Apollo.io API';
        this.logger.error(`Apollo API error: ${errMsg}`);
        throw new HttpException(
          `Apollo.io API Error: ${errMsg}`,
          error?.response?.status || HttpStatus.BAD_GATEWAY
        );
      }
    }

    if (!responseData || !Array.isArray(responseData.people)) {
      this.logger.warn('Apollo API did not return a valid people array.');
      return [];
    }

    const people: any[] = responseData.people;
    this.logger.log(`Successfully retrieved ${people.length} prospects from Apollo.io.`);

    profilesToCheck = people.map((p: any, index: number) => {
      const fullName =
        p.name ||
        `${p.first_name || ''} ${p.last_name || ''}`.trim() ||
        `Dr. Prospect ${index + 1}`;
      
      const specialty =
        p.title ||
        (titlesArray.length > 0 ? titlesArray[index % titlesArray.length] : 'Physician');

      const organization =
        p.organization?.name ||
        p.headline ||
        'Private Medical Practice';

      const location = p.city
        ? `${p.city}, ${p.state || p.country || ''}`.trim().replace(/,\s*$/, '')
        : p.country || (locationsArray.length > 0 ? locationsArray[0] : 'United States');

      const email =
        p.email ||
        p.work_email ||
        (p.personal_emails && p.personal_emails[0]) ||
        'Unenriched - Select for Bulk Match';

      const phone =
        (p.phone_numbers && p.phone_numbers[0]?.raw_number) ||
        p.organization?.phone ||
        p.sanitized_phone ||
        'Unenriched Phone';

      return {
        id: p.id || `doc-${Date.now()}-${index}`,
        fullName: fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`,
        specialty,
        organization,
        location,
        email,
        phone,
        status: 'ai_copy_ready',
      };
    });
    */

    // Cross-check with doctor_prospects table in PostgreSQL
    const apolloIds = profilesToCheck.map((p) => p.id).filter(Boolean);
    const existingMap = new Map<string, any>();

    const phoneMap: Record<string, string> = {
      '66d7f2c85b1234567890abcd': '+1 (512) 555-0192',
      '66d7f2c85b1234567890abce': '+1 (312) 555-0148',
      '66d7f2c85b1234567890abcf': '+1 (305) 555-0183',
      '66d7f2c85b1234567890abd0': '+1 (415) 555-0129',
      '66d7f2c85b1234567890abd1': '+1 (214) 555-0174',
    };

    if (apolloIds.length > 0) {
      try {
        const dbResult = await db.query(
          `SELECT apollo_id, email, phone, email_status, stage FROM doctor_prospects WHERE apollo_id = ANY($1)`,
          [apolloIds]
        );
        for (const row of dbResult.rows) {
          existingMap.set(row.apollo_id, row);
        }
      } catch (err: any) {
        this.logger.error(`Error querying doctor_prospects for existing IDs: ${err.message}`);
      }
    }

    return profilesToCheck.map((p) => {
      const saved = existingMap.get(p.id);
      const isAlreadySaved = Boolean(saved);

      let email = 'Email via Bulk Match Required';
      let phone = 'Phone via Bulk Match Required';

      if (isAlreadySaved) {
        email = saved.email || 'ishadubey343@gmail.com';
        phone = saved.phone || phoneMap[p.id] || '+1 (555) 019-8821';
        if (email.includes('Bulk Match Required') || email.includes('@medical-verified.org')) {
          email = 'ishadubey343@gmail.com';
        }
      }

      return {
        ...p,
        email,
        phone,
        isAlreadyEnriched: isAlreadySaved,
        emailStatus: isAlreadySaved ? (saved?.email_status || 'verified') : undefined,
        status: isAlreadySaved && ['sent', 'interested', 'not_interested'].includes(saved?.stage) ? saved.stage : 'ai_copy_ready',
        stage: saved?.stage || 'pending_outreach',
      };
    });
  }

  async bulkMatchAndSave(
    apolloIds: string[],
    mockProfilesData?: DoctorProspectDto[]
  ) {
    if (!apolloIds || apolloIds.length === 0) {
      throw new HttpException('No prospect IDs provided for enrichment', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Starting bulk match & DB save for ${apolloIds.length} prospects...`);

    let enrichedMatches: any[] = [];

    const apiKey = process.env.APOLLO_API_KEY;
    if (apiKey && process.env.APOLLO_FORCE_REAL === 'true') {
      try {
        this.logger.log('APOLLO_FORCE_REAL=true: Calling real Apollo /v1/people/bulk_match API...');
        const response = await axios.post(
          'https://api.apollo.io/api/v1/people/bulk_match',
          {
            api_key: apiKey,
            details: apolloIds.map((id) => ({ id })),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Api-Key': apiKey,
            },
            timeout: 25000,
          }
        );

        if (response.data && Array.isArray(response.data.matches)) {
          enrichedMatches = response.data.matches;
          this.logger.log(`Received ${enrichedMatches.length} real profile matches from Apollo bulk_match!`);
        }
      } catch (err: any) {
        this.logger.warn(`Real Apollo bulk_match request failed: ${err.message}. Falling back to default profile generation.`);
      }
    }

    // Fallback or Free Plan mode: enrich using mock/provided profiles data or generated realistic emails
    const phoneMap: Record<string, string> = {
      '66d7f2c85b1234567890abcd': '+1 (512) 555-0192',
      '66d7f2c85b1234567890abce': '+1 (312) 555-0148',
      '66d7f2c85b1234567890abcf': '+1 (305) 555-0183',
      '66d7f2c85b1234567890abd0': '+1 (415) 555-0129',
      '66d7f2c85b1234567890abd1': '+1 (214) 555-0174',
    };

    if (enrichedMatches.length === 0) {
      enrichedMatches = apolloIds.map((id) => {
        const found = mockProfilesData?.find((m) => m.id === id);
        const fullName = found?.fullName || `Dr. Enriched Lead ${id.substring(0, 6)}`;
        const realPhone = phoneMap[id] || (found?.phone && !found.phone.includes('Bulk Match Required') ? found.phone : '+1 (555) 019-8821');

        return {
          id,
          name: fullName,
          first_name: fullName.split(' ')[1] || 'Doctor',
          last_name: fullName.split(' ')[2] || 'Prospect',
          title: found?.specialty || 'Medical Specialist',
          email: 'ishadubey343@gmail.com',
          email_status: 'verified',
          organization: {
            name: found?.organization || 'Verified Medical Center',
          },
          city: found?.location?.split(',')[0] || 'New York',
          state: found?.location?.split(',')[1]?.trim() || 'NY',
          country: 'United States',
          phone: realPhone,
        };
      });
    }

    try {
      await db.query(`ALTER TABLE doctor_prospects DROP CONSTRAINT IF EXISTS doctor_prospects_email_key;`);
      await db.query(`DROP INDEX IF EXISTS doctor_prospects_email_key;`);
    } catch (e) {}

    const savedRows: any[] = [];

    for (const m of enrichedMatches) {
      if (!m || !m.id) continue;

      const apolloId = m.id;
      const fullName = m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Physician';
      const firstName = m.first_name || fullName.split(' ')[0] || '';
      const lastName = m.last_name || fullName.split(' ').slice(1).join(' ') || '';
      const specialty = m.title || 'Medical Doctor';
      const organization = m.organization?.name || 'Medical Clinic';
      const city = m.city || '';
      const state = m.state || m.country || '';
      const location = city && state ? `${city}, ${state}` : city || state || 'United States';
      const email = 'ishadubey343@gmail.com';
      const phone = m.phone || m.phone_numbers?.[0]?.raw_number || '+1 (555) 019-9911';
      const emailStatus = m.email_status || 'verified';

      try {
        const insertRes = await db.query(
          `INSERT INTO doctor_prospects (
             apollo_id, full_name, first_name, last_name, specialty, organization, location, city, state, email, phone, email_status, stage, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending_outreach', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (apollo_id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone,
             email_status = EXCLUDED.email_status,
             stage = CASE WHEN doctor_prospects.stage IN ('sent', 'interested', 'not_interested') THEN doctor_prospects.stage ELSE 'pending_outreach' END,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *;`,
          [
            apolloId,
            fullName,
            firstName,
            lastName,
            specialty,
            organization,
            location,
            city,
            state,
            email,
            phone,
            emailStatus,
          ]
        );

        if (insertRes.rows && insertRes.rows.length > 0) {
          savedRows.push(insertRes.rows[0]);

          // Log enrichment event
          await db.query(
            `INSERT INTO prospect_events (prospect_id, event_type, details, created_at)
             VALUES ($1, 'apollo_enriched', $2, CURRENT_TIMESTAMP)`,
            [
              apolloId,
              JSON.stringify({ email, emailStatus, organization, specialty }),
            ]
          );
        }
      } catch (dbErr: any) {
        this.logger.error(`Error saving prospect ${apolloId} to DB: ${dbErr.message}`);
      }
    }

    return {
      success: true,
      enrichedCount: savedRows.length,
      prospects: savedRows,
    };
  }

  async getSavedProspects(limit: number = 100) {
    const res = await db.query(
      `SELECT * FROM doctor_prospects ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    const phoneMap: Record<string, string> = {
      '66d7f2c85b1234567890abcd': '+1 (512) 555-0192',
      '66d7f2c85b1234567890abce': '+1 (312) 555-0148',
      '66d7f2c85b1234567890abcf': '+1 (305) 555-0183',
      '66d7f2c85b1234567890abd0': '+1 (415) 555-0129',
      '66d7f2c85b1234567890abd1': '+1 (214) 555-0174',
    };

    return res.rows.map((row: any) => {
      let phone = row.phone;
      let email = row.email;
      if (!phone || phone.includes('Bulk Match Required')) {
        phone = phoneMap[row.apollo_id] || '+1 (555) 019-8821';
      }
      if (!email || email.includes('Bulk Match Required') || email.includes('..') || email.includes('@medical-verified.org') || row.apollo_id === '66d7f2c85b1234567890abd0') {
        email = 'ishadubey343@gmail.com';
      }
      return {
        ...row,
        id: row.apollo_id || row.id,
        fullName: row.full_name || row.fullName || 'Dr. David Wiebe, MD',
        phone,
        email,
        status: ['sent', 'interested', 'not_interested'].includes(row.stage) ? row.stage : 'ai_copy_ready',
        stage: row.stage || 'pending_outreach',
        isAlreadyEnriched: true,
        emailStatus: row.email_status || 'verified'
      };
    });
  }

  async sendCampaignOutreach(
    prospectIds: string[],
    customMessage?: string,
    mockProfilesData?: DoctorProspectDto[],
    customSubject?: string
  ) {
    if (!prospectIds || prospectIds.length === 0) {
      throw new HttpException('No prospect IDs selected to send emails', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Starting campaign email outreach for ${prospectIds.length} prospects via SendGrid/SMTP...`);

    const sentProspects: any[] = [];
    const failedProspects: any[] = [];

    let dbProspectsMap = new Map<string, any>();
    try {
      const dbRes = await db.query(
        `SELECT * FROM doctor_prospects WHERE apollo_id = ANY($1)`,
        [prospectIds]
      );
      for (const row of dbRes.rows) {
        dbProspectsMap.set(row.apollo_id, row);
      }
    } catch (err: any) {
      this.logger.warn(`Could not query doctor_prospects for outreach: ${err.message}`);
    }

    for (const id of prospectIds) {
      let doc = dbProspectsMap.get(id);
      let email = doc?.email;
      let fullName = doc?.full_name || doc?.fullName;
      let organization = doc?.organization;
      let apolloId = doc?.apollo_id || id;

      if (!doc || !email || email.includes('Bulk Match Required')) {
        const foundMock = mockProfilesData?.find((m: any) => m.id === id || m.apolloId === id || m.apollo_id === id);
        if (foundMock) {
          fullName = (foundMock as any).fullName || (foundMock as any).full_name || (foundMock as any).name;
          organization = foundMock.organization;
          apolloId = (foundMock as any).id || (foundMock as any).apolloId || (foundMock as any).apollo_id || id;
          const cleanName = (fullName || 'physician').replace(/^dr\.?\s+/i, '').replace(/,\s*(md|dmd|do|phd).*$/i, '').trim();
          const emailSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
          email = foundMock.email && !foundMock.email.includes('Bulk Match Required') ? foundMock.email : 'ishadubey343@gmail.com';
        } else if (!email) {
          email = 'ishadubey343@gmail.com';
        }
      }

      if (!email || email.includes('Bulk Match Required') || email.includes('..')) {
        email = 'ishadubey343@gmail.com';
      }

      if (apolloId === '66d7f2c85b1234567890abd0' || id === '66d7f2c85b1234567890abd0' || fullName?.toLowerCase().includes('rostova')) {
        email = 'ishadubey343@gmail.com';
      }

      const subject = customSubject || `Invitation: Exclusive Real Estate & Wealth Webinar for Physicians`;
      const body = customMessage || `<p style="font-size: 15px; color: #374151;">Dear ${fullName || 'Physician'},</p><p style="font-size: 15px; color: #374151;">We are pleased to invite you to our upcoming private investor webinar session.</p>`;

      try {
        await this.emailService.sendCustomEmail(email, fullName || 'Doctor', subject, body);
        sentProspects.push({ id, email, fullName });

        try {
          await db.query(
            `UPDATE doctor_prospects SET stage = 'sent', updated_at = CURRENT_TIMESTAMP WHERE apollo_id = $1`,
            [apolloId]
          );
          await db.query(
            `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, 'email_sent', $2, CURRENT_TIMESTAMP)`,
            [apolloId, JSON.stringify({ email, subject, sentAt: new Date().toISOString() })]
          );
        } catch (dbErr) { }
      } catch (sendErr: any) {
        this.logger.error(`Failed to send email to ${email}: ${sendErr.message}`);
        failedProspects.push({ id, email, error: sendErr.message });
      }
    }

    return {
      success: true,
      totalRequested: prospectIds.length,
      sentCount: sentProspects.length,
      failedCount: failedProspects.length,
      sentProspects,
      failedProspects,
    };
  }

  @Cron('*/1 * * * *')
  async processScheduledDripEmails() {
    try {
      const res = await db.query(
        `SELECT apollo_id, full_name, email, ai_sequence, stage FROM doctor_prospects WHERE ai_sequence IS NOT NULL`
      );

      if (!res.rows || res.rows.length === 0) return;

      const now = new Date();

      for (const row of res.rows) {
        let seq = row.ai_sequence;
        if (typeof seq === 'string') {
          try { seq = JSON.parse(seq); } catch (e) { continue; }
        }
        if (!Array.isArray(seq) || seq.length === 0) continue;

        let updated = false;
        const updatedSeq = [...seq];

        for (let i = 0; i < updatedSeq.length; i++) {
          const item = updatedSeq[i];
          if (item.status === 'scheduled') {
            const schedDate = item.isoDate ? new Date(item.isoDate) : null;
            this.logger.log(`Checking ${row.full_name} Day ${item.day}: Scheduled = ${item.scheduledDate} (ISO: ${item.isoDate}), Current = ${now.toISOString()}`);
            if (!schedDate || schedDate <= now) {
              this.logger.log(`🚀 [CRON DRIP DISPATCH] Target scheduled time reached for ${row.full_name} (Day ${item.day})! Dispatching email...`);

              try {
                await this.sendCampaignOutreach([row.apollo_id], item.body, undefined, item.subject);
                item.status = 'sent';
                item.sentAt = new Date().toISOString();
                updated = true;
              } catch (sendErr: any) {
                this.logger.error(`Failed scheduled dispatch for ${row.full_name}: ${sendErr.message}`);
              }
              break;
            }
          }
        }

        if (updated) {
          await db.query(
            `UPDATE doctor_prospects SET ai_sequence = $1::jsonb, stage = 'sent' WHERE apollo_id = $2`,
            [JSON.stringify(updatedSeq), row.apollo_id]
          );
        }

        // Check if all items in sequence are sent and 48 hours have passed since final email dispatch without response
        const currentSeq = updated ? updatedSeq : seq;
        const allSent = currentSeq.every((item: any) => item.status === 'sent');
        if (allSent && (row.stage === 'sent' || row.stage === 'pending_outreach')) {
          const sentTimestamps = currentSeq
            .map((item: any) => item.sentAt ? new Date(item.sentAt).getTime() : 0)
            .filter((t: number) => t > 0);

          const lastSentTime = sentTimestamps.length > 0 ? Math.max(...sentTimestamps) : 0;
          if (lastSentTime > 0) {
            const elapsedHours = (now.getTime() - lastSentTime) / (1000 * 60 * 60);
            if (elapsedHours >= 48) {
              await db.query(
                `UPDATE doctor_prospects SET stage = 'needs_call', updated_at = CURRENT_TIMESTAMP WHERE apollo_id = $1`,
                [row.apollo_id]
              );
              await db.query(
                `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, 'campaign_completed_needs_call', $2, CURRENT_TIMESTAMP)`,
                [row.apollo_id, JSON.stringify({ completedAt: now.toISOString(), lastEmailSentAt: new Date(lastSentTime).toISOString() })]
              );
              this.logger.log(`📞 [CRON DRIP] Prospect ${row.full_name} (${row.email}) 48h elapsed since final email without response. Updated stage to 'needs_call'.`);
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in processScheduledDripEmails: ${err.message}`);
    }
  }

  private formatBackendTimeEST(t?: string): string {
    if (!t) return '04:00 PM EST';
    const clean = t.trim();
    if (/AM|PM/i.test(clean)) {
      if (!/EST/i.test(clean)) return `${clean} EST`;
      return clean;
    }
    const match = clean.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const formattedHours = hours.toString().padStart(2, '0');
      return `${formattedHours}:${minutes} ${ampm} EST`;
    }
    return clean.includes('EST') ? clean : `${clean} EST`;
  }

  @Cron('*/1 * * * *')
  async process2HourWebinarReminders() {
    try {
      const res = await db.query(
        `SELECT id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date,
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink", status
         FROM webinars`
      );

      if (!res.rows || res.rows.length === 0) return;

      const now = new Date();

      for (const w of res.rows) {
        if (!w.date) continue;
        const parts = w.date.split('-');
        if (parts.length < 3) continue;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) continue;

        let hours = 16;
        let minutes = 0;
        if (w.time) {
          const match = w.time.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (match) {
            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const ampm = match[3]?.toUpperCase();
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            hours = h;
            minutes = m;
          }
        }

        const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
        const diffMs = startTime.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Target webinars starting within 2 hours (0 to 120 minutes from now)
        if (diffMinutes > 0 && diffMinutes <= 120) {
          const attendeesRes = await db.query(
            `SELECT wa.webinar_id, wa.prospect_id, dp.full_name as "fullName", dp.email, dp.apollo_id
             FROM webinar_attendees wa
             JOIN doctor_prospects dp ON wa.prospect_id = dp.apollo_id
             WHERE wa.webinar_id = $1 AND dp.email IS NOT NULL`,
            [w.id]
          );

          for (const att of attendeesRes.rows) {
            const eventCheck = await db.query(
              `SELECT id FROM prospect_events WHERE prospect_id = $1 AND event_type = '2h_webinar_reminder' AND details->>'webinarId' = $2 LIMIT 1`,
              [att.apollo_id, w.id]
            );

            if (eventCheck.rows.length === 0) {
              const doctorName = att.fullName || 'Physician';
              const formattedDate = w.formattedDate || w.date;
              const timeStr = this.formatBackendTimeEST(w.time);
              const durationRaw = (w.duration || '45').toString().trim();
              const durationStr = durationRaw.toLowerCase().includes('min') ? durationRaw : `${durationRaw} mins`;
              const webinarPassUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/webinar/pass?webinarId=${encodeURIComponent(w.id)}&prospectId=${encodeURIComponent(att.apollo_id)}`;

              const subject = `⏰ Reminder: Your Webinar Session Starts in 2 Hours! — ${w.title}`;
              const emailBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F1F1F; text-align: left; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
  <h2 style="color: #1F2937; margin: 0 0 12px 0; font-size: 20px; font-weight: bold; line-height: 1.3;">Upcoming Session Reminder, ${doctorName}!</h2>
  <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 0 0 16px 0;">
    Just a quick reminder that your <strong>Ovalia Capital Physician Briefing</strong> session starts in <strong>2 hours</strong>.
  </p>

  <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 10px; padding: 16px; margin: 16px 0;">
    <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #92400E;">⏰ Session Starting Details</h3>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #374151;">
      <tr>
        <td style="padding: 4px 0; font-weight: bold; width: 90px;">Session:</td>
        <td style="padding: 4px 0; color: #111827; font-weight: 600;">${w.title}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Date:</td>
        <td style="padding: 4px 0;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Time:</td>
        <td style="padding: 4px 0; font-weight: bold; color: #B45309;">${timeStr}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Duration:</td>
        <td style="padding: 4px 0;">${durationStr}</td>
      </tr>
    </table>
  </div>

  <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 16px 0;">
    Please click below to access your personalized pass and join link:
  </p>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0; text-align: center;">
    <tr>
      <td align="center" style="text-align: center;">
        <a href="${webinarPassUrl}" target="_blank" style="background-color: #22C55E; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; text-align: center; margin: 0 auto; box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);">
          👉 Access Your VIP Session Pass
        </a>
      </td>
    </tr>
  </table>
  <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin: 16px 0 0 0;">
    If you have any questions, feel free to reply directly to this email.
  </p>
</div>`;

              try {
                await this.sendCampaignOutreach([att.apollo_id], emailBody, undefined, subject);
                await db.query(
                  `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, '2h_webinar_reminder', $2, CURRENT_TIMESTAMP)`,
                  [att.apollo_id, JSON.stringify({ webinarId: w.id, webinarTitle: w.title, sentAt: now.toISOString() })]
                );
                this.logger.log(`⏰ [2H WEBINAR REMINDER DISPATCH] Sent 2h reminder to registered doctor ${att.fullName} (${att.email}) for webinar ${w.id}`);
              } catch (sendErr: any) {
                this.logger.error(`Failed to send 2h reminder to ${att.email}: ${sendErr.message}`);
              }
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in process2HourWebinarReminders: ${err.message}`);
    }
  }

  calculateDripSchedule(startDate: Date = new Date()) {
    const addWorkDaysWithGap = (current: Date, daysToAdd: number): Date => {
      let result = new Date(current);
      let added = 0;
      while (added < daysToAdd) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          added++;
        }
      }
      return result;
    };

    let day1Date = new Date(startDate);
    day1Date.setDate(day1Date.getDate() + 1); // First email starts NEXT DAY
    day1Date.setHours(9, 0, 0, 0); // @ 9:00 AM EST
    if (day1Date.getDay() === 6) day1Date.setDate(day1Date.getDate() + 2); // Sat -> Mon
    if (day1Date.getDay() === 0) day1Date.setDate(day1Date.getDate() + 1); // Sun -> Mon

    const schedule = [];
    for (let i = 0; i < 5; i++) {
      const workDaysOffset = i * 2; // 0, 2, 4, 6, 8 work days offset (1-day gap Monday to Friday)
      const dayDate = i === 0 ? new Date(day1Date) : addWorkDaysWithGap(day1Date, workDaysOffset);
      dayDate.setHours(9, 0, 0, 0); // @ 9:00 AM EST

      const formattedDate = dayDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) + ' @ 9:00 AM EST';

      schedule.push({
        day: i + 1,
        scheduledDate: formattedDate,
        isoDate: dayDate.toISOString(),
        status: 'scheduled'
      });
    }
    return schedule;
  }

  async generateDoctorSequence(prospectId?: string, mockDoctorData?: any) {
    // Ensure at least 1 webinar exists in database
    const latestWebinarCheck = await db.query(`SELECT id FROM webinars ORDER BY created_at DESC LIMIT 1`);
    if (!latestWebinarCheck.rows || latestWebinarCheck.rows.length === 0) {
      throw new HttpException(
        'Please create a webinar first in the Webinars tab before creating an email campaign.',
        HttpStatus.BAD_REQUEST
      );
    }

    let doc: any = null;
    if (prospectId) {
      try {
        await db.query(`ALTER TABLE doctor_prospects ADD COLUMN IF NOT EXISTS ai_sequence JSONB;`);
        const res = await db.query(
          `SELECT apollo_id, full_name, specialty, organization, location, email, ai_sequence FROM doctor_prospects WHERE apollo_id = $1`,
          [prospectId]
        );
        if (res.rows.length > 0) {
          doc = res.rows[0];
          if (doc.ai_sequence && Array.isArray(doc.ai_sequence) && doc.ai_sequence.length > 0) {
            this.logger.log(`Loaded saved 5-day AI sequence from database for doctor ${doc.full_name}`);
            return {
              success: true,
              isAiGenerated: true,
              provider: 'Saved Database AI Sequence',
              doctor: {
                fullName: doc.full_name,
                specialty: doc.specialty,
                organization: doc.organization,
                location: doc.location,
                email: doc.email,
              },
              sequence: doc.ai_sequence,
            };
          }
        }
      } catch (err) { }
    }

    if (!doc && mockDoctorData) {
      doc = mockDoctorData;
    }

    const fullName = doc?.full_name || doc?.fullName || 'Dr. David Wiebe, MD';
    const specialty = doc?.specialty || 'Orthopedic Surgery';
    const organization = doc?.organization || 'Austin Spine & Joint Surgery Center';
    const location = doc?.location || 'Austin, TX';
    const email = doc?.email || 'dwiebe@medical-verified.org';

    const geminiKey = process.env.Gemini_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let isAiGenerated = false;
    let provider = 'Smart Template Engine (Fallback Mode)';
    let sequence: any[] = [];

    // 1. Priority: Try Google Gemini API if Gemini_API_KEY is configured
    if (geminiKey && geminiKey.length > 10) {
      try {
        this.logger.log(`Calling Google Gemini API (model: gemini-flash-latest) for ${fullName}...`);
        const responseBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const prompt = `You are an elite AI copywriter for Ovalia Capital, a private equity real estate fund manager specializing in tax-sheltered, high-yield investments for accredited physicians.
Generate a hyper-personalized 5-day email drip sequence for a doctor.

Doctor Metadata:
- Name: ${fullName}
- Specialty: ${specialty}
- Clinic/Organization: ${organization}
- City/Location: ${location}

CRITICAL BUTTON RULE:
At the bottom of EVERY email body HTML, do NOT include any generic CTA buttons like "Book a call", "Register now", or "Click here".
Instead, you MUST include ONLY these two exact response buttons at the bottom of every email body:
1. Interested Button: <a href="${responseBaseUrl}/api/webinar-campaign/respond?email=${encodeURIComponent(email)}&response=interested" style="background-color:#22C55E; color:#ffffff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px; display:inline-block; margin-right:10px;">YES — I'm Interested (Send Me Webinar Pass)</a>
2. Not Interested Button: <a href="${responseBaseUrl}/api/webinar-campaign/respond?email=${encodeURIComponent(email)}&response=not_interested" style="background-color:#6B7280; color:#ffffff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:13px; display:inline-block;">NO — Not Interested</a>

Output MUST be a strictly valid JSON array of 5 objects (and NOTHING else).
Each object must have:
- "day": integer (1 to 5)
- "title": string (e.g. "Day 1: Initial Invitation Hook")
- "subject": string (compelling, high-open-rate subject line)
- "body": string (professionally formatted HTML email body with strong hook referencing their medical specialty and clinic, clear value prop, bullet points, and the two required response buttons above at the bottom).`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (geminiRes.ok) {
          const gData: any = await geminiRes.json();
          const text = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanedJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            sequence = parsed;
            isAiGenerated = true;
            provider = 'Google Gemini Flash (Free AI Engine)';
          }
        } else {
          const errText = await geminiRes.text();
          this.logger.warn(`Gemini API returned status ${geminiRes.status}: ${errText}`);
        }
      } catch (gErr: any) {
        this.logger.error(`Gemini API error: ${gErr.message}`);
      }
    }

    // 2. Secondary: Try OpenAI API if sequence is not yet generated
    if (sequence.length === 0 && openaiKey) {
      if (openaiKey && openaiKey.length > 10) {
        try {
          this.logger.log(`Calling OpenAI API (model: gpt-4o) for ${fullName}...`);
          const systemPrompt = `You are an elite AI copywriter for Ovalia Capital, a private equity real estate fund manager specializing in tax-sheltered, high-yield investments for accredited physicians.
Generate a hyper-personalized 5-day email drip sequence for a doctor.

Output MUST be a strictly valid JSON array of 5 objects (and NOTHING else).
Each object must have:
- "day": integer (1 to 5)
- "title": string (e.g. "Day 1: Initial Invitation Hook")
- "subject": string (compelling, high-open-rate subject line)
- "body": string (professionally formatted HTML email body with strong hook referencing their medical specialty and clinic, clear value prop, bullet points, and the two required response buttons at the bottom).`;

          const userPrompt = `Doctor Metadata:
- Name: ${fullName}
- Specialty: ${specialty}
- Clinic/Organization: ${organization}
- City/Location: ${location}

Generate the 5-day email sequence JSON array now.`;

          const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.7,
            }),
          });

          if (aiRes.ok) {
            const data: any = await aiRes.json();
            const content = data.choices?.[0]?.message?.content || '';
            const cleanedJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanedJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              sequence = parsed;
              isAiGenerated = true;
              provider = 'GPT-4o (OpenAI Engine)';
            }
          } else {
            const errText = await aiRes.text();
            this.logger.warn(`AI API call returned status ${aiRes.status}: ${errText}`);
          }
        } catch (err: any) {
          this.logger.error(`Error generating sequence via AI API: ${err.message}`);
        }
      }
    }

    if (sequence.length === 0) {
      const cleanName = fullName.replace(/^dr\.?\s+/i, '').trim();
      const responseBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const rsvpButtonsHtml = `
<div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #E5E7EB; text-align: center;">
  <p style="font-size: 13px; font-weight: bold; color: #4B5563; margin-bottom: 12px;">Would you like to attend or receive our private investor deck?</p>
  <a href="${responseBaseUrl}/api/webinar-campaign/respond?email=${encodeURIComponent(email)}&response=interested" style="background-color: #22C55E; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block; margin-right: 10px; margin-bottom: 8px;">YES — I'm Interested (Send Me Webinar Pass)</a>
  <a href="${responseBaseUrl}/api/webinar-campaign/respond?email=${encodeURIComponent(email)}&response=not_interested" style="background-color: #6B7280; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">NO — Not Interested</a>
</div>`;

      sequence = [
        {
          day: 1,
          title: 'Day 1: Exclusive Webinar Hook',
          subject: `Exclusive Wealth & Tax Strategies for ${specialty} Physicians in ${location}`,
          body: `<p style="font-size: 15px; color: #374151;">Dear ${fullName},</p>
<p style="font-size: 15px; color: #374151;">As a practicing specialist at <strong>${organization}</strong>, you spend your weeks delivering exceptional clinical care in ${location}. However, high income often brings significant tax burdens that dilute long-term wealth accumulation.</p>
<p style="font-size: 15px; color: #374151;">We would love to personally invite you to an exclusive 45-minute webinar hosted by <strong>Ovalia Capital</strong> tailored specifically for ${specialty} doctors:</p>
<div style="background-color: #FFFBEB; border-left: 4px solid #FBCB4B; padding: 16px; border-radius: 6px; margin: 20px 0;">
  <p style="margin: 0; font-weight: bold; color: #1F1F1F;">Topic: Tax-Advantaged Commercial Real Estate Returns for High-Income Physicians</p>
  <p style="margin: 6px 0 0; font-size: 13px; color: #6B7280;">Target Yield: 15-18% IRR | 100% Passive | K-1 Tax Losses Included</p>
</div>
${rsvpButtonsHtml}
<p style="font-size: 14px; color: #6B7280; margin-top: 20px;">Best regards,<br><strong>Ovalia Capital Investor Relations Team</strong></p>`
        },
        {
          day: 2,
          title: 'Day 2: K-1 Depreciation & Passive Returns',
          subject: `How ${specialty} Specialists at ${organization} Shelter Practice Income`,
          body: `<p style="font-size: 15px; color: #374151;">Hi ${cleanName},</p>
<p style="font-size: 15px; color: #374151;">Following up on my message yesterday. Many physicians in ${location} tell us their primary frustration is paying over 40% in combined federal and state taxes on practice earnings.</p>
<p style="font-size: 15px; color: #374151;">Commercial real estate syndication offers accelerated cost segregation depreciation—allowing accredited doctors to offset income tax while earning quarterly cash distributions.</p>
<ul style="font-size: 14px; color: #4B5563; line-height: 1.8;">
  <li><strong>Quarterly Cash Flow:</strong> Direct ACH deposits to your account.</li>
  <li><strong>Bonus Depreciation:</strong> Significant Year-1 tax write-offs.</li>
  <li><strong>Zero Time Commitment:</strong> Fully managed by Ovalia Capital asset managers.</li>
</ul>
${rsvpButtonsHtml}`
        },
        {
          day: 3,
          title: 'Day 3: Case Study & Peer Social Proof',
          subject: `Case Study: How a ${specialty} Partner Scaled Passive Income to $120k/yr`,
          body: `<p style="font-size: 15px; color: #374151;">Hello ${fullName},</p>
<p style="font-size: 15px; color: #374151;">We recently partnered with a leading ${specialty} physician in Texas who wanted to diversify out of volatile equity markets into tangible institutional real estate.</p>
<div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; border-radius: 12px; margin: 20px 0;">
  <p style="margin: 0; font-style: italic; color: #334155; font-size: 14px;">"Ovalia Capital allowed me to build real estate wealth without taking time away from my patients or surgical schedule. The quarterly distributions and tax savings exceeded expectations."</p>
</div>
<p style="font-size: 15px; color: #374151;">We will break down this exact portfolio structure during our 45-minute live Q&A webinar.</p>
${rsvpButtonsHtml}`
        },
        {
          day: 4,
          title: 'Day 4: Live Webinar Countdown',
          subject: `Reminder: Live Q&A Session for ${organization} Physicians Starts Soon`,
          body: `<p style="font-size: 15px; color: #374151;">Hi ${cleanName},</p>
<p style="font-size: 15px; color: #374151;">Just a quick note that spots for our upcoming <strong>Ovalia Capital Physician Wealth Session</strong> are filling up quickly.</p>
<p style="font-size: 15px; color: #374151;">In 45 minutes, our Managing Partners will share:</p>
<ol style="font-size: 14px; color: #4B5563; line-height: 1.8;">
  <li>Current market opportunities in multifamily & industrial assets.</li>
  <li>How accredited doctors evaluate fund risk profiles.</li>
  <li>Live Q&A to answer your specific investment questions.</li>
</ol>
${rsvpButtonsHtml}`
        },
        {
          day: 5,
          title: 'Day 5: Final Break-in & Private Offering Deck',
          subject: `Final Check-in: Private Investment Deck for ${fullName}`,
          body: `<p style="font-size: 15px; color: #374151;">Dear ${fullName},</p>
<p style="font-size: 15px; color: #374151;">I know how demanding your schedule at <strong>${organization}</strong> can be. If you were unable to attend the webinar, I would be glad to send over our <strong>Private Investor Presentation Deck</strong> directly to your email.</p>
<p style="font-size: 15px; color: #374151;">Or, if you prefer a brief 10-minute introductory phone call with our Investor Relations Director, you can pick a time that suits your clinical hours.</p>
${rsvpButtonsHtml}
<p style="font-size: 14px; color: #6B7280; margin-top: 20px;">Warm regards,<br><strong>Ovalia Capital Managing Team</strong></p>`
        }
      ];
    }

    const dripSchedule = this.calculateDripSchedule(new Date());
    sequence = sequence.map((item: any, idx: number) => {
      const sched = dripSchedule[idx] || dripSchedule[0];
      return {
        ...item,
        scheduledDate: sched.scheduledDate,
        isoDate: sched.isoDate,
        status: 'scheduled',
      };
    });

    if (prospectId && sequence.length > 0) {
      try {
        await db.query(
          `UPDATE doctor_prospects SET ai_sequence = $1::jsonb, stage = 'pending_outreach' WHERE apollo_id = $2`,
          [JSON.stringify(sequence), prospectId]
        );
        this.logger.log(`💾 Persisted 5-day email sequence into database for prospect: ${prospectId}`);
      } catch (err: any) {
        this.logger.warn(`Failed to persist sequence to DB: ${err.message}`);
      }
    }

    return {
      success: true,
      isAiGenerated,
      provider,
      doctor: {
        fullName,
        specialty,
        organization,
        location,
        email,
      },
      sequence,
    };
  }

  async recordProspectResponse(identifier: string, status: string): Promise<void> {
    try {
      if (!identifier || !status) return;
      const validStatus = status === 'interested' ? 'interested' : 'not_interested';

      const updateRes = await db.query(
        `UPDATE doctor_prospects SET stage = $1, updated_at = CURRENT_TIMESTAMP WHERE apollo_id = $2 OR email = $2 RETURNING apollo_id, full_name, email`,
        [validStatus, identifier]
      );

      if (updateRes.rows.length > 0) {
        const row = updateRes.rows[0];
        const apolloId = row.apollo_id;
        const doctorName = row.full_name || 'Doctor';
        const doctorEmail = row.email || identifier;

        await db.query(
          `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [apolloId, `response_${validStatus}`, JSON.stringify({ status: validStatus, recordedAt: new Date().toISOString() })]
        );
        this.logger.log(`✅ [Prospect Response] Recorded stage '${validStatus}' in PostgreSQL for doctor ${doctorName} (${doctorEmail})!`);

        // Trigger automated interest confirmation email with dynamic VIP webinar pass link and briefing details
        if (validStatus === 'interested' && doctorEmail) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const latestWebinarRes = await db.query(
            `SELECT id, title, webinar_date, webinar_time, duration, meeting_link FROM webinars ORDER BY created_at DESC LIMIT 1`
          );

          const latestWebinar = latestWebinarRes.rows.length > 0 ? latestWebinarRes.rows[0] : null;
          const webinarPassUrl = latestWebinar
            ? `${frontendUrl}/webinar/pass?prospect_id=${encodeURIComponent(apolloId)}&webinar_id=${encodeURIComponent(latestWebinar.id)}`
            : `${frontendUrl}/webinar/pass?prospect_id=${encodeURIComponent(apolloId)}`;

          if (latestWebinar && apolloId) {
            try {
              await db.query(
                `INSERT INTO webinar_attendees (webinar_id, prospect_id, status, created_at, updated_at)
                 VALUES ($1, $2, 'registered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT (webinar_id, prospect_id) DO NOTHING`,
                [latestWebinar.id, apolloId]
              );
              this.logger.log(`🎟️ Logged doctor ${doctorName} (${apolloId}) as 'registered' (Pass Sent) for webinar ${latestWebinar.id}`);
            } catch (pErr: any) {
              this.logger.error(`Failed to register pass in webinar_attendees: ${pErr.message}`);
            }
          }

          const title = latestWebinar?.title || 'Ovalia Capital Physician Wealth Briefing';
          let formattedDate = 'Scheduled Date';
          if (latestWebinar?.webinar_date) {
            try {
              const d = new Date(latestWebinar.webinar_date);
              formattedDate = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            } catch (e) {}
          }
          const timeStr = this.formatBackendTimeEST(latestWebinar?.webinar_time);
          const durationRaw = (latestWebinar?.duration || '45').toString().trim();
          const durationStr = durationRaw.toLowerCase().includes('min') ? durationRaw : `${durationRaw} mins`;

          const subject = `Thank You for Your Interest! — Physician Webinar Access`;
          const emailBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F1F1F; text-align: left; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
  <h2 style="color: #1F2937; margin: 0 0 12px 0; font-size: 20px; font-weight: bold; line-height: 1.3;">Thank You for Your Interest, ${doctorName}!</h2>
  <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 0 0 16px 0;">
    We have received your response expressing interest in our <strong>Ovalia Capital Physician Wealth Session</strong>.
  </p>

  <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; margin: 16px 0;">
    <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #111827;">🗓️ Session Details</h3>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #374151;">
      <tr>
        <td style="padding: 4px 0; font-weight: bold; width: 90px;">Session:</td>
        <td style="padding: 4px 0; color: #111827; font-weight: 600;">${title}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Date:</td>
        <td style="padding: 4px 0;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Time:</td>
        <td style="padding: 4px 0;">${timeStr}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-weight: bold;">Duration:</td>
        <td style="padding: 4px 0;">${durationStr}</td>
      </tr>
    </table>
  </div>

  <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 16px 0;">
    You can access your personalized VIP session pass link directly below:
  </p>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0; text-align: center;">
    <tr>
      <td align="center" style="text-align: center;">
        <a href="${webinarPassUrl}" target="_blank" style="background-color: #22C55E; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; text-align: center; margin: 0 auto; box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);">
          👉 Access Your VIP Physician Webinar Pass
        </a>
      </td>
    </tr>
  </table>
  <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin: 16px 0 0 0;">
    Need help? Contact our support team at <a href="mailto:portal@ovaliacapital.com" style="color: #2563EB; text-decoration: underline;">portal@ovaliacapital.com</a>.
  </p>
</div>`;
          try {
            await this.emailService.sendCustomEmail(doctorEmail, doctorName, subject, emailBody);
            this.logger.log(`📩 Sent interest confirmation email with VIP webinar pass link to ${doctorEmail}`);
          } catch (emailErr: any) {
            this.logger.error(`Failed to send interest confirmation email to ${doctorEmail}: ${emailErr.message}`);
          }
        }
      } else {
        this.logger.warn(`[Prospect Response] Doctor record not found for identifier: ${identifier}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Error recording response for prospect ${identifier}: ${error.message}`, error?.stack);
    }
  }

  async getProspectNotes(prospectId: string): Promise<any[]> {
    try {
      const res = await db.query(
        `SELECT * FROM doctor_prospect_notes WHERE prospect_id = $1 ORDER BY created_at DESC`,
        [prospectId]
      );
      return res.rows;
    } catch (error: any) {
      this.logger.error(`Error fetching notes for prospect ${prospectId}: ${error.message}`);
      return [];
    }
  }

  async addProspectNote(prospectId: string, note: string, authorName: string = 'Staff'): Promise<any> {
    try {
      const res = await db.query(
        `INSERT INTO doctor_prospect_notes (prospect_id, note, author_name, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
        [prospectId, note, authorName]
      );
      this.logger.log(`📝 Added new note for doctor prospect ${prospectId}`);
      return res.rows[0];
    } catch (error: any) {
      this.logger.error(`Error adding note for prospect ${prospectId}: ${error.message}`);
      throw new HttpException(error.message || 'Failed to save note', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteProspectNote(noteId: number): Promise<{ success: boolean }> {
    try {
      await db.query(`DELETE FROM doctor_prospect_notes WHERE id = $1`, [noteId]);
      this.logger.log(`🗑️ Deleted doctor prospect note ID ${noteId}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error deleting note ${noteId}: ${error.message}`);
      throw new HttpException(error.message || 'Failed to delete note', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addManualProspect(data: {
    fullName: string;
    specialty?: string;
    organization?: string;
    location?: string;
    email: string;
    phone?: string;
  }) {
    if (!data.fullName || !data.email) {
      throw new HttpException('Full Name and Email are required', HttpStatus.BAD_REQUEST);
    }

    if (data.phone && data.phone.trim() && data.phone.trim() !== 'N/A') {
      const cleanPhone = data.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        throw new HttpException('Invalid phone number format. Phone number must contain between 7 and 15 digits.', HttpStatus.BAD_REQUEST);
      }
    }

    const apolloId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cleanFullName = data.fullName.trim();
    const nameWithoutPrefix = cleanFullName.replace(/^Dr\.?\s+/i, '');
    const nameParts = nameWithoutPrefix.split(' ');
    const firstName = nameParts[0] || 'Doctor';
    const lastName = nameParts.slice(1).join(' ') || '';

    const query = `
      INSERT INTO doctor_prospects (
        apollo_id, full_name, first_name, last_name, specialty, organization, location, email, phone, email_status, stage, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified', 'pending_outreach', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    try {
      const res = await db.query(query, [
        apolloId,
        cleanFullName,
        firstName,
        lastName,
        data.specialty?.trim() || 'General Practice',
        data.organization?.trim() || 'Private Practice',
        data.location?.trim() || 'United States',
        data.email.trim(),
        data.phone?.trim() || 'N/A'
      ]);

      this.logger.log(`➕ Added manual doctor prospect: ${cleanFullName} (${data.email}) to PostgreSQL`);
      return {
        success: true,
        prospect: res.rows[0]
      };
    } catch (err: any) {
      this.logger.error(`Error adding manual prospect: ${err.message}`);
      throw new HttpException(err.message || 'Failed to create doctor prospect', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- Dynamic Webinars & Attendance Tracking Methods ---

  private computeWebinarStatus(dateStr: string, timeStr?: string, durationStr?: string): 'upcoming' | 'live' | 'completed' {
    if (!dateStr) return 'upcoming';

    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return 'upcoming';
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      if (isNaN(year) || isNaN(month) || isNaN(day)) return 'upcoming';

      let hours = 16;
      let minutes = 0;

      if (timeStr) {
        const cleanTime = timeStr.trim();
        const match = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const ampm = match[3]?.toUpperCase();

          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;

          hours = h;
          minutes = m;
        }
      }

      const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      let durationMinutes = 45;
      if (durationStr) {
        const durMatch = durationStr.match(/(\d+)/);
        if (durMatch) {
          durationMinutes = parseInt(durMatch[1], 10);
        }
      }

      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      const now = new Date();

      if (now < startDate) {
        return 'upcoming';
      } else if (now >= startDate && now <= endDate) {
        return 'live';
      } else {
        return 'completed';
      }
    } catch {
      return 'upcoming';
    }
  }

  async getAllWebinars() {
    try {
      const webinarsRes = await db.query(
        `SELECT id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date, 
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink", status
         FROM webinars ORDER BY webinar_date DESC, created_at DESC`
      );

      const webinars = webinarsRes.rows;

      for (const w of webinars) {
        w.status = this.computeWebinarStatus(w.date, w.time, w.duration);

        const attendeesRes = await db.query(
          `SELECT wa.status, wa.first_joined_at as "joinTime", wa.total_duration_minutes as duration,
                  dp.apollo_id as id, dp.full_name as "fullName", dp.specialty, dp.organization, 
                  dp.location, dp.email, dp.phone
           FROM webinar_attendees wa
           JOIN doctor_prospects dp ON wa.prospect_id = dp.apollo_id
           WHERE wa.webinar_id = $1`,
          [w.id]
        );
        const rawAttendees = attendeesRes.rows;
        w.attendees = rawAttendees.map((att: any) => ({
          ...att,
          duration: att.status === 'attended' ? (att.duration ? `${att.duration} mins` : '0 mins') : 'N/A',
          joinTime: att.joinTime ? new Date(att.joinTime).toISOString() : undefined,
        }));

        w.totalPassesSent = rawAttendees.length;
        w.totalJoined = rawAttendees.filter((att: any) => att.status === 'attended').length;
        w.noShowCount = rawAttendees.filter((att: any) => att.status !== 'attended').length;
      }

      return {
        success: true,
        webinars,
      };
    } catch (err: any) {
      this.logger.error(`Error in getAllWebinars: ${err.message}`);
      return { success: false, webinars: [] };
    }
  }

  async createWebinar(data: {
    title: string;
    description?: string;
    webinarDate: string;
    webinarTime?: string;
    duration?: string;
    meetingLink: string;
  }) {
    if (!data.title || !data.webinarDate || !data.meetingLink) {
      throw new HttpException('Title, Date, and Meeting Link are required', HttpStatus.BAD_REQUEST);
    }

    const id = `web-${Date.now()}`;
    const query = `
      INSERT INTO webinars (id, title, description, webinar_date, webinar_time, duration, meeting_link, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'upcoming', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date,
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink", status
    `;

    try {
      const res = await db.query(query, [
        id,
        data.title.trim(),
        data.description?.trim() || 'Ovalia Capital Physician Wealth Session.',
        data.webinarDate,
        data.webinarTime?.trim() || '04:00 PM EST',
        data.duration?.trim() ? (data.duration.toLowerCase().includes('min') ? data.duration.trim() : `${data.duration.trim()} mins`) : '45 mins',
        data.meetingLink.trim(),
      ]);

      const createdWebinar = res.rows[0];
      if (createdWebinar) {
        createdWebinar.status = this.computeWebinarStatus(createdWebinar.date, createdWebinar.time, createdWebinar.duration);
      }

      this.logger.log(`🎥 Scheduled new webinar: ${data.title} (${data.webinarDate})`);
      return {
        success: true,
        webinar: {
          ...createdWebinar,
          attendees: [],
        },
      };
    } catch (err: any) {
      this.logger.error(`Error creating webinar: ${err.message}`);
      throw new HttpException('Failed to create webinar record', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteWebinar(id: string) {
    if (!id) {
      throw new HttpException('Webinar ID is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const res = await db.query(`DELETE FROM webinars WHERE id = $1 RETURNING id`, [id]);
      if (res.rowCount === 0) {
        throw new HttpException('Webinar not found', HttpStatus.NOT_FOUND);
      }
      this.logger.log(`🗑️ Deleted webinar: ${id}`);
      return {
        success: true,
        message: 'Webinar deleted successfully',
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Error deleting webinar ${id}: ${err.message}`);
      throw new HttpException(err.message || 'Failed to delete webinar', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getWebinarPassDetails(webinarId: string, prospectId: string) {
    try {
      const webinarRes = await db.query(
        `SELECT id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date,
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink", status
         FROM webinars WHERE id = $1`,
        [webinarId]
      );

      let doctor = null;
      if (prospectId) {
        const doctorRes = await db.query(
          `SELECT apollo_id as id, full_name as "fullName", specialty, organization, email FROM doctor_prospects WHERE apollo_id = $1 OR email = $1`,
          [prospectId]
        );
        if (doctorRes.rows.length > 0) {
          doctor = doctorRes.rows[0];
        }
      }

      const webinar = webinarRes.rows[0] || null;
      if (webinar) {
        webinar.status = this.computeWebinarStatus(webinar.date, webinar.time, webinar.duration);
      }

      return {
        success: !!webinar,
        webinar,
        doctor,
      };
    } catch (err: any) {
      this.logger.error(`Error fetching webinar pass details: ${err.message}`);
      return { success: false, webinar: null, doctor: null };
    }
  }

  async recordWebinarJoinSession(webinarId: string, prospectId: string) {
    try {
      if (!webinarId || !prospectId) {
        throw new HttpException('Webinar ID and Prospect ID are required', HttpStatus.BAD_REQUEST);
      }

      // Find prospect apollo_id
      const doctorRes = await db.query(
        `SELECT apollo_id, full_name, email FROM doctor_prospects WHERE apollo_id = $1 OR email = $1`,
        [prospectId]
      );

      if (doctorRes.rows.length === 0) {
        return { success: false, message: 'Prospect not found' };
      }

      const apolloId = doctorRes.rows[0].apollo_id;
      const doctorName = doctorRes.rows[0].full_name;

      // 1. Insert session log returning id
      const sessRes = await db.query(
        `INSERT INTO webinar_attendance_sessions (webinar_id, prospect_id, joined_at, last_heartbeat_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [webinarId, apolloId]
      );
      const sessionId = sessRes.rows[0]?.id;

      // 2. Upsert webinar_attendees summary record
      await db.query(
        `INSERT INTO webinar_attendees (webinar_id, prospect_id, status, first_joined_at, join_count, created_at, updated_at)
         VALUES ($1, $2, 'attended', CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (webinar_id, prospect_id) DO UPDATE SET
           status = 'attended',
           join_count = webinar_attendees.join_count + 1,
           first_joined_at = COALESCE(webinar_attendees.first_joined_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP`,
        [webinarId, apolloId]
      );

      // 3. Log event in prospect_events
      await db.query(
        `INSERT INTO prospect_events (prospect_id, event_type, details, created_at)
         VALUES ($1, 'webinar_joined', $2, CURRENT_TIMESTAMP)`,
        [apolloId, JSON.stringify({ webinarId, sessionId, joinedAt: new Date().toISOString() })]
      );

      this.logger.log(`🎟️ [Webinar Attendance] Doctor ${doctorName} (${apolloId}) joined webinar ${webinarId} (Session #${sessionId})!`);

      return {
        success: true,
        sessionId,
        message: 'Attendance recorded successfully',
      };
    } catch (err: any) {
      this.logger.error(`Error recording webinar attendance: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async recordWebinarHeartbeat(sessionId?: number, webinarId?: string, prospectId?: string) {
    try {
      let targetSessionId = sessionId;

      if (!targetSessionId && webinarId && prospectId) {
        // Find most recent active session
        const sessRes = await db.query(
          `SELECT id FROM webinar_attendance_sessions 
           WHERE webinar_id = $1 AND prospect_id = $2 
           ORDER BY joined_at DESC LIMIT 1`,
          [webinarId, prospectId]
        );
        if (sessRes.rows.length > 0) {
          targetSessionId = sessRes.rows[0].id;
        }
      }

      if (!targetSessionId) {
        return { success: false, message: 'Active session not found' };
      }

      // Update session last_heartbeat_at, left_at, and compute duration_seconds
      const updateRes = await db.query(
        `UPDATE webinar_attendance_sessions
         SET last_heartbeat_at = CURRENT_TIMESTAMP,
             left_at = CURRENT_TIMESTAMP,
             duration_seconds = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - joined_at)))
         WHERE id = $1
         RETURNING webinar_id, prospect_id, duration_seconds`,
        [targetSessionId]
      );

      if (updateRes.rows.length > 0) {
        const { webinar_id, prospect_id } = updateRes.rows[0];

        // Aggregate total seconds across all sessions for this doctor & webinar
        const sumRes = await db.query(
          `SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
           FROM webinar_attendance_sessions
           WHERE webinar_id = $1 AND prospect_id = $2`,
          [webinar_id, prospect_id]
        );

        const totalSeconds = Number(sumRes.rows[0]?.total_seconds || 0);
        const totalMinutes = Math.round(totalSeconds / 60);

        // Update webinar_attendees master table total_duration_minutes
        await db.query(
          `UPDATE webinar_attendees
           SET total_duration_minutes = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE webinar_id = $2 AND prospect_id = $3`,
          [totalMinutes, webinar_id, prospect_id]
        );
      }

      return { success: true, sessionId: targetSessionId };
    } catch (err: any) {
      this.logger.error(`Error in recordWebinarHeartbeat: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendSequenceStepNow(prospectId: string, day: number) {
    try {
      const res = await db.query(
        `SELECT apollo_id, full_name, email, ai_sequence, stage FROM doctor_prospects WHERE apollo_id = $1 OR email = $1`,
        [prospectId]
      );

      if (res.rows.length === 0) {
        throw new HttpException('Doctor prospect not found', HttpStatus.NOT_FOUND);
      }

      const row = res.rows[0];
      let seq = row.ai_sequence;
      if (typeof seq === 'string') {
        try { seq = JSON.parse(seq); } catch (e) { seq = []; }
      }

      if (!Array.isArray(seq) || seq.length === 0) {
        throw new HttpException('No AI sequence configured for this doctor. Please generate a sequence first.', HttpStatus.BAD_REQUEST);
      }

      const dayIdx = Math.max(0, day - 1);
      const stepItem = seq[dayIdx] || seq[0];

      if (!stepItem || !stepItem.body) {
        throw new HttpException(`Step Day ${day} content not found`, HttpStatus.BAD_REQUEST);
      }

      // Send the email via Resend/SMTP
      await this.sendCampaignOutreach([row.apollo_id], stepItem.body, undefined, stepItem.subject);

      // Update sequence step status in memory to 'sent'
      stepItem.status = 'sent';
      stepItem.sentAt = new Date().toISOString();

      // Persist updated sequence and stage in PostgreSQL
      await db.query(
        `UPDATE doctor_prospects SET ai_sequence = $1::jsonb, stage = 'sent', updated_at = CURRENT_TIMESTAMP WHERE apollo_id = $2`,
        [JSON.stringify(seq), row.apollo_id]
      );

      await db.query(
        `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, 'manual_step_sent', $2, CURRENT_TIMESTAMP)`,
        [row.apollo_id, JSON.stringify({ day, subject: stepItem.subject, sentAt: stepItem.sentAt })]
      );

      this.logger.log(`⚡ [Manual Instant Dispatch] Sent Day ${day} email to ${row.full_name} (${row.email}) & set status='sent'`);

      return {
        success: true,
        message: `Day ${day} email sent successfully to ${row.full_name}`,
        sequence: seq,
      };
    } catch (err: any) {
      this.logger.error(`Error in sendSequenceStepNow: ${err.message}`);
      throw new HttpException(err.message || 'Failed to send sequence step', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}


