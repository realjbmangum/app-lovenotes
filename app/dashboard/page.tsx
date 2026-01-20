"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Copy, Check, RefreshCw, Sparkles, Smile, HandHeart, Lightbulb } from "lucide-react"
import Link from "next/link"

interface Message {
  id: number
  theme: string
  content: string
  wifeName: string
}

interface Subscriber {
  id: string
  email: string
  wife_name: string
  frequency: string
}

// Production worker URL - update this after deploying worker
const PRODUCTION_API_URL = 'https://lovenotes-api.realjbmangum.workers.dev/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? PRODUCTION_API_URL
    : 'http://localhost:8787/api')

// Fetch wrapper that includes credentials for cookie-based auth
const authFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for auth
  })
}

// Themes match database: romantic (850), funny (400), appreciative (410), encouraging (400)
const themes = [
  { id: 'romantic', label: 'Romantic', icon: Heart, color: 'bg-rose-500 hover:bg-rose-600' },
  { id: 'funny', label: 'Funny', icon: Smile, color: 'bg-amber-500 hover:bg-amber-600' },
  { id: 'appreciative', label: 'Grateful', icon: HandHeart, color: 'bg-green-500 hover:bg-green-600' },
  { id: 'encouraging', label: 'Uplifting', icon: Lightbulb, color: 'bg-purple-500 hover:bg-purple-600' },
]

// Demo messages for screenshot/preview mode (match database themes)
const demoMessages: Record<string, string> = {
  romantic: "Good morning beautiful ❤️ Just wanted you to know that waking up thinking of you makes every day perfect. Have an amazing day, my love!",
  funny: "Hey gorgeous! 😄 I just realized I'm married to someone way out of my league... and I'm totally okay with that! Hope your day is as awesome as you are!",
  appreciative: "Thank you for being the incredible woman you are 💕 Your strength, kindness, and love make our home a paradise. I'm so grateful for you!",
  encouraging: "You've got this, superwoman! 💪 Whatever today brings, remember that I believe in you completely. You're stronger than you know! ✨",
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(isDemo ? 'romantic' : null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(!isDemo)
  const [messageLoading, setMessageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Demo mode - skip auth and show sample data
    if (isDemo) {
      setSubscriber({ id: 'demo', email: 'demo@example.com', wife_name: 'Sarah', frequency: 'daily' })
      setMessage({ id: 1, theme: 'romantic', content: demoMessages['romantic'], wifeName: 'Sarah' })
      setLoading(false)
      return
    }
    // Auth is now cookie-based - just call the API and it will validate
    loadSubscriber()
  }, [isDemo])

  const loadSubscriber = async () => {
    try {
      const res = await authFetch(`${API_URL}/subscriber`)
      if (res.status === 401) {
        setError('Please sign up or log in to access your dashboard.')
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('Failed to load subscriber')
      const data = await res.json()
      setSubscriber(data)
    } catch (err) {
      setError('Failed to load your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadMessage = async (theme: string) => {
    if (!subscriber) return

    setMessageLoading(true)
    setSelectedTheme(theme)
    setCopied(false)

    // Demo mode - use local demo messages
    if (isDemo) {
      await new Promise(r => setTimeout(r, 300)) // Simulate loading
      setMessage({ id: 1, theme, content: demoMessages[theme] || demoMessages['romantic'], wifeName: subscriber.wife_name })
      setMessageLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/messages/random?theme=${theme}&name=${encodeURIComponent(subscriber.wife_name)}`)
      if (!res.ok) throw new Error('Failed to load message')
      const data = await res.json()
      setMessage({ ...data, theme, wifeName: subscriber.wife_name })
    } catch (err) {
      setError('Failed to load message. Please try again.')
    } finally {
      setMessageLoading(false)
    }
  }

  const handleCopy = () => {
    if (message) {
      navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = () => {
    if (selectedTheme) {
      loadMessage(selectedTheme)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="h-12 w-12 text-rose-400" />
        </div>
      </div>
    )
  }

  if (error || !subscriber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-red-400">Oops!</CardTitle>
            <p className="text-slate-400">{error || 'Something went wrong'}</p>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button className="bg-rose-500 hover:bg-rose-600">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-4">
      {/* Navigation Header */}
      <header className="container mx-auto max-w-2xl mb-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-md px-2 py-1">
            <Heart className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-medium">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" />
            <span className="text-xl font-bold text-white">LoveNotes</span>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="container mx-auto max-w-2xl">
        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-slate-400">
            Pick a style, get a message for <span className="text-rose-400 font-medium">{subscriber.wife_name}</span>
          </p>
        </div>

        {/* Theme Selector Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {themes.map((theme) => {
            const Icon = theme.icon
            const isSelected = selectedTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => loadMessage(theme.id)}
                disabled={messageLoading}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-xl transition-all
                  ${isSelected
                    ? `${theme.color} text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900`
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                  ${messageLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{theme.label}</span>
              </button>
            )
          })}
        </div>

        {/* Message Display */}
        <Card className="bg-slate-800 border-slate-700 mb-4">
          <CardContent className="p-6">
            {messageLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
              </div>
            ) : message ? (
              <div className="space-y-4">
                <p className="text-lg text-white leading-relaxed">
                  {message.content}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleCopy}
                    className={`flex-1 ${copied ? 'bg-green-600 hover:bg-green-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Message
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">Tap a style above to get a message</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500">
          Copy the message and send it to {subscriber.wife_name} from your phone
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="h-12 w-12 text-rose-400" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
