import { Resend } from 'resend'
import { getServerEnv } from './env.js'
import { escapeHtml } from './review-links.js'

let _resend: Resend | null = null

function getResendClient(): Resend {
  if (!_resend) {
    const resendApiKey = getServerEnv('RESEND_API_KEY')
    _resend = new Resend(resendApiKey)
  }
  return _resend
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions) {
  const resend = getResendClient()
  const emailFrom = getServerEnv('EMAIL_FROM', false) || 'Jigi <onboarding@resend.dev>'

  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return data
}

export function createSubmissionEmailHtml(params: {
  recipientName: string
  campaignName: string
  assetType: string
  submitterName: string
  reviewUrl: string
}) {
  return `
    <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FEFDFB;">
      <h2 style="color: #1C1917; margin-bottom: 16px;">New Asset Submitted for Review</h2>
      <p style="color: #44403C;">Hi ${params.recipientName},</p>
      <p style="color: #44403C;">
        <strong>${params.submitterName}</strong> has submitted a new <strong>${params.assetType}</strong> 
        for <strong>"${params.campaignName}"</strong> that needs your review.
      </p>
      <a href="${params.reviewUrl}" 
         style="display: inline-block; background: #0D9488; color: white; 
                padding: 12px 24px; border-radius: 8px; text-decoration: none;
                margin: 16px 0; font-weight: 500;">
        Review Now
      </a>
      <p style="color: #78716C; font-size: 14px; margin-top: 24px;">
        — The Jigi Team
      </p>
    </div>
  `
}

export function createApprovalEmailHtml(params: {
  recipientName: string
  campaignName: string
  assetType: string
  action: 'approved' | 'rejected' | 'changes_requested'
  reviewerName: string
  notes?: string
  assetUrl: string
}) {
  const recipientName = escapeHtml(params.recipientName)
  const reviewerName = escapeHtml(params.reviewerName)
  const campaignName = escapeHtml(params.campaignName)
  const notes = params.notes ? escapeHtml(params.notes) : ''
  const actionText = {
    approved: 'approved',
    rejected: 'rejected',
    changes_requested: 'requested changes on',
  }[params.action]

  const actionColor = {
    approved: '#059669',
    rejected: '#DC2626',
    changes_requested: '#D97706',
  }[params.action]

  return `
    <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FEFDFB;">
      <h2 style="color: ${actionColor}; margin-bottom: 16px;">
        Asset ${params.action === 'approved' ? 'Approved' : params.action === 'rejected' ? 'Rejected' : 'Needs Changes'}
      </h2>
      <p style="color: #44403C;">Hi ${recipientName},</p>
      <p style="color: #44403C;">
        <strong>${reviewerName}</strong> has ${actionText} your <strong>${params.assetType}</strong> 
        for <strong>"${campaignName}"</strong>.
      </p>
      ${notes ? `
        <div style="background: #F5F5F4; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="color: #44403C; margin: 0;"><strong>Notes:</strong></p>
          <p style="color: #57534E; margin: 8px 0 0;">${notes}</p>
        </div>
      ` : ''}
      <a href="${params.assetUrl}" 
         style="display: inline-block; background: #0D9488; color: white; 
                padding: 12px 24px; border-radius: 8px; text-decoration: none;
                margin: 16px 0; font-weight: 500;">
        View Asset
      </a>
      <p style="color: #78716C; font-size: 14px; margin-top: 24px;">
        — The Jigi Team
      </p>
    </div>
  `
}

export function createNudgeEmailHtml(params: {
  recipientName: string
  campaignName: string
  pendingCount: number
  reviewUrl: string
}) {
  return `
    <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FEFDFB;">
      <h2 style="color: #D97706; margin-bottom: 16px;">Friendly Reminder</h2>
      <p style="color: #44403C;">Hi ${params.recipientName},</p>
      <p style="color: #44403C;">
        You have <strong>${params.pendingCount} asset${params.pendingCount > 1 ? 's' : ''}</strong> 
        waiting for your review in <strong>"${params.campaignName}"</strong>.
      </p>
      <p style="color: #44403C;">
        Quick reviews help your agency deliver faster!
      </p>
      <a href="${params.reviewUrl}" 
         style="display: inline-block; background: #0D9488; color: white; 
                padding: 12px 24px; border-radius: 8px; text-decoration: none;
                margin: 16px 0; font-weight: 500;">
        Review Now
      </a>
      <p style="color: #78716C; font-size: 14px; margin-top: 24px;">
        — The Jigi Team
      </p>
    </div>
  `
}


export function createGuestReviewInviteHtml(params: {
  recipientName?: string
  senderName: string
  brandName?: string
  campaignName: string
  assetType: string
  message?: string
  reviewUrl: string
  expiresAt: string
}) {
  const hello = params.recipientName ? `Hi ${escapeHtml(params.recipientName)},` : 'Hi,'
  const who = escapeHtml(params.senderName)
  const campaign = escapeHtml(params.campaignName)
  const brand = params.brandName ? escapeHtml(params.brandName) : ''
  const message = params.message ? escapeHtml(params.message) : ''
  const expires = new Date(params.expiresAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
  return `
    <div style="font-family: 'Source Sans 3', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FEFDFB;">
      ${brand ? `<p style="color: #78716C; font-size: 13px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.04em;">${brand}</p>` : ''}
      <h2 style="color: #1C1917; margin: 0 0 16px;">Your decision is needed</h2>
      <p style="color: #44403C;">${hello}</p>
      <p style="color: #44403C;"><strong>${who}</strong> sent you a ${escapeHtml(params.assetType)} for <strong>"${campaign}"</strong>. Approve it, ask for changes, or decline — no account needed.</p>
      ${message ? `<div style="background: #F5F5F4; padding: 16px; border-radius: 8px; margin: 16px 0;"><p style="color: #57534E; margin: 0; white-space: pre-line;">${message}</p></div>` : ''}
      <a href="${params.reviewUrl}" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0; font-weight: 600;">Review and decide</a>
      <p style="color: #78716C; font-size: 13px;">This link is personal to you and works until ${expires}.</p>
    </div>
  `
}
