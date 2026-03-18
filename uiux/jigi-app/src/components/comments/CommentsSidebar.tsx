import { useState } from 'react'
import { MessageSquare, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CommentInput } from './CommentInput'
import { CommentThread, type Comment } from './CommentThread'

type CommentFilter = 'all' | 'unresolved' | 'resolved'

interface CommentsSidebarProps {
  assetId: string
  comments: Comment[]
  isLoading?: boolean
  isSubmitting?: boolean
  currentUserId?: string
  currentUserName?: string
  currentUserAvatar?: string
  onAddComment: (content: string) => void
  onReplyComment: (commentId: string, content: string) => void
  onResolveComment: (commentId: string) => void
  onDeleteComment: (commentId: string) => void
  onClose?: () => void
}

export function CommentsSidebar({
  comments,
  isLoading = false,
  isSubmitting = false,
  currentUserId,
  currentUserName = 'User',
  currentUserAvatar,
  onAddComment,
  onReplyComment,
  onResolveComment,
  onDeleteComment,
  onClose,
}: CommentsSidebarProps) {
  const [filter, setFilter] = useState<CommentFilter>('all')

  const filteredComments = comments.filter((comment) => {
    if (filter === 'unresolved') return !comment.resolved
    if (filter === 'resolved') return comment.resolved
    return true
  })

  const unresolvedCount = comments.filter((c) => !c.resolved).length
  const resolvedCount = comments.filter((c) => c.resolved).length

  return (
    <div className="flex flex-col h-full bg-background border-l">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Comments</h3>
          <Badge variant="secondary" className="text-xs">
            {comments.length}
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as CommentFilter)}>
            <SelectTrigger className="h-8 text-sm flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Comments ({comments.length})
              </SelectItem>
              <SelectItem value="unresolved">
                Unresolved ({unresolvedCount})
              </SelectItem>
              <SelectItem value="resolved">
                Resolved ({resolvedCount})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2" />
            <span className="text-sm">Loading comments...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <span className="text-sm">
              {filter === 'all'
                ? 'No comments yet'
                : filter === 'unresolved'
                ? 'No unresolved comments'
                : 'No resolved comments'}
            </span>
            {filter === 'all' && (
              <span className="text-xs mt-1">Be the first to comment</span>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReply={onReplyComment}
                onResolve={onResolveComment}
                onDelete={onDeleteComment}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <CommentInput
          onSubmit={onAddComment}
          isSubmitting={isSubmitting}
          userName={currentUserName}
          userAvatar={currentUserAvatar}
          placeholder="Add a comment..."
        />
      </div>
    </div>
  )
}
