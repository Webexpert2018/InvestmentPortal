import { Injectable, Logger } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class AthenaService {
  private readonly logger = new Logger(AthenaService.name);

  // Admin curated schema
  private readonly adminCuratedSchema = `
Table: users
Columns: id, email, first_name, last_name, phone, role, status, created_at
Table: investors
Columns: id, full_name, email, phone, role, kyc_status, status, created_at, expected_future_investment, pipeline_stage_id
Table: pipeline_stages
Columns: id, name, status, order_index
Table: funds
Columns: id, name, description, min_investment, unit_price, start_date, status
Table: investments
Columns: id, user_id, fund_id, investment_amount, processing_fee, total_amount, status, created_at
Table: transactions
Columns: id, user_id, type, amount, status, created_at
Table: doctor_prospects
Columns: apollo_id, full_name, specialty, organization, location, email, phone, stage, created_at
Table: webinars
Columns: id, title, webinar_date, webinar_time, status, is_active
Table: ringcentral_call_logs
Columns: id, apollo_id, phone_number, duration, transcription_text, created_at
Table: redemptions
Columns: id, investor_id, investment_id, amount, units, status, reason, created_at
  `.trim();

  // Investor schema: STRICTLY isolated to the investor's own records and active funds
  private readonly investorSchema = `
Table: investors
Columns: id, full_name, email, phone, kyc_status, status, address_line1, address_line2, city, state, zip_code, country, created_at
CRITICAL CONSTRAINT: You can ONLY query where id = 'USER_ID'. Never query other investors. Do NOT query password_hash, tax_id, or SSN.

Table: funds
Columns: id, name, description, min_investment, unit_price, status, created_at
NOTE: Active investment funds available for investment on the portal.

Table: investments
Columns: id, user_id, fund_id, account_id, account_type, investment_amount, processing_fee, total_amount, unit_price, estimated_units, units, status, document_signed, is_reconciled, revised_amount, created_at
CRITICAL CONSTRAINT: You MUST ALWAYS filter WHERE user_id = 'USER_ID' (or WHERE user_id = 'USER_ID' OR user_id IN (SELECT id FROM investors WHERE parent_id = 'USER_ID')).

Table: old_investments
Columns: project_name, project_status, class_name, investor_profile_legal_name, email_address, investment_status, investment_amount, placed_on, received_on, shares, ownership
CRITICAL CONSTRAINT: You MUST ALWAYS filter WHERE email_address = 'USER_EMAIL'.

Table: redemptions
Columns: id, investor_id, investment_id, amount, units, status, reason, created_at
CRITICAL CONSTRAINT: You MUST ALWAYS filter WHERE investor_id = 'USER_ID'.

Table: ira_accounts
Columns: id, user_id, account_type, custodian, account_number, balance, status, created_at
CRITICAL CONSTRAINT: You MUST ALWAYS filter WHERE user_id = 'USER_ID'.

Table: investor_documents
Columns: id, investor_id, document_name, document_type, status, created_at
CRITICAL CONSTRAINT: You MUST ALWAYS filter WHERE investor_id = 'USER_ID'.

Table: investor_bank_accounts
Columns: id, investor_id, bank_name, account_type, status, created_at
CRITICAL CONSTRAINT: You MUST ALWAYS filter WHERE investor_id = 'USER_ID'.
  `.trim();

  // Knowledge base for investor investment flows and procedures
  private readonly investmentKnowledge = `
Ovalia Capital Platform Knowledge & Investment Flow:
1. Steps to Invest (Direct, simple step-by-step flow):
   - Step 1: Go to the "Invest" tab on the sidebar and select the fund you want to invest in.
   - Step 2: Select your account — choose your Personal account, an IRA account, or a Sub-account (Minor or Entity).
   - Step 3: Enter the amount you want to invest.
   - Step 4: Review and electronically sign the subscription document (DocuSign) directly in the portal.
   - Step 5: Submit your request. A team member from Ovalia Capital will reach out to you with wiring instructions and walk you through the final funding steps.

2. Steps to Redeem (Simple & direct):
   - Step 1: Go to the "Redeem" tab on the sidebar.
   - Step 2: Select your eligible investment (units must be issued and lockup period satisfied).
   - Step 3: Enter the units or dollar amount you want to redeem.
   - Step 4: Select your payout bank account and submit. Our team will review and process your request.

3. Account Types Supported:
   - Personal Account
   - Self-Directed IRA (Traditional, Roth, SEP IRA)
   - Sub-accounts (Minors or Legal Entities such as LLC, Trust, Corporation)

4. Key Sections:
   - "Invest" tab: Explore funds and start an investment.
   - "Portfolio" tab: View your active units, current value, and performance.
   - "Document Vault": View executed subscription agreements and notices.
   - "Tax Vault": Download your annual Schedule K-1s and 1099 tax packages.
  `.trim();

  async queryAthena(userId: string, userQuery: string, userRole: string = 'executive_admin') {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return { success: false, reply: 'OpenAI API Key is missing.' };
    }

    const normalizedRole = userRole?.trim().toLowerCase();
    if (normalizedRole === 'investor') {
      return this.queryAthenaForInvestor(userId, userQuery, openaiKey);
    }

    return this.queryAthenaForAdmin(userId, userQuery, openaiKey);
  }

  /**
   * Investor query handler: strictly isolated to investor's personal account and platform guidance.
   */
  private async queryAthenaForInvestor(userId: string, userQuery: string, openaiKey: string) {
    try {
      // 1. Fetch investor profile
      let investorName = 'Valued Investor';
      let investorEmail = '';
      try {
        const invRes = await db.query(
          'SELECT id, full_name, email, phone, kyc_status, status FROM investors WHERE id = $1',
          [userId]
        );
        if (invRes.rows.length > 0) {
          investorName = invRes.rows[0].full_name || 'Valued Investor';
          investorEmail = invRes.rows[0].email || '';
        } else {
          const uRes = await db.query(
            'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
            [userId]
          );
          if (uRes.rows.length > 0) {
            investorName = `${uRes.rows[0].first_name || ''} ${uRes.rows[0].last_name || ''}`.trim() || 'Valued Investor';
            investorEmail = uRes.rows[0].email || '';
          }
        }
      } catch (e: any) {
        this.logger.warn(`Could not fetch investor profile for Athena: ${e.message}`);
      }

      // 2. Early rejection of explicitly restricted terms (admin / CRM / other investors)
      const lowerQuery = userQuery.toLowerCase();
      const adminTerms = [
        'doctor', 'prospect', 'apollo', 'ringcentral', 'transcript', 'webinar',
        'other investor', 'all investors', 'other user', 'all users', 'staff', 'salary', 'salaries',
        'admin log', 'audit log', 'password', 'drop table', 'delete from', 'update investments'
      ];

      const containsRestrictedTerm = adminTerms.some(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        return regex.test(lowerQuery);
      });

      if (containsRestrictedTerm) {
        return {
          success: true,
          reply: `As your personal AI Investment Assistant, I can only provide details regarding your personal investments, portfolio, fund documents, and general investment procedures for Ovalia Capital. I do not have access to administrative tools, CRM leads, or other investors' details.`
        };
      }

      // Fast direct response for common "how to invest" inquiries
      const normalizedQuery = lowerQuery.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      const howToInvestPatterns = [
        'how to invest',
        'how do i invest',
        'how can i invest',
        'how do we invest',
        'how to start investing',
        'steps to invest',
        'what are the steps to invest',
        'tell me how to invest',
        'how does investing work',
        'how to make an investment',
        'investing process'
      ];
      if (howToInvestPatterns.some(p => normalizedQuery.includes(p))) {
        return {
          success: true,
          reply: `Investing on the platform is straightforward:

1. **Go to the Invest tab:** Select the fund you want to invest in.
2. **Select your account:** Choose between your **Personal**, **IRA**, or a **Sub-Account** (Minor or Entity).
3. **Enter the investment amount:** Input the dollar amount you wish to invest.
4. **Sign the document:** Review and electronically sign the subscription agreement (DocuSign) directly in the portal.
5. **Next steps:** Submit your investment. A team member from Ovalia Capital will reach out to you with wiring/funding instructions and guide you through the final steps.`
        };
      }

      // 3. Ask LLM to generate SQL or answer directly
      const investorSystemPrompt1 = `You are Athena, a direct, concise, and helpful AI Investment Assistant for Ovalia Capital.
You are assisting the investor: ${investorName} (Internal User ID: '${userId}', Email: '${investorEmail}').
The current date is ${new Date().toISOString().split('T')[0]}.

Platform Knowledge & Investment Flow:
${this.investmentKnowledge}

Allowed Database Schema:
${this.investorSchema}

STYLE & TONE (CRITICAL):
- BE DIRECT, SIMPLE, AND CONCISE: Avoid long financial essays, repetitive disclaimers, or flowery jargon.
- When explaining any procedure (how to invest, how to redeem, etc.), ALWAYS explain in simple, direct numbered steps (Step 1, Step 2, Step 3...).
- If the investor asks how to invest, provide the direct 5-step guide:
  1. Go to the **Invest** tab and select the fund.
  2. Select your account (**Personal**, **IRA**, or a **Sub-Account** like Minor/Entity).
  3. Enter the amount you wish to invest.
  4. Review and sign the subscription document (DocuSign) directly in the portal.
  5. Submit your request. A team member from Ovalia Capital will reach out with funding instructions and walk you through the next steps.

CRITICAL RULES:
1. You assist ONLY with this investor's personal account data and general fund/platform information.
2. You DO NOT have access to any other investor's records or administrative data. If asked about other investors or administrative data, reply with:
"NO_QUERY_NEEDED: As your personal AI Investment Assistant, I only have access to your personal account and general platform guides."
3. If the user asks a greeting, general inquiry, or asks about steps to invest, how to redeem, how IRA works, or platform procedures, respond with:
"NO_QUERY_NEEDED: <your direct, concise, step-by-step answer>".
4. If a database query is required to answer the question (e.g., checking their portfolio balance, past investments, redemption requests, available funds, or linked accounts):
Respond WITH ONLY THE RAW POSTGRESQL SELECT QUERY. Do NOT include markdown formatting or explanations.
- The query MUST begin with SELECT and MUST ONLY query allowed tables (investors, funds, investments, old_investments, redemptions, ira_accounts, investor_documents, investor_bank_accounts).
- When querying investor-specific tables (investments, redemptions, ira_accounts, investor_documents, investor_bank_accounts, investors), you MUST ALWAYS scope to this investor:
  - For investments: user_id = '${userId}' (or user_id = '${userId}' OR user_id IN (SELECT id FROM investors WHERE parent_id = '${userId}'))
  - For old_investments: email_address = '${investorEmail}'
  - For redemptions: investor_id = '${userId}'
  - For ira_accounts: user_id = '${userId}'
  - For investor_documents: investor_id = '${userId}'
  - For investor_bank_accounts: investor_id = '${userId}'
  - For investors: id = '${userId}'
- Never query passwords, password_hash, or sensitive tax IDs.
- For funds table, you can select active funds available to all investors.`;

      const aiRes1 = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: investorSystemPrompt1 },
            { role: 'user', content: userQuery }
          ]
        })
      });

      if (!aiRes1.ok) {
        throw new Error('Failed to communicate with OpenAI');
      }

      const data1 = await aiRes1.json() as any;
      let sqlQuery = data1.choices[0]?.message?.content?.trim() || '';

      if (sqlQuery.startsWith('NO_QUERY_NEEDED:')) {
        return { success: true, reply: sqlQuery.replace('NO_QUERY_NEEDED:', '').trim() };
      }

      if (sqlQuery.startsWith('```sql')) {
        sqlQuery = sqlQuery.replace(/^```sql/, '').replace(/```$/, '').trim();
      }

      // 4. Strict Security & Scoping Validation
      if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
        return { success: false, reply: 'For security reasons, only read-only information can be retrieved.' };
      }

      const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'EXEC', 'CREATE', 'GRANT', 'REVOKE'];
      const hasDangerousKeyword = dangerousKeywords.some(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(sqlQuery);
      });
      if (hasDangerousKeyword) {
        this.logger.warn(`Athena detected prohibited keyword in investor query: ${sqlQuery}`);
        return { success: false, reply: 'Invalid query detected.' };
      }

      const forbiddenTables = [
        'users', 'staff', 'doctor_prospects', 'prospect_events', 'doctor_prospect_notes',
        'ringcentral_call_logs', 'webinars', 'webinar_attendees', 'user_sessions', 'user_otps',
        'audit_logs', 'compliance_reports', 'pipeline_stages', 'investment_invites', 'waterfalls',
        'waterfall_rules', 'migrations'
      ];

      for (const table of forbiddenTables) {
        const tableRegex = new RegExp(`\\b${table}\\b`, 'i');
        if (tableRegex.test(sqlQuery)) {
          this.logger.warn(`Athena blocked investor from accessing prohibited table '${table}': ${sqlQuery}`);
          return {
            success: false,
            reply: 'As your personal AI Investment Assistant, I cannot access administrative or internal system tables.'
          };
        }
      }

      // Verify investor isolation: if user data tables are queried, ensure user ID / email is present
      const userScopedTables = ['investors', 'investments', 'redemptions', 'ira_accounts', 'investor_documents', 'investor_bank_accounts'];
      const touchesUserTable = userScopedTables.some(t => new RegExp(`\\b${t}\\b`, 'i').test(sqlQuery));
      if (touchesUserTable && !sqlQuery.includes(userId)) {
        this.logger.warn(`Athena blocked query missing investor user ID: ${sqlQuery}`);
        return {
          success: false,
          reply: 'For security and privacy reasons, I can only look up your personal account information.'
        };
      }

      if (sqlQuery.toLowerCase().includes('old_investments') && investorEmail && !sqlQuery.toLowerCase().includes(investorEmail.toLowerCase())) {
        this.logger.warn(`Athena blocked old_investments query missing investor email: ${sqlQuery}`);
        return {
          success: false,
          reply: 'For security and privacy reasons, I can only look up your personal account information.'
        };
      }

      // 5. Execute Query
      this.logger.log(`Athena executing investor SQL for ${userId}: ${sqlQuery}`);
      let queryResults: any[] = [];
      try {
        const dbRes = await db.query(sqlQuery);
        queryResults = dbRes.rows;
      } catch (err: any) {
        this.logger.error(`Investor SQL execution failed: ${err.message}`);
        return { success: false, reply: `I encountered an issue looking up your information: ${err.message}` };
      }

      // Mask sensitive fields
      queryResults = queryResults.map(row => {
        const maskedRow = { ...row };
        for (const key in maskedRow) {
          if (key.includes('password') || key.includes('hash') || key === 'ssn' || key === 'tax_id') {
            maskedRow[key] = '[MASKED]';
          }
        }
        return maskedRow;
      });

      if (queryResults.length > 50) {
        queryResults = queryResults.slice(0, 50);
        queryResults.push({ warning: 'Results truncated to 50 rows.' });
      }

      // 6. Format Response for Investor
      const investorSystemPrompt2 = `You are Athena, the personal AI Investment Assistant for ${investorName} at Ovalia Capital.
You are direct, concise, professional, and helpful.
You assist the investor by answering their question based on the database results and Ovalia Capital platform rules.
Below is the investor's question and the raw JSON results from the database.
Formulate a direct, concise, and easy-to-read response:
- Be clear, direct, and straightforward. Avoid unnecessary fluff or long walls of text.
- Use clean bullet points or numbered steps whenever explaining processes or multiple items.
- Format all dollar amounts as currency (e.g. $25,000.00).
- Format dates cleanly (e.g. Oct 14, 2026).
- If results are empty, explain politely and simply (e.g., "You currently do not have any active investments in this fund" or "No pending redemptions found").
- Never mention raw SQL queries, column names, or technical database jargon. Speak naturally and clearly.

Query Results:
${JSON.stringify(queryResults, null, 2)}`;

      const aiRes2 = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: investorSystemPrompt2 },
            { role: 'user', content: userQuery }
          ]
        })
      });

      if (!aiRes2.ok) {
        throw new Error('Failed to generate final response from OpenAI');
      }

      const data2 = await aiRes2.json() as any;
      const finalReply = data2.choices[0]?.message?.content?.trim() || 'I could not generate a response.';
      return { success: true, reply: finalReply };

    } catch (error: any) {
      this.logger.error(`Error in AthenaService (investor): ${error.message}`);
      return { success: false, reply: `Sorry, an error occurred: ${error.message}` };
    }
  }

  /**
   * Admin query handler: full CRM, transcripts, and database context.
   */
  private async queryAthenaForAdmin(userId: string, userQuery: string, openaiKey: string) {
    try {
      let sqlQuery = '';
      let queryResults: any[] = [];
      
      const crmKeywords = ['crm', 'webinar', 'doctor', 'lead', 'call', 'prospect', 'transcript', 'seb', 'contact'];
      const isCrmQuery = crmKeywords.some(kw => userQuery.toLowerCase().includes(kw));

      if (isCrmQuery) {
        sqlQuery = 'FULL CRM CONTEXT DUMP';
        this.logger.log(`Athena bypassing SQL generation for CRM query`);
        const docs = await db.query('SELECT apollo_id, full_name, specialty, organization, location, stage FROM doctor_prospects');
        const webs = await db.query('SELECT id, title, webinar_date, webinar_time, status, is_active FROM webinars');
        const calls = await db.query('SELECT apollo_id, duration, transcription_text, created_at FROM ringcentral_call_logs ORDER BY created_at ASC');
        
        queryResults = [
          { type: 'DOCTORS', data: docs.rows },
          { type: 'WEBINARS', data: webs.rows },
          { type: 'CALLS', data: calls.rows }
        ];
      } else {
        // Step 1: Ask LLM to generate SQL
        const systemPrompt1 = `You are a PostgreSQL expert. Your job is to convert a user's question into a valid PostgreSQL SELECT query based on the following database schema.
The user asking the question has the internal user ID: '${userId}'. Use this ID if they ask for "my" data, "my" investments, or information related to themselves.
The current date is ${new Date().toISOString().split('T')[0]}.
If the question can be answered without a query (e.g., general greeting), respond with "NO_QUERY_NEEDED: <your response>".
Otherwise, respond WITH ONLY THE SQL QUERY. Do NOT include markdown formatting, code blocks, or any explanation. ONLY the raw SQL query string.
The query MUST start with SELECT and must NOT modify any data.
Do NOT select passwords or sensitive hashes.

Schema:
${this.adminCuratedSchema}

Hints:
- When the user asks about the "pipeline" or "pipeline stages", they are referring to the pipeline_stages table and the pipeline_stage_id column in the investors table. ALWAYS use the ILIKE operator (e.g., name ILIKE '%stage%') for stage name matching as case varies.
- When asked about doctor prospects in a specific status (e.g., "interested", "needs call"), ALWAYS query the 'stage' column in the doctor_prospects table directly. IMPORTANT: Stage names in the database often use underscores instead of spaces (e.g., 'needs_call', 'pending_outreach'). Make sure to account for this in your ILIKE condition (e.g., stage ILIKE '%needs_call%'). Do NOT count all doctors.
- If asked to summarize a call, conversation, or transcript for a specific person by name, you MUST JOIN the 'ringcentral_call_logs' table with the 'doctor_prospects' table ON ringcentral_call_logs.apollo_id = doctor_prospects.apollo_id, and filter by doctor_prospects.full_name using the ILIKE operator (e.g., full_name ILIKE '%name%'). DO NOT respond with NO_QUERY_NEEDED. You MUST generate a SELECT query to fetch 'ringcentral_call_logs.transcription_text' and 'ringcentral_call_logs.created_at' (to avoid ambiguous column errors) and append 'ORDER BY ringcentral_call_logs.created_at ASC' so the history is chronological.
- When querying for investors in any specific pipeline stage, if that stage has order_index = 1, you MUST also include investors where pipeline_stage_id IS NULL, as new signups default to NULL but belong to the first stage.`;

        const aiRes1 = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt1 },
              { role: 'user', content: userQuery }
            ]
          })
        });

        if (!aiRes1.ok) {
          throw new Error('Failed to communicate with OpenAI');
        }

        const data1 = await aiRes1.json() as any;
        sqlQuery = data1.choices[0]?.message?.content?.trim() || '';

        if (sqlQuery.startsWith('NO_QUERY_NEEDED:')) {
          return { success: true, reply: sqlQuery.replace('NO_QUERY_NEEDED:', '').trim() };
        }

        if (sqlQuery.startsWith('```sql')) {
          sqlQuery = sqlQuery.replace(/^```sql/, '').replace(/```$/, '').trim();
        }

        if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
          return { success: false, reply: 'I can only run SELECT queries for security reasons.' };
        }

        // Step 2: Execute the query
        this.logger.log(`Athena executing SQL: ${sqlQuery}`);
        try {
          const dbRes = await db.query(sqlQuery);
          queryResults = dbRes.rows;
        } catch (err: any) {
          this.logger.error(`SQL execution failed: ${err.message}`);
          return { success: false, reply: `I encountered a database error while looking up that information: ${err.message}` };
        }
      }

      // Mask sensitive fields
      queryResults = queryResults.map(row => {
        const maskedRow = { ...row };
        for (const key in maskedRow) {
          if (key.includes('password') || key.includes('hash') || key === 'ssn' || key === 'tax_id') {
            maskedRow[key] = '[MASKED]';
          }
        }
        return maskedRow;
      });

      // Limit results to avoid token overflow
      if (queryResults.length > 50) {
        queryResults = queryResults.slice(0, 50);
        queryResults.push({ warning: 'Results truncated to 50 rows for token limits.' });
      }

      // Step 3: Ask LLM to format the response
      const systemPrompt2 = `You are Athena, a helpful, professional Executive Assistant AI Agent. 
You assist the team by answering questions based on database query results.
If the query results contain timestamps or multiple events (like call transcriptions), pay close attention to the chronological progression of events. Always prioritize the most recent information (e.g. if a prospect agrees to a meeting but later cancels, state that they cancelled).
Below is the user's question, the SQL query used to find the data, and the raw JSON results from the database.
Formulate a concise, professional, and friendly response answering the user's question.

SQL Executed: ${sqlQuery}

Query Results (Masked): 
${JSON.stringify(queryResults, null, 2)}`;

      const aiRes2 = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt2 },
            { role: 'user', content: userQuery }
          ]
        })
      });

      if (!aiRes2.ok) {
        throw new Error('Failed to generate final response from OpenAI');
      }

      const data2 = await aiRes2.json() as any;
      const finalReply = data2.choices[0]?.message?.content?.trim() || 'I could not generate a response.';

      return { success: true, reply: finalReply };

    } catch (error: any) {
      this.logger.error(`Error in AthenaService (admin): ${error.message}`);
      return { success: false, reply: `Sorry, an error occurred: ${error.message}` };
    }
  }
}
