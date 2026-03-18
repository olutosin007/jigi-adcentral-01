interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || ''
const FROM_EMAIL = import.meta.env.VITE_EMAIL_FROM || 'Jigi <notifications@jigi.app>'
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, from = FROM_EMAIL } = options

  if (!RESEND_API_KEY) {
    console.warn('[Email] Resend API key not configured. Email not sent:', subject)
    return {
      success: false,
      error: 'Email not configured',
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Email] Failed to send:', errorData)
      return {
        success: false,
        error: errorData.message || 'Failed to send email',
      }
    }

    const data = await response.json()
    return {
      success: true,
      id: data.id,
    }
  } catch (error) {
    console.error('[Email] Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export { APP_URL }
