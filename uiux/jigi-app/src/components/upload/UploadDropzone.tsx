import React, { useCallback, useRef, useState } from 'react'
import { Image as ImageIcon, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadDropzoneProps {
  accept?: string[]
  onFileSelected: (file: File) => void
}

export function UploadDropzone({ accept, onFileSelected }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const [file] = Array.from(files)
      onFileSelected(file)
    },
    [onFileSelected]
  )

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const acceptAttr = accept && accept.length > 0 ? accept.join(',') : 'image/*'

  return (
    <div className="space-y-3">
      <div
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border bg-muted'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragLeave}
        role="button"
        tabIndex={0}
        onClick={handleClick}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm mb-4">
          <ImageIcon className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">Drag and drop a file here</p>
        <p className="text-xs text-gray-500 mt-1">or click to browse from your computer</p>
        {accept && accept.length > 0 && (
          <p className="text-[11px] text-muted-foreground/80 mt-2">
            Accepted types: {accept.join(', ')}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          Choose file
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  )
}

