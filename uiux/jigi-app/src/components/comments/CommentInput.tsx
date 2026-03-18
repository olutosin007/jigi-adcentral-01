import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CommentInputProps {
  onSubmit: (content: string) => void
  isSubmitting?: boolean
  placeholder?: string
  autoFocus?: boolean
  userAvatar?: string
  userName?: string
  replyTo?: string
  onCancelReply?: () => void
}

export function CommentInput({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Add a comment...',
  autoFocus = false,
  userAvatar,
  userName = 'User',
  replyTo,
  onCancelReply,
}: CommentInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyTo])

  const handleSubmit = () => {
    if (!content.trim()) return
    onSubmit(content.trim())
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape' && replyTo && onCancelReply) {
      onCancelReply()
    }
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={userAvatar} alt={userName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <span>Replying to {replyTo}</span>
            <button
              onClick={onCancelReply}
              className="hover:text-foreground"
              type="button"
            >
              Cancel
            </button>
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="resize-none text-sm"
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Press ⌘+Enter to send
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
