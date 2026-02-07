/**
 * SendMyLove API Worker
 * Handles signup, message retrieval, and subscription management
 * Plus scheduled daily message generation
 */

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
  ANTHROPIC_API_KEY?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_ID?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

// Available themes for random selection
const THEMES = ['romantic', 'funny', 'appreciative', 'encouraging', 'spicy'];

// Holiday detection helpers
function getHolidayForDate(date: Date): string | null {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Fixed holidays
  if (month === 1 && day === 1) return 'new_years';
  if (month === 2 && day === 14) return 'valentines';
  if (month === 12 && day === 25) return 'christmas';

  // Thanksgiving - 4th Thursday of November
  if (month === 11 && date.getDay() === 4) {
    // Count which Thursday this is
    const firstDay = new Date(date.getFullYear(), 10, 1); // Nov 1
    let thursdayCount = 0;
    for (let d = 1; d <= day; d++) {
      const checkDate = new Date(date.getFullYear(), 10, d);
      if (checkDate.getDay() === 4) thursdayCount++;
    }
    if (thursdayCount === 4) return 'thanksgiving';
  }

  // Mother's Day - 2nd Sunday of May
  if (month === 5 && date.getDay() === 0) {
    const firstDay = new Date(date.getFullYear(), 4, 1); // May 1
    let sundayCount = 0;
    for (let d = 1; d <= day; d++) {
      const checkDate = new Date(date.getFullYear(), 4, d);
      if (checkDate.getDay() === 0) sundayCount++;
    }
    if (sundayCount === 2) return 'mothers_day';
  }

  return null;
}

// Get themed email styling for occasions
function getOccasionEmailStyle(occasion: string | null): { emoji: string; gradient: string; greeting: string } {
  switch (occasion) {
    case 'anniversary':
      return { emoji: '💍', gradient: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', greeting: 'Happy Anniversary!' };
    case 'valentines':
      return { emoji: '💘', gradient: 'linear-gradient(135deg, #fecdd3, #fda4af)', greeting: "Happy Valentine's Day!" };
    case 'christmas':
      return { emoji: '🎄', gradient: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', greeting: 'Merry Christmas!' };
    case 'mothers_day':
      return { emoji: '💐', gradient: 'linear-gradient(135deg, #f5d0fe, #e879f9)', greeting: "Happy Mother's Day!" };
    case 'thanksgiving':
      return { emoji: '🦃', gradient: 'linear-gradient(135deg, #fed7aa, #fdba74)', greeting: 'Happy Thanksgiving!' };
    case 'new_years':
      return { emoji: '🎉', gradient: 'linear-gradient(135deg, #fef08a, #fde047)', greeting: 'Happy New Year!' };
    case 'birthday':
      return { emoji: '🎂', gradient: 'linear-gradient(135deg, #c7d2fe, #a5b4fc)', greeting: 'Happy Birthday!' };
    default:
      return { emoji: '💕', gradient: 'linear-gradient(135deg, #fef2f2, #fdf4ff)', greeting: '' };
  }
}

interface SignupRequest {
  email: string;
  phone: string;
  wifeName: string;
  nickname?: string;
  theme: string;
  frequency: string;
  anniversaryDate?: string;
  wifeBirthday?: string;
}

interface JWTPayload {
  sub: string; // subscriber ID
  email: string;
  exp: number;
  iat: number;
}

// Cloudflare Worker types
interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// JWT Helper Functions using Web Crypto API
async function signJWT(payload: Omit<JWTPayload, 'iat'>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Validate algorithm to prevent algorithm confusion attacks
    const headerStr = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'));
    const header = JSON.parse(headerStr) as { alg: string; typ?: string };
    if (header.alg !== 'HS256') {
      console.error('JWT algorithm mismatch: expected HS256, got', header.alg);
      return null;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode signature
    const signatureStr = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
    const signature = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signature[i] = signatureStr.charCodeAt(i);
    }

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(`${headerB64}.${payloadB64}`)
    );

    if (!valid) return null;

    // Decode payload
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload: JWTPayload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://lovenotes.pages.dev',
  'https://app-lovenotes.pages.dev',
  'https://app-lovenotes-nextjs.pages.dev',
  'https://sendmylove.app',
  'https://www.sendmylove.app',
];

// Get CORS headers - origin passed as parameter (no mutable global state)
function getCORSHeaders(env: Env, requestOrigin?: string): Record<string, string> {
  // Check if request origin is in the allowed list
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : (env.ALLOWED_ORIGIN || ALLOWED_ORIGINS[0]);

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function jsonResponse(data: unknown, status = 200, env?: Env, cookies?: string[], requestOrigin?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(env ? getCORSHeaders(env, requestOrigin) : {}),
  };

  if (cookies && cookies.length > 0) {
    // For multiple cookies, we need to use Headers object
    const response = new Response(JSON.stringify(data), { status });
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    cookies.forEach(cookie => response.headers.append('Set-Cookie', cookie));
    return response;
  }

  return new Response(JSON.stringify(data), { status, headers });
}

function generateId(): string {
  return crypto.randomUUID();
}

// HTML escape utility to prevent XSS in emails
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// Send email via SendGrid
async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; error?: string }> {
  if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) {
    return { success: false, error: 'SendGrid not configured' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: env.SENDGRID_FROM_EMAIL, name: 'SendMyLove' },
        subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent },
        ],
      }),
    });

    if (response.ok || response.status === 202) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function getAuthToken(request: Request): string | null {
  // Check cookie first
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('lovenotes_auth='));
    if (authCookie) {
      return authCookie.split('=')[1];
    }
  }

  // Fallback to Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

export default {
  // HTTP request handler
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Get request origin for CORS (passed to all responses)
    const requestOrigin = request.headers.get('Origin') || '';
    const corsHeaders = getCORSHeaders(env, requestOrigin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Public routes (no auth required)
      if (url.pathname === '/api/signup' && request.method === 'POST') {
        return handleSignup(request, env, requestOrigin);
      }

      if (url.pathname === '/api/messages/random' && request.method === 'GET') {
        return handleRandomMessage(url, env, requestOrigin);
      }

      if (url.pathname === '/api/health') {
        return jsonResponse({ status: 'ok', environment: env.ENVIRONMENT }, 200, env, undefined, requestOrigin);
      }

      // Test endpoint - only available in development
      if (url.pathname === '/api/test/create-user' && request.method === 'POST') {
        if (env.ENVIRONMENT === 'production') {
          return jsonResponse({ error: 'Not available in production' }, 403, env, undefined, requestOrigin);
        }
        return handleCreateTestUser(request, env, requestOrigin);
      }

      // Test endpoint to trigger message send for a subscriber
      if (url.pathname === '/api/test/send-message' && request.method === 'POST') {
        if (env.ENVIRONMENT === 'production') {
          return jsonResponse({ error: 'Not available in production' }, 403, env, undefined, requestOrigin);
        }
        return handleTestSendMessage(request, env, requestOrigin);
      }

      // Test endpoint to send occasion or theme test email
      if (url.pathname === '/api/test/send-occasion' && request.method === 'POST') {
        if (env.ENVIRONMENT === 'production') {
          return jsonResponse({ error: 'Not available in production' }, 403, env, undefined, requestOrigin);
        }
        return handleTestOccasionEmail(request, env, requestOrigin);
      }

      // Stripe webhook (no auth - verified by Stripe signature)
      if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
        return handleStripeWebhook(request, env, requestOrigin);
      }

      // Protected routes (auth required)
      const token = getAuthToken(request);
      if (!token) {
        return jsonResponse({ error: 'Authentication required' }, 401, env, undefined, requestOrigin);
      }

      // JWT_SECRET is required - fail if not configured
      if (!env.JWT_SECRET) {
        console.error('JWT_SECRET environment variable not configured');
        return jsonResponse({ error: 'Server configuration error' }, 500, env, undefined, requestOrigin);
      }
      const payload = await verifyJWT(token, env.JWT_SECRET);
      if (!payload) {
        return jsonResponse({ error: 'Invalid or expired token' }, 401, env, undefined, requestOrigin);
      }

      // Pass authenticated subscriber ID to handlers
      if (url.pathname === '/api/messages/next' && request.method === 'GET') {
        return handleNextMessage(payload.sub, env, requestOrigin);
      }

      if (url.pathname === '/api/subscriber' && request.method === 'GET') {
        return handleGetSubscriber(payload.sub, env, requestOrigin);
      }

      // Create Stripe Checkout session for subscription
      if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
        return handleCreateCheckoutSession(payload.sub, payload.email, env, requestOrigin);
      }

      // --- V2 Endpoints ---

      // Relationship profile
      if (url.pathname === '/api/profile' && request.method === 'GET') {
        return handleGetProfile(payload.sub, env, requestOrigin);
      }
      if (url.pathname === '/api/profile' && request.method === 'POST') {
        return handleSaveProfile(request, payload.sub, env, requestOrigin);
      }

      // Daily prompt
      if (url.pathname === '/api/prompt/today' && request.method === 'GET') {
        return handleGetTodayPrompt(payload.sub, env, requestOrigin);
      }
      if (url.pathname === '/api/prompt/alternative' && request.method === 'GET') {
        return handleGetAlternativePrompt(payload.sub, env, requestOrigin);
      }

      // Message composition
      if (url.pathname === '/api/compose' && request.method === 'POST') {
        return handleCompose(request, payload.sub, env, requestOrigin);
      }

      // AI polish
      if (url.pathname === '/api/polish' && request.method === 'POST') {
        return handlePolish(request, payload.sub, env, requestOrigin);
      }

      // Daily log
      if (url.pathname === '/api/log' && request.method === 'POST') {
        return handleSaveLog(request, payload.sub, env, requestOrigin);
      }
      if (url.pathname === '/api/log' && request.method === 'GET') {
        return handleGetLogs(payload.sub, env, requestOrigin);
      }

      // History & favorites
      if (url.pathname === '/api/history' && request.method === 'GET') {
        return handleGetHistory(url, payload.sub, env, requestOrigin);
      }
      if (url.pathname.startsWith('/api/favorites') && request.method === 'GET') {
        return handleGetFavorites(payload.sub, env, requestOrigin);
      }
      if (url.pathname.startsWith('/api/favorites/') && request.method === 'POST') {
        const compositionId = url.pathname.split('/').pop();
        if (compositionId) {
          return handleToggleFavorite(compositionId, payload.sub, env, requestOrigin);
        }
      }

      return jsonResponse({ error: 'Not found' }, 404, env, undefined, requestOrigin);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, env, undefined, requestOrigin);
    }
  },

  // Scheduled handler - runs daily at 8am to send messages
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  },
};

async function handleSignup(request: Request, env: Env, requestOrigin: string): Promise<Response> {
  const body: SignupRequest = await request.json();

  // Validate required fields
  if (!body.email || !body.phone || !body.wifeName) {
    return jsonResponse({ success: false, error: 'Missing required fields' }, 400, env, undefined, requestOrigin);
  }

  // Validate email format (stricter than frontend)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(body.email)) {
    return jsonResponse({ success: false, error: 'Invalid email format' }, 400, env, undefined, requestOrigin);
  }

  // Validate phone (10 digits)
  const phoneDigits = body.phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    return jsonResponse({ success: false, error: 'Invalid phone number' }, 400, env, undefined, requestOrigin);
  }

  // Sanitize wife's name (alphanumeric, spaces, common punctuation only)
  const sanitizedWifeName = body.wifeName.replace(/[^a-zA-Z0-9\s'-]/g, '').slice(0, 50);
  if (!sanitizedWifeName) {
    return jsonResponse({ success: false, error: 'Invalid name' }, 400, env, undefined, requestOrigin);
  }

  // Check if email already exists - use generic error to prevent email enumeration
  const existing = await env.DB.prepare(
    'SELECT id FROM subscribers WHERE email = ?'
  ).bind(body.email).first();

  if (existing) {
    // Generic error message prevents email enumeration attacks
    return jsonResponse({ success: false, error: 'Unable to create account. Please try again or contact support.' }, 400, env, undefined, requestOrigin);
  }

  // JWT_SECRET is required
  if (!env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable not configured');
    return jsonResponse({ success: false, error: 'Server configuration error' }, 500, env, undefined, requestOrigin);
  }

  // Sanitize nickname (optional - used in messages instead of wife's real name)
  const sanitizedNickname = body.nickname
    ? body.nickname.replace(/[^a-zA-Z0-9\s'-]/g, '').slice(0, 30)
    : null;

  // Create subscriber
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO subscribers (id, email, phone, wife_name, nickname, theme, frequency, anniversary_date, wife_birthday, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial')
  `).bind(
    id,
    body.email,
    phoneDigits, // Store only digits
    sanitizedWifeName,
    sanitizedNickname,
    body.theme || 'romantic',
    body.frequency || 'daily',
    body.anniversaryDate || null,
    body.wifeBirthday || null
  ).run();

  // Generate JWT token (expires in 30 days)
  const token = await signJWT({
    sub: id,
    email: body.email,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  }, env.JWT_SECRET);

  // Set httpOnly cookie - SameSite=None required for cross-origin (worker domain != frontend domain)
  const cookieOptions = [
    `lovenotes_auth=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${30 * 24 * 60 * 60}`, // 30 days
    'SameSite=None',
    'Secure',
  ].join('; ');

  const successUrl = `/success?name=${encodeURIComponent(sanitizedWifeName)}`;

  // Send welcome email with first love note
  if (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) {
    // Get first love note based on their theme preference
    let messageTheme = body.theme || 'romantic';
    if (messageTheme === 'random') {
      messageTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    }

    const firstMessage = await env.DB.prepare(`
      SELECT id, theme, content FROM messages
      WHERE theme = ? AND occasion IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `).bind(messageTheme).first();

    if (firstMessage) {
      // Use nickname in the actual love note, fall back to wife's name
      const messageNameToUse = sanitizedNickname || sanitizedWifeName;
      const loveNote = (firstMessage.content as string).replace(/{wife_name}/g, messageNameToUse);

      // Record in history to prevent repeat
      await env.DB.prepare(`
        INSERT INTO subscriber_message_history (subscriber_id, message_id)
        VALUES (?, ?)
      `).bind(id, firstMessage.id).run();

      // Escape user content for HTML email (prevent XSS/injection)
      const safeWifeName = escapeHtml(sanitizedWifeName);
      const safeLoveNote = escapeHtml(loveNote);

      // Send welcome email
      const subject = `Welcome to SendMyLove! Here's your first love note for ${sanitizedWifeName} 💕`;
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://sendmylove.app/sendmylove.app.png" alt="SendMyLove" style="height: 80px; margin-bottom: 10px;">
            <h1 style="color: #e11d48; margin: 10px 0;">Welcome!</h1>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You're all set! Every day, you'll receive a love note suggestion to send to ${safeWifeName}.
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            <strong>Here's your first one:</strong>
          </p>

          <div style="background: linear-gradient(135deg, #fef2f2, #fdf4ff); padding: 24px; border-radius: 12px; margin-bottom: 20px;">
            <p style="font-size: 18px; line-height: 1.6; color: #374151; margin: 0;">
              ${safeLoveNote}
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Copy this message and send it to ${safeWifeName} from your phone 📱
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://sendmylove.app/dashboard" style="background: #e11d48; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Your Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            You'll receive daily love notes at 8am ET.<br>
            Theme: ${escapeHtml(messageTheme)}
          </p>
        </div>
      `;
      const textContent = `Welcome to SendMyLove!\n\nYou're all set! Every day, you'll receive a love note suggestion to send to ${sanitizedWifeName}.\n\nHere's your first one:\n\n${loveNote}\n\nCopy this message and send it to ${sanitizedWifeName} from your phone.\n\nView your dashboard: https://sendmylove.app/dashboard`;

      // Wait for email to send before returning response
      const emailResult = await sendEmail(env, body.email, subject, htmlContent, textContent);
      if (!emailResult.success) {
        console.error('Welcome email failed:', emailResult.error);
      }
    }
  }

  // Create Stripe Checkout session if Stripe is configured
  if (env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID) {
    try {
      // Create Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: body.email,
          'metadata[subscriber_id]': id,
        }).toString(),
      });

      const customerData = await customerResponse.json() as { id?: string; error?: { message: string } };

      if (customerResponse.ok && customerData.id) {
        // Save customer ID
        await env.DB.prepare(
          'UPDATE subscribers SET stripe_customer_id = ? WHERE id = ?'
        ).bind(customerData.id, id).run();

        // Create Checkout session
        const stripeSuccessUrl = `${env.ALLOWED_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(sanitizedWifeName)}`;
        const cancelUrl = `${env.ALLOWED_ORIGIN}/?canceled=true`;

        const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            customer: customerData.id,
            'line_items[0][price]': env.STRIPE_PRICE_ID,
            'line_items[0][quantity]': '1',
            mode: 'subscription',
            success_url: stripeSuccessUrl,
            cancel_url: cancelUrl,
            payment_method_collection: 'always',
            'subscription_data[trial_period_days]': '7',
            'subscription_data[metadata][subscriber_id]': id,
          }).toString(),
        });

        const sessionData = await sessionResponse.json() as { id?: string; url?: string; error?: { message: string } };

        if (sessionResponse.ok && sessionData.url) {
          // Return Stripe checkout URL
          return jsonResponse({
            success: true,
            checkoutUrl: sessionData.url,
          }, 200, env, [cookieOptions], requestOrigin);
        } else {
          console.error('Stripe session creation failed:', sessionData);
        }
      } else {
        console.error('Stripe customer creation failed:', customerData);
      }
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
    }
  }

  // Fallback: No Stripe or Stripe failed - return success page URL
  return jsonResponse({
    success: true,
    checkoutUrl: successUrl,
  }, 200, env, [cookieOptions], requestOrigin);
}

async function handleRandomMessage(url: URL, env: Env, requestOrigin: string): Promise<Response> {
  const theme = url.searchParams.get('theme') || 'romantic';
  const wifeName = url.searchParams.get('name') || 'honey';

  // Sanitize wife's name
  const sanitizedName = wifeName.replace(/[^a-zA-Z0-9\s'-]/g, '').slice(0, 50) || 'honey';

  const result = await env.DB.prepare(`
    SELECT id, theme, occasion, content
    FROM messages
    WHERE theme = ? AND occasion IS NULL
    ORDER BY RANDOM()
    LIMIT 1
  `).bind(theme).first();

  if (!result) {
    return jsonResponse({ error: 'No messages found' }, 404, env, undefined, requestOrigin);
  }

  // Replace placeholder with sanitized name
  const content = (result.content as string).replace(/{wife_name}/g, sanitizedName);

  return jsonResponse({
    id: result.id,
    theme: result.theme,
    content,
  }, 200, env, undefined, requestOrigin);
}

async function handleNextMessage(subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  // Get subscriber (already authenticated via JWT)
  const subscriber = await env.DB.prepare(
    'SELECT * FROM subscribers WHERE id = ?'
  ).bind(subscriberId).first();

  if (!subscriber) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, env, undefined, requestOrigin);
  }

  // If theme is "random", pick a random theme
  let messageTheme = subscriber.theme as string;
  if (messageTheme === 'random') {
    messageTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
  }

  // Get next message that hasn't been sent to this subscriber
  const result = await env.DB.prepare(`
    SELECT m.id, m.theme, m.occasion, m.content
    FROM messages m
    WHERE m.theme = ?
      AND m.occasion IS NULL
      AND m.id NOT IN (
        SELECT message_id FROM subscriber_message_history WHERE subscriber_id = ?
      )
    ORDER BY m.id
    LIMIT 1
  `).bind(messageTheme, subscriberId).first();

  if (!result) {
    // All messages sent, reset and start over
    await env.DB.prepare(
      'DELETE FROM subscriber_message_history WHERE subscriber_id = ?'
    ).bind(subscriberId).run();

    // Get first message (use the selected theme, which may be randomized)
    const firstResult = await env.DB.prepare(`
      SELECT id, theme, occasion, content
      FROM messages
      WHERE theme = ? AND occasion IS NULL
      ORDER BY id
      LIMIT 1
    `).bind(messageTheme).first();

    if (!firstResult) {
      return jsonResponse({ error: 'No messages found' }, 404, env, undefined, requestOrigin);
    }

    // Use nickname in message content, fall back to wife's name
    const nameForMessage = (subscriber.nickname || subscriber.wife_name) as string;
    const content = (firstResult.content as string).replace(/{wife_name}/g, nameForMessage);

    return jsonResponse({
      id: firstResult.id,
      theme: firstResult.theme,
      content,
      wifeName: subscriber.wife_name,
      cycleReset: true,
    }, 200, env, undefined, requestOrigin);
  }

  // Use nickname in message content, fall back to wife's name
  const nameForMessage = (subscriber.nickname || subscriber.wife_name) as string;
  const content = (result.content as string).replace(/{wife_name}/g, nameForMessage);

  // Record that this message was shown
  await env.DB.prepare(`
    INSERT INTO subscriber_message_history (subscriber_id, message_id)
    VALUES (?, ?)
  `).bind(subscriberId, result.id).run();

  return jsonResponse({
    id: result.id,
    theme: result.theme,
    content,
    wifeName: subscriber.wife_name,
  }, 200, env, undefined, requestOrigin);
}

async function handleGetSubscriber(subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  // Already authenticated via JWT - just fetch the subscriber data
  const subscriber = await env.DB.prepare(
    'SELECT * FROM subscribers WHERE id = ?'
  ).bind(subscriberId).first();

  if (!subscriber) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, env, undefined, requestOrigin);
  }

  // Get message history count
  const historyCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM subscriber_message_history WHERE subscriber_id = ?'
  ).bind(subscriber.id).first();

  return jsonResponse({
    ...subscriber,
    messagesReceived: historyCount?.count || 0,
  }, 200, env, undefined, requestOrigin);
}

async function handleCreateTestUser(request: Request, env: Env, requestOrigin: string): Promise<Response> {
  const body = await request.json() as { email?: string; wifeName?: string; theme?: string };

  // JWT_SECRET is required even for test users
  if (!env.JWT_SECRET) {
    return jsonResponse({ error: 'JWT_SECRET not configured' }, 500, env, undefined, requestOrigin);
  }

  const id = generateId();
  const email = body.email || `test-${Date.now()}@example.com`;
  const wifeName = body.wifeName || 'Bari';
  const theme = body.theme || 'romantic';

  await env.DB.prepare(`
    INSERT INTO subscribers (id, email, phone, wife_name, theme, frequency, status)
    VALUES (?, ?, ?, ?, ?, 'daily', 'active')
  `).bind(id, email, '5551234567', wifeName, theme).run();

  // Generate JWT for test user too
  const token = await signJWT({
    sub: id,
    email: email,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
  }, env.JWT_SECRET);

  return jsonResponse({
    success: true,
    subscriber: {
      id,
      email,
      wifeName,
      theme,
    },
    token, // Return token for testing
  }, 200, env, undefined, requestOrigin);
}

// Test endpoint to manually trigger a message send
async function handleTestSendMessage(request: Request, env: Env, requestOrigin: string): Promise<Response> {
  const body = await request.json() as { email?: string; subscriberId?: string };

  // Find subscriber by email or ID
  let subscriber;
  if (body.subscriberId) {
    subscriber = await env.DB.prepare(
      'SELECT * FROM subscribers WHERE id = ?'
    ).bind(body.subscriberId).first();
  } else if (body.email) {
    subscriber = await env.DB.prepare(
      'SELECT * FROM subscribers WHERE email = ?'
    ).bind(body.email).first();
  } else {
    return jsonResponse({ error: 'Provide email or subscriberId' }, 400, env, undefined, requestOrigin);
  }

  if (!subscriber) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, env, undefined, requestOrigin);
  }

  // Pick a random theme if subscriber has 'random' selected
  let messageTheme = subscriber.theme as string;
  if (messageTheme === 'random') {
    messageTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
  }

  // Get a random message
  const message = await env.DB.prepare(`
    SELECT id, theme, content FROM messages
    WHERE theme = ? AND occasion IS NULL
    ORDER BY RANDOM()
    LIMIT 1
  `).bind(messageTheme).first();

  if (!message) {
    return jsonResponse({ error: 'No messages found' }, 404, env, undefined, requestOrigin);
  }

  // Use nickname in message content, fall back to wife's name
  const nameForMessage = (subscriber.nickname || subscriber.wife_name) as string;
  const content = (message.content as string).replace(/{wife_name}/g, nameForMessage);

  // Log the send
  const sendId = generateId();
  await env.DB.prepare(`
    INSERT INTO send_log (id, subscriber_id, message_id, status)
    VALUES (?, ?, ?, 'pending')
  `).bind(sendId, subscriber.id, message.id).run();

  // Try to send via email (since this is for testing)
  if (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) {
    // Escape user content for HTML email
    const safeWifeName = escapeHtml(subscriber.wife_name as string);
    const safeContent = escapeHtml(content);

    const subject = `💕 Today's Love Note for ${subscriber.wife_name}`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://sendmylove.app/sendmylove.app.png" alt="SendMyLove" style="height: 80px;">
        </div>
        <div style="background: linear-gradient(135deg, #fef2f2, #fdf4ff); padding: 24px; border-radius: 12px; margin-bottom: 20px;">
          <p style="font-size: 18px; line-height: 1.6; color: #374151; margin: 0;">
            ${safeContent}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Copy this message and send it to ${safeWifeName} from your phone 📱
        </p>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          Theme: ${escapeHtml(messageTheme)} | This is a test message
        </p>
      </div>
    `;
    const textContent = `💕 SendMyLove\n\n${content}\n\nCopy this message and send it to ${subscriber.wife_name} from your phone.\n\nTheme: ${messageTheme}`;

    const emailResult = await sendEmail(env, subscriber.email as string, subject, htmlContent, textContent);

    if (emailResult.success) {
      await env.DB.prepare(`UPDATE send_log SET status = 'sent' WHERE id = ?`).bind(sendId).run();
      return jsonResponse({
        success: true,
        method: 'email',
        to: subscriber.email,
        theme: messageTheme,
        content,
      }, 200, env, undefined, requestOrigin);
    } else {
      await env.DB.prepare(`UPDATE send_log SET status = 'failed', error_message = ? WHERE id = ?`)
        .bind(emailResult.error || 'Unknown', sendId).run();
      return jsonResponse({
        success: false,
        error: emailResult.error,
        content, // Still return content so you can see what would have been sent
      }, 500, env, undefined, requestOrigin);
    }
  }

  // No email configured - just return the message
  await env.DB.prepare(`UPDATE send_log SET status = 'ready' WHERE id = ?`).bind(sendId).run();
  return jsonResponse({
    success: true,
    method: 'none (no email/SMS configured)',
    theme: messageTheme,
    content,
    note: 'Message logged but not sent - configure SENDGRID_API_KEY to send emails',
  }, 200, env, undefined, requestOrigin);
}

// Test endpoint to send occasion-specific or theme-specific test email
async function handleTestOccasionEmail(request: Request, env: Env, requestOrigin: string): Promise<Response> {
  const body = await request.json() as {
    email: string;
    occasion?: string; // anniversary, valentines, christmas, etc.
    theme?: string;    // romantic, spicy, funny, etc.
    wifeName?: string;
  };

  if (!body.email) {
    return jsonResponse({ error: 'Email required' }, 400, env, undefined, requestOrigin);
  }

  const wifeName = body.wifeName || 'Sarah';
  const occasion = body.occasion || null;
  const theme = body.theme || 'romantic';

  // Get a message - either occasion-specific or theme-specific
  let message;
  if (occasion) {
    message = await env.DB.prepare(`
      SELECT id, theme, occasion, content FROM messages
      WHERE occasion = ?
      ORDER BY RANDOM()
      LIMIT 1
    `).bind(occasion).first();
  }

  if (!message) {
    message = await env.DB.prepare(`
      SELECT id, theme, occasion, content FROM messages
      WHERE theme = ? AND occasion IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `).bind(theme).first();
  }

  if (!message) {
    return jsonResponse({ error: 'No messages found' }, 404, env, undefined, requestOrigin);
  }

  const content = (message.content as string).replace(/{wife_name}/g, wifeName);
  const style = getOccasionEmailStyle(occasion);

  // Escape user content for HTML email
  const safeWifeName = escapeHtml(wifeName);
  const safeContent = escapeHtml(content);

  // Send themed email
  if (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) {
    const subject = occasion
      ? `${style.emoji} ${style.greeting} A special love note for ${wifeName}`
      : `💕 Today's Love Note for ${wifeName} (${theme})`;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://sendmylove.app/sendmylove.app.png" alt="SendMyLove" style="height: 80px;">
          ${occasion ? `<h2 style="color: #e11d48; margin: 10px 0;">${style.emoji} ${escapeHtml(style.greeting)} ${style.emoji}</h2>` : ''}
        </div>
        <div style="background: ${style.gradient}; padding: 24px; border-radius: 12px; margin-bottom: 20px;">
          <p style="font-size: 18px; line-height: 1.6; color: #374151; margin: 0;">
            ${safeContent}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Copy this message and send it to ${safeWifeName} from your phone 📱
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          ${occasion ? `Occasion: ${escapeHtml(occasion)}` : `Theme: ${escapeHtml(theme)}`} | Test email
        </p>
      </div>
    `;

    const textContent = `${style.emoji} SendMyLove${occasion ? ` - ${style.greeting}` : ''}\n\n${content}\n\nCopy this message and send it to ${wifeName} from your phone.`;

    const emailResult = await sendEmail(env, body.email, subject, htmlContent, textContent);

    if (emailResult.success) {
      return jsonResponse({
        success: true,
        occasion: occasion || null,
        theme: message.theme,
        content,
        sentTo: body.email,
      }, 200, env, undefined, requestOrigin);
    } else {
      return jsonResponse({
        success: false,
        error: emailResult.error,
      }, 500, env, undefined, requestOrigin);
    }
  }

  return jsonResponse({ error: 'SendGrid not configured' }, 500, env, undefined, requestOrigin);
}

// ============================================================
// V2 HANDLERS — Profile, Prompts, Compose, Polish, Logs, History
// ============================================================

const V2_THEMES = ['romantic', 'funny', 'flirty', 'appreciative', 'encouraging', 'spicy'];

/** GET /api/profile — get relationship profile */
async function handleGetProfile(subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  const profile = await env.DB.prepare(
    'SELECT * FROM relationship_profiles WHERE subscriber_id = ?'
  ).bind(subscriberId).first();

  if (!profile) {
    return jsonResponse({ exists: false }, 200, env, undefined, requestOrigin);
  }

  return jsonResponse({ exists: true, profile }, 200, env, undefined, requestOrigin);
}

/** POST /api/profile — create or update relationship profile */
async function handleSaveProfile(request: Request, subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  const body = await request.json() as {
    wife_name: string;
    nickname?: string;
    how_met?: string;
    years_together?: string;
    love_language?: string;
    inside_jokes?: string;
    what_makes_her_smile?: string;
    kids_names?: string;
    anniversary_date?: string;
    wife_birthday?: string;
    theme_preference?: string;
    frequency?: string;
  };

  if (!body.wife_name) {
    return jsonResponse({ error: 'Wife name is required' }, 400, env, undefined, requestOrigin);
  }

  // Sanitize inputs
  const sanitize = (val?: string, maxLen = 200) =>
    val ? val.replace(/[<>]/g, '').slice(0, maxLen) : null;

  const wifeName = sanitize(body.wife_name, 50) || '';
  const nickname = sanitize(body.nickname, 30);
  const howMet = sanitize(body.how_met, 500);
  const yearsTogether = sanitize(body.years_together, 10);
  const loveLanguage = sanitize(body.love_language, 30);
  const insideJokes = sanitize(body.inside_jokes, 500);
  const whatMakesHerSmile = sanitize(body.what_makes_her_smile, 500);
  const kidsNames = sanitize(body.kids_names, 200);
  const anniversaryDate = sanitize(body.anniversary_date, 10);
  const wifeBirthday = sanitize(body.wife_birthday, 5);

  // Upsert profile
  const existing = await env.DB.prepare(
    'SELECT subscriber_id FROM relationship_profiles WHERE subscriber_id = ?'
  ).bind(subscriberId).first();

  if (existing) {
    await env.DB.prepare(`
      UPDATE relationship_profiles SET
        wife_name = ?, nickname = ?, how_met = ?, years_together = ?,
        love_language = ?, inside_jokes = ?, what_makes_her_smile = ?,
        kids_names = ?, anniversary_date = ?, wife_birthday = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE subscriber_id = ?
    `).bind(
      wifeName, nickname, howMet, yearsTogether,
      loveLanguage, insideJokes, whatMakesHerSmile,
      kidsNames, anniversaryDate, wifeBirthday,
      subscriberId
    ).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO relationship_profiles
        (subscriber_id, wife_name, nickname, how_met, years_together,
         love_language, inside_jokes, what_makes_her_smile,
         kids_names, anniversary_date, wife_birthday)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      subscriberId, wifeName, nickname, howMet, yearsTogether,
      loveLanguage, insideJokes, whatMakesHerSmile,
      kidsNames, anniversaryDate, wifeBirthday
    ).run();
  }

  // Also update subscriber table with wife_name and nickname
  await env.DB.prepare(
    'UPDATE subscribers SET wife_name = ?, nickname = ?, onboarding_complete = 1 WHERE id = ?'
  ).bind(wifeName, nickname, subscriberId).run();

  // Update theme/frequency if provided
  if (body.theme_preference) {
    await env.DB.prepare(
      'UPDATE subscribers SET theme = ? WHERE id = ?'
    ).bind(body.theme_preference, subscriberId).run();
  }
  if (body.frequency) {
    await env.DB.prepare(
      'UPDATE subscribers SET frequency = ? WHERE id = ?'
    ).bind(body.frequency, subscriberId).run();
  }

  return jsonResponse({ success: true }, 200, env, undefined, requestOrigin);
}

/** Personalize prompt text by replacing placeholders with profile data */
function personalizeText(text: string, profile: Record<string, unknown> | null): string {
  if (!profile) return text.replace(/\{wife_name\}/g, 'her');
  let result = text;
  result = result.replace(/\{wife_name\}/g, (profile.wife_name as string) || 'her');
  result = result.replace(/\{nickname\}/g, (profile.nickname as string) || (profile.wife_name as string) || 'babe');
  result = result.replace(/\{years_together\}/g, (profile.years_together as string) || 'all these');
  return result;
}

/** GET /api/prompt/today — get or generate today's prompt */
async function handleGetTodayPrompt(subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if we already generated a prompt today
  const existingPrompt = await env.DB.prepare(`
    SELECT dp.*, pt.theme FROM daily_prompts dp
    JOIN prompt_templates pt ON dp.prompt_template_id = pt.id
    WHERE dp.subscriber_id = ? AND DATE(dp.created_at) = ?
    ORDER BY dp.created_at DESC LIMIT 1
  `).bind(subscriberId, today).first();

  if (existingPrompt) {
    return jsonResponse({
      prompt: {
        id: existingPrompt.id,
        theme: existingPrompt.theme,
        nudge: existingPrompt.personalized_nudge,
        starter: existingPrompt.personalized_starter,
        completed: existingPrompt.completed,
      }
    }, 200, env, undefined, requestOrigin);
  }

  // Generate a new prompt for today
  const profile = await env.DB.prepare(
    'SELECT * FROM relationship_profiles WHERE subscriber_id = ?'
  ).bind(subscriberId).first();

  const subscriber = await env.DB.prepare(
    'SELECT theme, tier FROM subscribers WHERE id = ?'
  ).bind(subscriberId).first();

  // Check free tier limit (1 prompt per week)
  if (subscriber?.tier === 'free') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentPrompts = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM daily_prompts
      WHERE subscriber_id = ? AND DATE(created_at) > ?
    `).bind(subscriberId, weekAgo).first();

    if ((recentPrompts?.count as number) >= 1) {
      return jsonResponse({
        error: 'free_limit',
        message: 'Free tier gets 1 prompt per week. Upgrade for daily prompts.',
      }, 200, env, undefined, requestOrigin);
    }
  }

  // Pick theme
  let theme = (subscriber?.theme as string) || 'romantic';
  if (theme === 'random') {
    theme = V2_THEMES[Math.floor(Math.random() * V2_THEMES.length)];
  }

  // Check for occasion-specific prompts
  const now = new Date();
  let occasion: string | null = null;

  // Check holidays
  occasion = getHolidayForDate(now);

  // Check anniversary
  if (profile?.anniversary_date) {
    const annivMMDD = (profile.anniversary_date as string).substring(5);
    const todayMMDD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (annivMMDD === todayMMDD) occasion = 'anniversary';
  }

  // Check wife's birthday
  if (profile?.wife_birthday) {
    const todayMMDD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if ((profile.wife_birthday as string) === todayMMDD) occasion = 'birthday';
  }

  // Get a prompt template (occasion first, then theme)
  let template;
  if (occasion) {
    template = await env.DB.prepare(`
      SELECT * FROM prompt_templates WHERE occasion = ?
      ORDER BY RANDOM() LIMIT 1
    `).bind(occasion).first();
  }

  if (!template) {
    // Get one we haven't used recently (90-day window)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    template = await env.DB.prepare(`
      SELECT pt.* FROM prompt_templates pt
      WHERE pt.theme = ? AND pt.occasion IS NULL
        AND pt.id NOT IN (
          SELECT prompt_template_id FROM daily_prompts
          WHERE subscriber_id = ? AND DATE(created_at) > ?
        )
      ORDER BY RANDOM() LIMIT 1
    `).bind(theme, subscriberId, ninetyDaysAgo).first();

    // Fallback: if all used, just pick random
    if (!template) {
      template = await env.DB.prepare(`
        SELECT * FROM prompt_templates WHERE theme = ? AND occasion IS NULL
        ORDER BY RANDOM() LIMIT 1
      `).bind(theme).first();
    }
  }

  if (!template) {
    return jsonResponse({ error: 'No prompt templates found' }, 404, env, undefined, requestOrigin);
  }

  // Personalize the prompt
  const nudge = personalizeText(template.nudge_text as string, profile);
  const starter = personalizeText(template.starter_text as string, profile);

  // Store the daily prompt
  const result = await env.DB.prepare(`
    INSERT INTO daily_prompts (subscriber_id, prompt_template_id, personalized_nudge, personalized_starter, sent_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(subscriberId, template.id, nudge, starter).run();

  const promptId = result.meta?.last_row_id;

  return jsonResponse({
    prompt: {
      id: promptId,
      theme: template.theme,
      nudge,
      starter,
      completed: 0,
    }
  }, 200, env, undefined, requestOrigin);
}

/** GET /api/prompt/alternative — swap for a different prompt */
async function handleGetAlternativePrompt(subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  const profile = await env.DB.prepare(
    'SELECT * FROM relationship_profiles WHERE subscriber_id = ?'
  ).bind(subscriberId).first();

  const subscriber = await env.DB.prepare(
    'SELECT theme FROM subscribers WHERE id = ?'
  ).bind(subscriberId).first();

  let theme = (subscriber?.theme as string) || 'romantic';
  if (theme === 'random') {
    theme = V2_THEMES[Math.floor(Math.random() * V2_THEMES.length)];
  }

  // Get today's prompt IDs to exclude
  const today = new Date().toISOString().split('T')[0];
  const todayPrompts = await env.DB.prepare(`
    SELECT prompt_template_id FROM daily_prompts
    WHERE subscriber_id = ? AND DATE(created_at) = ?
  `).bind(subscriberId, today).all();

  const excludeIds = todayPrompts.results?.map(r => r.prompt_template_id) || [];
  const excludePlaceholders = excludeIds.length > 0 ? excludeIds.map(() => '?').join(',') : '0';

  const template = await env.DB.prepare(`
    SELECT * FROM prompt_templates
    WHERE theme = ? AND occasion IS NULL
      AND id NOT IN (${excludePlaceholders})
    ORDER BY RANDOM() LIMIT 1
  `).bind(theme, ...excludeIds).first();

  if (!template) {
    // Fallback: any theme
    const fallback = await env.DB.prepare(`
      SELECT * FROM prompt_templates
      WHERE occasion IS NULL AND id NOT IN (${excludePlaceholders})
      ORDER BY RANDOM() LIMIT 1
    `).bind(...excludeIds).first();

    if (!fallback) {
      return jsonResponse({ error: 'No alternative prompts available' }, 404, env, undefined, requestOrigin);
    }

    const nudge = personalizeText(fallback.nudge_text as string, profile);
    const starter = personalizeText(fallback.starter_text as string, profile);

    const result = await env.DB.prepare(`
      INSERT INTO daily_prompts (subscriber_id, prompt_template_id, personalized_nudge, personalized_starter, sent_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(subscriberId, fallback.id, nudge, starter).run();

    return jsonResponse({
      prompt: {
        id: result.meta?.last_row_id,
        theme: fallback.theme,
        nudge,
        starter,
        completed: 0,
      }
    }, 200, env, undefined, requestOrigin);
  }

  const nudge = personalizeText(template.nudge_text as string, profile);
  const starter = personalizeText(template.starter_text as string, profile);

  const result = await env.DB.prepare(`
    INSERT INTO daily_prompts (subscriber_id, prompt_template_id, personalized_nudge, personalized_starter, sent_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(subscriberId, template.id, nudge, starter).run();

  return jsonResponse({
    prompt: {
      id: result.meta?.last_row_id,
      theme: template.theme,
      nudge,
      starter,
      completed: 0,
    }
  }, 200, env, undefined, requestOrigin);
}

/** POST /api/compose — save a composed message */
async function handleCompose(request: Request, subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  const body = await request.json() as {
    daily_prompt_id?: number;
    raw_text: string;
    polished_text?: string;
    final_text: string;
    tone_setting?: string;
  };

  if (!body.raw_text || !body.final_text) {
    return jsonResponse({ error: 'raw_text and final_text are required' }, 400, env, undefined, requestOrigin);
  }

  // Sanitize (no HTML tags but allow everything else — it's their personal message)
  const rawText = body.raw_text.replace(/[<>]/g, '').slice(0, 2000);
  const finalText = body.final_text.replace(/[<>]/g, '').slice(0, 2000);
  const polishedText = body.polished_text ? body.polished_text.replace(/[<>]/g, '').slice(0, 2000) : null;
  const tone = ['sweet', 'balanced', 'spicy'].includes(body.tone_setting || '') ? body.tone_setting : 'sweet';

  const result = await env.DB.prepare(`
    INSERT INTO message_compositions
      (subscriber_id, daily_prompt_id, raw_text, polished_text, final_text, tone_setting)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(subscriberId, body.daily_prompt_id || null, rawText, polishedText, finalText, tone).run();

  // Mark the daily prompt as completed
  if (body.daily_prompt_id) {
    await env.DB.prepare(
      'UPDATE daily_prompts SET completed = 1 WHERE id = ? AND subscriber_id = ?'
    ).bind(body.daily_prompt_id, subscriberId).run();
  }

  return jsonResponse({
    success: true,
    composition_id: result.meta?.last_row_id,
  }, 200, env, undefined, requestOrigin);
}

/** POST /api/polish — AI polish a draft message via Claude */
async function handlePolish(request: Request, subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'AI polish not configured' }, 500, env, undefined, requestOrigin);
  }

  const body = await request.json() as {
    draft: string;
    tone?: string; // sweet, balanced, spicy
  };

  if (!body.draft || body.draft.trim().length < 5) {
    return jsonResponse({ error: 'Draft must be at least 5 characters' }, 400, env, undefined, requestOrigin);
  }

  // Rate limit: 5 polishes per day
  const today = new Date().toISOString().split('T')[0];
  const polishCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM message_compositions
    WHERE subscriber_id = ? AND DATE(created_at) = ? AND polished_text IS NOT NULL
  `).bind(subscriberId, today).first();

  if ((polishCount?.count as number) >= 5) {
    return jsonResponse({ error: 'Daily polish limit reached (5 per day)' }, 429, env, undefined, requestOrigin);
  }

  // Get relationship profile for context
  const profile = await env.DB.prepare(
    'SELECT * FROM relationship_profiles WHERE subscriber_id = ?'
  ).bind(subscriberId).first();

  const tone = body.tone || 'sweet';
  const draft = body.draft.replace(/[<>]/g, '').slice(0, 1000);

  // Build system prompt with relationship context
  let contextBlock = '';
  if (profile) {
    const parts: string[] = [];
    if (profile.wife_name) parts.push(`Her name: ${profile.wife_name}`);
    if (profile.nickname) parts.push(`Pet name: ${profile.nickname}`);
    if (profile.years_together) parts.push(`Together: ${profile.years_together} years`);
    if (profile.how_met) parts.push(`How they met: ${profile.how_met}`);
    if (profile.inside_jokes) parts.push(`Inside jokes: ${profile.inside_jokes}`);
    contextBlock = parts.join('\n');
  }

  const systemPrompt = `You are helping a husband send a genuine text message to his wife.

${contextBlock ? `Context about their relationship:\n${contextBlock}\n` : ''}
Rules:
- Keep it SHORT (2-4 sentences max, this is a text message)
- Sound like HIM, not like a poet or greeting card
- Preserve every specific detail he mentioned
- Don't add flowery language or cliches
- Don't add emojis unless his draft has them
- Match the tone: ${tone} (sweet = warm and tender, balanced = natural and easy, spicy = flirty and bold)
- This should read like a real text from a real husband
- Return ONLY the polished message, nothing else`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Polish this draft message:\n\n${draft}` }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Claude API error:', err);
      return jsonResponse({ error: 'AI polish failed' }, 500, env, undefined, requestOrigin);
    }

    const result = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const polished = result.content?.[0]?.text?.trim() || draft;

    return jsonResponse({
      original: draft,
      polished,
      tone,
    }, 200, env, undefined, requestOrigin);

  } catch (err) {
    console.error('Polish error:', err);
    return jsonResponse({ error: 'AI polish failed' }, 500, env, undefined, requestOrigin);
  }
}

/** POST /api/log — save a daily log entry */
async function handleSaveLog(request: Request, subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  // Check free tier
  const subscriber = await env.DB.prepare(
    'SELECT tier FROM subscribers WHERE id = ?'
  ).bind(subscriberId).first();

  if (subscriber?.tier === 'free') {
    return jsonResponse({ error: 'Daily logs require a paid subscription' }, 403, env, undefined, requestOrigin);
  }

  const body = await request.json() as {
    log_text: string;
    tag?: string;
  };

  if (!body.log_text || body.log_text.trim().length < 2) {
    return jsonResponse({ error: 'Log text is required' }, 400, env, undefined, requestOrigin);
  }

  const logText = body.log_text.replace(/[<>]/g, '').slice(0, 280);
  const validTags = ['funny', 'sweet', 'tough', 'win', 'date_night'];
  const tag = body.tag && validTags.includes(body.tag) ? body.tag : null;
  const logDate = new Date().toISOString().split('T')[0];

  await env.DB.prepare(`
    INSERT INTO daily_logs (subscriber_id, log_text, tag, log_date)
    VALUES (?, ?, ?, ?)
  `).bind(subscriberId, logText, tag, logDate).run();

  return jsonResponse({ success: true }, 200, env, undefined, requestOrigin);
}

/** GET /api/log — get recent log entries */
async function handleGetLogs(subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  const logs = await env.DB.prepare(`
    SELECT id, log_text, tag, log_date, created_at FROM daily_logs
    WHERE subscriber_id = ?
    ORDER BY log_date DESC
    LIMIT 30
  `).bind(subscriberId).all();

  return jsonResponse({ logs: logs.results || [] }, 200, env, undefined, requestOrigin);
}

/** GET /api/history — get message composition history */
async function handleGetHistory(url: URL, subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const compositions = await env.DB.prepare(`
    SELECT mc.id, mc.raw_text, mc.polished_text, mc.final_text,
           mc.tone_setting, mc.is_favorite, mc.created_at,
           dp.personalized_nudge as prompt_nudge, pt.theme
    FROM message_compositions mc
    LEFT JOIN daily_prompts dp ON mc.daily_prompt_id = dp.id
    LEFT JOIN prompt_templates pt ON dp.prompt_template_id = pt.id
    WHERE mc.subscriber_id = ?
    ORDER BY mc.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(subscriberId, limit, offset).all();

  // Get total count for pagination
  const total = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM message_compositions WHERE subscriber_id = ?'
  ).bind(subscriberId).first();

  // Get streak (consecutive days with compositions)
  const streak = await calculateStreak(subscriberId, env);

  return jsonResponse({
    compositions: compositions.results || [],
    total: total?.count || 0,
    streak,
  }, 200, env, undefined, requestOrigin);
}

/** Calculate consecutive day streak for a subscriber */
async function calculateStreak(subscriberId: string, env: Env): Promise<number> {
  const days = await env.DB.prepare(`
    SELECT DISTINCT DATE(created_at) as day FROM message_compositions
    WHERE subscriber_id = ?
    ORDER BY day DESC
    LIMIT 365
  `).bind(subscriberId).all();

  if (!days.results || days.results.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Streak must include today or yesterday
  const firstDay = days.results[0].day as string;
  if (firstDay !== today && firstDay !== yesterday) return 0;

  let expectedDate = new Date(firstDay);
  for (const row of days.results) {
    const dayStr = row.day as string;
    const dayDate = new Date(dayStr);
    const expected = expectedDate.toISOString().split('T')[0];
    if (dayStr === expected) {
      streak++;
      expectedDate = new Date(expectedDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return streak;
}

/** GET /api/favorites — get favorited compositions */
async function handleGetFavorites(subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  const favorites = await env.DB.prepare(`
    SELECT mc.id, mc.final_text, mc.tone_setting, mc.created_at,
           dp.personalized_nudge as prompt_nudge, pt.theme
    FROM message_compositions mc
    LEFT JOIN daily_prompts dp ON mc.daily_prompt_id = dp.id
    LEFT JOIN prompt_templates pt ON dp.prompt_template_id = pt.id
    WHERE mc.subscriber_id = ? AND mc.is_favorite = 1
    ORDER BY mc.created_at DESC
  `).bind(subscriberId).all();

  return jsonResponse({ favorites: favorites.results || [] }, 200, env, undefined, requestOrigin);
}

/** POST /api/favorites/:id — toggle favorite on a composition */
async function handleToggleFavorite(compositionId: string, subscriberId: string, env: Env, requestOrigin: string): Promise<Response> {
  // Verify ownership
  const composition = await env.DB.prepare(
    'SELECT id, is_favorite FROM message_compositions WHERE id = ? AND subscriber_id = ?'
  ).bind(compositionId, subscriberId).first();

  if (!composition) {
    return jsonResponse({ error: 'Composition not found' }, 404, env, undefined, requestOrigin);
  }

  const newValue = composition.is_favorite ? 0 : 1;
  await env.DB.prepare(
    'UPDATE message_compositions SET is_favorite = ? WHERE id = ?'
  ).bind(newValue, compositionId).run();

  return jsonResponse({ is_favorite: newValue === 1 }, 200, env, undefined, requestOrigin);
}

/**
 * Scheduled handler - runs daily to generate messages for all active subscribers
 */
async function handleScheduled(env: Env): Promise<void> {
  console.log('Running v2 daily prompt generation...');

  const today = new Date();
  const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get all eligible subscribers:
  // - 'active' (paid) get daily prompts
  // - 'trial' within 7 days get daily prompts
  // - 'free' get weekly (Mondays only)
  const subscribers = await env.DB.prepare(`
    SELECT s.id, s.email, s.phone, s.wife_name, s.nickname, s.theme, s.tier, s.status, s.onboarding_complete,
           rp.wife_name as rp_wife_name, rp.nickname as rp_nickname, rp.anniversary_date, rp.wife_birthday,
           rp.love_language, rp.how_met, rp.years_together
    FROM subscribers s
    LEFT JOIN relationship_profiles rp ON s.id = rp.subscriber_id
    WHERE s.status = 'active'
       OR (s.status = 'trial' AND s.created_at > datetime('now', '-7 days'))
       OR s.tier = 'free'
  `).all();

  if (!subscribers.results || subscribers.results.length === 0) {
    console.log('No eligible subscribers found');
    return;
  }

  console.log(`Found ${subscribers.results.length} eligible subscribers`);

  for (const subscriber of subscribers.results) {
    try {
      // Free tier: only send on Mondays
      if (subscriber.tier === 'free' && subscriber.status !== 'active' && subscriber.status !== 'trial') {
        if (today.getDay() !== 1) continue;
      }

      // Skip if onboarding not complete (no profile yet)
      if (!subscriber.onboarding_complete) continue;

      // Check if we already generated a prompt today
      const existingPrompt = await env.DB.prepare(`
        SELECT id FROM daily_prompts
        WHERE subscriber_id = ? AND DATE(created_at) = ?
      `).bind(subscriber.id, todayDate).first();

      if (existingPrompt) continue;

      // Determine occasion
      let occasion: string | null = getHolidayForDate(today);

      if (subscriber.anniversary_date) {
        const annivMMDD = (subscriber.anniversary_date as string).substring(5);
        if (annivMMDD === todayMMDD) occasion = 'anniversary';
      }

      if (subscriber.wife_birthday) {
        if ((subscriber.wife_birthday as string) === todayMMDD) occasion = 'birthday';
      }

      // Pick theme
      let theme = (subscriber.theme as string) || 'romantic';
      if (theme === 'random') {
        theme = V2_THEMES[Math.floor(Math.random() * V2_THEMES.length)];
      }

      // Get prompt template (occasion first, then theme with 90-day non-repeat)
      let template;
      if (occasion) {
        template = await env.DB.prepare(`
          SELECT * FROM prompt_templates WHERE occasion = ?
          ORDER BY RANDOM() LIMIT 1
        `).bind(occasion).first();
      }

      if (!template) {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        template = await env.DB.prepare(`
          SELECT pt.* FROM prompt_templates pt
          WHERE pt.theme = ? AND pt.occasion IS NULL
            AND pt.id NOT IN (
              SELECT prompt_template_id FROM daily_prompts
              WHERE subscriber_id = ? AND DATE(created_at) > ?
            )
          ORDER BY RANDOM() LIMIT 1
        `).bind(theme, subscriber.id, ninetyDaysAgo).first();

        if (!template) {
          template = await env.DB.prepare(`
            SELECT * FROM prompt_templates WHERE theme = ? AND occasion IS NULL
            ORDER BY RANDOM() LIMIT 1
          `).bind(theme).first();
        }
      }

      if (!template) {
        console.log(`No prompt template found for subscriber ${subscriber.id}`);
        continue;
      }

      // Build profile object for personalization
      const profile = {
        wife_name: subscriber.rp_wife_name || subscriber.wife_name,
        nickname: subscriber.rp_nickname || subscriber.nickname,
        years_together: subscriber.years_together,
      };

      const nudge = personalizeText(template.nudge_text as string, profile);
      const starter = personalizeText(template.starter_text as string, profile);

      // Store daily prompt
      await env.DB.prepare(`
        INSERT INTO daily_prompts (subscriber_id, prompt_template_id, personalized_nudge, personalized_starter, sent_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(subscriber.id, template.id, nudge, starter).run();

      // Send email notification
      if (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) {
        const wifeName = (profile.wife_name || subscriber.wife_name || 'her') as string;
        const safeWifeName = escapeHtml(wifeName);
        const safeNudge = escapeHtml(nudge);
        const safeStarter = escapeHtml(starter);
        const style = getOccasionEmailStyle(occasion);

        const subject = occasion
          ? `${style.emoji} ${style.greeting} Today's prompt for ${wifeName}`
          : `Your daily prompt is ready — say something to ${wifeName}`;

        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://sendmylove.app/sendmylove.app.png" alt="SendMyLove" style="height: 80px;">
              ${occasion ? `<h2 style="color: #e11d48; margin: 10px 0;">${style.emoji} ${escapeHtml(style.greeting)} ${style.emoji}</h2>` : ''}
            </div>
            <div style="background: #fef2f2; padding: 24px; border-radius: 12px; margin-bottom: 16px;">
              <p style="font-size: 16px; color: #6b7280; margin: 0 0 8px 0; font-weight: 600;">Today's question:</p>
              <p style="font-size: 20px; line-height: 1.5; color: #374151; margin: 0;">
                ${safeNudge}
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 2px dashed #d1d5db; margin-bottom: 20px;">
              <p style="font-size: 14px; color: #9ca3af; margin: 0 0 8px 0;">Fill in the blank:</p>
              <p style="font-size: 16px; line-height: 1.5; color: #374151; margin: 0; font-style: italic;">
                "${safeStarter}"
              </p>
            </div>
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://sendmylove.app/dashboard" style="display: inline-block; background: #e11d48; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Complete & Send to ${safeWifeName}
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px; text-align: center;">
              Takes 30 seconds. She'll love it.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              <a href="https://sendmylove.app/dashboard" style="color: #e11d48;">Dashboard</a> |
              <a href="mailto:support@sendmylove.app" style="color: #e11d48;">Unsubscribe</a>
            </p>
          </div>
        `;

        const textContent = `SendMyLove${occasion ? ` - ${style.greeting}` : ''}\n\nToday's question: ${nudge}\n\nFill in the blank:\n"${starter}"\n\nComplete it here: https://sendmylove.app/dashboard\n\nTakes 30 seconds. She'll love it.`;

        const emailResult = await sendEmail(env, subscriber.email as string, subject, htmlContent, textContent);

        if (emailResult.success) {
          console.log(`Prompt email sent to subscriber ${subscriber.id}`);
        } else {
          console.error(`Email failed for ${subscriber.id}:`, emailResult.error);
        }
      }

    } catch (err) {
      console.error(`Error processing subscriber ${subscriber.id}:`, err);
    }
  }

  console.log('Scheduled prompt generation complete');
}

/**
 * Create Stripe Checkout session for subscription
 */
async function handleCreateCheckoutSession(
  subscriberId: string,
  email: string,
  env: Env,
  requestOrigin: string
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
    return jsonResponse({ error: 'Stripe not configured' }, 500, env, undefined, requestOrigin);
  }

  // Get subscriber to check if they already have a Stripe customer
  const subscriber = await env.DB.prepare(
    'SELECT * FROM subscribers WHERE id = ?'
  ).bind(subscriberId).first();

  if (!subscriber) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, env, undefined, requestOrigin);
  }

  // If already active, no need to checkout
  if (subscriber.status === 'active') {
    return jsonResponse({ error: 'Already subscribed' }, 400, env, undefined, requestOrigin);
  }

  try {
    // Create or reuse Stripe customer
    let customerId = subscriber.stripe_customer_id as string | null;

    if (!customerId) {
      // Create new Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email,
          metadata: JSON.stringify({ subscriber_id: subscriberId }),
        }).toString(),
      });

      const customerData = await customerResponse.json() as { id?: string; error?: { message: string } };

      if (!customerResponse.ok || !customerData.id) {
        console.error('Stripe customer creation failed:', customerData);
        return jsonResponse({ error: 'Failed to create customer' }, 500, env, undefined, requestOrigin);
      }

      customerId = customerData.id;

      // Save customer ID to subscriber
      await env.DB.prepare(
        'UPDATE subscribers SET stripe_customer_id = ? WHERE id = ?'
      ).bind(customerId, subscriberId).run();
    }

    // Create Checkout session
    const successUrl = `${env.ALLOWED_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${env.ALLOWED_ORIGIN}/?canceled=true`;

    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'line_items[0][price]': env.STRIPE_PRICE_ID,
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_collection: 'always', // Require card even during trial
        'subscription_data[trial_period_days]': '7',
        'subscription_data[metadata][subscriber_id]': subscriberId,
      }).toString(),
    });

    const sessionData = await sessionResponse.json() as { id?: string; url?: string; error?: { message: string } };

    if (!sessionResponse.ok || !sessionData.url) {
      console.error('Stripe session creation failed:', sessionData);
      return jsonResponse({ error: 'Failed to create checkout session' }, 500, env, undefined, requestOrigin);
    }

    return jsonResponse({
      success: true,
      checkoutUrl: sessionData.url,
      sessionId: sessionData.id,
    }, 200, env, undefined, requestOrigin);

  } catch (error) {
    console.error('Stripe error:', error);
    return jsonResponse({ error: 'Stripe error' }, 500, env, undefined, requestOrigin);
  }
}

/**
 * Handle Stripe webhook events
 */
async function handleStripeWebhook(
  request: Request,
  env: Env,
  requestOrigin: string
): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({ error: 'Stripe not configured' }, 500, env, undefined, requestOrigin);
  }

  const body = await request.text();

  // TODO: Verify webhook signature if STRIPE_WEBHOOK_SECRET is set
  // For now, we'll parse the event directly (less secure but works for MVP)

  let event;
  try {
    event = JSON.parse(body) as {
      type: string;
      data: {
        object: {
          id: string;
          customer?: string;
          status?: string;
          metadata?: { subscriber_id?: string };
          subscription?: string;
        };
      };
    };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, env, undefined, requestOrigin);
  }

  console.log('Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // User completed checkout - subscription is now active
        const session = event.data.object;
        const subscriberId = session.metadata?.subscriber_id;

        if (subscriberId) {
          await env.DB.prepare(`
            UPDATE subscribers
            SET status = 'active', stripe_subscription_id = ?
            WHERE id = ?
          `).bind(session.subscription || session.id, subscriberId).run();
          console.log(`Subscriber ${subscriberId} activated via checkout`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const subscriberId = subscription.metadata?.subscriber_id;

        if (subscriberId && subscription.status === 'active') {
          await env.DB.prepare(`
            UPDATE subscribers SET status = 'active' WHERE id = ?
          `).bind(subscriberId).run();
          console.log(`Subscriber ${subscriberId} subscription active`);
        } else if (subscriberId && subscription.status === 'trialing') {
          // Still in trial - keep as trial status
          console.log(`Subscriber ${subscriberId} in trial`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription cancelled
        const subscription = event.data.object;
        const subscriberId = subscription.metadata?.subscriber_id;

        if (subscriberId) {
          await env.DB.prepare(`
            UPDATE subscribers SET status = 'cancelled' WHERE id = ?
          `).bind(subscriberId).run();
          console.log(`Subscriber ${subscriberId} subscription cancelled`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed - could downgrade or notify
        const invoice = event.data.object;
        console.log(`Payment failed for customer ${invoice.customer}`);
        // Optionally: Update status to 'past_due' or send notification
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return jsonResponse({ received: true }, 200, env, undefined, requestOrigin);
  } catch (error) {
    console.error('Webhook processing error:', error);
    return jsonResponse({ error: 'Webhook processing failed' }, 500, env, undefined, requestOrigin);
  }
}
