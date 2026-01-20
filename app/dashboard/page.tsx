"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Copy, Check, RefreshCw, Zap, Flame, MessageSquare, HandHeart, HeartHandshake, Shield, Trophy, Smile } from "lucide-react"
import Link from "next/link"

interface Message {
  id: number
  voice: string
  content: string
  wifeName: string
}

interface Subscriber {
  id: string
  email: string
  wife_name: string
  frequency: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787/api'

// Fetch wrapper that includes credentials for cookie-based auth
const authFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for auth
  })
}

const voices = [
  { id: 'quick', label: 'Quick', icon: Zap, color: 'bg-blue-500 hover:bg-blue-600' },
  { id: 'flirty', label: 'Flirty', icon: Flame, color: 'bg-pink-500 hover:bg-pink-600' },
  { id: 'deep', label: 'Deep', icon: MessageSquare, color: 'bg-purple-500 hover:bg-purple-600' },
  { id: 'grateful', label: 'Grateful', icon: HandHeart, color: 'bg-green-500 hover:bg-green-600' },
  { id: 'sorry', label: 'Sorry', icon: HeartHandshake, color: 'bg-amber-500 hover:bg-amber-600' },
  { id: 'supportive', label: 'Support', icon: Shield, color: 'bg-teal-500 hover:bg-teal-600' },
  { id: 'proud', label: 'Proud', icon: Trophy, color: 'bg-orange-500 hover:bg-orange-600' },
  { id: 'playful', label: 'Playful', icon: Smile, color: 'bg-rose-500 hover:bg-rose-600' },
]

// Demo messages for screenshot/preview mode
const demoMessages: Record<string, string> = {
  quick: "Hey beautiful, just thinking about you. Hope your day is as amazing as you are. ❤️",
  flirty: "Is it hot in here, or is it just you? Can't stop thinking about that smile of yours. 😏",
  deep: "Sarah, every day with you feels like a gift I never knew I needed. You've made me a better man.",
  grateful: "Thank you for being my rock, my best friend, and the love of my life. I don't say it enough.",
  sorry: "I know I messed up. You deserve better, and I'm committed to being that person for you.",
  supportive: "Whatever you're facing today, remember - I believe in you completely. You've got this.",
  proud: "Watching you crush it every day inspires me. I'm so proud to be your husband.",
  playful: "Hey wifey! If loving you is wrong, I don't want to be right. 😄 Have an awesome day!"
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<string | null>(isDemo ? 'flirty' : null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(!isDemo)
  const [messageLoading, setMessageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Demo mode - skip auth and show sample data
    if (isDemo) {
      setSubscriber({ id: 'demo', email: 'demo@example.com', wife_name: 'Sarah', frequency: 'daily' })
      setMessage({ id: 1, voice: 'flirty', content: demoMessages['flirty'], wifeName: 'Sarah' })
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

  const loadMessage = async (voice: string) => {
    if (!subscriber) return

    setMessageLoading(true)
    setSelectedVoice(voice)
    setCopied(false)

    // Demo mode - use local demo messages
    if (isDemo) {
      await new Promise(r => setTimeout(r, 300)) // Simulate loading
      setMessage({ id: 1, voice, content: demoMessages[voice] || demoMessages['quick'], wifeName: subscriber.wife_name })
      setMessageLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/messages/random?theme=${voice}&name=${encodeURIComponent(subscriber.wife_name)}`)
      if (!res.ok) throw new Error('Failed to load message')
      const data = await res.json()
      setMessage({ ...data, voice, wifeName: subscriber.wife_name })
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
    if (selectedVoice) {
      loadMessage(selectedVoice)
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
            Pick a vibe, get a message for <span className="text-rose-400 font-medium">{subscriber.wife_name}</span>
          </p>
        </div>

        {/* Voice Selector Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {voices.map((voice) => {
            const Icon = voice.icon
            const isSelected = selectedVoice === voice.id
            return (
              <button
                key={voice.id}
                onClick={() => loadMessage(voice.id)}
                disabled={messageLoading}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-xl transition-all
                  ${isSelected
                    ? `${voice.color} text-white ring-2 ring-white ring-offset-2 ring-offset-slate-900`
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                  ${messageLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{voice.label}</span>
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
                <p className="text-slate-400">Tap a vibe above to get a message</p>
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
