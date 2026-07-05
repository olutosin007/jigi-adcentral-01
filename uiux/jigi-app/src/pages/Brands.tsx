import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, AlertCircle, Search, MoreHorizontal, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DeleteBrandDialog } from '@/components/brands/DeleteBrandDialog'
import { QuickCreateBrandDialog } from '@/components/brands/QuickCreateBrandDialog'
import { useBrandStore, type Brand } from '@/store/brandStore'
import { toast } from 'sonner'

const statusLabels = {
  complete: 'Complete',
  partial: 'Partial',
  starter: 'Starter',
} as const

const statusStyles = {
  complete: 'bg-success/10 text-success border-success/30',
  partial: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  starter: 'bg-muted text-muted-foreground border-border',
} as const

function getBrandColors(brand: Brand): { primary: string; secondary?: string; accent?: string } {
  const c = brand.identity?.colours
  return {
    primary: c?.primary || '#0D9488',
    secondary: c?.secondary,
    accent: c?.accent,
  }
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export function Brands() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [deleteDialogBrand, setDeleteDialogBrand] = useState<Brand | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const { brands, isLoading, error, fetchBrands, deleteBrand, archiveBrand, unarchiveBrand } = useBrandStore()

  useEffect(() => {
    fetchBrands({ includeArchived: showArchived })
  }, [fetchBrands, showArchived])

  const filteredBrands = useMemo(() => {
    if (brands.length < 5 || !debouncedSearch.trim()) return brands
    const q = debouncedSearch.toLowerCase()
    return brands.filter((b) => b.name.toLowerCase().includes(q))
  }, [brands, debouncedSearch])

  const handleCreateBrand = () => {
    setQuickCreateOpen(true)
  }

  const handleFullWizard = () => {
    navigate('/app/onboarding')
  }

  const handleArchive = async (brand: Brand) => {
    const result = await archiveBrand(brand.id)
    if (result.success) {
      toast.success(`"${brand.name}" archived`)
      fetchBrands({ includeArchived: showArchived })
    } else {
      toast.error(result.error ?? 'Failed to archive brand')
    }
  }

  const handleUnarchive = async (brand: Brand) => {
    const result = await unarchiveBrand(brand.id)
    if (result.success) {
      toast.success(`"${brand.name}" restored`)
      fetchBrands({ includeArchived: showArchived })
    } else {
      toast.error(result.error ?? 'Failed to restore brand')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialogBrand) return
    setIsDeleting(true)
    const result = await deleteBrand(deleteDialogBrand.id)
    setIsDeleting(false)
    if (result.success) {
      toast.success('Brand deleted')
      setDeleteDialogBrand(null)
      fetchBrands({ includeArchived: showArchived })
    } else {
      toast.error(result.error ?? 'Failed to delete brand')
    }
  }

  if (isLoading && brands.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => fetchBrands({ includeArchived: showArchived })}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Brands</h1>
            <p className="text-muted-foreground">Manage your brand profiles and guidelines</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <>
                <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
                Hide archived
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 mr-1" />
                Show archived
              </>
            )}
          </Button>
        </div>
        <EmptyState
          icon={<Building2 className="h-12 w-12 text-primary" />}
          title={showArchived ? 'No archived brands' : 'No brands yet'}
          description={
            showArchived
              ? 'You have no archived brands.'
              : 'Create your first brand profile to get started with creative generation.'
          }
          action={
            !showArchived ? (
              <Button onClick={handleCreateBrand} data-tour="brand-create">
                <Plus className="mr-2 h-4 w-4" />
                Create brand
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Brands</h1>
          <p className="text-muted-foreground">Manage your brand profiles and guidelines</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleCreateBrand} className="w-full sm:w-auto" data-tour="brand-create">
            <Plus className="mr-2 h-4 w-4" />
            Add brand
          </Button>
          <Button variant="outline" onClick={handleFullWizard} className="w-full sm:w-auto">
            Full setup wizard
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {brands.length >= 5 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? (
            <>
              <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
              Hide archived
            </>
          ) : (
            <>
              <Archive className="w-3.5 h-3.5 mr-1" />
              Show archived
            </>
          )}
        </Button>
      </div>

      {filteredBrands.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12 text-muted-foreground" />}
          title="No brands found"
          description="Try adjusting your search."
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onNavigate={() => navigate(`/app/brands/${brand.id}`)}
              onArchive={() => handleArchive(brand)}
              onUnarchive={() => handleUnarchive(brand)}
              onDelete={() => setDeleteDialogBrand(brand)}
            />
          ))}
        </div>
      )}

      <DeleteBrandDialog
        open={!!deleteDialogBrand}
        onOpenChange={(open) => !open && setDeleteDialogBrand(null)}
        brandName={deleteDialogBrand?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <QuickCreateBrandDialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen} />
    </div>
  )
}

interface BrandCardProps {
  brand: Brand
  onNavigate: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}

function BrandCard({ brand, onNavigate, onArchive, onUnarchive, onDelete }: BrandCardProps) {
  const colors = getBrandColors(brand)
  const status = brand.brand_profile_status
  const isArchived = brand.status === 'archived'

  return (
    <Card
      className="cursor-pointer shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl group relative"
      onClick={onNavigate}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            {brand.identity?.logo_url ? (
              <img
                src={brand.identity.logo_url}
                alt={brand.name}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <Building2 className="h-6 w-6" style={{ color: colors.primary }} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {isArchived && (
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
                Archived
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs font-medium border ${statusStyles[status]}`}>
              {statusLabels[status]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {isArchived ? (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUnarchive() }}>
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive() }}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Colour swatches */}
        <div className="flex items-center gap-1.5 mt-3">
          <div
            className="w-4 h-4 rounded-full border border-border shrink-0"
            style={{ backgroundColor: colors.primary }}
            title="Primary"
          />
          {colors.secondary && (
            <div
              className="w-4 h-4 rounded-full border border-border shrink-0"
              style={{ backgroundColor: colors.secondary }}
              title="Secondary"
            />
          )}
          {colors.accent && (
            <div
              className="w-4 h-4 rounded-full border border-border shrink-0"
              style={{ backgroundColor: colors.accent }}
              title="Accent"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg">{brand.name}</CardTitle>
        <CardDescription>
          {brand.onboarding_completed ? 'Profile complete' : 'Setup in progress'}
        </CardDescription>
        {status === 'partial' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Complete your brand profile for better results
          </p>
        )}
      </CardContent>
    </Card>
  )
}
