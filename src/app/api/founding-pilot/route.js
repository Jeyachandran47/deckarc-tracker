import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const form = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Get Gmail tokens
    const { data: tokenRow } = await supabase
      .from('gmail_tokens')
      .select('tokens')
      .eq('id', 1)
      .single()

    if (!tokenRow) {
      return Response.json({ error: 'Gmail not connected' }, { status: 500 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials(JSON.parse(tokenRow.tokens))
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const emailBody = `
New Founding Pilot Application — DECKARC Tracker

Full Name:        ${form.full_name}
Company:          ${form.company_name || '—'}
Email:            ${form.email}
Phone:            ${form.phone || '—'}
Website:          ${form.website || '—'}
City / State:     ${form.city_state || '—'}
Contractor Type:  ${form.contractor_type || '—'}
Active Projects:  ${form.active_projects || '—'}
Challenge:        ${form.challenge || '—'}

Live Project:
${form.live_project || '—'}

---
Submitted via DECKARC Project Tracker
    `.trim()

    const emailLines = [
      `To: deckarc.projecttracker.test@gmail.com`,
      `Subject: New Founding Pilot Application — ${form.full_name}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      emailBody,
    ]

    const raw = Buffer.from(emailLines.join('\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const sendResult = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    }).catch(err => {
      console.error('Gmail send error:', err.message)
      throw err
    })
    console.log('Send result:', sendResult.data)

    return Response.json({ success: true })

} catch (err) {
    console.error('Founding pilot full error:', err.message, err.stack)
    return Response.json({ error: err.message, details: err.stack }, { status: 500 })
  }
}