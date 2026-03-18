import type { GenerationOptions } from '../types'

interface AIModelBase {
  name: string
  generate(prompt: string, options?: Record<string, unknown>): Promise<string>
}

export class AzureGPT4oMini implements AIModelBase {
  name = 'gpt-4o-mini'
  
  private endpoint: string
  private apiKey: string
  private deployment: string

  constructor() {
    this.endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || ''
    this.apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || ''
    this.deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_GPT || 'gpt-4o-mini'
  }

  async generate(prompt: string, options?: GenerationOptions): Promise<string> {
    if (!this.endpoint || !this.apiKey) {
      console.warn('Azure OpenAI not configured, using mock response')
      return this.getMockResponse(prompt)
    }

    try {
      const response = await fetch(
        `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=2024-02-15-preview`,
        {
          method: 'POST',
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 2000,
            response_format: { type: 'json_object' },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Azure OpenAI error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('Azure OpenAI generation failed:', error)
      throw error
    }
  }

  private getMockResponse(prompt: string): string {
    if (prompt.includes('campaign concept')) {
      return JSON.stringify({
        concepts: [
          {
            theme: 'Summer Freedom',
            headlines: ['Break Free This Summer', 'Your Summer, Unleashed', 'Own Every Moment'],
            visual_direction: 'Bright, airy outdoor photography with natural light and open spaces. Focus on authentic moments of joy and freedom.',
            rationale: 'Appeals to the desire for liberation and memorable experiences during the summer season.',
          },
          {
            theme: 'Athletic Energy',
            headlines: ['Push Your Limits', 'Every Step Counts', 'Move Without Boundaries'],
            visual_direction: 'Dynamic action shots with high contrast and motion blur. Urban and outdoor athletic settings.',
            rationale: 'Connects with active lifestyle seekers who value performance and achievement.',
          },
          {
            theme: 'Urban Explorer',
            headlines: ['Own the City', 'Streets Are Yours', 'Discover Your Path'],
            visual_direction: 'Urban street photography with moody tones and architectural framing. Night and golden hour shots.',
            rationale: 'Resonates with city dwellers who see urban environments as their playground.',
          },
          {
            theme: 'Authentic You',
            headlines: ['Be Unapologetically You', 'Your Story Matters', 'Real is Beautiful'],
            visual_direction: 'Candid portrait photography with natural expressions. Diverse representation and genuine moments.',
            rationale: 'Celebrates individuality and self-expression in an era of authenticity.',
          },
        ],
      })
    }

    if (prompt.includes('copywriter')) {
      return JSON.stringify({
        variants: [
          {
            headline: 'Discover Your Summer Story',
            body: 'This season, write your own adventure. Whether you\'re hitting the trails at dawn or exploring city streets at dusk, every step is a chapter in your story.',
            cta: 'Shop the Collection',
          },
          {
            headline: 'Summer Starts With You',
            body: 'Don\'t wait for the perfect moment — create it. Our Summer 2026 collection is built for those who move first and think later.',
            cta: 'Explore Now',
          },
          {
            headline: 'Ready for Anything',
            body: 'From morning runs to evening adventures, gear up for whatever summer brings your way. Designed for comfort, built for performance.',
            cta: 'Get Started',
          },
          {
            headline: 'Make This Summer Count',
            body: 'Every sunrise is an opportunity. Every sunset is a celebration. Make every moment in between unforgettable.',
            cta: 'See What\'s New',
          },
          {
            headline: 'Your Best Summer Yet',
            body: 'We\'ve raised the bar so you can too. Premium materials, innovative design, and the confidence to go further.',
            cta: 'Shop Now',
          },
        ],
      })
    }

    if (prompt.includes('compliance')) {
      return JSON.stringify({
        passed: true,
        checks: [
          { name: 'Tone alignment', status: 'pass', message: 'Content matches brand tone guidelines.' },
          { name: 'Language check', status: 'pass', message: 'No forbidden words detected.' },
          { name: 'Brand consistency', status: 'pass', message: 'Content is appropriate for the brand.' },
        ],
      })
    }

    return JSON.stringify({ error: 'Unknown prompt type' })
  }
}

export interface ImageGenerationOptions {
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

export class AzureDALLE3 implements AIModelBase {
  name = 'dall-e-3'
  
  private endpoint: string
  private apiKey: string
  private deployment: string

  constructor() {
    this.endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || ''
    this.apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || ''
    this.deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_DALLE || 'dall-e-3'
  }

  async generate(prompt: string, options?: ImageGenerationOptions): Promise<string> {
    const size = options?.size ?? '1024x1024'
    const quality = options?.quality ?? 'standard'
    const style = options?.style ?? 'vivid'

    if (!this.endpoint || !this.apiKey) {
      console.warn('Azure DALL-E not configured, using placeholder')
      await this.simulateDelay()
      return JSON.stringify({
        url: this.getMockImageUrl(prompt, size),
        prompt_used: prompt,
        model: this.name,
        size,
        quality,
      })
    }

    try {
      const response = await fetch(
        `${this.endpoint}/openai/deployments/${this.deployment}/images/generations?api-version=2024-02-15-preview`,
        {
          method: 'POST',
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            size,
            quality,
            style,
            n: 1,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `Azure DALL-E error: ${response.status}`)
      }

      const data = await response.json()
      return JSON.stringify({
        url: data.data[0].url,
        revised_prompt: data.data[0].revised_prompt,
        prompt_used: prompt,
        model: this.name,
        size,
        quality,
      })
    } catch (error) {
      console.error('Azure DALL-E generation failed:', error)
      throw error
    }
  }

  private async simulateDelay(): Promise<void> {
    const delay = 2000 + Math.random() * 1000
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  private getMockImageUrl(prompt: string, size: string): string {
    const [width, height] = size.split('x')
    const colors = ['0D9488', '6366F1', 'EC4899', 'F59E0B', '10B981', '8B5CF6']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const text = encodeURIComponent(prompt.slice(0, 25).replace(/[^a-zA-Z0-9 ]/g, ''))
    return `https://via.placeholder.com/${width}x${height}/${color}/FFFFFF?text=${text}`
  }
}
