import { describe, it, expect } from 'vitest'
import {
  allowedTypesForFile,
  inferUploadType,
  isAmbiguousFile,
  parseCreativeMode,
  stageToUploadType,
} from './upload-intake'

const f = (type: string) => ({ type })

describe('upload-intake', () => {
  it('parses creative mode with generate default', () => {
    expect(parseCreativeMode('upload')).toBe('upload')
    expect(parseCreativeMode(null)).toBe('generate')
    expect(parseCreativeMode('junk')).toBe('generate')
  })

  it('maps stage to default upload type', () => {
    expect(stageToUploadType('concepts')).toBe('concept')
    expect(stageToUploadType('copy')).toBe('copy')
    expect(stageToUploadType('images')).toBe('image')
    expect(stageToUploadType('assets')).toBe('image')
  })

  it('derives allowed types from MIME', () => {
    expect(allowedTypesForFile(f('image/png'))).toEqual(['image'])
    expect(allowedTypesForFile(f('application/pdf'))).toEqual(['concept'])
    expect(allowedTypesForFile(f('text/plain'))).toEqual(['copy', 'concept'])
    expect(allowedTypesForFile(f('video/mp4'))).toEqual([])
  })

  it('prefers the requested type when valid', () => {
    expect(inferUploadType(f('text/plain'), 'concept')).toBe('concept')
    expect(inferUploadType(f('text/plain'), 'image')).toBe('copy')
    expect(inferUploadType(f('image/jpeg'), 'copy')).toBe('image')
    expect(inferUploadType(f('video/mp4'), 'image')).toBeNull()
  })

  it('flags ambiguous files', () => {
    expect(isAmbiguousFile(f('text/plain'))).toBe(true)
    expect(isAmbiguousFile(f('image/png'))).toBe(false)
  })
})
