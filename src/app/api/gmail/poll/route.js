import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

async function classifyPriority(subject, body) {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
You are an email priority classifier for DECKARC LLC, a construction company.

Classify this email as exactly one of: high, normal, low

Rules:
- high: urgent issues, blocked work, permit rejections, inspection failures, safety concerns, client complaints, anything with URGENT in subject
- normal: progress updates, questions, meeting requests, general inquiries, delivery updates
- low: invoices, newsletters, holiday notices, non-urgent admin emails

Email Subject: ${subject}
Email Body: ${body}

Reply with ONLY one word — either: high, normal, or low
`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim().toLowerCase()
    if (['high', 'normal', 'low'].includes(text)) return text
    return 'normal'
  } catch {
    return 'normal'
  }
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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

  oauth2Client.on('tokens', async (tokens) => {
    await supabase
      .from('gmail_tokens')
      .update({ tokens: JSON.stringify(tokens), updated_at: new Date() })
      .eq('id', 1)
  })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const { data: list } = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 20,
    q: 'in:inbox',
  })

  const messages = list.messages || []
  let newCount = 0

  for (const msg of messages) {
    // Fetch full message first to get labels and content
    const fullRes = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    })
    const full = fullRes.data

    const isUnreadInGmail = full.labelIds?.includes('UNREAD') ?? false

    // Check if already saved
    const { data: existing } = await supabase
      .from('notifications')
      .select('notification_id, is_read')
      .eq('gmail_message_id', msg.id)
      .single()

    if (existing) {
      // Sync read status — if read in Gmail, mark read in dashboard too
      if (!existing.is_read && !isUnreadInGmail) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('gmail_message_id', msg.id)
      }
      continue
    }

    const headers = full.payload.headers
    const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)'
    const from = headers.find(h => h.name === 'From')?.value || ''
    const date = headers.find(h => h.name === 'Date')?.value || ''

    const fromMatch = from.match(/^(.*?)\s*<(.+)>$/)
    const fromName = fromMatch ? fromMatch[1].trim() : from
    const fromEmail = fromMatch ? fromMatch[2] : from

    let body = ''
    if (full.payload.parts) {
      const textPart = full.payload.parts.find(p => p.mimeType === 'text/plain')
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
      }
    } else if (full.payload.body?.data) {
      body = Buffer.from(full.payload.body.data, 'base64').toString('utf-8')
    }

    const priority = await classifyPriority(subject, body.slice(0, 500))

    await supabase.from('notifications').insert([{
      gmail_message_id: msg.id,
      from_email: fromEmail,
      from_name: fromName,
      subject,
      body: body.slice(0, 2000),
      received_at: new Date(date),
      priority,
      is_read: !isUnreadInGmail,
    }])

    newCount++
  }

  return Response.json({ success: true, newEmails: newCount })
}