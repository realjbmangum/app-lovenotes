"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Heart,
  MessageCircle,
  Calendar,
  Sparkles,
  Check,
  Star,
  Shield,
  CreditCard,
  Users,
  ArrowRight,
  Phone,
  Mail,
  AlertCircle,
  Menu,
  X,
} from "lucide-react"
import { submitSignup, formatPhoneNumber, validatePhoneNumber, validateEmail } from "@/lib/api"

export default function LandingPage() {
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
    wifeName: "",
    contentTheme: "romantic",
    frequency: "daily",
    anniversaryDate: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [currentTheme, setCurrentTheme] = useState("romantic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const messageExamples = {
    romantic:
      "Good morning beautiful ❤️ Just wanted you to know that waking up thinking of you makes every day perfect. Have an amazing day, my love!",
    funny:
      "Hey gorgeous! 😄 I just realized I'm married to someone way out of my league... and I'm totally okay with that! Hope your day is as awesome as you are!",
    appreciative:
      "Thank you for being the incredible woman you are 💕 Your strength, kindness, and love make our home a paradise. I'm so grateful for you!",
    encouraging:
      "You've got this, superwoman! 💪 Whatever today brings, remember that I believe in you completely. You're stronger than you know! ✨",
  }

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
      newErrors.wifeName = "Wife's name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phoneNumber: formatted })
    if (errors.phone) {
      setErrors({ ...errors, phone: "" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const response = await submitSignup({
      email: formData.email,
      phone: formData.phoneNumber.replace(/\D/g, ''), // Send only digits
      wifeName: formData.wifeName,
      theme: formData.contentTheme,
      frequency: formData.frequency,
      anniversaryDate: formData.anniversaryDate || undefined,
    })

    if (response.success && response.checkoutUrl) {
      // Store subscriber ID for dashboard access
      if (response.subscriberId) {
        localStorage.setItem('lovenotes_subscriber_id', response.subscriberId)
      }
      // Redirect to success page (will be Stripe Checkout when integrated)
      window.location.href = `${response.checkoutUrl}&id=${response.subscriberId}`
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-rose-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              LoveNotes
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-600 hover:text-rose-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-gray-600 hover:text-rose-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-gray-600 hover:text-rose-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              Reviews
            </button>
            <Button
              onClick={() => scrollToSection("signup")}
              className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
            >
              Get Started
            </Button>
          </nav>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-rose-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 rounded-md"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-rose-100 py-4 px-4 space-y-3">
            <button
              onClick={() => { scrollToSection("how-it-works"); setMobileMenuOpen(false); }}
              className="block w-full text-left text-gray-600 hover:text-rose-500 transition-colors py-2 px-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              How It Works
            </button>
            <button
              onClick={() => { scrollToSection("pricing"); setMobileMenuOpen(false); }}
              className="block w-full text-left text-gray-600 hover:text-rose-500 transition-colors py-2 px-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              Pricing
            </button>
            <button
              onClick={() => { scrollToSection("testimonials"); setMobileMenuOpen(false); }}
              className="block w-full text-left text-gray-600 hover:text-rose-500 transition-colors py-2 px-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              Reviews
            </button>
            <Button
              onClick={() => { scrollToSection("signup"); setMobileMenuOpen(false); }}
              className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
            >
              Get Started
            </Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200">
                  <Heart className="h-3 w-3 mr-1" />
                  Trusted by loving husbands everywhere
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Never miss a moment to{" "}
                  <span className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                    show her you care
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Get personalized message suggestions sent to your phone. Copy, customize, and send sweet texts that
                  will make her day.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => scrollToSection("signup")}
                  className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-lg px-8 py-6 group"
                >
                  Start Making Her Smile - $5/month
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection("how-it-works")}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-lg px-8 py-6"
                >
                  See How It Works
                </Button>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  7-day free trial
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  Cancel anytime
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  30-day guarantee
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto w-80 h-96 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-2 shadow-2xl">
                <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
                  <div className="p-4 pt-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                          <Heart className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white font-medium">LoveNotes</span>
                      </div>
                      <span className="text-gray-400 text-sm">9:42 AM</span>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="bg-rose-500 rounded-2xl rounded-bl-md p-4 ml-8">
                        <p className="text-white text-sm leading-relaxed">
                          {messageExamples[currentTheme as keyof typeof messageExamples]}
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          size="sm"
                          className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                          onClick={() => {
                            const themes = Object.keys(messageExamples)
                            const currentIndex = themes.indexOf(currentTheme)
                            const nextIndex = (currentIndex + 1) % themes.length
                            setCurrentTheme(themes[nextIndex])
                          }}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Try Different Style
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-amber-300 rounded-full p-3 shadow-lg animate-pulse">
                <Heart className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to become the husband she brags about</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Sign Up & Personalize</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Tell us about your wife and what makes her smile. We'll customize everything just for your
                  relationship.
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Receive Message Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Get loving message suggestions sent to your phone daily, perfectly timed for maximum impact.
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Copy & Send</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Personalize and send from your number. She'll never know the difference - just that you're amazing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Be Her Hero</h2>
            <p className="text-xl text-gray-600">Thoughtfully designed features that make love effortless</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-8 w-8 text-rose-500 mb-2" />
                <CardTitle className="text-lg">Daily/Weekly Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Choose your rhythm - daily sweetness or weekly surprises that fit your style.
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Sparkles className="h-8 w-8 text-rose-500 mb-2" />
                <CardTitle className="text-lg">Personalized Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Messages crafted for your wife's name and your unique relationship style.
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="h-8 w-8 text-rose-500 mb-2" />
                <CardTitle className="text-lg">Anniversary Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Never forget important dates with smart anniversary and milestone alerts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-rose-500 mb-2" />
                <CardTitle className="text-lg">Multiple Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Romantic, funny, appreciative, or encouraging - match your mood perfectly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Honest Pricing</h2>
            <p className="text-xl text-gray-600">One plan, everything included. No surprises.</p>
          </div>

          <Card className="max-w-md mx-auto border-2 border-rose-200 shadow-xl">
            <CardHeader className="text-center bg-gradient-to-br from-rose-50 to-purple-50">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">LoveNotes Premium</CardTitle>
              <div className="text-4xl font-bold text-rose-600">
                $5<span className="text-lg text-gray-500">/month</span>
              </div>
              <CardDescription>Everything you need to be amazing</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Personalized daily message suggestions
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Multiple content themes (romantic, funny, appreciative)
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Anniversary and milestone reminders
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Flexible delivery schedule
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  24/7 customer support
                </li>
              </ul>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
                onClick={() => scrollToSection("signup")}
              >
                Start 7-Day Free Trial
              </Button>

              <div className="text-center mt-4 space-y-2">
                <p className="text-sm text-gray-500">7-day free trial • Cancel anytime</p>
                <p className="text-sm text-gray-500">30-day money-back guarantee</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Real Stories from Real Husbands</h2>
            <p className="text-xl text-gray-600">See how LoveNotes is transforming relationships</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-rose-100">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <CardTitle className="text-lg">Mike & Sarah</CardTitle>
                <CardDescription>Married 8 years</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  "Sarah started asking me when I became so thoughtful! The messages helped me express feelings I had
                  but couldn't put into words. Our connection is stronger than ever."
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-100">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <CardTitle className="text-lg">David & Emma</CardTitle>
                <CardDescription>Married 3 years</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  "I was never good with words, but LoveNotes changed that. Emma lights up every time she gets one of
                  'my' messages. It's like having a relationship coach in my pocket."
                </p>
              </CardContent>
            </Card>

            <Card className="border-rose-100">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <CardTitle className="text-lg">James & Lisa</CardTitle>
                <CardDescription>Married 12 years</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  "After 12 years, it's easy to get comfortable and forget the little things. LoveNotes brought back
                  that spark and reminded me why I fell in love with Lisa."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about LoveNotes</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="privacy" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">Is my information private and secure?</AccordionTrigger>
              <AccordionContent>
                Absolutely. Your personal information is encrypted and never shared with third parties. We take privacy
                seriously and only use your details to personalize your message suggestions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="process" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">How does the copy/paste process work?</AccordionTrigger>
              <AccordionContent>
                We send message suggestions directly to your phone via text or our app. Simply copy the message,
                personalize it if you'd like, and send it from your own number. Your wife will only see it coming from
                you.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="billing" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">How does billing work?</AccordionTrigger>
              <AccordionContent>
                Simple monthly billing at $5/month. Start with a 7-day free trial, and cancel anytime with no questions
                asked. We also offer a 30-day money-back guarantee if you're not completely satisfied.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customization" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">Can I customize the messages?</AccordionTrigger>
              <AccordionContent>
                Yes! Every message is designed to be a starting point. You can use them as-is or personalize them with
                your own touches. We also learn your preferences over time to make suggestions more tailored to your
                style.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="frequency" className="border border-rose-100 rounded-lg px-6">
              <AccordionTrigger className="text-left">How often will I receive messages?</AccordionTrigger>
              <AccordionContent>
                You choose! Options include daily messages, weekly surprises, or bi-weekly suggestions. You can change
                your frequency anytime in your account settings.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Signup Form */}
      <section id="signup" className="py-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Start Your 7-Day Free Trial</h2>
            <p className="text-xl text-gray-600">Join thousands of husbands making their wives smile daily</p>
          </div>

          <Card className="border-rose-200 shadow-xl">
            <CardHeader className="text-center bg-gradient-to-br from-rose-50 to-purple-50">
              <CardTitle className="text-2xl">Get Started Today</CardTitle>
              <CardDescription>Setup takes less than 2 minutes</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{submitError}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value })
                        if (errors.email) setErrors({ ...errors, email: "" })
                      }}
                      className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wifeName">Your Wife's Name</Label>
                  <Input
                    id="wifeName"
                    placeholder="Sarah"
                    value={formData.wifeName}
                    onChange={(e) => {
                      setFormData({ ...formData, wifeName: e.target.value })
                      if (errors.wifeName) setErrors({ ...errors, wifeName: "" })
                    }}
                    className={errors.wifeName ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {errors.wifeName && (
                    <p className="text-sm text-red-500">{errors.wifeName}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Message Style</Label>
                    <Select
                      value={formData.contentTheme}
                      onValueChange={(value) => setFormData({ ...formData, contentTheme: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="romantic">Romantic</SelectItem>
                        <SelectItem value="funny">Funny</SelectItem>
                        <SelectItem value="appreciative">Appreciative</SelectItem>
                        <SelectItem value="encouraging">Encouraging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="How often?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anniversary">Anniversary Date (Optional)</Label>
                  <Input
                    id="anniversary"
                    type="date"
                    value={formData.anniversaryDate}
                    onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Setting Up Your Account..." : "Start Free Trial - $5/month after"}
                </Button>

                <div className="text-center text-sm text-gray-500 space-y-1">
                  <p>7-day free trial • No commitment • Cancel anytime</p>
                  <p>30-day money-back guarantee</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-rose-500" />
                <span className="text-2xl font-bold">LoveNotes</span>
              </div>
              <p className="text-gray-300">
                Helping husbands stay connected with their wives through personalized daily messages.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Reviews
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Trust & Security</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-300">SSL Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-300">Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-300">30-Day Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">© {new Date().getFullYear()} LoveNotes. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="mailto:support@lovenotes.com" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-md">
                <Mail className="h-5 w-5" />
              </a>
              <a href="tel:+1234567890" className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-md">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
