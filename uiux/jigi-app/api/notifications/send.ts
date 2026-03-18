import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getAuthenticatedUser } from '../lib/supabase.js'
import { sendEmail } from '../lib/resend.js'

interface SendNotificationRequest {
  user_id: string
  type: 'submission' | 'approval' | 'rejection' | 'changes_requested' | 'comment_added' | 'comment_reply'
  title: string
  body: string
  related_asset_id?: string
  related_campaign_id?: string
  related_comment_id?: string
  send_email?: boolean
  email_subject?: string
  email_html?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user, error: authError } = await getAuthenticatedUser(
    req.headers.authorization as string
  )

  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const body = req.body as SendNotificationRequest

  if (!body.user_id || !body.type || !body.title) {
    return res.status(400).json({
      error: 'Missing required fields: user_id, type, title',
    })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: notification, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: body.user_id,
        type: body.type,
        title: body.title,
        body: body.body,
        related_asset_id: body.related_asset_id || null,
        related_campaign_id: body.related_campaign_id || null,
        related_comment_id: body.related_comment_id || null,
        email_sent: false,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create notification: ${insertError.message}`)
    }

    let emailSent = false

    if (body.send_email && body.email_subject && body.email_html) {
      const { data: recipient } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', body.user_id)
        .single()

      if (recipient?.email) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: body.email_subject,
            html: body.email_html,
          })

          await supabaseAdmin
            .from('notifications')
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id)

          emailSent = true
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError)
        }
      }
    }

    return res.json({
      notification,
      email_sent: emailSent,
    })
  } catch (error) {
    console.error('Send notification error:', error)

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send notification',
    })
  }
}
