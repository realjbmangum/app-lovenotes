"use client"

import { Heart, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
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
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-500">Last updated: January 21, 2026</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              At SendMyLove, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect information you provide directly to us when you:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><strong>Create an account:</strong> Email address, phone number, and password</li>
              <li><strong>Set up your profile:</strong> Your wife's name, nickname/pet name, anniversary date, and birthday</li>
              <li><strong>Configure preferences:</strong> Message theme preferences and delivery frequency</li>
              <li><strong>Make payments:</strong> Payment information (processed securely by Stripe)</li>
              <li><strong>Contact us:</strong> Any information you provide in support requests</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize message suggestions with your wife's name or nickname</li>
              <li>Send you daily/weekly message suggestions based on your preferences</li>
              <li>Send special occasion messages on anniversaries and birthdays</li>
              <li>Process payments and send transaction confirmations</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Send you technical notices, updates, and administrative messages</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
            <p className="text-gray-600 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your
              information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><strong>Service Providers:</strong> We use trusted third-party services (Stripe for payments,
              SendGrid for emails) that need access to certain information to perform services on our behalf</li>
              <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal requests</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>All data is encrypted in transit using SSL/TLS encryption</li>
              <li>Passwords are hashed and never stored in plain text</li>
              <li>Payment information is processed by Stripe and never stored on our servers</li>
              <li>We use secure, httpOnly cookies for authentication</li>
              <li>Regular security audits and updates</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              We retain your personal information for as long as your account is active or as needed to provide
              you services. If you cancel your subscription, we will delete your personal information within 30 days,
              except where we are required to retain it for legal or accounting purposes.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
            </ul>
            <p className="text-gray-600 mb-4">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:support@sendmylove.app" className="text-rose-500 hover:underline">
                support@sendmylove.app
              </a>
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Cookies</h2>
            <p className="text-gray-600 mb-4">
              We use essential cookies to keep you logged in and remember your preferences. We do not use
              tracking cookies or share cookie data with advertisers. You can disable cookies in your browser,
              but this may affect the functionality of our service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-600 mb-4">
              SendMyLove is not intended for use by anyone under the age of 18. We do not knowingly collect
              personal information from children. If you believe we have collected information from a child,
              please contact us immediately.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to
              review this Privacy Policy periodically.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
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
