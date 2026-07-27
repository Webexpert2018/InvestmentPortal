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
      }
    } catch (err: any) {
      this.logger.error(`Error in processScheduledDripEmails: ${err.message}`);
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
        const apolloId = updateRes.rows[0].apollo_id;
        await db.query(
          `INSERT INTO prospect_events (prospect_id, event_type, details, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [apolloId, `response_${validStatus}`, JSON.stringify({ status: validStatus, recordedAt: new Date().toISOString() })]
        );
        this.logger.log(`✅ [Prospect Response] Recorded stage '${validStatus}' in PostgreSQL for doctor ${updateRes.rows[0].full_name} (${updateRes.rows[0].email})!`);
      } else {
        this.logger.warn(`[Prospect Response] Doctor record not found for identifier: ${identifier}`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Error recording response for prospect ${identifier}: ${error.message}`, error?.stack);
    }
  }
}

