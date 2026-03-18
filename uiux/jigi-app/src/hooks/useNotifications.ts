import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type NotificationType =
  | 'submission'
  | 'approval'
  | 'rejection'
  | 'changes_requested'
  | 'nudge_reminder'
  | 'comment_added'
  | 'comment_reply'
  | 'comment_resolved'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  related_asset_id: string | null
  related_campaign_id: string | null
  related_comment_id: string | null
  generation_mode: 'brand_grounded' | 'idea_first' | null
  read: boolean
  read_at: string | null
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
}

interface NotificationFilters {
  unreadOnly?: boolean
  limit?: number
}

async function fetchNotifications(
  userId: string,
  filters?: NotificationFilters
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters?.unreadOnly) {
    query = query.eq('read', false)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Notification[]
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
  return count || 0
}

export function useNotifications(userId: string, filters?: NotificationFilters) {
  return useQuery({
    queryKey: ['notifications', userId, filters],
    queryFn: () => fetchNotifications(userId, filters),
    enabled: !!userId,
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useUnreadNotificationCount(userId: string) {
  return useQuery({
    queryKey: ['notifications-count', userId],
    queryFn: () => fetchUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

interface MarkAsReadParams {
  notificationId: string
  userId: string
}

async function markAsRead(params: MarkAsReadParams) {
  const { notificationId, userId } = params

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) throw error
  return { notificationId, userId }
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
    },
  })
}

interface MarkAllAsReadParams {
  userId: string
}

async function markAllAsRead(params: MarkAllAsReadParams) {
  const { userId } = params

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
  return { userId }
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
    },
  })
}

interface DeleteNotificationParams {
  notificationId: string
  userId: string
}

async function deleteNotification(params: DeleteNotificationParams) {
  const { notificationId, userId } = params

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) throw error
  return { userId }
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
    },
  })
}
