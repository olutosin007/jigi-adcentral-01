import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function getInitials(displayName?: string | null, email?: string): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
    }
    return displayName[0].toUpperCase().slice(0, 2)
  }
  if (email?.[0]) {
    return email[0].toUpperCase()
  }
  return 'U'
}

interface UserAvatarProps {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string
  size?: 'sm' | 'md'
  className?: string
}

export function UserAvatar({
  avatarUrl,
  displayName,
  email = '',
  size = 'md',
  className,
}: UserAvatarProps) {
  const initials = getInitials(displayName, email)
  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-8 w-8'

  return (
    <Avatar
      className={cn(
        sizeClass,
        'shrink-0 bg-gradient-to-br from-primary to-primary/80',
        className
      )}
    >
      <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? 'User'} />
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-white">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
