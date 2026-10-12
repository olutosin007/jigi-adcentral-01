import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { validatePresetInput, type BrandImagePreset, type PresetInput } from '@/lib/brand-presets'

const PRESET_COLUMNS = 'id, brand_id, name, style_prompt, image_tier, aspect_ratio, created_by, created_at, updated_at'

export const brandPresetsKey = (brandId: string | undefined) => ['brand-image-presets', brandId] as const

export function useBrandPresets(brandId: string | undefined) {
  return useQuery({
    queryKey: brandPresetsKey(brandId),
    enabled: !!brandId,
    retry: false,
    queryFn: async (): Promise<BrandImagePreset[]> => {
      const { data, error } = await supabase
        .from('brand_image_presets')
        .select(PRESET_COLUMNS)
        .eq('brand_id', brandId!)
        .order('created_at', { ascending: true })
      // Environments without migration 036 simply have no presets.
      if (error) return []
      return (data ?? []) as BrandImagePreset[]
    },
  })
}

export function useCreateBrandPreset(brandId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ input, userId }: { input: PresetInput; userId: string }): Promise<BrandImagePreset> => {
      if (!brandId) throw new Error('Presets need a brand')
      const validation = validatePresetInput(input)
      if (!validation.ok) throw new Error(Object.values(validation.errors)[0])
      const { data, error } = await supabase
        .from('brand_image_presets')
        .insert({ ...validation.value, brand_id: brandId, created_by: userId })
        .select(PRESET_COLUMNS)
        .single()
      if (error) {
        if (error.code === '23505') throw new Error('A look with that name already exists for this brand')
        throw new Error(error.message)
      }
      return data as BrandImagePreset
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandPresetsKey(brandId) }),
  })
}

export function useDeleteBrandPreset(brandId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (presetId: string) => {
      const { error } = await supabase.from('brand_image_presets').delete().eq('id', presetId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandPresetsKey(brandId) }),
  })
}
