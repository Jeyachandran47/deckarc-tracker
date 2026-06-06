import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return new Response('No code provided', { status: 400 })
  }

  const { tokens } = await oauth2Client.getToken(code)

  // Save tokens to Supabase so we can reuse them
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

  await supabase
    .from('gmail_tokens')
    .upsert({ id: 1, tokens: JSON.stringify(tokens) })

  return new Response(`
    <html>
      <body style="background:#030712;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center">
          <h2 style="color:#f97316">Gmail Connected!</h2>
          <p>You can close this tab and go back to the dashboard.</p>
        </div>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } })
}