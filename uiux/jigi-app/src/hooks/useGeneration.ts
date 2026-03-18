import { useState, useCallback } from 'react'
import { aiOrchestrator, type GenerationResult, type BrandConstraints, type CampaignBrief, type FallbackContext } from '@/lib/ai'
import { useCampaignStore } from '@/store/campaignStore'
import { useAuthStore } from '@/store/authStore'

interface UseGenerationOptions {
  onSuccess?: (result: GenerationResult) => void
  onError?: (error: Error) => void
}

export function useGeneration(options: UseGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)

  const { createAsset, currentCampaign } = useCampaignStore()
  const { user } = useAuthStore()

  const generateConcepts = useCallback(
    async (
      brand: BrandConstraints | undefined,
      brief: CampaignBrief,
      fallback?: FallbackContext
    ) => {
      setIsGenerating(true)
      setError(null)

      try {
        const result = await aiOrchestrator.generateConcepts(
          brand,
          brief,
          fallback,
          user?.id,
          currentCampaign?.brand_id || undefined,
          currentCampaign?.id
        )

        setResult(result)
        options.onSuccess?.(result)

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Generation failed')
        setError(error)
        options.onError?.(error)
        throw error
      } finally {
        setIsGenerating(false)
      }
    },
    [user?.id, currentCampaign, options]
  )

  const generateCopy = useCallback(
    async (
      brand: BrandConstraints | undefined,
      brief: CampaignBrief,
      format?: string,
      fallback?: FallbackContext
    ) => {
      setIsGenerating(true)
      setError(null)

      try {
        const result = await aiOrchestrator.generateCopy(
          brand,
          brief,
          format,
          fallback,
          user?.id,
          currentCampaign?.brand_id || undefined,
          currentCampaign?.id
        )

        setResult(result)
        options.onSuccess?.(result)

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Generation failed')
        setError(error)
        options.onError?.(error)
        throw error
      } finally {
        setIsGenerating(false)
      }
    },
    [user?.id, currentCampaign, options]
  )

  const generateImage = useCallback(
    async (
      brand: BrandConstraints | undefined,
      description: string,
      fallback?: FallbackContext
    ) => {
      setIsGenerating(true)
      setError(null)

      try {
        const result = await aiOrchestrator.generateImage(
          brand,
          description,
          fallback,
          user?.id,
          currentCampaign?.brand_id || undefined,
          currentCampaign?.id
        )

        setResult(result)
        options.onSuccess?.(result)

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Generation failed')
        setError(error)
        options.onError?.(error)
        throw error
      } finally {
        setIsGenerating(false)
      }
    },
    [user?.id, currentCampaign, options]
  )

  const saveAsset = useCallback(
    async (type: 'concept' | 'copy' | 'image', content: unknown, generationMode: 'brand_grounded' | 'idea_first') => {
      if (!currentCampaign?.id || !user?.id) {
        throw new Error('No campaign or user context')
      }

      const result = await createAsset({
        campaign_id: currentCampaign.id,
        created_by: user.id,
        type,
        generation_mode: generationMode,
        content: content as any,
      })

      return result
    },
    [currentCampaign?.id, user?.id, createAsset]
  )

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])

  return {
    isGenerating,
    error,
    result,
    generateConcepts,
    generateCopy,
    generateImage,
    saveAsset,
    reset,
  }
}
