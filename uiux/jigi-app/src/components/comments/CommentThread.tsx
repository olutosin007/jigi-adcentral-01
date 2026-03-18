import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  MoreHorizontal, 
  Reply, 
  CheckCircle, 
  Trash2,
  MessageSquare 
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CommentInput } from './CommentInput'

export interface Comment {
  id: string
  content: string
  user_id: string
  user_name: string
  user_avatar?: string
  created_at: string
  resolved: boolean
  resolved_by?: string
  resolved_at?: string
  replies?: Comment[]
}

interface CommentThreadProps {
  comment: Comment
  currentUserId?: string
  onReply: (commentId: string, content: string) => void
  onResolve: (commentId: string) => void
  onDelete: (commentId: string) => void
  isSubmitting?: boolean
  depth?: number
}

export function CommentThread({
  comment,
  currentUserId,
  onReply,
  onResolve,
  onDelete,
  isSubmitting = false,
  depth = 0,
}: CommentThreadProps) {
  const [showReplyInput, setShowReplyInput] = useState(false)

  const initials = comment.user_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isOwnComment = currentUserId === comment.user_id
  const hasReplies = comment.replies && comment.replies.length > 0
  const maxDepth = 2

  const handleReply = (content: string) => {
    onReply(comment.id, content)
    setShowReplyInput(false)
  }

  return (
    <div className={cn('group', depth > 0 && 'ml-8 mt-3')}>
      <div className={cn(
        'flex gap-3',
        comment.resolved && 'opacity-60'
      )}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.user_avatar} alt={comment.user_name} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{comment.user_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.resolved && (
                <Badge variant="secondary" className="text-xs h-5">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Comment actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {depth < maxDepth && (
                  <DropdownMenuItem onClick={() => setShowReplyInput(true)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                {!comment.resolved && (
                  <DropdownMenuItem onClick={() => onResolve(comment.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </DropdownMenuItem>
                )}
                {isOwnComment && (
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>

          {!comment.resolved && depth < maxDepth && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground mt-1"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>
      </div>

      {showReplyInput && (
        <div className="ml-11 mt-3">
          <CommentInput
            onSubmit={handleReply}
            isSubmitting={isSubmitting}
            placeholder="Write a reply..."
            autoFocus
            replyTo={comment.user_name}
            onCancelReply={() => setShowReplyInput(false)}
          />
        </div>
      )}

      {hasReplies && (
        <div className="border-l-2 border-muted ml-4">
          {comment.replies!.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onResolve={onResolve}
              onDelete={onDelete}
              isSubmitting={isSubmitting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
