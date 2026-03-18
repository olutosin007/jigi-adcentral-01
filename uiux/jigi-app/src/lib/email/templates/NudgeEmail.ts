import { baseEmailTemplate, primaryButton } from './base'
import { APP_URL } from '../client'

interface NudgeEmailProps {
  recipientName: string
  assetName: string
  assetId: string
  campaignName: string
  submittedBy: string
  pendingDuration: string
  nudgeType: 'pending_24h' | 'pending_48h' | 'opened_no_action'
}

export function nudgeEmailTemplate({
  recipientName,
  assetName,
  assetId,
  campaignName,
  submittedBy,
  pendingDuration,
  nudgeType,
}: NudgeEmailProps): string {
  const getUrgencyLevel = () => {
    switch (nudgeType) {
      case 'pending_24h':
        return { color: '#F59E0B', label: 'Gentle Reminder', icon: '⏰' }
      case 'pending_48h':
        return { color: '#F97316', label: 'Needs Attention', icon: '⚡' }
      case 'opened_no_action':
        return { color: '#EF4444', label: 'Action Required', icon: '🔔' }
      default:
        return { color: '#6B7280', label: 'Reminder', icon: '📌' }
    }
  }

  const urgency = getUrgencyLevel()

  const getMessage = () => {
    switch (nudgeType) {
      case 'pending_24h':
        return `This asset has been waiting for your review for ${pendingDuration}. A quick review would help keep the creative workflow moving smoothly.`
      case 'pending_48h':
        return `This asset has been pending review for ${pendingDuration}. The team is waiting for your feedback to proceed with the campaign.`
      case 'opened_no_action':
        return `You viewed this asset but didn't take action. Please approve, reject, or request changes so the team can proceed.`
      default:
        return `This asset is waiting for your review.`
    }
  }

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">${urgency.icon}</div>
      <span style="display: inline-block; padding: 6px 16px; background-color: ${urgency.color}15; color: ${urgency.color}; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        ${urgency.label}
      </span>
    </div>

    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      Hi ${recipientName},
    </p>

    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      ${getMessage()}
    </p>

    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
      <table style="width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #6B7280; font-size: 14px;">Asset</span>
          </td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="color: #111827; font-weight: 600; font-size: 14px;">${assetName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #E5E7EB;">
            <span style="color: #6B7280; font-size: 14px;">Campaign</span>
          </td>
          <td style="padding: 8px 0; border-top: 1px solid #E5E7EB; text-align: right;">
            <span style="color: #111827; font-size: 14px;">${campaignName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #E5E7EB;">
            <span style="color: #6B7280; font-size: 14px;">Submitted by</span>
          </td>
          <td style="padding: 8px 0; border-top: 1px solid #E5E7EB; text-align: right;">
            <span style="color: #111827; font-size: 14px;">${submittedBy}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #E5E7EB;">
            <span style="color: #6B7280; font-size: 14px;">Pending for</span>
          </td>
          <td style="padding: 8px 0; border-top: 1px solid #E5E7EB; text-align: right;">
            <span style="color: ${urgency.color}; font-weight: 600; font-size: 14px;">${pendingDuration}</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      ${primaryButton('Review Now', `${APP_URL}/app/review/${assetId}`)}
    </div>

    <p style="font-size: 14px; color: #6B7280; line-height: 1.6; text-align: center;">
      Quick actions help keep your team productive and creative workflows on track.
    </p>
  `

  return baseEmailTemplate({
    preheader: `Reminder: ${assetName} is waiting for your review`,
    content,
  })
}
