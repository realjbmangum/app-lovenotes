"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Heart, Copy, Check, RefreshCw, Sparkles, Star,
  ChevronDown, ChevronUp, Send, BookOpen, Settings,
  Flame, Smile, HandHeart, Lightbulb, Zap
} from "lucide-react"
import Link from "next/link"

// --- Types ---

interface Prompt {
  id: number
  theme: string
  nudge: string
  starter: string
  completed: number
}

interface Subscriber {
  id: string
  email: string
  wife_name: string
  nickname: string | null
  theme: string
  frequency: string
  onboarding_complete: number
  tier: string
}

interface Composition {
  id: number
  final_text: string
  tone_setting: string
  is_favorite: number
  created_at: string
  prompt_nudge: string | null
  theme: string | null
}

// --- Config ---

const PRODUCTION_API_URL = 'https://lovenotes-api-production.bmangum1.workers.dev/api'
const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? PRODUCTION_API_URL
    : 'http://localhost:8787/api')

const authFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, { ...options, credentials: 'include' })
}

const THEME_ICONS: Record<string, typeof Heart> = {
  romantic: Heart,
  funny: Smile,
  flirty: Zap,
  appreciative: HandHeart,
  encouraging: Lightbulb,
  spicy: Flame,
}

const THEME_COLORS: Record<string, string> = {
  romantic: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  funny: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  flirty: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  appreciative: 'bg-green-500/20 text-green-300 border-green-500/30',
  encouraging: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  spicy: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

// --- Dashboard ---

function DashboardContent() {
  const router = useRouter()

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [draftText, setDraftText] = useState('')
  const [polishedText, setPolishedText] = useState<string | null>(null)
  const [finalText, setFinalText] = useState('')
  const [tone, setTone] = useState<'sweet' | 'balanced' | 'spicy'>('sweet')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [promptLoading, setPromptLoading] = useState(false)
  const [polishLoading, setPolishLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freeLimitHit, setFreeLimitHit] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<Composition[]>([])
  const [streak, setStreak] = useState(0)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [logText, setLogText] = useState('')
  const [logSaved, setLogSaved] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load subscriber + today's prompt on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const subRes = await authFetch(`${API_URL}/subscriber`)
      if (subRes.status === 401) {
        setError('Please sign up or log in.')
        setLoading(false)
        return
      }
      if (!subRes.ok) throw new Error('Failed to load account')
      const subData = await subRes.json()
      setSubscriber(subData)

      // Redirect to onboarding if not complete
      if (!subData.onboarding_complete) {
        router.push('/onboarding')
        return
      }

      // Load today's prompt
      await loadPrompt()
    } catch {
      setError('Failed to load your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadPrompt = async () => {
    setPromptLoading(true)
    setFreeLimitHit(false)
    try {
      const res = await authFetch(`${API_URL}/prompt/today`)
      if (!res.ok) throw new Error('Failed to load prompt')
      const data = await res.json()

      if (data.error === 'free_limit') {
        setFreeLimitHit(true)
        return
      }

      setPrompt(data.prompt)
      // Pre-populate the starter text
      if (data.prompt?.starter) {
        setDraftText(data.prompt.starter)
        setFinalText(data.prompt.starter)
        setPolishedText(null)
      }
    } catch {
      setError('Failed to load today\'s prompt.')
    } finally {
      setPromptLoading(false)
    }
  }

  const loadAlternativePrompt = async () => {
    setPromptLoading(true)
    setPolishedText(null)
    try {
      const res = await authFetch(`${API_URL}/prompt/alternative`)
      if (!res.ok) throw new Error('Failed to load prompt')
      const data = await res.json()
      setPrompt(data.prompt)
      if (data.prompt?.starter) {
        setDraftText(data.prompt.starter)
        setFinalText(data.prompt.starter)
      }
    } catch {
      setError('Failed to load alternative prompt.')
    } finally {
      setPromptLoading(false)
    }
  }

  const handlePolish = async () => {
    if (!draftText.trim() || draftText.length < 10) return
    setPolishLoading(true)
    try {
      const res = await authFetch(`${API_URL}/polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftText, tone }),
      })

      if (res.status === 429) {
        setError('Polish limit reached for today (5 per day)')
        return
      }
      if (!res.ok) throw new Error('Polish failed')

      const data = await res.json()
      setPolishedText(data.polished)
      setFinalText(data.polished)
    } catch {
      setError('AI polish failed. Your draft is still great as-is.')
    } finally {
      setPolishLoading(false)
    }
  }

  const handleCopy = () => {
    const textToCopy = finalText || draftText
    if (!textToCopy.trim()) return
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Auto-save the composition
    handleSave()
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await authFetch(`${API_URL}/compose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_prompt_id: prompt?.id,
          raw_text: draftText,
          polished_text: polishedText,
          final_text: finalText || draftText,
          tone_setting: tone,
        }),
      })
    } catch {
      // Silent fail on save — the copy worked which is what matters
    } finally {
      setSaving(false)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await authFetch(`${API_URL}/history?limit=10`)
      if (!res.ok) return
      const data = await res.json()
      setHistory(data.compositions || [])
      setStreak(data.streak || 0)
    } catch {
      // Silent fail
    }
  }

  const toggleHistory = () => {
    if (!showHistory) loadHistory()
    setShowHistory(!showHistory)
  }

  const handleSaveLog = async () => {
    if (!logText.trim()) return
    try {
      const res = await authFetch(`${API_URL}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_text: logText }),
      })
      if (res.ok) {
        setLogSaved(true)
        setLogText('')
        setTimeout(() => { setLogSaved(false); setShowQuickLog(false) }, 1500)
      }
    } catch {
      // Silent fail
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <img src="/sendmylove.app.png" alt="SendMyLove" className="h-28 brightness-0 invert animate-pulse" />
      </div>
    )
  }

  if (error && !subscriber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <img src="/sendmylove.app.png" alt="SendMyLove" className="h-24 mx-auto mb-4 brightness-0 invert" />
            <CardTitle className="text-red-400">Oops!</CardTitle>
            <p className="text-slate-400">{error}</p>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/"><Button className="bg-rose-500 hover:bg-rose-600">Go to Home</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-6">
      {/* Header */}
      <header className="container mx-auto max-w-2xl mb-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <img src="/sendmylove.app.png" alt="SendMyLove" className="h-16 brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <Badge variant="outline" className="border-rose-500/30 text-rose-300">
                {streak} day streak
              </Badge>
            )}
            <Link href="/onboarding">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl space-y-4">

        {/* Free tier limit message */}
        {freeLimitHit && (
          <Card className="bg-slate-800 border-amber-500/30">
            <CardContent className="p-6 text-center">
              <p className="text-amber-300 mb-3">You've used your free prompt this week.</p>
              <p className="text-slate-400 text-sm mb-4">Upgrade for daily prompts, AI polish, and daily logs.</p>
              <Button className="bg-rose-500 hover:bg-rose-600">Upgrade to Pro — $5/mo</Button>
            </CardContent>
          </Card>
        )}

        {/* Today's Prompt */}
        {prompt && !freeLimitHit && (
          <>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-5 sm:p-6">
                {/* Theme badge */}
                <div className="flex items-center justify-between mb-4">
                  <Badge className={THEME_COLORS[prompt.theme] || THEME_COLORS.romantic}>
                    {prompt.theme}
                  </Badge>
                  {prompt.completed ? (
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      <Check className="h-3 w-3 mr-1" /> sent today
                    </Badge>
                  ) : null}
                </div>

                {/* Nudge question */}
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  {prompt.nudge}
                </p>

                {/* Fill-in-the-blank textarea */}
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={draftText}
                    onChange={(e) => {
                      setDraftText(e.target.value)
                      setFinalText(e.target.value)
                      setPolishedText(null) // Clear polish when editing
                    }}
                    placeholder="Fill in the blank..."
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 min-h-[100px] text-base leading-relaxed resize-none"
                    maxLength={2000}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-slate-500">
                    {draftText.length}/2000
                  </span>
                </div>

                {/* Tone selector */}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-slate-500">Tone:</span>
                  {(['sweet', 'balanced', 'spicy'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        tone === t
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button
                    onClick={handlePolish}
                    disabled={polishLoading || draftText.length < 10}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    {polishLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Help me say it better
                  </Button>
                  <Button
                    onClick={loadAlternativePrompt}
                    disabled={promptLoading}
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${promptLoading ? 'animate-spin' : ''}`} />
                    Different prompt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Polished version (if available) */}
            {polishedText && (
              <Card className="bg-slate-800 border-rose-500/20">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-rose-400" />
                    <span className="text-sm font-medium text-rose-300">Polished version</span>
                  </div>
                  <Textarea
                    value={finalText}
                    onChange={(e) => setFinalText(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white min-h-[80px] text-base leading-relaxed resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setFinalText(draftText); setPolishedText(null) }}
                      className="text-xs text-slate-500 hover:text-slate-300 underline"
                    >
                      Use my original instead
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Copy / Send button */}
            <Button
              onClick={handleCopy}
              disabled={!draftText.trim() || draftText === prompt.starter}
              className={`w-full py-6 text-lg ${
                copied
                  ? 'bg-green-600 hover:bg-green-600'
                  : 'bg-rose-500 hover:bg-rose-600'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Copied! Now send it to her
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  Copy & Send
                </>
              )}
            </Button>
          </>
        )}

        {/* Prompt loading state */}
        {promptLoading && !prompt && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
            </CardContent>
          </Card>
        )}

        {/* Quick Log */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <button
              onClick={() => setShowQuickLog(!showQuickLog)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">What happened today?</span>
              </div>
              {showQuickLog ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {showQuickLog && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500">
                  Quick note about your day — helps tomorrow's prompt feel personal.
                </p>
                <Textarea
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="She nailed her work presentation today..."
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 resize-none text-sm"
                  rows={2}
                  maxLength={280}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{logText.length}/280</span>
                  <Button
                    onClick={handleSaveLog}
                    disabled={!logText.trim() || logSaved}
                    size="sm"
                    className={logSaved ? 'bg-green-600' : 'bg-slate-600 hover:bg-slate-500'}
                  >
                    {logSaved ? (
                      <><Check className="h-3 w-3 mr-1" /> Saved</>
                    ) : (
                      <><Send className="h-3 w-3 mr-1" /> Save</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message History Toggle */}
        <button
          onClick={toggleHistory}
          className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
        >
          {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showHistory ? 'Hide' : 'Show'} message history
        </button>

        {showHistory && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">No messages yet. Send your first one above!</p>
            ) : (
              history.map((comp) => (
                <Card key={comp.id} className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white leading-relaxed line-clamp-2">
                          {comp.final_text}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {comp.theme && (
                            <Badge variant="outline" className={`text-xs ${THEME_COLORS[comp.theme] || ''}`}>
                              {comp.theme}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {new Date(comp.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {comp.is_favorite ? (
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Error toast */}
        {error && subscriber && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-red-900/90 border border-red-700 text-red-200 rounded-lg p-3 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-200">dismiss</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <img src="/sendmylove.app.png" alt="SendMyLove" className="h-28 brightness-0 invert animate-pulse" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
