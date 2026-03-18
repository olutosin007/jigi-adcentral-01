import { APP_URL } from '../client'
import { baseEmailTemplate, primaryButton } from './base'

interface SubmissionEmailProps {
  recipientName: string
  assetType: string
  campaignName: string
  brandName?: string
  submitterName: string
  submissionNote?: string
  assetId: string
}

export function submissionEmailTemplate(props: SubmissionEmailProps): string {
  const {
    recipientName,
    assetType,
    campaignName,
    brandName,
    submitterName,
    submissionNote,
    assetId,
  } = props

  const reviewUrl = `${APP_URL}/app/review/${assetId}`

  const content = `
    <h1 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
      New Asset for Review
    </h1>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      Hi ${recipientName},
    </p>
    
    <p style="margin: 0 0 24px; color: #4B5563; font-size: 16px; line-height: 1.5;">
      ${submitterName} has submitted a new <strong>${assetType}</strong> for your review
      ${brandName ? `for <strong>${brandName}</strong>` : ''} 
      in the campaign "<strong>${campaignName}</strong>".
    </p>
    
    ${submissionNote ? `
      <div style="background-color: #F9FAFB; border-left: 4px solid #0D9488; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 4px; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
          Submission Note
        </p>
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
          ${submissionNote}
        </p>
      </div>
    ` : ''}
    
    <div style="margin: 0 0 24px;">
      ${primaryButton('Review Asset', reviewUrl)}
    </div>
    
    <p style="margin: 0; color: #9CA3AF; font-size: 14px;">
      Or copy and paste this link: <a href="${reviewUrl}" style="color: #0D9488;">${reviewUrl}</a>
    </p>
  `

  return baseEmailTemplate({
    preheader: `New ${assetType} submitted for review in ${campaignName}`,
    content,
  })
}
