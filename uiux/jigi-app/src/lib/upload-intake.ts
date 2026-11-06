import { getAllowedMimeTypes } from './upload'

export type UploadAssetType = 'image' | 'copy' | 'concept'
export type CreativeMode = 'generate' | 'upload'

/** Copy files are read as text in the browser, so only plain text qualifies. */
const COPY_FILE_TYPES = ['text/plain']

export function parseCreativeMode(value: string | null): CreativeMode {
  return value === 'upload' ? 'upload' : 'generate'
}

export function stageToUploadType(stage: string): UploadAssetType {
  if (stage === 'concepts') return 'concept'
  if (stage === 'copy') return 'copy'
  return 'image'
}

/** Asset types a file could legitimately become, given current MIME allowlists. */
export function allowedTypesForFile(file: Pick<File, 'type'>): UploadAssetType[] {
  const types: UploadAssetType[] = []
  if (getAllowedMimeTypes('image').includes(file.type)) types.push('image')
  if (COPY_FILE_TYPES.includes(file.type)) types.push('copy')
  if (getAllowedMimeTypes('concept').includes(file.type)) types.push('concept')
  return types
}

/** Pick the user's preferred type when the file supports it, else the first valid type. */
export function inferUploadType(
  file: Pick<File, 'type'>,
  preferred: UploadAssetType
): UploadAssetType | null {
  const allowed = allowedTypesForFile(file)
  if (allowed.length === 0) return null
  return allowed.includes(preferred) ? preferred : allowed[0]
}

export function isAmbiguousFile(file: Pick<File, 'type'>): boolean {
  return allowedTypesForFile(file).length > 1
}

export function intakeAcceptList(): string[] {
  return Array.from(
    new Set([
      ...getAllowedMimeTypes('image'),
      ...getAllowedMimeTypes('concept'),
      ...COPY_FILE_TYPES,
    ])
  )
}
