import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Plus, X, ThumbsUp, ThumbsDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { OnboardingFormData } from '../OnboardingWizard'

export function LanguageRulesStep() {
  const { control, watch, setValue } = useFormContext<OnboardingFormData>()
  const [preferredInput, setPreferredInput] = useState('')
  const [avoidedInput, setAvoidedInput] = useState('')
  
  const preferredWords = watch('preferredWords') || []
  const avoidedWords = watch('avoidedWords') || []

  const addPreferredWord = () => {
    if (preferredInput.trim() && !preferredWords.includes(preferredInput.trim())) {
      setValue('preferredWords', [...preferredWords, preferredInput.trim()])
      setPreferredInput('')
    }
  }

  const removePreferredWord = (word: string) => {
    setValue('preferredWords', preferredWords.filter((w) => w !== word))
  }

  const addAvoidedWord = () => {
    if (avoidedInput.trim() && !avoidedWords.includes(avoidedInput.trim())) {
      setValue('avoidedWords', [...avoidedWords, avoidedInput.trim()])
      setAvoidedInput('')
    }
  }

  const removeAvoidedWord = (word: string) => {
    setValue('avoidedWords', avoidedWords.filter((w) => w !== word))
  }

  const handlePreferredKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPreferredWord()
    }
  }

  const handleAvoidedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addAvoidedWord()
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Define words or phrases your brand prefers to use or avoid.
        This helps the AI maintain consistency in your brand's language.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ThumbsUp className="h-4 w-4 text-success" />
              Preferred Words
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={control}
              name="preferredWords"
              render={() => (
                <FormItem>
                  <div className="flex gap-2">
                    <Input
                      value={preferredInput}
                      onChange={(e) => setPreferredInput(e.target.value)}
                      onKeyDown={handlePreferredKeyDown}
                      placeholder="Add a word or phrase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addPreferredWord}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {preferredWords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preferredWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-sm"
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() => removePreferredWord(word)}
                      className="hover:text-success/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No preferred words added yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ThumbsDown className="h-4 w-4 text-destructive" />
              Avoided Words
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={control}
              name="avoidedWords"
              render={() => (
                <FormItem>
                  <div className="flex gap-2">
                    <Input
                      value={avoidedInput}
                      onChange={(e) => setAvoidedInput(e.target.value)}
                      onKeyDown={handleAvoidedKeyDown}
                      placeholder="Add a word or phrase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addAvoidedWord}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {avoidedWords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {avoidedWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm"
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() => removeAvoidedWord(word)}
                      className="hover:text-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No avoided words added yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Examples</p>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Preferred:</p>
              <ul className="list-disc list-inside">
                <li>"customers" instead of "users"</li>
                <li>"empower" instead of "help"</li>
                <li>Brand-specific terminology</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Avoided:</p>
              <ul className="list-disc list-inside">
                <li>Competitor brand names</li>
                <li>Industry jargon</li>
                <li>Words that don't fit your tone</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
