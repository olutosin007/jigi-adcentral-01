import { useState, useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

import type { OnboardingFormData } from '../OnboardingWizard'

export function LogoUploadStep() {
  const { control, setValue, watch } = useFormContext<OnboardingFormData>()
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const logoUrl = watch('logoUrl')

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Logo upload error:', uploadError)
        toast.error('Logo storage is not configured. Please try again or contact support.')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath)

      setValue('logoUrl', publicUrl)
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Logo storage is not configured. Please try again or contact support.')
    } finally {
      setIsUploading(false)
    }
  }, [setValue])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleRemoveLogo = useCallback(() => {
    setValue('logoUrl', '')
  }, [setValue])

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="brandName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter your brand name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <FormLabel>Brand Logo</FormLabel>
        
        {logoUrl ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video flex items-center justify-center bg-muted">
                <img
                  src={logoUrl}
                  alt="Brand logo"
                  className="max-h-48 max-w-full object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="logo-upload"
              disabled={isUploading}
            />
            <label htmlFor="logo-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                {isUploading ? (
                  <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {isUploading ? 'Uploading...' : 'Drop your logo here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse (PNG, JPG, SVG up to 5MB)
                  </p>
                </div>
                {!isUploading && (
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </span>
                  </Button>
                )}
              </div>
            </label>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Your logo will be used to auto-extract brand colors in the next step.
        </p>
      </div>
    </div>
  )
}
