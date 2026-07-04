import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { NotificationDropdown } from './NotificationDropdown'
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false)

  const { data: notifications = [], isLoading } = useNotifications(userId, { limit: 20 })
  const { data: unreadCount = 0 } = useUnreadNotificationCount(userId)

  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const deleteNotification = useDeleteNotification()

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate({ notificationId, userId })
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate({ userId })
  }

  const handleDelete = (notificationId: string) => {
    deleteNotification.mutate({ notificationId, userId })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          data-tour="notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 text-[10px] font-bold',
                'bg-destructive text-destructive-foreground rounded-full',
                unreadCount > 99 && 'text-[8px]'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0" sideOffset={8}>
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
