"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Heart,
  MessageCircle,
  Sparkles,
  Check,
  Shield,
  CreditCard,
  ArrowRight,
  Mail,
  AlertCircle,
  Menu,
  X,
  Copy,
  Pencil,
  Send,
} from "lucide-react"
import { submitSignup, formatPhoneNumber, validatePhoneNumber, validateEmail } from "@/lib/api"
import Link from "next/link"
// Helper: returns animation class after mount, opacity-0 before
function useAnimReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])
  return (cls: string, delay?: string) =>
    ready ? `${cls}${delay ? ` ${delay}` : ''}` : 'opacity-0'
}

export default function LandingPage() {
  const a = useAnimReady()

  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    wifeName: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeExample, setActiveExample] = useState(0)

  const promptExamples = [
    {
      theme: "romantic",
      nudge: "What moment with Sarah do you keep replaying in your head?",
      starter: "I keep thinking about when we",
      filled: "I keep thinking about when we stayed up talking on the beach in Hilton Head until 2am. I'd give anything to do that again tonight.",
    },
    {
      theme: "funny",
      nudge: "What's a running joke between you two that no one else gets?",
      starter: "Just thinking about",
      filled: "Just thinking about \"the incident\" at Olive Garden and cracking up at my desk. We can never go back there.",
    },
    {
      theme: "appreciative",
      nudge: "What did Sarah do this week that made your life easier?",
      starter: "Thank you for",
      filled: "Thank you for handling the whole car situation Tuesday while I was stuck at work. I know it doesn't seem like a big deal but it meant everything.",
    },
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phone = "Please enter a valid 10-digit phone number"
    }
    if (!formData.wifeName.trim()) {
      newErrors.wifeName = "Her name is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phoneNumber: formatted })
    if (errors.phone) setErrors({ ...errors, phone: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!validateForm()) return

    setIsSubmitting(true)
    const response = await submitSignup({
      email: formData.email,
      phone: formData.phoneNumber.replace(/\D/g, ''),
      wifeName: formData.wifeName,
      theme: 'random',
      frequency: 'daily',
    })

    if (response.success && response.checkoutUrl) {
      window.location.href = response.checkoutUrl
    } else {
      setSubmitError(response.error || "Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <img src="/sendmylove.app.png" alt="SendMyLove" className="h-14 md:h-16" />
          <nav className="hidden md:flex items-center space-x-6">
            <button onClick={() => scrollToSection("how-it-works")} className="text-gray-600 hover:text-rose-500 transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection("pricing")} className="text-gray-600 hover:text-rose-500 transition-colors">
              Pricing
            </button>
            <Button onClick={() => scrollToSection("signup")} className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700">
              Get Started
            </Button>
          </nav>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-rose-500"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-rose-100 py-4 px-4 space-y-3">
            <button onClick={() => { scrollToSection("how-it-works"); setMobileMenuOpen(false) }} className="block w-full text-left text-gray-600 hover:text-rose-500 py-2">How It Works</button>
            <button onClick={() => { scrollToSection("pricing"); setMobileMenuOpen(false) }} className="block w-full text-left text-gray-600 hover:text-rose-500 py-2">Pricing</button>
            <Button onClick={() => { scrollToSection("signup"); setMobileMenuOpen(false) }} className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700">Get Started</Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        {/* Animated background blobs — larger + more visible */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-rose-300/50 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-300/50 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Floating decorative elements — hidden on mobile to avoid overlap */}
        <div className="absolute inset-0 -z-10 pointer-events-none hidden md:block" aria-hidden="true">
          <div className="absolute top-[15%] left-[8%] animate-float opacity-20">
            <Heart className="h-8 w-8 text-rose-400 fill-rose-400" />
          </div>
          <div className="absolute top-[25%] right-[10%] animate-float-reverse opacity-15">
            <MessageCircle className="h-10 w-10 text-purple-400" />
          </div>
          <div className="absolute bottom-[30%] right-[7%] animate-float-slow opacity-15">
            <Sparkles className="h-9 w-9 text-amber-400" />
          </div>
        </div>

        <div className="container mx-auto max-w-5xl text-center relative">
          {/* Logo + animated message bubble */}
          <div className={`flex justify-center items-center mb-8 gap-4 ${a('animate-scale-in')}`}>
            <img src="/sendmylove.app.png" alt="SendMyLove" className="h-32 md:h-44 lg:h-52" />
            <div className="relative animate-float">
              <div className="bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg shadow-rose-500/20">
                <Heart className="h-6 w-6 md:h-8 md:w-8 text-white fill-white animate-pulse-heart" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-amber-400 animate-bounce-in" />
            </div>
          </div>

          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 ${a('animate-scale-in', 'delay-1')}`}>
            You know what you feel.<br />
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient-text">
              We help you say it.
            </span>
          </h1>

          <p className={`text-xl md:text-2xl text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto ${a('animate-fade-in-up', 'delay-2')}`}>
            Daily prompts that help you write real, personal messages to your wife.
            Not AI slop. Not greeting cards. Your words, your feelings, said better.
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-8 ${a('animate-fade-in-up', 'delay-3')}`}>
            <Button
              size="lg"
              onClick={() => scrollToSection("signup")}
              className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-lg px-10 py-7 group hover:scale-105 transition-all animate-glow-pulse"
            >
              Start Free Trial — $5/month
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className={`flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-16 ${a('animate-fade-in-up', 'delay-4')}`}>
            <div className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />7-day free trial</div>
            <div className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Cancel anytime</div>
            <div className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />She never needs an account</div>
          </div>

          {/* Interactive Prompt Preview */}
          <div className={`max-w-2xl mx-auto ${a('animate-fade-in-up', 'delay-5')}`}>
            <div className="flex gap-2 justify-center mb-4">
              {promptExamples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setActiveExample(i)}
                  className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                    activeExample === i
                      ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/25'
                      : 'bg-white text-gray-600 hover:bg-rose-50 hover:scale-105'
                  }`}
                >
                  {ex.theme}
                </button>
              ))}
            </div>

            <Card className="border-rose-200 shadow-xl text-left overflow-hidden">
              <CardContent className="p-6 space-y-4">
                {/* Nudge — keyed for re-animation on tab switch */}
                <div key={`nudge-${activeExample}`} className="animate-fade-in">
                  <Badge className="bg-rose-100 text-rose-700 mb-3">{promptExamples[activeExample].theme}</Badge>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {promptExamples[activeExample].nudge}
                  </p>
                </div>

                {/* Starter → Filled */}
                <div key={`filled-${activeExample}`} className="bg-gray-50 rounded-xl p-4 space-y-3 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Pencil className="h-3 w-3" />
                    <span>You fill in the blank:</span>
                  </div>
                  <p className="text-gray-400 text-sm line-through">
                    {promptExamples[activeExample].starter} ___
                  </p>
                  <p className="text-gray-900">
                    {promptExamples[activeExample].filled}
                  </p>
                </div>

                {/* Copy button mock */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-rose-500 text-white rounded-lg py-3 text-center text-sm font-medium flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer">
                    <Copy className="h-4 w-4" />
                    Copy & Send from your phone
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  She gets a real text from you. Not from an app.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center mb-16 ${a('animate-fade-in-up')}`}>
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three steps. Two minutes. One happy wife.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className={`border-rose-100 hover:shadow-lg transition-shadow ${a('animate-fade-in-up', 'delay-1')}`}>
              <CardHeader className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold ${a('animate-bounce-in', 'delay-2')}`}>1</div>
                <CardTitle className="text-xl">We ask a question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Each day you get a prompt based on your relationship — something that sparks a real thought about her.
                </p>
              </CardContent>
            </Card>

            <Card className={`border-rose-100 hover:shadow-lg transition-shadow ${a('animate-fade-in-up', 'delay-2')}`}>
              <CardHeader className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold ${a('animate-bounce-in', 'delay-3')}`}>2</div>
                <CardTitle className="text-xl">You fill in the blank</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  We give you a sentence starter. You add the real stuff — the memory, the detail, the thing only you would say.
                </p>
              </CardContent>
            </Card>

            <Card className={`border-rose-100 hover:shadow-lg transition-shadow ${a('animate-fade-in-up', 'delay-3')}`}>
              <CardHeader className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold ${a('animate-bounce-in', 'delay-4')}`}>3</div>
                <CardTitle className="text-xl">Copy, send, done</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Copy the message and text it from your phone. She just gets a thoughtful text from her husband. That's it.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-500 text-lg">
              Optional: tap <span className="inline-flex items-center gap-1 text-rose-500"><Sparkles className="h-4 w-4" /> "Help me say it better"</span> and we'll polish your words without changing what you said.
            </p>
          </div>
        </div>
      </section>

      {/* Why this works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className={`text-center mb-16 ${a('animate-fade-in-up')}`}>
            <h2 className="text-4xl font-bold mb-4">Why this actually works</h2>
            <p className="text-xl text-gray-600">Unlike every other "relationship app" out there</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className={`space-y-6 ${a('animate-slide-in-left', 'delay-1')}`}>
              <h3 className="text-lg font-semibold text-gray-900">Other apps</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-gray-500">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Both partners need to download the app</span>
                </div>
                <div className="flex items-start gap-3 text-gray-500">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Generic AI-written messages she'll see right through</span>
                </div>
                <div className="flex items-start gap-3 text-gray-500">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Feels like couples therapy homework</span>
                </div>
                <div className="flex items-start gap-3 text-gray-500">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Messages come "from the app" not from him</span>
                </div>
              </div>
            </div>

            <div className={`space-y-6 ${a('animate-slide-in-right', 'delay-2')}`}>
              <h3 className="text-lg font-semibold text-gray-900">SendMyLove</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>She doesn't need an account.</strong> You use it. She just gets better texts.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Your words, your memories.</strong> We just help you get started.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Feels like a buddy, not a therapist.</strong> Quick, fun, no pressure.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Sent from your phone number.</strong> She has no idea. She just knows you're amazing.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <div className={`text-center mb-16 ${a('animate-fade-in-up')}`}>
            <h2 className="text-4xl font-bold mb-4">Less than a coffee. More than a card.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <Card className={`border-gray-200 ${a('animate-fade-in-up', 'delay-1')}`}>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Free</CardTitle>
                <div className="text-3xl font-bold text-gray-900">$0</div>
                <CardDescription>See if it clicks</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" />1 prompt per week</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" />Fill-in-the-blank starters</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" />Copy & send</li>
                  <li className="flex items-center text-gray-400"><X className="h-5 w-5 text-gray-300 mr-3" />AI polish</li>
                  <li className="flex items-center text-gray-400"><X className="h-5 w-5 text-gray-300 mr-3" />Daily prompts</li>
                  <li className="flex items-center text-gray-400"><X className="h-5 w-5 text-gray-300 mr-3" />Daily log</li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => scrollToSection("signup")}>
                  Try Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className={`border-2 border-rose-200 shadow-xl relative ${a('animate-fade-in-up', 'delay-2')}`}>
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${a('animate-bounce-in', 'delay-4')}`}>
                <Badge className="bg-rose-500 text-white">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Pro</CardTitle>
                <div className="text-3xl font-bold text-rose-600">$5<span className="text-lg text-gray-500">/mo</span></div>
                <CardDescription>7-day free trial</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" />Daily personalized prompts</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" />Fill-in-the-blank starters</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" />Copy & send</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><Sparkles className="h-4 w-4 text-rose-400 mr-1" /> AI polish (5x/day)</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" />Daily relationship log</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" />Anniversary & birthday prompts</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700" onClick={() => scrollToSection("signup")}>
                  Start 7-Day Free Trial
                </Button>
                <p className="text-center text-xs text-gray-500 mt-3">Cancel anytime. 30-day guarantee.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className={`text-center mb-16 ${a('animate-fade-in-up')}`}>
            <h2 className="text-4xl font-bold mb-4">Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="what" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">What exactly is SendMyLove?</AccordionTrigger>
              <AccordionContent>
                It's a daily prompt that helps you write a genuine text to your wife. We ask you a question, give you a fill-in-the-blank sentence starter, and you add the real stuff — the memories, the details, the things only you would say. Then you copy it and send it from your own phone.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ai" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">Will she know I'm using this?</AccordionTrigger>
              <AccordionContent>
                No. The message comes from your phone number, in your words, about real things in your life together. There's nothing to detect. She'll just think you got really good at texting.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="different" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">How is this different from ChatGPT?</AccordionTrigger>
              <AccordionContent>
                ChatGPT writes generic messages for you. We don't write anything — you do. We just ask the right question to get you thinking, then give you a starting point. The result sounds like you because it IS you. We also remember your relationship details, so prompts get more personal over time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="wife-account" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">Does my wife need to sign up?</AccordionTrigger>
              <AccordionContent>
                No. That's the whole point. You use SendMyLove, she just gets a great text from her husband. No app for her to download, no account to create, no couples quiz to fill out.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="billing" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">How does billing work?</AccordionTrigger>
              <AccordionContent>
                $5/month after a 7-day free trial. Cancel anytime — no questions asked. We also have a free tier (1 prompt per week) if you want to try it without a card.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="polish" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">What does "Help me say it better" do?</AccordionTrigger>
              <AccordionContent>
                It takes what you wrote and tightens it up — better flow, cleaner wording — without changing your meaning or adding stuff you wouldn't say. Think of it like a friend reading your text and saying "say it like this instead." It's optional and you can always use your original.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Signup Form */}
      <section id="signup" className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-lg">
          <div className={`text-center mb-8 ${a('animate-fade-in-up')}`}>
            <h2 className="text-3xl font-bold mb-3">Start in 60 seconds</h2>
            <p className="text-gray-600">Sign up, tell us about her, get your first prompt.</p>
          </div>

          <Card className={`border-rose-200 shadow-xl ${a('animate-fade-in-up', 'delay-1')}`}>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{submitError}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Your email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: "" }) }}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wifeName">Her name</Label>
                  <Input
                    id="wifeName"
                    placeholder="Sarah"
                    value={formData.wifeName}
                    onChange={(e) => { setFormData({ ...formData, wifeName: e.target.value }); if (errors.wifeName) setErrors({ ...errors, wifeName: "" }) }}
                    className={errors.wifeName ? "border-red-500" : ""}
                  />
                  {errors.wifeName && <p className="text-sm text-red-500">{errors.wifeName}</p>}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 hover:scale-[1.02] hover:shadow-xl transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Setting up..." : "Start 7-Day Free Trial"}
                </Button>

                <p className="text-center text-xs text-gray-500">
                  7-day free trial. $5/month after. Cancel anytime.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <img src="/sendmylove.app.png" alt="SendMyLove" className="h-16 md:h-20 brightness-0 invert" />
              <p className="text-gray-300">
                Helping husbands say what they feel, in their own words.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollToSection("pricing")} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection("signup")} className="hover:text-white transition-colors">Get Started</button></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="mailto:support@sendmylove.app" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
              <div className="space-y-2 pt-4">
                <div className="flex items-center space-x-2"><Shield className="h-4 w-4 text-green-500" /><span className="text-sm text-gray-300">SSL Encrypted</span></div>
                <div className="flex items-center space-x-2"><CreditCard className="h-4 w-4 text-green-500" /><span className="text-sm text-gray-300">Secure Payments via Stripe</span></div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">&copy; {new Date().getFullYear()} SendMyLove. All rights reserved.</p>
            <a href="mailto:support@sendmylove.app" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 mt-4 md:mt-0">
              <Mail className="h-5 w-5" />
              <span className="text-sm">support@sendmylove.app</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
