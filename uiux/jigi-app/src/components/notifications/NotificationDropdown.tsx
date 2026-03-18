import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@/hooks/useNotifications'

interface NotificationDropdownProps {
  notifications: Notification[]
  isLoading?: boolean
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClose?: () => void
}

export function NotificationDropdown({
  notifications,
  isLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="w-80 md:w-96">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onMarkAllAsRead}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Mark all as read
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {notifications.length > 0 && (
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
