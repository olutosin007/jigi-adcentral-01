import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  createReviewLink,
  revokeReviewLink,
  type CreateReviewLinkRequest,
  type ReviewLink,
} from '@/lib/api-client'

/** token_hash is not granted to clients, so columns must be listed explicitly. */
const LINK_COLUMNS =
  'id, asset_id, campaign_id, brand_id, created_by, recipient_name, recipient_email, expires_at, revoked_at, max_uses, use_count, first_opened_at, last_used_at, decided_at, decision, guest_name, guest_email, created_at'

export function useReviewLinks(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['review-links', campaignId],
    enabled: !!campaignId,
    retry: false,
    queryFn: async (): Promise<ReviewLink[]> => {
      const { data, error } = await supabase
        .from('review_links')
        .select(LINK_COLUMNS)
        .eq('campaign_id', campaignId!)
        .order('created_at', { ascending: false })
      // Environments without migration 032 simply have no links.
      if (error) return []
      return (data ?? []) as ReviewLink[]
    },
  })
}

export function useCreateReviewLink(campaignId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateReviewLinkRequest) => createReviewLink(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['review-links', campaignId] }),
  })
}

export function useRevokeReviewLink(campaignId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (linkId: string) => revokeReviewLink(linkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['review-links', campaignId] }),
  })
}
