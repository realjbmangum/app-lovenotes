"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, Clock, Mail } from "lucide-react"
import Link from "next/link"

function SuccessContent() {
  const searchParams = useSearchParams()
  const wifeName = searchParams.get("name") || "your wife"
  const subscriberId = searchParams.get("id")

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full border-rose-200 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-br from-rose-50 to-purple-50">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            You're All Set!
          </CardTitle>
          <CardDescription className="text-lg">
            Get ready to make {wifeName} smile
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-rose-50 rounded-lg">
              <Clock className="h-6 w-6 text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">First message tomorrow at 8am</h3>
                <p className="text-gray-600 text-sm">
                  Your personalized love note will arrive via text message.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <MessageCircle className="h-6 w-6 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">How it works</h3>
                <p className="text-gray-600 text-sm">
                  Copy the message, personalize it if you'd like, and send it to {wifeName} from your phone. She'll only see it coming from you.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="h-6 w-6 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Need help?</h3>
                <p className="text-gray-600 text-sm">
                  Email us at{" "}
                  <a href="mailto:support@lovenotes.app" className="text-rose-500 hover:underline">
                    support@lovenotes.app
                  </a>{" "}
                  for any questions or to manage your subscription.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-3">
            {subscriberId && (
              <Link href={`/dashboard?id=${subscriberId}`}>
                <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700">
                  Get Your First Message Now
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50">
                Back to Home
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500">
            Your 7-day free trial has started. You won't be charged until the trial ends.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="h-12 w-12 text-rose-400" />
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
