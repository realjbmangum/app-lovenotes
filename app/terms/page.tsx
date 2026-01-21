"use client"

import { Heart, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/sendmylove.app.png" alt="SendMyLove" className="h-12 md:h-14" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
              <p className="text-gray-500">Last updated: January 21, 2026</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Welcome to SendMyLove! These Terms of Service ("Terms") govern your use of our website and
              services. By using SendMyLove, you agree to these Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing or using SendMyLove, you agree to be bound by these Terms and our Privacy Policy.
              If you do not agree to these Terms, please do not use our service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-4">
              SendMyLove is a subscription service that provides personalized love message suggestions for
              husbands to send to their wives. Our service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Daily, weekly, or bi-weekly message suggestions delivered via email</li>
              <li>Personalized messages using your wife's name or nickname</li>
              <li>Multiple message themes (romantic, funny, appreciative, encouraging, spicy)</li>
              <li>Special occasion messages for anniversaries, birthdays, and holidays</li>
              <li>A dashboard to browse and copy messages on-demand</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Account Registration</h2>
            <p className="text-gray-600 mb-4">To use SendMyLove, you must:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-gray-600 mb-4">
              You are responsible for all activity that occurs under your account.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Subscription and Billing</h2>
            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">4.1 Free Trial</h3>
            <p className="text-gray-600 mb-4">
              New subscribers receive a 7-day free trial. You will not be charged during the trial period.
              If you do not cancel before the trial ends, your subscription will automatically convert to a
              paid subscription.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">4.2 Subscription Fees</h3>
            <p className="text-gray-600 mb-4">
              After your free trial, you will be charged $5.00 USD per month. Subscription fees are billed
              in advance on a monthly basis and are non-refundable except as described in our Money-Back
              Guarantee.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">4.3 30-Day Money-Back Guarantee</h3>
            <p className="text-gray-600 mb-4">
              If you are not satisfied with SendMyLove within the first 30 days of your paid subscription,
              contact us at support@sendmylove.app for a full refund. This guarantee applies only to your
              first 30 days as a paying subscriber.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">4.4 Cancellation</h3>
            <p className="text-gray-600 mb-4">
              You may cancel your subscription at any time by contacting us at support@sendmylove.app.
              Cancellation will be effective at the end of your current billing period. You will continue
              to have access to the service until then.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Acceptable Use</h2>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Use the service for any unlawful purpose</li>
              <li>Share your account credentials with others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Redistribute, resell, or commercially exploit our content</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Harass, abuse, or harm others using our service</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              All content provided through SendMyLove, including message templates, designs, logos, and
              software, is owned by SendMyLove and protected by intellectual property laws. You are granted
              a limited, non-exclusive license to use the message suggestions for personal, non-commercial
              purposes only.
            </p>
            <p className="text-gray-600 mb-4">
              You may copy and send the messages to your spouse, but you may not:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Publish or distribute our messages publicly</li>
              <li>Use our messages for commercial purposes</li>
              <li>Create derivative works based on our content</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-gray-600 mb-4">
              SendMyLove is provided "as is" and "as available" without warranties of any kind, either
              express or implied. We do not guarantee that:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>The service will be uninterrupted or error-free</li>
              <li>The messages will achieve any particular result in your relationship</li>
              <li>The service will meet your specific requirements</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              To the maximum extent permitted by law, SendMyLove shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including but not limited to loss
              of profits, data, or goodwill, arising out of or related to your use of the service.
            </p>
            <p className="text-gray-600 mb-4">
              Our total liability for any claims arising from your use of the service shall not exceed
              the amount you paid us in the 12 months preceding the claim.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Indemnification</h2>
            <p className="text-gray-600 mb-4">
              You agree to indemnify and hold harmless SendMyLove and its officers, directors, employees,
              and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees)
              arising from your use of the service or violation of these Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of material changes
              by posting the updated Terms on our website and updating the "Last updated" date. Your continued
              use of the service after changes are posted constitutes acceptance of the modified Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Termination</h2>
            <p className="text-gray-600 mb-4">
              We may terminate or suspend your account and access to the service at our sole discretion,
              without notice, for conduct that we believe violates these Terms or is harmful to other users,
              us, or third parties, or for any other reason.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
            <p className="text-gray-600 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States,
              without regard to its conflict of law provisions. Any disputes arising from these Terms or your
              use of the service shall be resolved in the courts of the United States.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600">
              <p><strong>SendMyLove</strong></p>
              <p>Email: <a href="mailto:support@sendmylove.app" className="text-rose-500 hover:underline">support@sendmylove.app</a></p>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} SendMyLove. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link>
            <Link href="/" className="text-gray-400 hover:text-white text-sm">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
