const { Client } = require('pg');
const nodemailer = require('nodemailer');

const client = new Client({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

// Configure SMTP exactly as in the backend .env
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'apptest032@gmail.com',
    pass: 'jatnwwpbqbsdjuba',
  },
});

async function runTest() {
  await client.connect();
  console.log('Connected to database.');

  // Define start and end of today in UTC
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);

  console.log('Searching for meetings between:', startOfToday.toISOString(), 'and', endOfToday.toISOString());

  const meetingsToday = await client.query(`
    SELECT m.id, m.title, m.scheduled_date, m.meeting_link, m.organizer_id, m.organizer_type,
           COALESCE(os.full_name, oi.full_name, ou.first_name || ' ' || ou.last_name) as organizer_name,
           COALESCE(ou.email, oi.email) as organizer_email
    FROM meetings m
    LEFT JOIN staff os ON m.organizer_id = os.id AND m.organizer_type = 'staff'
    LEFT JOIN users ou ON m.organizer_id = ou.id AND m.organizer_type = 'staff'
    LEFT JOIN investors oi ON m.organizer_id = oi.id AND m.organizer_type = 'investor'
    WHERE m.scheduled_date >= $1 AND m.scheduled_date <= $2
  `, [startOfToday, endOfToday]);

  console.log(`Found ${meetingsToday.rows.length} meetings today.`);

  for (const meeting of meetingsToday.rows) {
    console.log('\nProcessing meeting:', meeting.title);
    console.log('Organizer Name:', meeting.organizer_name);
    console.log('Organizer Email:', meeting.organizer_email);

    const participants = await client.query(`
      SELECT mp.participant_id, mp.participant_type, mp.status,
             COALESCE(s.full_name, i.full_name) as name,
             COALESCE(u.email, i.email) as email
      FROM meeting_participants mp
      LEFT JOIN staff s ON mp.participant_id = s.id AND mp.participant_type = 'staff'
      LEFT JOIN users u ON mp.participant_id = u.id AND mp.participant_type = 'staff'
      LEFT JOIN investors i ON mp.participant_id = i.id AND mp.participant_type = 'investor'
      WHERE mp.meeting_id = $1 AND mp.status != 'rejected'
    `, [meeting.id]);

    console.log(`Participants (${participants.rows.length}):`);
    participants.rows.forEach(p => {
      console.log(`- ${p.name} (${p.email}) - Status: ${p.status}`);
    });

    const allEmails = [meeting.organizer_email, ...participants.rows.map(p => p.email)].filter(Boolean);
    const uniqueEmails = [...new Set(allEmails)];
    console.log('All unique recipient emails:', uniqueEmails);

    const meetingTime = new Date(meeting.scheduled_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    for (const email of uniqueEmails) {
      console.log(`Sending test email to: ${email}...`);
      const content = `
        <p>You have a meeting scheduled for today.</p>
        <p><strong>Title:</strong> ${meeting.title}</p>
        <p><strong>Time:</strong> ${meetingTime}</p>
        <p><strong>Organizer:</strong> ${meeting.organizer_name}</p>
        ${meeting.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${meeting.meeting_link}">${meeting.meeting_link}</a></p>` : '<p>No meeting link provided.</p>'}
      `;

      try {
        const info = await transporter.sendMail({
          from: '"Ovalia Capital" <apptest032@gmail.com>',
          to: email,
          subject: `Meeting Today: ${meeting.title}`,
          html: content,
        });
        console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);
      } catch (err) {
        console.error(`Failed to send email to ${email}:`, err);
      }
    }
  }

  await client.end();
}

runTest().catch(console.error);
