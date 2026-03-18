import { Skeleton } from '@/components/ui/skeleton'

interface GenerationLoadingStateProps {
  type: 'concept' | 'copy' | 'image'
  count?: number
}

export function GenerationLoadingState({ type, count = 4 }: GenerationLoadingStateProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">
            Generating {count} {type === 'concept' ? 'concepts' : type === 'copy' ? 'copy variants' : 'images'}...
          </span>
        </div>
        {type === 'image' && (
          <p className="text-xs text-muted-foreground pl-6">
            This may take 30–60 seconds.
          </p>
        )}
      </div>

      {type === 'concept' && (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <ConceptSkeleton key={i} />
          ))}
        </div>
      )}

      {type === 'copy' && (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <CopySkeleton key={i} />
          ))}
        </div>
      )}

      {type === 'image' && (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <ImageSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function ConceptSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="w-5 h-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  )
}

function CopySkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

function ImageSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Skeleton className="h-36 w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}
