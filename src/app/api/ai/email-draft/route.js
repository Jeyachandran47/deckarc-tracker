import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req) {
  try {
    const { fromName, fromEmail, subject, body } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
You are an assistant for DECKARC LLC, a professional construction company.

An email was received with the following details:
From: ${fromName} <${fromEmail}>
Subject: ${subject}
Message:
${body}

Write a professional, friendly, and concise reply email on behalf of DECKARC LLC.
- Address the sender by name
- Respond to their specific message
- Keep it under 150 words
- Use a professional construction company tone
- Do not include subject line — just the body of the reply
- End with: Best regards, DECKARC Project Team
    `

    const result = await model.generateContent(prompt)
    const draft = result.response.text()

    return Response.json({ draft })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}