import { APP_URL } from '../client'
import { baseEmailTemplate, primaryButton } from './base'

interface ApprovalEmailProps {
  recipientName: string
  assetType: string
  campaignName: string
  brandName?: string
  approverName: string
  approvalNote?: string
  assetId: string
}

export function approvalEmailTemplate(props: ApprovalEmailProps): string {
  const {
    recipientName,
    assetType,
    campaignName,
    brandName,
    approverName,
    approvalNote,
    assetId,
  } = props

  const assetUrl = `${APP_URL}/app/campaigns?asset=${assetId}`

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #D1FAE5; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
    </div>
    
    <h1 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; text-align: center;">
      Asset Approved!
    </h1>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      Hi ${recipientName},
    </p>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      Great news! Your <strong>${assetType}</strong> 
      ${brandName ? `for <strong>${brandName}</strong>` : ''} 
      in the campaign "<strong>${campaignName}</strong>" has been approved by ${approverName}.
    </p>
    
    ${approvalNote ? `
      <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 4px; color: #065F46; font-size: 12px; font-weight: 600; text-transform: uppercase;">
          Approval Note
        </p>
        <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.5;">
          ${approvalNote}
        </p>
      </div>
    ` : ''}
    
    <div style="text-align: center; margin: 0 0 24px;">
      ${primaryButton('View Asset', assetUrl)}
    </div>
  `

  return baseEmailTemplate({
    preheader: `Your ${assetType} has been approved!`,
    content,
  })
}
