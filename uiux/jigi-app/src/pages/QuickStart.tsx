import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'

export function QuickStart() {
  const navigate = useNavigate()
  const [idea, setIdea] = useState('')

  const handleGenerate = () => {
    if (!idea.trim()) return
    navigate('/app/campaigns/new', { state: { idea, journeyMode: 'idea_first' } })
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quick Start</CardTitle>
          <CardDescription className="text-base">
            Start with an idea. Generate creative assets instantly. Add brand elements later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="idea" className="text-sm font-medium">
              What's your creative idea?
            </label>
            <Textarea
              id="idea"
              placeholder="e.g., Summer sale campaign for eco-friendly products with vibrant tropical colors..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
            <div className="flex gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Idea-First Journey</p>
                <p className="mt-1 text-amber-700 dark:text-amber-300">
                  You can add brand colors, logos, and guidelines after generation to maintain consistency across future campaigns.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 hover:bg-muted transition-colors"
              onClick={() => navigate('/app/onboarding')}
            >
              Set up brand first
            </Button>
            <Button
              className="flex-1 transition-colors"
              onClick={handleGenerate}
              disabled={!idea.trim()}
            >
              Generate creative
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
