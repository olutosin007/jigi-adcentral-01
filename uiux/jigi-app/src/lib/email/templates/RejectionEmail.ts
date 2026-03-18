import { APP_URL } from '../client'
import { baseEmailTemplate, primaryButton } from './base'

interface RejectionEmailProps {
  recipientName: string
  assetType: string
  campaignName: string
  brandName?: string
  reviewerName: string
  rejectionReason: string
  assetId: string
}

export function rejectionEmailTemplate(props: RejectionEmailProps): string {
  const {
    recipientName,
    assetType,
    campaignName,
    brandName,
    reviewerName,
    rejectionReason,
    assetId,
  } = props

  const assetUrl = `${APP_URL}/app/campaigns?asset=${assetId}`

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #FEE2E2; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
    </div>
    
    <h1 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; text-align: center;">
      Asset Not Approved
    </h1>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      Hi ${recipientName},
    </p>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      Unfortunately, your <strong>${assetType}</strong> 
      ${brandName ? `for <strong>${brandName}</strong>` : ''} 
      in the campaign "<strong>${campaignName}</strong>" has been rejected by ${reviewerName}.
    </p>
    
    <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 4px; color: #991B1B; font-size: 12px; font-weight: 600; text-transform: uppercase;">
        Rejection Reason
      </p>
      <p style="margin: 0; color: #B91C1C; font-size: 14px; line-height: 1.5;">
        ${rejectionReason}
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      You may need to create a new asset that addresses this feedback.
    </p>
    
    <div style="text-align: center; margin: 0 0 24px;">
      ${primaryButton('View Campaign', assetUrl)}
    </div>
  `

  return baseEmailTemplate({
    preheader: `Your ${assetType} was not approved`,
    content,
  })
}
