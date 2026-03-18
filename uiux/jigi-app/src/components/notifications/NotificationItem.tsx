import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Clock,
  MessageCircle,
  CheckCheck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Notification, NotificationType } from '@/hooks/useNotifications'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClose?: () => void
}

const NOTIFICATION_ICONS: Record<NotificationType, typeof CheckCircle2> = {
  submission: Send,
  approval: CheckCircle2,
  rejection: XCircle,
  changes_requested: MessageSquare,
  nudge_reminder: Clock,
  comment_added: MessageCircle,
  comment_reply: MessageCircle,
  comment_resolved: CheckCheck,
}

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  submission: 'text-primary bg-primary/10',
  approval: 'text-success bg-success/10',
  rejection: 'text-destructive bg-destructive/10',
  changes_requested: 'text-warning bg-warning/10',
  nudge_reminder: 'text-purple-600 bg-purple-100',
  comment_added: 'text-cyan-600 bg-cyan-100',
  comment_reply: 'text-cyan-600 bg-cyan-100',
  comment_resolved: 'text-success bg-success/10',
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const navigate = useNavigate()
  const Icon = NOTIFICATION_ICONS[notification.type]
  const colorClass = NOTIFICATION_COLORS[notification.type]

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }

    if (notification.related_asset_id) {
      navigate(`/app/review/${notification.related_asset_id}`)
      onClose?.()
    } else if (notification.related_campaign_id) {
      navigate(`/app/campaigns/${notification.related_campaign_id}`)
      onClose?.()
    }
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group',
        notification.read ? 'bg-transparent hover:bg-muted/50' : 'bg-primary/5 hover:bg-primary/10'
      )}
      onClick={handleClick}
    >
      <div className={cn('shrink-0 p-2 rounded-full', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.read && 'font-medium')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {!notification.read && (
        <div className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
      )}

      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 absolute top-2 right-2"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(notification.id)
        }}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Delete notification</span>
      </Button>
    </div>
  )
}
