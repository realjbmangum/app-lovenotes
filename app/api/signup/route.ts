import { NextRequest, NextResponse } from "next/server"

// Mock API for local development
// In production, this will be replaced by a Cloudflare Worker

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, wifeName, theme, frequency, anniversaryDate } = body

    // Validate required fields
    if (!email || !phone || !wifeName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate phone number (10 digits)
    if (phone.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number" },
        { status: 400 }
      )
    }

    // In production, this would:
    // 1. Create a pending subscriber in D1
    // 2. Create a Stripe Checkout session
    // 3. Return the checkout URL

    console.log("Signup received:", { email, phone, wifeName, theme, frequency, anniversaryDate })

    // For local dev, simulate success and redirect to success page
    // In production, this would be the Stripe Checkout URL
    const successUrl = `/success?name=${encodeURIComponent(wifeName)}`

    return NextResponse.json({
      success: true,
      checkoutUrl: successUrl, // In production: Stripe Checkout URL
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
