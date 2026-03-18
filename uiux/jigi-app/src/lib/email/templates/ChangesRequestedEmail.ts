import { APP_URL } from '../client'
import { baseEmailTemplate, primaryButton } from './base'

interface ChangesRequestedEmailProps {
  recipientName: string
  assetType: string
  campaignName: string
  brandName?: string
  reviewerName: string
  feedback: string
  assetId: string
}

export function changesRequestedEmailTemplate(props: ChangesRequestedEmailProps): string {
  const {
    recipientName,
    assetType,
    campaignName,
    brandName,
    reviewerName,
    feedback,
    assetId,
  } = props

  const assetUrl = `${APP_URL}/app/campaigns?asset=${assetId}`

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #FEF3C7; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
    </div>
    
    <h1 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; text-align: center;">
      Changes Requested
    </h1>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      Hi ${recipientName},
    </p>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      ${reviewerName} has requested changes to your <strong>${assetType}</strong> 
      ${brandName ? `for <strong>${brandName}</strong>` : ''} 
      in the campaign "<strong>${campaignName}</strong>".
    </p>
    
    <div style="background-color: #FFFBEB; border-left: 4px solid #D97706; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 4px; color: #92400E; font-size: 12px; font-weight: 600; text-transform: uppercase;">
        Requested Changes
      </p>
      <p style="margin: 0; color: #B45309; font-size: 14px; line-height: 1.5; white-space: pre-line;">
        ${feedback}
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      Please review the feedback and make the necessary adjustments.
    </p>
    
    <div style="text-align: center; margin: 0 0 24px;">
      ${primaryButton('View Asset', assetUrl)}
    </div>
  `

  return baseEmailTemplate({
    preheader: `Changes requested for your ${assetType}`,
    content,
  })
}
