import { supabase } from './supabase'
import { sendEmail, submissionEmailTemplate, approvalEmailTemplate, rejectionEmailTemplate, changesRequestedEmailTemplate } from './email'
import type { NotificationType } from '@/hooks/useNotifications'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  body?: string
  relatedAssetId?: string
  relatedCampaignId?: string
  relatedCommentId?: string
  generationMode?: 'brand_grounded' | 'idea_first'
}

export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    type,
    title,
    body,
    relatedAssetId,
    relatedCampaignId,
    relatedCommentId,
    generationMode,
  } = params

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      related_asset_id: relatedAssetId,
      related_campaign_id: relatedCampaignId,
      related_comment_id: relatedCommentId,
      generation_mode: generationMode,
    })
    .select()
    .single()

  if (error) {
    console.error('[Notifications] Failed to create notification:', error)
    throw error
  }

  return data
}

interface NotifySubmissionParams {
  reviewerIds: string[]
  submitterId: string
  submitterName: string
  assetId: string
  assetType: string
  campaignId: string
  campaignName: string
  brandName?: string
  submissionNote?: string
  sendEmailNotification?: boolean
}

export async function notifySubmission(params: NotifySubmissionParams) {
  const {
    reviewerIds,
    submitterName,
    assetId,
    assetType,
    campaignId,
    campaignName,
    brandName,
    submissionNote,
    sendEmailNotification = true,
  } = params

  const promises = reviewerIds.map(async (reviewerId) => {
    await createNotification({
      userId: reviewerId,
      type: 'submission',
      title: `New ${assetType} for review`,
      body: `${submitterName} submitted a ${assetType} in "${campaignName}"${submissionNote ? `: ${submissionNote}` : ''}`,
      relatedAssetId: assetId,
      relatedCampaignId: campaignId,
    })

    if (sendEmailNotification) {
      const { data: reviewer } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', reviewerId)
        .single()

      if (reviewer?.email) {
        const html = submissionEmailTemplate({
          recipientName: reviewer.full_name || 'Reviewer',
          assetType,
          campaignName,
          brandName,
          submitterName,
          submissionNote,
          assetId,
        })

        await sendEmail({
          to: reviewer.email,
          subject: `New ${assetType} for review in ${campaignName}`,
          html,
        })

        await supabase
          .from('notifications')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq('user_id', reviewerId)
          .eq('related_asset_id', assetId)
          .eq('type', 'submission')
      }
    }
  })

  await Promise.all(promises)
}

interface NotifyApprovalParams {
  creatorId: string
  creatorEmail: string
  creatorName: string
  approverId: string
  approverName: string
  assetId: string
  assetType: string
  campaignId: string
  campaignName: string
  brandName?: string
  approvalNote?: string
  sendEmailNotification?: boolean
}

export async function notifyApproval(params: NotifyApprovalParams) {
  const {
    creatorId,
    creatorEmail,
    creatorName,
    approverName,
    assetId,
    assetType,
    campaignId,
    campaignName,
    brandName,
    approvalNote,
    sendEmailNotification = true,
  } = params

  await createNotification({
    userId: creatorId,
    type: 'approval',
    title: `${assetType} approved!`,
    body: `Your ${assetType} in "${campaignName}" was approved by ${approverName}${approvalNote ? `. Note: ${approvalNote}` : ''}`,
    relatedAssetId: assetId,
    relatedCampaignId: campaignId,
  })

  if (sendEmailNotification && creatorEmail) {
    const html = approvalEmailTemplate({
      recipientName: creatorName,
      assetType,
      campaignName,
      brandName,
      approverName,
      approvalNote,
      assetId,
    })

    await sendEmail({
      to: creatorEmail,
      subject: `Your ${assetType} has been approved!`,
      html,
    })

    await supabase
      .from('notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('user_id', creatorId)
      .eq('related_asset_id', assetId)
      .eq('type', 'approval')
  }
}

interface NotifyRejectionParams {
  creatorId: string
  creatorEmail: string
  creatorName: string
  reviewerId: string
  reviewerName: string
  assetId: string
  assetType: string
  campaignId: string
  campaignName: string
  brandName?: string
  rejectionReason: string
  sendEmailNotification?: boolean
}

export async function notifyRejection(params: NotifyRejectionParams) {
  const {
    creatorId,
    creatorEmail,
    creatorName,
    reviewerName,
    assetId,
    assetType,
    campaignId,
    campaignName,
    brandName,
    rejectionReason,
    sendEmailNotification = true,
  } = params

  await createNotification({
    userId: creatorId,
    type: 'rejection',
    title: `${assetType} not approved`,
    body: `Your ${assetType} in "${campaignName}" was rejected by ${reviewerName}. Reason: ${rejectionReason}`,
    relatedAssetId: assetId,
    relatedCampaignId: campaignId,
  })

  if (sendEmailNotification && creatorEmail) {
    const html = rejectionEmailTemplate({
      recipientName: creatorName,
      assetType,
      campaignName,
      brandName,
      reviewerName,
      rejectionReason,
      assetId,
    })

    await sendEmail({
      to: creatorEmail,
      subject: `Your ${assetType} was not approved`,
      html,
    })

    await supabase
      .from('notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('user_id', creatorId)
      .eq('related_asset_id', assetId)
      .eq('type', 'rejection')
  }
}

interface NotifyChangesRequestedParams {
  creatorId: string
  creatorEmail: string
  creatorName: string
  reviewerId: string
  reviewerName: string
  assetId: string
  assetType: string
  campaignId: string
  campaignName: string
  brandName?: string
  feedback: string
  sendEmailNotification?: boolean
}

export async function notifyChangesRequested(params: NotifyChangesRequestedParams) {
  const {
    creatorId,
    creatorEmail,
    creatorName,
    reviewerName,
    assetId,
    assetType,
    campaignId,
    campaignName,
    brandName,
    feedback,
    sendEmailNotification = true,
  } = params

  await createNotification({
    userId: creatorId,
    type: 'changes_requested',
    title: `Changes requested for ${assetType}`,
    body: `${reviewerName} requested changes to your ${assetType} in "${campaignName}": ${feedback}`,
    relatedAssetId: assetId,
    relatedCampaignId: campaignId,
  })

  if (sendEmailNotification && creatorEmail) {
    const html = changesRequestedEmailTemplate({
      recipientName: creatorName,
      assetType,
      campaignName,
      brandName,
      reviewerName,
      feedback,
      assetId,
    })

    await sendEmail({
      to: creatorEmail,
      subject: `Changes requested for your ${assetType}`,
      html,
    })

    await supabase
      .from('notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('user_id', creatorId)
      .eq('related_asset_id', assetId)
      .eq('type', 'changes_requested')
  }
}

interface NotifyCommentParams {
  userId: string
  commenterName: string
  assetId: string
  campaignId?: string
  commentId: string
  isReply?: boolean
}

export async function notifyComment(params: NotifyCommentParams) {
  const {
    userId,
    commenterName,
    assetId,
    campaignId,
    commentId,
    isReply = false,
  } = params

  await createNotification({
    userId,
    type: isReply ? 'comment_reply' : 'comment_added',
    title: isReply ? `${commenterName} replied to your comment` : `${commenterName} commented on an asset`,
    body: `View the comment to respond.`,
    relatedAssetId: assetId,
    relatedCampaignId: campaignId,
    relatedCommentId: commentId,
  })
}

interface NotifyCommentResolvedParams {
  commentOwnerId: string
  resolverName: string
  assetId: string
  campaignId?: string
  commentId: string
}

export async function notifyCommentResolved(params: NotifyCommentResolvedParams) {
  const {
    commentOwnerId,
    resolverName,
    assetId,
    campaignId,
    commentId,
  } = params

  await createNotification({
    userId: commentOwnerId,
    type: 'comment_resolved',
    title: `Your comment was resolved`,
    body: `${resolverName} resolved your comment.`,
    relatedAssetId: assetId,
    relatedCampaignId: campaignId,
    relatedCommentId: commentId,
  })
}
