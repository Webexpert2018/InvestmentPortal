import { Injectable, Logger } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class AthenaService {
  private readonly logger = new Logger(AthenaService.name);

  private readonly curatedSchema = `
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

  async queryAthena(userId: string, userQuery: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return { success: false, reply: 'OpenAI API Key is missing.' };
    }

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
${this.curatedSchema}

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
      this.logger.error(`Error in AthenaService: ${error.message}`);
      return { success: false, reply: `Sorry, an error occurred: ${error.message}` };
    }
  }
}
