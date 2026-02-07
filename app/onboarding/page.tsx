"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, ArrowRight, ArrowLeft, Sparkles, SkipForward } from "lucide-react"

const PRODUCTION_API_URL = 'https://lovenotes-api-production.bmangum1.workers.dev/api'
const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? PRODUCTION_API_URL
    : 'http://localhost:8787/api')

const authFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, { ...options, credentials: 'include' })
}

const LOVE_LANGUAGES = [
  { value: 'words', label: 'Words of Affirmation' },
  { value: 'acts', label: 'Acts of Service' },
  { value: 'gifts', label: 'Receiving Gifts' },
  { value: 'time', label: 'Quality Time' },
  { value: 'touch', label: 'Physical Touch' },
]

const YEARS_OPTIONS = [
  { value: '<1', label: 'Less than 1 year' },
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-10', label: '5-10 years' },
  { value: '10-20', label: '10-20 years' },
  { value: '20+', label: '20+ years' },
]

const THEME_OPTIONS = [
  { value: 'romantic', label: 'Romantic', desc: 'Sweet and heartfelt' },
  { value: 'funny', label: 'Funny', desc: 'Inside jokes and laughs' },
  { value: 'flirty', label: 'Flirty', desc: 'Playful and bold' },
  { value: 'appreciative', label: 'Grateful', desc: 'Thank her for what she does' },
  { value: 'encouraging', label: 'Uplifting', desc: 'Build her up' },
  { value: 'spicy', label: 'Spicy', desc: 'Turn up the heat' },
  { value: 'random', label: 'Mix it up', desc: 'Different style each day' },
]

function OnboardingContent() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [wifeName, setWifeName] = useState('')
  const [nickname, setNickname] = useState('')
  const [yearsTogether, setYearsTogether] = useState('')
  const [howMet, setHowMet] = useState('')
  const [whatMakesHerSmile, setWhatMakesHerSmile] = useState('')
  const [insideJokes, setInsideJokes] = useState('')
  const [loveLanguage, setLoveLanguage] = useState('')
  const [anniversaryDate, setAnniversaryDate] = useState('')
  const [wifeBirthday, setWifeBirthday] = useState('')
  const [kidsNames, setKidsNames] = useState('')
  const [themePreference, setThemePreference] = useState('random')

  const totalSteps = 4

  const handleSave = async () => {
    if (!wifeName.trim()) {
      setError("What's her name?")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await authFetch(`${API_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wife_name: wifeName.trim(),
          nickname: nickname.trim() || undefined,
          how_met: howMet.trim() || undefined,
          years_together: yearsTogether || undefined,
          love_language: loveLanguage || undefined,
          inside_jokes: insideJokes.trim() || undefined,
          what_makes_her_smile: whatMakesHerSmile.trim() || undefined,
          kids_names: kidsNames.trim() || undefined,
          anniversary_date: anniversaryDate || undefined,
          wife_birthday: wifeBirthday || undefined,
          theme_preference: themePreference,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save profile')
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    if (wifeName.trim()) {
      handleSave()
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < step ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 sm:p-8">
            {/* Step 1: The basics */}
            {step === 1 && (
              <div key="step-1" className="space-y-6 animate-fade-in-up">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-white mb-2">Let's get to know your relationship</h2>
                  <p className="text-slate-400">This helps us write prompts that actually feel like you.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="wifeName" className="text-slate-300">Her name *</Label>
                    <Input
                      id="wifeName"
                      value={wifeName}
                      onChange={(e) => setWifeName(e.target.value)}
                      placeholder="Sarah"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 mt-1"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label htmlFor="nickname" className="text-slate-300">Pet name / nickname</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="babe, honey, etc."
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">How long together?</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {YEARS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setYearsTogether(opt.value)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            yearsTogether === opt.value
                              ? 'bg-rose-500 text-white animate-pop'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: What makes her special */}
            {step === 2 && (
              <div key="step-2" className="space-y-6 animate-fade-in-up">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-white mb-2">What makes her special?</h2>
                  <p className="text-slate-400">A sentence or two is plenty. This feeds your daily prompts.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="howMet" className="text-slate-300">How did you two meet?</Label>
                    <Textarea
                      id="howMet"
                      value={howMet}
                      onChange={(e) => setHowMet(e.target.value)}
                      placeholder="We met at a friend's barbecue..."
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 mt-1 resize-none"
                      rows={2}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smile" className="text-slate-300">What does she do that makes you smile?</Label>
                    <Textarea
                      id="smile"
                      value={whatMakesHerSmile}
                      onChange={(e) => setWhatMakesHerSmile(e.target.value)}
                      placeholder="The way she laughs at her own jokes..."
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 mt-1 resize-none"
                      rows={2}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <Label htmlFor="jokes" className="text-slate-300">Any inside jokes or things only you two get?</Label>
                    <Textarea
                      id="jokes"
                      value={insideJokes}
                      onChange={(e) => setInsideJokes(e.target.value)}
                      placeholder="We always say 'that's our song' about everything..."
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 mt-1 resize-none"
                      rows={2}
                      maxLength={500}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Her favorites (optional) */}
            {step === 3 && (
              <div key="step-3" className="space-y-6 animate-fade-in-up">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-white mb-2">Her favorites</h2>
                  <p className="text-slate-400">All optional — skip anything you're not sure about.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Her love language</Label>
                    <div className="grid grid-cols-1 gap-2 mt-1">
                      {LOVE_LANGUAGES.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => setLoveLanguage(lang.value)}
                          className={`px-4 py-3 rounded-lg text-sm text-left transition-all ${
                            loveLanguage === lang.value
                              ? 'bg-rose-500 text-white animate-pop'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="anniversary" className="text-slate-300">Anniversary</Label>
                      <Input
                        id="anniversary"
                        type="date"
                        value={anniversaryDate}
                        onChange={(e) => setAnniversaryDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthday" className="text-slate-300">Her birthday</Label>
                      <Input
                        id="birthday"
                        type="date"
                        value={wifeBirthday}
                        onChange={(e) => {
                          // Store as MM-DD
                          const val = e.target.value
                          if (val) {
                            setWifeBirthday(val.substring(5))
                          }
                        }}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="kids" className="text-slate-300">Kids' names (if any)</Label>
                    <Input
                      id="kids"
                      value={kidsNames}
                      onChange={(e) => setKidsNames(e.target.value)}
                      placeholder="Emma, Jake"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Pick your vibe */}
            {step === 4 && (
              <div key="step-4" className="space-y-6 animate-fade-in-up">
                <div className="text-center mb-2">
                  <Sparkles className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                  <h2 className="text-2xl font-bold text-white mb-2">Pick your vibe</h2>
                  <p className="text-slate-400">What kind of prompts should we send you?</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setThemePreference(theme.value)}
                      className={`px-4 py-3 rounded-lg text-left transition-all ${
                        themePreference === theme.value
                          ? 'bg-rose-500 text-white animate-pop'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <span className="font-medium">{theme.label}</span>
                      <span className={`text-sm ml-2 ${
                        themePreference === theme.value ? 'text-rose-100' : 'text-slate-500'
                      }`}>
                        {theme.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm mt-4">{error}</p>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div>
                {step > 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                    className="text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip for now
                  </Button>
                )}
              </div>

              <div>
                {step < totalSteps ? (
                  <Button
                    onClick={() => {
                      if (step === 1 && !wifeName.trim()) {
                        setError("What's her name?")
                        return
                      }
                      setError(null)
                      setStep(step + 1)
                    }}
                    className="bg-rose-500 hover:bg-rose-600"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-rose-500 hover:bg-rose-600 animate-pulse"
                  >
                    {saving ? 'Saving...' : "Let's go"}
                    {!saving && <Heart className="h-4 w-4 ml-1" />}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-xs mt-4">
          You can always update this later from your dashboard.
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Heart className="h-8 w-8 text-rose-400 animate-pulse" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
