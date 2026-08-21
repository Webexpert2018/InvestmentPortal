import { Injectable, HttpException, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { db } from '../../config/database';
import { EmailService } from '../email/email.service';
import { MeetingsService } from '../meetings/meetings.service';

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
export class WebinarCampaignService implements OnModuleInit {
  private readonly logger = new Logger(WebinarCampaignService.name);

  constructor(
    private emailService: EmailService,
    private configService: ConfigService,
    private meetingsService: MeetingsService
  ) { }

  async onModuleInit() {
    try {
      await db.query(`
        CREATE OR REPLACE FUNCTION sync_attendee_to_interested()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE doctor_prospects
          SET stage = 'interested', updated_at = CURRENT_TIMESTAMP
          WHERE apollo_id = NEW.prospect_id AND (stage IS NULL OR stage != 'interested');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      await db.query(`
        DROP TRIGGER IF EXISTS trg_sync_attendee_to_interested ON webinar_attendees;
      `);
      await db.query(`
        CREATE TRIGGER trg_sync_attendee_to_interested
        AFTER INSERT ON webinar_attendees
        FOR EACH ROW
        EXECUTE FUNCTION sync_attendee_to_interested();
      `);
      this.logger.log('⚡ Registered PostgreSQL trigger for syncing webinar attendees to interested prospects!');
    } catch (err: any) {
      this.logger.error(`Failed to register PostgreSQL trigger: ${err.message}`);
    }
  }

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
          `SELECT apollo_id, email, phone, email_status, stage, created_at FROM doctor_prospects WHERE apollo_id = ANY($1)`,
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

      const createdAt = isAlreadySaved ? (saved?.created_at || saved?.createdAt || new Date().toISOString()) : undefined;

      return {
        ...p,
        email,
        phone,
        isAlreadyEnriched: isAlreadySaved,
        emailStatus: isAlreadySaved ? (saved?.email_status || 'verified') : undefined,
        status: isAlreadySaved && ['sent', 'interested', 'not_interested', 'needs_call'].includes(saved?.stage) ? saved.stage : 'ai_copy_ready',
        stage: saved?.stage || 'pending_outreach',
        createdAt,
        created_at: createdAt,
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
      const rawDate = row.created_at || row.createdAt || row.updated_at;
      const validCreatedAt = rawDate ? (typeof rawDate === 'string' ? rawDate : new Date(rawDate).toISOString()) : new Date().toISOString();
      return {
        ...row,
        id: row.apollo_id || row.id,
        fullName: row.full_name || row.fullName || 'Dr. David Wiebe, MD',
        phone,
        email,
        createdAt: validCreatedAt,
        created_at: validCreatedAt,
        status: ['sent', 'interested', 'not_interested', 'needs_call'].includes(row.stage) ? row.stage : 'ai_copy_ready',
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

  private parseEasternDateTime(dateStr?: string, timeStr?: string): { startUtc: Date; timeZoneAbbr: string; formattedTimeET: string } {
    let year = new Date().getFullYear();
    let month = new Date().getMonth();
    let day = new Date().getDate();

    if (dateStr) {
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      } else {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          year = d.getUTCFullYear();
          month = d.getUTCMonth();
          day = d.getUTCDate();
        }
      }
    }

    let hours = 16;
    let minutes = 0;

    if (timeStr) {
      const cleanTime = timeStr.trim();
      const match = cleanTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        if (/pm/i.test(cleanTime) && hours < 12) hours += 12;
        if (/am/i.test(cleanTime) && hours === 12) hours = 0;
      }
    }

    const guessUtc = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));

    const nyFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });

    const parts = nyFormatter.formatToParts(guessUtc);
    const partMap: Record<string, string> = {};
    parts.forEach((p) => { partMap[p.type] = p.value; });

    const nyYear = parseInt(partMap.year, 10);
    const nyMonth = parseInt(partMap.month, 10) - 1;
    const nyDay = parseInt(partMap.day, 10);
    let nyHour = parseInt(partMap.hour, 10);
    if (nyHour === 24) nyHour = 0;
    const nyMinute = parseInt(partMap.minute, 10);

    const nyAsUtc = Date.UTC(nyYear, nyMonth, nyDay, nyHour, nyMinute, 0, 0);
    const diffMs = guessUtc.getTime() - nyAsUtc;

    const startUtc = new Date(guessUtc.getTime() + diffMs);

    const finalParts = nyFormatter.formatToParts(startUtc);
    const tzPart = finalParts.find((p) => p.type === 'timeZoneName');
    const timeZoneAbbr = tzPart ? tzPart.value : 'ET';

    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = displayHours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedTimeET = `${formattedHours}:${formattedMinutes} ${ampm} ${timeZoneAbbr}`;

    return { startUtc, timeZoneAbbr, formattedTimeET };
  }

  private formatBackendTimeEST(t?: string, dateStr?: string): string {
    if (!t && !dateStr) return '04:00 PM EDT';
    try {
      const { formattedTimeET } = this.parseEasternDateTime(dateStr, t);
      return formattedTimeET;
    } catch (e) {
      if (!t) return '04:00 PM EDT';
      return t;
    }
  }

  @Cron('*/1 * * * *')
  async processAutomatedWebinarReminders() {
    try {
      const res = await db.query(
        `SELECT id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date,
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink", status,
                COALESCE(reminder_offsets, '{}') as "reminderOffsets"
         FROM webinars`
      );

      if (!res.rows || res.rows.length === 0) return;

      const now = new Date();

      for (const w of res.rows) {
        if (!w.date) continue;
        const offsets: number[] = Array.isArray(w.reminderOffsets) ? w.reminderOffsets.map(Number) : [];
        if (offsets.length === 0) continue;

        const { startUtc } = this.parseEasternDateTime(w.date, w.time);
        const diffMs = startUtc.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        this.logger.log(
          `⏰ [Cron Reminder Check] Webinar "${w.title}" (${w.date} ${w.time || '16:00'}): ` +
          `UTC start = ${startUtc.toISOString()}, Current UTC = ${now.toISOString()}, diffMinutes = ${Math.round(diffMinutes)}m. Offsets: [${offsets.join(', ')}]`
        );

        let attendeesRes: any = null;

        for (const offsetMins of offsets) {
          // Trigger reminder if time remaining is within the window for this offset
          if (diffMinutes >= -720 && diffMinutes <= offsetMins) {
            if (!attendeesRes) {
              attendeesRes = await db.query(
                `SELECT wa.webinar_id, wa.prospect_id, dp.full_name as "fullName", dp.email, dp.apollo_id
                 FROM webinar_attendees wa
                 JOIN doctor_prospects dp ON wa.prospect_id = dp.apollo_id
                 WHERE wa.webinar_id = $1 AND dp.email IS NOT NULL`,
                [w.id]
              );
            }

            const eventType = `webinar_reminder_${offsetMins}m`;

            for (const att of attendeesRes.rows) {
              const alreadySent = await db.query(
                `SELECT 1 FROM prospect_events WHERE prospect_id = $1 AND event_type = $2 AND details->>'webinarId' = $3`,
                [att.apollo_id, eventType, w.id]
              );

              if (alreadySent.rows.length === 0) {
                const doctorName = att.fullName || 'Doctor';
                const subject = `⏰ Reminder: "${w.title}" is coming up!`;
                
                // Format session time nicely for the email body
                const formattedDate = w.formattedDate || w.date;
                const timeStr = w.time;
                const durationStr = w.duration || '45 mins';
                
                const emailBody = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #1F1F1F;">Webinar Session Reminder</h2>
                    <p>Dear Dr. ${doctorName},</p>
                    <p>This is a quick reminder that the webinar session <strong>"${w.title}"</strong> is scheduled to start soon.</p>
                    
                    <div style="background-color: #F8F9FA; padding: 15px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
                      <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Time:</strong> ${timeStr}</p>
                      <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Duration:</strong> ${durationStr}</p>
                    </div>

                    <p>To join the session, please use the link below:</p>
                    <p style="text-align: center; margin: 30px 0;">
                      <a href="${w.meetingLink || 'https://us02web.zoom.us/j/6466719252'}" style="background-color: #D9A11E; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: bold;">Join Meeting</a>
                    </p>
                    
                    <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">
                      This is an automated reminder. If you have questions, please reply directly to this email.
                    </p>
                  </div>
                `;

                try {
                  await this.emailService.sendCustomEmail(att.email, doctorName, subject, emailBody);
                  await db.query(
                    `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                    [att.apollo_id, eventType, JSON.stringify({ webinarId: w.id, webinarTitle: w.title, offsetMins, sentAt: now.toISOString() })]
                  );
                  this.logger.log(`⏰ [Cron Reminder ${offsetMins}m] Dispatched reminder email to Dr. ${doctorName} (${att.email}) for webinar ${w.id}`);
                } catch (sendErr: any) {
                  this.logger.error(`Failed to send ${offsetMins}m reminder to ${att.email}: ${sendErr.message}`);
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in processAutomatedWebinarReminders cron: ${err.message}`);
    }
  }

  /*
  // Original local reminder implementation (retained for reference):
  async processAutomatedWebinarRemindersBackup() {
    try {
      const res = await db.query(
        `SELECT id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date,
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink", status,
                COALESCE(reminder_offsets, '{}') as "reminderOffsets"
         FROM webinars`
      );

      if (!res.rows || res.rows.length === 0) return;

      const now = new Date();

      for (const w of res.rows) {
        if (!w.date) continue;
        const offsets: number[] = Array.isArray(w.reminderOffsets) ? w.reminderOffsets.map(Number) : [];
        if (offsets.length === 0) continue;

        const { startUtc } = this.parseEasternDateTime(w.date, w.time);
        const diffMs = startUtc.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        this.logger.log(
          `⏰ [Cron Reminder Check] Webinar "${w.title}" (${w.date} ${w.time || '16:00'}): ` +
          `UTC start = ${startUtc.toISOString()}, Current UTC = ${now.toISOString()}, diffMinutes = ${Math.round(diffMinutes)}m. Offsets: [${offsets.join(', ')}]`
        );

        let attendeesRes: any = null;

        for (const offsetMins of offsets) {
          if (diffMinutes >= -720 && diffMinutes <= offsetMins) {
            if (!attendeesRes) {
              attendeesRes = await db.query(
                `SELECT wa.webinar_id, wa.prospect_id, dp.full_name as "fullName", dp.email, dp.apollo_id
                 FROM webinar_attendees wa
                 JOIN doctor_prospects dp ON wa.prospect_id = dp.apollo_id
                 WHERE wa.webinar_id = $1 AND dp.email IS NOT NULL`,
                [w.id]
              );
            }

            const eventType = `webinar_reminder_${offsetMins}m`;

            for (const att of attendeesRes.rows) {
              const alreadySent = await db.query(
                `SELECT 1 FROM prospect_events WHERE prospect_id = $1 AND event_type = $2 AND details->>'webinarId' = $3`,
                [att.apollo_id, eventType, w.id]
              );

              if (alreadySent.rows.length === 0) {
                const doctorName = att.fullName || 'Doctor';
                const subject = `⏰ Reminder: "${w.title}" is coming up!`;
                const emailBody = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #1F1F1F;">Webinar Session Reminder</h2>
                    <p>Dear Dr. ${doctorName},</p>
                    <p>This is a quick reminder that the webinar session <strong>"${w.title}"</strong> is scheduled to start soon.</p>
                    
                    <div style="background-color: #F8F9FA; padding: 15px; border-radius: 6px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${w.formattedDate}</p>
                      <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Time:</strong> ${w.time}</p>
                      <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Duration:</strong> ${w.duration || '45 mins'}</p>
                    </div>

                    <p>To join the session, please use the link below:</p>
                    <p style="text-align: center; margin: 30px 0;">
                      <a href="\${w.meetingLink || 'https://owaliacapital.com'}" style="background-color: #D9A11E; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: bold;">Join Meeting</a>
                    </p>
                    
                    <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px; margin-top: 30px;">
                      This is an automated reminder. If you have questions, please reply directly to this email.
                    </p>
                  </div>
                `;

                try {
                  await this.emailService.sendCustomEmail(att.email, doctorName, subject, emailBody);
                  await db.query(
                    `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                    [att.apollo_id, eventType, JSON.stringify({ webinarId: w.id, webinarTitle: w.title, offsetMins, sentAt: now.toISOString() })]
                  );
                } catch (sendErr: any) {
                  this.logger.error(\`Failed to send \${offsetMins}m reminder to \${att.email}: \${sendErr.message}\`);
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.error(\`Error in processAutomatedWebinarRemindersBackup: \${err.message}\`);
    }
  }
  */

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
    const latestWebinarCheck = await db.query(`SELECT id FROM webinars ORDER BY is_active DESC, created_at DESC LIMIT 1`);
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

        // Trigger automated interest Google Calendar invitation
        if (validStatus === 'interested' && doctorEmail) {
          const latestWebinarRes = await db.query(
            `SELECT id, title, webinar_date, webinar_time, duration, meeting_link, google_event_id FROM webinars ORDER BY is_active DESC, created_at DESC LIMIT 1`
          );

          const latestWebinar = latestWebinarRes.rows.length > 0 ? latestWebinarRes.rows[0] : null;

          if (latestWebinar && apolloId) {
            try {
              await db.query(
                `INSERT INTO webinar_attendees (webinar_id, prospect_id, status, created_at, updated_at)
                 VALUES ($1, $2, 'registered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 ON CONFLICT (webinar_id, prospect_id) DO NOTHING`,
                [latestWebinar.id, apolloId]
              );
              this.logger.log(`🎟️ Logged doctor ${doctorName} (${apolloId}) as 'registered' (Calendar Invite Pending) for webinar ${latestWebinar.id}`);
            } catch (pErr: any) {
              this.logger.error(`Failed to register pass in webinar_attendees: ${pErr.message}`);
            }

            if (latestWebinar.google_event_id) {
              try {
                const tokenRes = await db.query(`SELECT user_id FROM google_tokens LIMIT 1`);
                const adminUserId = tokenRes.rows.length > 0 ? tokenRes.rows[0].user_id : null;
                if (adminUserId) {
                  await this.meetingsService.addAttendeeToGoogleEvent(
                    adminUserId,
                    latestWebinar.google_event_id,
                    doctorEmail
                  );
                  this.logger.log(`📅 Automatically invited ${doctorEmail} to Google Calendar event ${latestWebinar.google_event_id}`);
                } else {
                  this.logger.warn(`Could not send Google Calendar invite: No connected Google Token found in database.`);
                }
              } catch (inviteErr: any) {
                this.logger.error(`Failed to send Google Calendar invite to ${doctorEmail}: ${inviteErr.message}`);
              }
            } else {
              this.logger.warn(`Could not send Google Calendar invite: Latest webinar has no associated google_event_id.`);
            }
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

  async updateProspectStage(prospectId: string, stage: string) {
    if (!prospectId || !stage) {
      throw new HttpException('Prospect ID and Stage are required', HttpStatus.BAD_REQUEST);
    }
    try {
      const res = await db.query(
        `UPDATE doctor_prospects SET stage = $1, updated_at = CURRENT_TIMESTAMP WHERE apollo_id = $2 OR email = $2 RETURNING *`,
        [stage, prospectId]
      );
      if (res.rows.length === 0) {
        throw new HttpException('Doctor prospect not found', HttpStatus.NOT_FOUND);
      }
      this.logger.log(`🔄 Updated stage for prospect ${prospectId} to '${stage}'`);

      const prospect = res.rows[0];
      const apolloId = prospect.apollo_id;
      const doctorName = prospect.full_name || 'Doctor';
      const doctorEmail = prospect.email;

      // Trigger automated interest Google Calendar invitation if they are marked interested
      if (stage === 'interested' && doctorEmail) {
        const latestWebinarRes = await db.query(
          `SELECT id, title, webinar_date, webinar_time, duration, meeting_link, google_event_id FROM webinars ORDER BY is_active DESC, created_at DESC LIMIT 1`
        );

        const latestWebinar = latestWebinarRes.rows.length > 0 ? latestWebinarRes.rows[0] : null;

        if (latestWebinar && apolloId) {
          try {
            await db.query(
              `INSERT INTO webinar_attendees (webinar_id, prospect_id, status, created_at, updated_at)
               VALUES ($1, $2, 'registered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
               ON CONFLICT (webinar_id, prospect_id) DO NOTHING`,
              [latestWebinar.id, apolloId]
            );
            this.logger.log(`🎟️ Logged doctor ${doctorName} (${apolloId}) as 'registered' (Calendar Invite Pending) for webinar ${latestWebinar.id}`);
          } catch (pErr: any) {
            this.logger.error(`Failed to register pass in webinar_attendees: ${pErr.message}`);
          }

          if (latestWebinar.google_event_id) {
            try {
              const tokenRes = await db.query(`SELECT user_id FROM google_tokens LIMIT 1`);
              const adminUserId = tokenRes.rows.length > 0 ? tokenRes.rows[0].user_id : null;
              if (adminUserId) {
                await this.meetingsService.addAttendeeToGoogleEvent(
                  adminUserId,
                  latestWebinar.google_event_id,
                  doctorEmail
                );
                this.logger.log(`📅 Automatically invited ${doctorEmail} to Google Calendar event ${latestWebinar.google_event_id}`);
              } else {
                this.logger.warn(`Could not send Google Calendar invite: No connected Google Token found in database.`);
              }
            } catch (inviteErr: any) {
              this.logger.error(`Failed to send Google Calendar invite to ${doctorEmail}: ${inviteErr.message}`);
            }
          } else {
            this.logger.warn(`Could not send Google Calendar invite: Latest webinar has no associated google_event_id.`);
          }
        }
      }

      return { success: true, prospect };
    } catch (err: any) {
      this.logger.error(`Error updating prospect stage: ${err.message}`);
      throw new HttpException(err.message || 'Failed to update stage', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProspectCallAction(prospectId: string, callAction: string) {
    if (!prospectId) {
      throw new HttpException('Prospect ID is required', HttpStatus.BAD_REQUEST);
    }
    try {
      await db.query(`ALTER TABLE doctor_prospects ADD COLUMN IF NOT EXISTS call_action VARCHAR(255) DEFAULT NULL;`);
      const res = await db.query(
        `UPDATE doctor_prospects SET call_action = $1, updated_at = CURRENT_TIMESTAMP WHERE apollo_id = $2 OR email = $2 RETURNING *`,
        [callAction || null, prospectId]
      );
      if (res.rows.length === 0) {
        throw new HttpException('Doctor prospect not found', HttpStatus.NOT_FOUND);
      }
      this.logger.log(`📞 Updated call_action for prospect ${prospectId} to '${callAction}'`);
      return { success: true, prospect: res.rows[0] };
    } catch (err: any) {
      this.logger.error(`Error updating prospect call action: ${err.message}`);
      throw new HttpException(err.message || 'Failed to update call action', HttpStatus.INTERNAL_SERVER_ERROR);
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

  async bulkAddProspects(prospects: Array<{
    fullName: string;
    specialty?: string;
    organization?: string;
    location?: string;
    email?: string;
    phone?: string;
    stage?: string;
  }>) {
    if (!Array.isArray(prospects) || prospects.length === 0) {
      throw new HttpException('No prospects provided for bulk upload', HttpStatus.BAD_REQUEST);
    }

    let insertedCount = 0;
    const errors: string[] = [];
    const insertedRecords: any[] = [];

    for (let i = 0; i < prospects.length; i++) {
      const item = prospects[i];
      if ((!item.fullName || item.fullName === '-') && (!item.email || item.email === '-') && (!item.specialty || item.specialty === '-') && (!item.organization || item.organization === '-') && (!item.location || item.location === '-')) {
        continue;
      }

      const rawName = (item.fullName || '-').trim();
      const cleanFullName = rawName === '-' ? '-' : (rawName.startsWith('Dr.') ? rawName : (rawName.toLowerCase().includes('dr') ? rawName : `Dr. ${rawName}`));
      const nameWithoutPrefix = cleanFullName.replace(/^Dr\.?\s+/i, '');
      const nameParts = nameWithoutPrefix.split(' ');
      const firstName = nameParts[0] || '-';
      const lastName = nameParts.slice(1).join(' ') || '';

      const email = item.email?.trim() || '-';
      const specialty = item.specialty?.trim() || '-';
      const organization = item.organization?.trim() || '-';
      const location = item.location?.trim() || '-';
      const phone = item.phone?.trim() || 'N/A';
      
      // Map stage input to valid DB stage strings
      let stage = 'pending_outreach';
      if (item.stage) {
        const lowerStage = item.stage.toLowerCase().trim();
        if (lowerStage === 'needs_call' || lowerStage.includes('needs_call') || lowerStage.includes('needs call') || lowerStage.includes('call') || lowerStage.includes('queue') || lowerStage.includes('phone')) stage = 'needs_call';
        else if (lowerStage.includes('interested') || lowerStage.includes('high intent')) stage = 'interested';
        else if (lowerStage.includes('replied') || lowerStage.includes('reply')) stage = 'email_replied';
        else if (lowerStage.includes('luma') || lowerStage.includes('rsvp')) stage = 'luma_registered';
        else if (lowerStage.includes('converted') || lowerStage.includes('investor')) stage = 'converted_investor';
        else if (lowerStage.includes('pending') || lowerStage.includes('outreach')) stage = 'pending_outreach';
        else stage = item.stage;
      }

      const apolloId = `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`;

      try {
        const query = `
          INSERT INTO doctor_prospects (
            apollo_id, full_name, first_name, last_name, specialty, organization, location, email, phone, email_status, stage, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified', $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `;
        const res = await db.query(query, [
          apolloId,
          cleanFullName,
          firstName,
          lastName,
          specialty,
          organization,
          location,
          email,
          phone,
          stage
        ]);

        if (res.rows.length > 0) {
          insertedCount++;
          insertedRecords.push(res.rows[0]);
        }
      } catch (err: any) {
        this.logger.error(`Error bulk inserting row ${i + 1} (${cleanFullName}): ${err.message}`);
        errors.push(`Row ${i + 1} (${cleanFullName}): ${err.message}`);
      }
    }

    this.logger.log(`📊 Bulk uploaded ${insertedCount} doctor prospects into PostgreSQL.`);

    return {
      success: true,
      count: insertedCount,
      inserted: insertedRecords,
      errors: errors.length > 0 ? errors : undefined
    };
  }


  // --- Dynamic Webinars & Attendance Tracking Methods ---

  private computeWebinarStatus(dateStr: string, timeStr?: string, durationStr?: string): 'upcoming' | 'live' | 'completed' {
    if (!dateStr) return 'upcoming';

    try {
      const { startUtc } = this.parseEasternDateTime(dateStr, timeStr);
      const startDate = startUtc;

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
      const tokenRes = await db.query(`SELECT user_id FROM google_tokens LIMIT 1`);
      const adminUserId = tokenRes.rows.length > 0 ? tokenRes.rows[0].user_id : null;

      const webinarsRes = await db.query(
        `SELECT id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date, 
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink", status,
                google_event_id as "googleEventId",
                created_at as "createdAt",
                COALESCE(reminder_offsets, '{}') as "reminderOffsets",
                is_active as "isActive"
         FROM webinars ORDER BY is_active DESC, webinar_date DESC, created_at DESC`
      );

      const webinars = webinarsRes.rows;

      // Find the active webinar (whose link/pass is being shared in active campaigns)
      const activeRes = await db.query(`SELECT id FROM webinars WHERE is_active = true LIMIT 1`);
      let activeId = activeRes.rows[0]?.id;
      if (!activeId && webinars.length > 0) {
        // Fallback to the first one (which is the latest due to sorting)
        activeId = webinars[0].id;
      }

      for (const w of webinars) {
        w.isLatest = w.id === activeId;
        w.status = this.computeWebinarStatus(w.date, w.time, w.duration);

        if (adminUserId && w.googleEventId && w.status !== 'completed') {
          try {
            await this.meetingsService.getGoogleEventStatus(adminUserId, w.googleEventId);
          } catch (syncErr: any) {
            this.logger.error(`Failed to auto-sync Google RSVP status for event ${w.googleEventId}: ${syncErr.message}`);
          }
        }

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

  async createWebinar(userId: string, data: {
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

    const tokenStatus = await this.meetingsService.getGoogleTokenStatus(userId);
    if (!tokenStatus || !tokenStatus.connected) {
      throw new HttpException('Google Calendar is not connected. Please connect Google Calendar to create a webinar.', HttpStatus.BAD_REQUEST);
    }

    let googleEventId: string | null = null;
    const finalMeetingLink = 'https://us02web.zoom.us/j/6466719252';

    try {
      const { startUtc } = this.parseEasternDateTime(data.webinarDate, data.webinarTime);
      const durationMinutes = parseInt(data.duration || '45', 10) || 45;

      const gcalEvent = await this.meetingsService.createGoogleEvent(userId, {
        title: data.title,
        description: data.description || 'Ovalia Capital Physician Wealth Session.',
        scheduledDate: startUtc.toISOString(),
        durationMinutes,
        location: 'https://us02web.zoom.us/j/6466719252',
      });

      if (gcalEvent && gcalEvent.googleEventId) {
        googleEventId = gcalEvent.googleEventId;
      }
    } catch (gcalErr: any) {
      this.logger.error(`Failed to create Google Calendar event for webinar: ${gcalErr.message}`);
      throw new HttpException(`Failed to create Google Calendar event: ${gcalErr.message}`, HttpStatus.BAD_REQUEST);
    }

    const id = `web-${Date.now()}`;
    const query = `
      INSERT INTO webinars (id, title, description, webinar_date, webinar_time, duration, meeting_link, status, google_event_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'upcoming', $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date,
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink", status, google_event_id as "googleEventId"
    `;

    try {
      const res = await db.query(query, [
        id,
        data.title.trim(),
        data.description?.trim() || 'Ovalia Capital Physician Wealth Session.',
        data.webinarDate,
        data.webinarTime?.trim() || '04:00 PM EST',
        data.duration?.trim() ? (data.duration.toLowerCase().includes('min') ? data.duration.trim() : `${data.duration.trim()} mins`) : '45 mins',
        finalMeetingLink,
        googleEventId,
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

  async updateWebinar(
    userId: string,
    id: string,
    data: {
      title: string;
      description?: string;
      webinarDate: string;
      webinarTime?: string;
      duration?: string;
      meetingLink: string;
    }
  ) {
    if (!id) {
      throw new HttpException('Webinar ID is required', HttpStatus.BAD_REQUEST);
    }
    if (!data.title || !data.webinarDate || !data.meetingLink) {
      throw new HttpException('Title, Date, and Meeting Link are required', HttpStatus.BAD_REQUEST);
    }

    try {
      // 1. Perform update
      const formattedTime = data.webinarTime?.trim()
        ? this.formatBackendTimeEST(data.webinarTime, data.webinarDate)
        : '04:00 PM EDT';
      const formattedDuration = data.duration?.trim()
        ? (data.duration.toLowerCase().includes('min') ? data.duration.trim() : `${data.duration.trim()} mins`)
        : '45 mins';
      const finalMeetingLink = 'https://us02web.zoom.us/j/6466719252';

      const updateQuery = `
        UPDATE webinars
        SET title = $1,
            description = $2,
            webinar_date = $3,
            webinar_time = $4,
            duration = $5,
            meeting_link = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date,
                  to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                  webinar_time as time, duration, meeting_link as "meetingLink", status, google_event_id as "googleEventId"
      `;

      const res = await db.query(updateQuery, [
        data.title.trim(),
        data.description?.trim() || 'Ovalia Capital Physician Wealth Session.',
        data.webinarDate,
        formattedTime,
        formattedDuration,
        finalMeetingLink,
        id,
      ]);

      if (res.rowCount === 0) {
        throw new HttpException('Webinar not found', HttpStatus.NOT_FOUND);
      }

      const updatedWebinar = res.rows[0];
      updatedWebinar.status = this.computeWebinarStatus(updatedWebinar.date, updatedWebinar.time, updatedWebinar.duration);

      const googleEventId = updatedWebinar.googleEventId;
      if (googleEventId) {
        try {
          const { startUtc } = this.parseEasternDateTime(data.webinarDate, data.webinarTime);
          const durationMinutes = parseInt(formattedDuration || '45', 10) || 45;
          await this.meetingsService.updateGoogleEventDetails(userId, googleEventId, {
            title: data.title,
            description: data.description || 'Ovalia Capital Physician Wealth Session.',
            scheduledDate: startUtc.toISOString(),
            durationMinutes,
            location: 'https://us02web.zoom.us/j/6466719252',
          });
        } catch (gcalErr: any) {
          this.logger.error(`Failed to update Google Calendar event ${googleEventId}: ${gcalErr.message}`);
        }
      }

      // 2. Fetch existing attendees / pass recipients
      const attendeesRes = await db.query(
        `SELECT wa.prospect_id as id, dp.full_name as "fullName", dp.specialty, dp.organization, dp.location, dp.email, dp.phone, wa.status, wa.total_duration_minutes as duration, wa.first_joined_at as "joinTime"
         FROM webinar_attendees wa
         JOIN doctor_prospects dp ON wa.prospect_id = dp.apollo_id
         WHERE wa.webinar_id = $1`,
        [id]
      );
      const rawAttendees = attendeesRes.rows || [];
      updatedWebinar.attendees = rawAttendees.map((att: any) => ({
        ...att,
        duration: att.status === 'attended' ? (att.duration ? `${att.duration} mins` : '0 mins') : 'N/A',
        joinTime: att.joinTime ? new Date(att.joinTime).toISOString() : undefined,
      }));
      updatedWebinar.totalPassesSent = rawAttendees.length;
      updatedWebinar.totalJoined = rawAttendees.filter((att: any) => att.status === 'attended').length;
      updatedWebinar.noShowCount = rawAttendees.filter((att: any) => att.status !== 'attended').length;

      // 3. Dispatch email notifications to all users who received passes
      let notifiedCount = 0;
      if (rawAttendees.length > 0) {
        const title = updatedWebinar.title || 'Ovalia Capital Physician Wealth Briefing';
        const formattedDate = updatedWebinar.formattedDate || updatedWebinar.date || 'Scheduled Date';
        const timeStr = this.formatBackendTimeEST(updatedWebinar.time, updatedWebinar.date);
        const durationRaw = (updatedWebinar.duration || '45').toString().trim();
        const durationStr = durationRaw.toLowerCase().includes('min') ? durationRaw : `${durationRaw} mins`;
        const durationMinsNum = parseInt(durationRaw, 10) || 45;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        for (const att of rawAttendees) {
          const doctorEmail = att.email;
          const doctorName = att.fullName || 'Physician';
          const apolloId = att.id;

          if (!doctorEmail) continue;

          const webinarPassUrl = `${frontendUrl}/webinar/pass?prospect_id=${encodeURIComponent(apolloId)}&webinar_id=${encodeURIComponent(updatedWebinar.id)}`;
          const gcalUrl = this.generateGoogleCalendarUrl(
            title,
            updatedWebinar.date,
            updatedWebinar.time,
            durationMinsNum,
            updatedWebinar.meetingLink || webinarPassUrl
          );

          const subject = `📅 Schedule Update: ${title}`;
          const emailBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F1F1F; text-align: left; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
  <h2 style="color: #1F2937; margin: 0 0 12px 0; font-size: 20px; font-weight: bold; line-height: 1.3;">Webinar Details Updated, ${doctorName}!</h2>
  <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 0 0 16px 0;">
    Please note that the schedule or session details for your upcoming <strong>Ovalia Capital Physician Wealth Briefing</strong> have been updated.
  </p>

  <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; margin: 16px 0;">
    <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #111827;">🗓️ Updated Session Briefing Details</h3>
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

  <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 16px 0 8px 0;">
    Update this event on your calendar to reflect the updated time in your local timezone:
  </p>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 12px 0 20px 0; text-align: center;">
    <tr>
      <td align="center" style="text-align: center; padding-bottom: 12px;">
        <a href="${gcalUrl}" target="_blank" style="background-color: #4285F4; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; text-align: center; margin: 0 auto; box-shadow: 0 2px 6px rgba(66, 133, 244, 0.25);">
          📅 Update Google Calendar Event
        </a>
      </td>
    </tr>
    <tr>
      <td align="center" style="text-align: center;">
        <a href="${webinarPassUrl}" target="_blank" style="background-color: #22C55E; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; text-align: center; margin: 0 auto; box-shadow: 0 2px 6px rgba(34, 197, 94, 0.2);">
          🎟️ Access Your VIP Session Pass
        </a>
      </td>
    </tr>
  </table>
  <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin: 16px 0 0 0;">
    If you have any questions, contact our investor relations team at <a href="mailto:portal@ovaliacapital.com" style="color: #2563EB; text-decoration: underline;">portal@ovaliacapital.com</a>.
  </p>
</div>`;

          try {
            await this.emailService.sendCustomEmail(doctorEmail, doctorName, subject, emailBody);
            await db.query(
              `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, 'webinar_details_updated_email_sent', $2, CURRENT_TIMESTAMP)`,
              [apolloId, JSON.stringify({ webinarId: updatedWebinar.id, webinarTitle: title, sentAt: new Date().toISOString() })]
            );
            notifiedCount++;
            this.logger.log(`📩 Sent webinar update email to ${doctorName} (${doctorEmail}) for webinar ${updatedWebinar.id}`);
          } catch (sendErr: any) {
            this.logger.error(`Failed to send webinar update email to ${doctorEmail}: ${sendErr.message}`);
          }
        }
      }

      this.logger.log(`✏️ Updated webinar: ${data.title} (${id}). Notified ${notifiedCount} pass holders.`);
      return {
        success: true,
        webinar: updatedWebinar,
        notifiedCount,
        message: notifiedCount > 0
          ? `Webinar updated and notification emails dispatched to ${notifiedCount} pass holder(s).`
          : 'Webinar updated successfully.',
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Error updating webinar ${id}: ${err.message}`);
      throw new HttpException(err.message || 'Failed to update webinar record', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendDirectWebinarInvites(userId: string, webinarId: string, prospectIds: string[]) {
    if (!webinarId) {
      throw new HttpException('Webinar ID is required', HttpStatus.BAD_REQUEST);
    }
    if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
      throw new HttpException('No prospects selected for invitation', HttpStatus.BAD_REQUEST);
    }

    const tokenStatus = await this.meetingsService.getGoogleTokenStatus(userId);
    if (!tokenStatus || !tokenStatus.connected) {
      throw new HttpException('Google Calendar is not connected. Please connect Google Calendar to send invites.', HttpStatus.BAD_REQUEST);
    }

    try {
      // 1. Fetch webinar details
      const webinarRes = await db.query(
        `SELECT id, title, description, google_event_id FROM webinars WHERE id = $1`,
        [webinarId]
      );

      if (webinarRes.rows.length === 0) {
        throw new HttpException('Webinar not found', HttpStatus.NOT_FOUND);
      }

      const webinar = webinarRes.rows[0];
      const googleEventId = webinar.google_event_id;

      if (!googleEventId) {
        throw new HttpException('This webinar does not have an active Google Calendar event. Please recreate the webinar with Google Calendar connected.', HttpStatus.BAD_REQUEST);
      }

      // 2. Fetch selected doctors
      const doctorsRes = await db.query(
        `SELECT apollo_id, full_name, email FROM doctor_prospects WHERE apollo_id = ANY($1::text[]) OR email = ANY($1::text[])`,
        [prospectIds]
      );

      if (doctorsRes.rows.length === 0) {
        throw new HttpException('No valid doctor prospects found for selected IDs', HttpStatus.NOT_FOUND);
      }

      let successCount = 0;
      let calendarInviteCount = 0;

      for (const doc of doctorsRes.rows) {
        const apolloId = doc.apollo_id;
        const doctorEmail = doc.email;

        if (!doctorEmail) continue;

        // Register pass in webinar_attendees if not present
        try {
          const insertRes = await db.query(
            `INSERT INTO webinar_attendees (webinar_id, prospect_id, status, created_at, updated_at)
             VALUES ($1, $2, 'registered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (webinar_id, prospect_id) DO NOTHING`,
            [webinar.id, apolloId]
          ) as any;

          if (insertRes && insertRes.rowCount > 0) {
            successCount++;

            // Send Google Calendar invite if googleEventId exists
            if (googleEventId) {
              try {
                await this.meetingsService.addAttendeeToGoogleEvent(userId, googleEventId, doctorEmail);
                calendarInviteCount++;
              } catch (gcalErr: any) {
                this.logger.error(`Failed to add calendar attendee ${doctorEmail} to event ${googleEventId}: ${gcalErr.message}`);
              }
            }
          }
        } catch (regErr: any) {
          this.logger.error(`Error registering attendee ${apolloId} for webinar ${webinar.id}: ${regErr.message}`);
        }
      }

      let message = `Successfully registered ${successCount} doctor(s) for the webinar.`;
      if (calendarInviteCount > 0) {
        message += ` Sent ${calendarInviteCount} Google Calendar invites.`;
      } else if (googleEventId) {
        message += ` (Could not send Google Calendar invites - check Google Calendar connection).`;
      }

      return {
        success: true,
        count: successCount,
        message,
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Error sending direct webinar invites: ${err.message}`);
      throw new HttpException(err.message || 'Failed to send direct webinar invites', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateWebinarReminders(webinarId: string, reminderOffsets: number[]) {
    if (!webinarId) {
      throw new HttpException('Webinar ID is required', HttpStatus.BAD_REQUEST);
    }
    const cleanOffsets = Array.isArray(reminderOffsets)
      ? reminderOffsets.map(Number).filter((n) => !isNaN(n) && n > 0)
      : [];

    try {
      const res = await db.query(
        `UPDATE webinars
         SET reminder_offsets = $1::int[],
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, google_event_id as "googleEventId", reminder_offsets as "reminderOffsets"`,
        [cleanOffsets, webinarId]
      );

      if (res.rowCount === 0) {
        throw new HttpException('Webinar not found', HttpStatus.NOT_FOUND);
      }

      const googleEventId = res.rows[0].googleEventId;
      if (googleEventId) {
        const tokenRes = await db.query(`SELECT user_id FROM google_tokens LIMIT 1`);
        const adminUserId = tokenRes.rows.length > 0 ? tokenRes.rows[0].user_id : null;
        if (adminUserId) {
          try {
            await this.meetingsService.updateGoogleEventReminders(
              adminUserId,
              googleEventId,
              cleanOffsets
            );
            this.logger.log(`📅 Successfully synced Google Calendar reminders for event ${googleEventId}`);
          } catch (gcalErr: any) {
            this.logger.error(`Failed to update Google Calendar reminders for event ${googleEventId}: ${gcalErr.message}`);
          }
        }
      }

      this.logger.log(`🔔 Updated reminder schedule for webinar ${webinarId}: [${cleanOffsets.join(', ')}]`);
      return {
        success: true,
        reminderOffsets: res.rows[0].reminderOffsets || [],
        message: 'Reminder schedule saved successfully',
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Error updating reminder offsets for webinar ${webinarId}: ${err.message}`);
      throw new HttpException(err.message || 'Failed to save reminder schedule', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendTestWebinarReminder(webinarId: string) {
    if (!webinarId) {
      throw new HttpException('Webinar ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const webinarRes = await db.query(
        `SELECT id, title, description, to_char(webinar_date, 'YYYY-MM-DD') as date,
                to_char(webinar_date, 'FMDay, FMMonth FMDD, YYYY') as "formattedDate",
                webinar_time as time, duration, meeting_link as "meetingLink"
         FROM webinars WHERE id = $1`,
        [webinarId]
      );

      if (webinarRes.rows.length === 0) {
        throw new HttpException('Webinar not found', HttpStatus.NOT_FOUND);
      }

      const w = webinarRes.rows[0];
      const attendeesRes = await db.query(
        `SELECT wa.webinar_id, wa.prospect_id, dp.full_name as "fullName", dp.email, dp.apollo_id
         FROM webinar_attendees wa
         JOIN doctor_prospects dp ON wa.prospect_id = dp.apollo_id
         WHERE wa.webinar_id = $1 AND dp.email IS NOT NULL`,
        [w.id]
      );

      if (attendeesRes.rows.length === 0) {
        throw new HttpException('No registered attendees found for this webinar to send reminders to.', HttpStatus.NOT_FOUND);
      }

      let successCount = 0;
      const now = new Date();

      for (const att of attendeesRes.rows) {
        const doctorName = att.fullName || 'Physician';
        const formattedDate = w.formattedDate || w.date;
        const timeStr = this.formatBackendTimeEST(w.time, w.date);
        const durationRaw = (w.duration || '45').toString().trim();
        const durationStr = durationRaw.toLowerCase().includes('min') ? durationRaw : `${durationRaw} mins`;
        const webinarPassUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/webinar/pass?webinarId=${encodeURIComponent(w.id)}&prospectId=${encodeURIComponent(att.apollo_id)}`;

        const durationMinsNum = parseInt(durationRaw, 10) || 45;
        const gcalUrl = this.generateGoogleCalendarUrl(
          w.title,
          w.date,
          w.time,
          durationMinsNum,
          w.meetingLink || webinarPassUrl
        );

        const subject = `⏰ [TEST REMINDER] Session Briefing — ${w.title}`;
        const emailBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F1F1F; text-align: left; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
  <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #1D4ED8; font-weight: bold; margin-bottom: 14px;">
    🧪 Manual Test Reminder Email Dispatch
  </div>
  <h2 style="color: #1F2937; margin: 0 0 12px 0; font-size: 20px; font-weight: bold; line-height: 1.3;">Upcoming Session Reminder, ${doctorName}!</h2>
  <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 0 0 16px 0;">
    This is a scheduled reminder for your upcoming <strong>Ovalia Capital Physician Briefing</strong> session.
  </p>

  <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 10px; padding: 16px; margin: 16px 0;">
    <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #92400E;">⏰ Session Details</h3>
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

  <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 16px 0 8px 0;">
    Add this event to your calendar to automatically convert to your local timezone:
  </p>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 12px 0 20px 0; text-align: center;">
    <tr>
      <td align="center" style="text-align: center; padding-bottom: 12px;">
        <a href="${gcalUrl}" target="_blank" style="background-color: #4285F4; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; text-align: center; margin: 0 auto; box-shadow: 0 2px 6px rgba(66, 133, 244, 0.25);">
          📅 Add to Google Calendar (Auto-Converts to Your Timezone)
        </a>
      </td>
    </tr>
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
          await this.emailService.sendCustomEmail(att.email, doctorName, subject, emailBody);
          await db.query(
            `INSERT INTO prospect_events (prospect_id, event_type, details, created_at)
             VALUES ($1, 'manual_test_reminder', $2, CURRENT_TIMESTAMP)`,
            [att.apollo_id, JSON.stringify({ webinarId: w.id, sentAt: now.toISOString() })]
          );
          successCount++;
          this.logger.log(`🧪 Dispatched test reminder email to Dr. ${doctorName} (${att.email}) for webinar ${w.id}`);
        } catch (err: any) {
          this.logger.error(`Failed to send test reminder to ${att.email}: ${err.message}`);
        }
      }

      return {
        success: true,
        count: successCount,
        message: `Test reminder emails successfully sent to ${successCount} registered attendees!`,
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Error sending test webinar reminder for ${webinarId}: ${err.message}`);
      throw new HttpException(err.message || 'Failed to send test webinar reminder', HttpStatus.INTERNAL_SERVER_ERROR);
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

  async importPreviousWebinarAttendees(userId: string, webinarId: string) {
    if (!webinarId) {
      throw new HttpException('Webinar ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // 1. Fetch current webinar details to know its date and google_event_id
      const currentWebinarRes = await db.query(
        `SELECT webinar_date, google_event_id, title FROM webinars WHERE id = $1`,
        [webinarId]
      );
      if (currentWebinarRes.rows.length === 0) {
        throw new HttpException('Current webinar not found', HttpStatus.NOT_FOUND);
      }
      const { webinar_date: currentWebinarDate, google_event_id: googleEventId, title: webinarTitle } = currentWebinarRes.rows[0];

      // 2. Query the single chronologically previous webinar
      const previousWebinarRes = await db.query(
        `SELECT id, title FROM webinars 
         WHERE id != $1 
         AND webinar_date <= $2 
         ORDER BY webinar_date DESC, created_at DESC 
         LIMIT 1`,
        [webinarId, currentWebinarDate]
      );

      if (previousWebinarRes.rows.length === 0) {
        return {
          success: false,
          message: 'No previous webinars found to import from.',
          count: 0
        };
      }

      const prevWebinar = previousWebinarRes.rows[0];

      // 3. Fetch all attendees from that previous webinar who are not already registered to the current webinar
      const attendeesRes = await db.query(
        `SELECT DISTINCT wa.prospect_id, dp.email FROM webinar_attendees wa
         JOIN doctor_prospects dp ON wa.prospect_id = dp.apollo_id
         WHERE wa.webinar_id = $1 
         AND wa.status != 'accepted'
         AND wa.prospect_id NOT IN (
           SELECT prospect_id FROM webinar_attendees WHERE webinar_id = $2
         )`,
        [prevWebinar.id, webinarId]
      );

      const attendees = attendeesRes.rows || [];

      if (attendees.length === 0) {
        return {
          success: false,
          message: `The previous webinar "${prevWebinar.title}" has no registered doctors to import.`,
          count: 0
        };
      }

      let successCount = 0;
      let calendarInviteCount = 0;

      for (const att of attendees) {
        const apolloId = att.prospect_id;
        const email = att.email;

        // Register in webinar_attendees for the new webinar
        try {
          const insertRes = await db.query(
            `INSERT INTO webinar_attendees (webinar_id, prospect_id, status, created_at, updated_at)
             VALUES ($1, $2, 'registered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (webinar_id, prospect_id) DO NOTHING`,
            [webinarId, apolloId]
          ) as any;

          if (insertRes && insertRes.rowCount > 0) {
            successCount++;
          }
        } catch (dbErr: any) {
          this.logger.error(`Failed to register imported prospect ${apolloId}: ${dbErr.message}`);
          continue;
        }

        // Send Google Calendar invite if googleEventId and email exist
        if (googleEventId && email) {
          try {
            await this.meetingsService.addAttendeeToGoogleEvent(userId, googleEventId, email);
            calendarInviteCount++;
          } catch (gcalErr: any) {
            this.logger.error(`Failed to add calendar attendee ${email} to event ${googleEventId}: ${gcalErr.message}`);
          }
        }
      }

      let message = `Successfully imported ${successCount} doctor(s) from previous webinar "${prevWebinar.title}".`;
      if (calendarInviteCount > 0) {
        message += ` Sent ${calendarInviteCount} Google Calendar invites.`;
      } else if (googleEventId) {
        message += ` (Could not send Google Calendar invites - check Google Calendar connection).`;
      }

      return {
        success: true,
        count: successCount,
        message,
      };
    } catch (err: any) {
      this.logger.error(`Error in importPreviousWebinarAttendees: ${err.message}`);
      throw new HttpException(err.message || 'Failed to import attendees', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async activateWebinar(id: string) {
    await db.query(`BEGIN`);
    try {
      await db.query(`UPDATE webinars SET is_active = false`);
      await db.query(`UPDATE webinars SET is_active = true WHERE id = $1`, [id]);
      await db.query(`COMMIT`);
      return { success: true };
    } catch (err: any) {
      await db.query(`ROLLBACK`);
      this.logger.error(`Error activating webinar ${id}: ${err.message}`);
      throw new HttpException('Failed to activate webinar', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addDoctorAndSendInvite(userId: string, webinarId: string, data: {
    fullName: string;
    email: string;
    specialty?: string;
    phone?: string;
    organization?: string;
    location?: string;
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

    // Check if Google Calendar is connected
    const tokenStatus = await this.meetingsService.getGoogleTokenStatus(userId);
    if (!tokenStatus || !tokenStatus.connected) {
      throw new HttpException('Google Calendar is not connected. Please connect Google Calendar to send invites.', HttpStatus.BAD_REQUEST);
    }

    // 1. Fetch webinar details
    const webinarRes = await db.query(
      `SELECT id, title, description, google_event_id FROM webinars WHERE id = $1`,
      [webinarId]
    );
    if (webinarRes.rows.length === 0) {
      throw new HttpException('Webinar not found', HttpStatus.NOT_FOUND);
    }
    const webinar = webinarRes.rows[0];
    const googleEventId = webinar.google_event_id;
    if (!googleEventId) {
      throw new HttpException('This webinar does not have an active Google Calendar event.', HttpStatus.BAD_REQUEST);
    }

    // Check if prospect already exists in database by email
    let prospectId: string;
    const existingRes = await db.query(
      `SELECT apollo_id FROM doctor_prospects WHERE email = $1`,
      [data.email.trim()]
    );

    if (existingRes.rows.length > 0) {
      prospectId = existingRes.rows[0].apollo_id;
      // Update stage to interested
      await db.query(
        `UPDATE doctor_prospects SET stage = 'interested', updated_at = CURRENT_TIMESTAMP WHERE apollo_id = $1`,
        [prospectId]
      );
    } else {
      prospectId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const cleanFullName = data.fullName.trim();
      const nameWithoutPrefix = cleanFullName.replace(/^Dr\.?\s+/i, '');
      const nameParts = nameWithoutPrefix.split(' ');
      const firstName = nameParts[0] || 'Doctor';
      const lastName = nameParts.slice(1).join(' ') || '';

      const query = `
        INSERT INTO doctor_prospects (
          apollo_id, full_name, first_name, last_name, specialty, organization, location, email, phone, email_status, stage, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'verified', 'interested', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      await db.query(query, [
        prospectId,
        cleanFullName,
        firstName,
        lastName,
        data.specialty?.trim() || 'General Practice',
        data.organization?.trim() || 'Private Practice',
        data.location?.trim() || 'United States',
        data.email.trim(),
        data.phone?.trim() || 'N/A'
      ]);
    }

    // Register attendee in webinar_attendees if not present
    await db.query(
      `INSERT INTO webinar_attendees (webinar_id, prospect_id, status, created_at, updated_at)
       VALUES ($1, $2, 'registered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (webinar_id, prospect_id) DO UPDATE SET status = 'registered', updated_at = CURRENT_TIMESTAMP`,
      [webinarId, prospectId]
    );

    // Send Google Calendar invite
    let calendarInviteSent = false;
    try {
      await this.meetingsService.addAttendeeToGoogleEvent(userId, googleEventId, data.email.trim());
      calendarInviteSent = true;
    } catch (gcalErr: any) {
      this.logger.error(`Failed to add calendar attendee ${data.email.trim()} to event ${googleEventId}: ${gcalErr.message}`);
    }

    return {
      success: true,
      prospectId,
      calendarInviteSent,
      message: `Successfully saved doctor and sent ${calendarInviteSent ? 'Google Calendar invite' : 'pass registration'}.`
    };
  }

  private generateGoogleCalendarUrl(
    title: string,
    webinarDateStr?: string,
    webinarTimeStr?: string,
    durationMins: number = 45,
    meetingLink: string = ''
  ): string {
    try {
      const { startUtc } = this.parseEasternDateTime(webinarDateStr, webinarTimeStr);
      const endUtc = new Date(startUtc.getTime() + (durationMins || 45) * 60 * 1000);

      const formatGcal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const startStr = formatGcal(startUtc);
      const endStr = formatGcal(endUtc);

      const details = `Ovalia Capital Physician Wealth Briefing session. Access session pass and details: ${meetingLink || 'https://ovaliacapital.com'}`;
      const location = meetingLink || 'Online Zoom Room';

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    } catch (e) {
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}`;
    }
  }
}


