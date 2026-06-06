import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  const { to, subject, body } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: tokenRow } = await supabase
    .from('gmail_tokens')
    .select('tokens')
    .eq('id', 1)
    .single()

  if (!tokenRow) {
    return Response.json({ error: 'Gmail not connected' }, { status: 401 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials(JSON.parse(tokenRow.tokens))

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const emailLines = [
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ]

  const email = emailLines.join('\n')
  const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedEmail },
  })

  return Response.json({ success: true })
}