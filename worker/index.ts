/**
 * LoveNotes API Worker
 * Handles signup, message retrieval, and subscription management
 * Plus scheduled daily message generation
 */

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
}

// Available themes for random selection
const THEMES = ['romantic', 'funny', 'appreciative', 'encouraging'];

interface SignupRequest {
  email: string;
  phone: string;
  wifeName: string;
  theme: string;
  frequency: string;
  anniversaryDate?: string;
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
  'https://lovenotes.app',
];

// Store current request origin for CORS (set per-request)
let currentRequestOrigin = '';

function getCORSHeaders(env: Env): Record<string, string> {
  // Check if current request origin is allowed
  const origin = ALLOWED_ORIGINS.includes(currentRequestOrigin)
    ? currentRequestOrigin
    : (env.ALLOWED_ORIGIN || ALLOWED_ORIGINS[0]);

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function jsonResponse(data: unknown, status = 200, env?: Env, cookies?: string[]) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(env ? getCORSHeaders(env) : {}),
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
        from: { email: env.SENDGRID_FROM_EMAIL, name: 'LoveNotes' },
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

    // Set current request origin for CORS
    currentRequestOrigin = request.headers.get('Origin') || '';
    const corsHeaders = getCORSHeaders(env);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Public routes (no auth required)
      if (url.pathname === '/api/signup' && request.method === 'POST') {
        return handleSignup(request, env);
      }

      if (url.pathname === '/api/messages/random' && request.method === 'GET') {
        return handleRandomMessage(url, env);
      }

      if (url.pathname === '/api/health') {
        return jsonResponse({ status: 'ok', environment: env.ENVIRONMENT }, 200, env);
      }

      // Test endpoint - only available in development
      if (url.pathname === '/api/test/create-user' && request.method === 'POST') {
        if (env.ENVIRONMENT === 'production') {
          return jsonResponse({ error: 'Not available in production' }, 403, env);
        }
        return handleCreateTestUser(request, env);
      }

      // Test endpoint to trigger message send for a subscriber
      if (url.pathname === '/api/test/send-message' && request.method === 'POST') {
        if (env.ENVIRONMENT === 'production') {
          return jsonResponse({ error: 'Not available in production' }, 403, env);
        }
        return handleTestSendMessage(request, env);
      }

      // Protected routes (auth required)
      const token = getAuthToken(request);
      if (!token) {
        return jsonResponse({ error: 'Authentication required' }, 401, env);
      }

      const jwtSecret = env.JWT_SECRET || 'dev-secret-change-in-production';
      const payload = await verifyJWT(token, jwtSecret);
      if (!payload) {
        return jsonResponse({ error: 'Invalid or expired token' }, 401, env);
      }

      // Pass authenticated subscriber ID to handlers
      if (url.pathname === '/api/messages/next' && request.method === 'GET') {
        return handleNextMessage(payload.sub, env);
      }

      if (url.pathname === '/api/subscriber' && request.method === 'GET') {
        return handleGetSubscriber(payload.sub, env);
      }

      return jsonResponse({ error: 'Not found' }, 404, env);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, env);
    }
  },

  // Scheduled handler - runs daily at 8am to send messages
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  },
};

async function handleSignup(request: Request, env: Env): Promise<Response> {
  const body: SignupRequest = await request.json();

  // Validate required fields
  if (!body.email || !body.phone || !body.wifeName) {
    return jsonResponse({ success: false, error: 'Missing required fields' }, 400, env);
  }

  // Validate email format (stricter than frontend)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(body.email)) {
    return jsonResponse({ success: false, error: 'Invalid email format' }, 400, env);
  }

  // Validate phone (10 digits)
  const phoneDigits = body.phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    return jsonResponse({ success: false, error: 'Invalid phone number' }, 400, env);
  }

  // Sanitize wife's name (alphanumeric, spaces, common punctuation only)
  const sanitizedWifeName = body.wifeName.replace(/[^a-zA-Z0-9\s'-]/g, '').slice(0, 50);
  if (!sanitizedWifeName) {
    return jsonResponse({ success: false, error: 'Invalid name' }, 400, env);
  }

  // Check if email already exists
  const existing = await env.DB.prepare(
    'SELECT id FROM subscribers WHERE email = ?'
  ).bind(body.email).first();

  if (existing) {
    return jsonResponse({ success: false, error: 'Email already registered' }, 400, env);
  }

  // Create subscriber
  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO subscribers (id, email, phone, wife_name, theme, frequency, anniversary_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'trial')
  `).bind(
    id,
    body.email,
    phoneDigits, // Store only digits
    sanitizedWifeName,
    body.theme || 'romantic',
    body.frequency || 'daily',
    body.anniversaryDate || null
  ).run();

  // Generate JWT token (expires in 30 days)
  const jwtSecret = env.JWT_SECRET || 'dev-secret-change-in-production';
  const token = await signJWT({
    sub: id,
    email: body.email,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  }, jwtSecret);

  // Set httpOnly cookie
  const isProduction = env.ENVIRONMENT === 'production';
  const cookieOptions = [
    `lovenotes_auth=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${30 * 24 * 60 * 60}`, // 30 days
    'SameSite=Lax',
    isProduction ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  const successUrl = `/success?name=${encodeURIComponent(sanitizedWifeName)}`;

  return jsonResponse({
    success: true,
    checkoutUrl: successUrl,
    subscriberId: id,
  }, 200, env, [cookieOptions]);
}

async function handleRandomMessage(url: URL, env: Env): Promise<Response> {
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
    return jsonResponse({ error: 'No messages found' }, 404, env);
  }

  // Replace placeholder with sanitized name
  const content = (result.content as string).replace(/{wife_name}/g, sanitizedName);

  return jsonResponse({
    id: result.id,
    theme: result.theme,
    content,
  }, 200, env);
}

async function handleNextMessage(subscriberId: string, env: Env): Promise<Response> {
  // Get subscriber (already authenticated via JWT)
  const subscriber = await env.DB.prepare(
    'SELECT * FROM subscribers WHERE id = ?'
  ).bind(subscriberId).first();

  if (!subscriber) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, env);
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
      return jsonResponse({ error: 'No messages found' }, 404, env);
    }

    const content = (firstResult.content as string).replace(/{wife_name}/g, subscriber.wife_name as string);

    return jsonResponse({
      id: firstResult.id,
      theme: firstResult.theme,
      content,
      wifeName: subscriber.wife_name,
      cycleReset: true,
    }, 200, env);
  }

  // Replace placeholder
  const content = (result.content as string).replace(/{wife_name}/g, subscriber.wife_name as string);

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
  }, 200, env);
}

async function handleGetSubscriber(subscriberId: string, env: Env): Promise<Response> {
  // Already authenticated via JWT - just fetch the subscriber data
  const subscriber = await env.DB.prepare(
    'SELECT * FROM subscribers WHERE id = ?'
  ).bind(subscriberId).first();

  if (!subscriber) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, env);
  }

  // Get message history count
  const historyCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM subscriber_message_history WHERE subscriber_id = ?'
  ).bind(subscriber.id).first();

  return jsonResponse({
    ...subscriber,
    messagesReceived: historyCount?.count || 0,
  }, 200, env);
}

async function handleCreateTestUser(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { email?: string; wifeName?: string; theme?: string };

  const id = generateId();
  const email = body.email || `test-${Date.now()}@example.com`;
  const wifeName = body.wifeName || 'Bari';
  const theme = body.theme || 'romantic';

  await env.DB.prepare(`
    INSERT INTO subscribers (id, email, phone, wife_name, theme, frequency, status)
    VALUES (?, ?, ?, ?, ?, 'daily', 'active')
  `).bind(id, email, '5551234567', wifeName, theme).run();

  // Generate JWT for test user too
  const jwtSecret = env.JWT_SECRET || 'dev-secret-change-in-production';
  const token = await signJWT({
    sub: id,
    email: email,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
  }, jwtSecret);

  return jsonResponse({
    success: true,
    subscriber: {
      id,
      email,
      wifeName,
      theme,
    },
    token, // Return token for testing
  }, 200, env);
}

// Test endpoint to manually trigger a message send
async function handleTestSendMessage(request: Request, env: Env): Promise<Response> {
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
    return jsonResponse({ error: 'Provide email or subscriberId' }, 400, env);
  }

  if (!subscriber) {
    return jsonResponse({ error: 'Subscriber not found' }, 404, env);
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
    return jsonResponse({ error: 'No messages found' }, 404, env);
  }

  const content = (message.content as string).replace(/{wife_name}/g, subscriber.wife_name as string);

  // Log the send
  const sendId = generateId();
  await env.DB.prepare(`
    INSERT INTO send_log (id, subscriber_id, message_id, status)
    VALUES (?, ?, ?, 'pending')
  `).bind(sendId, subscriber.id, message.id).run();

  // Try to send via email (since this is for testing)
  if (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) {
    const subject = `💕 Today's LoveNote for ${subscriber.wife_name}`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px;">💕</span>
          <h1 style="color: #e11d48; margin: 10px 0;">LoveNotes</h1>
        </div>
        <div style="background: linear-gradient(135deg, #fef2f2, #fdf4ff); padding: 24px; border-radius: 12px; margin-bottom: 20px;">
          <p style="font-size: 18px; line-height: 1.6; color: #374151; margin: 0;">
            ${content}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Copy this message and send it to ${subscriber.wife_name} from your phone 📱
        </p>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          Theme: ${messageTheme} | This is a test message
        </p>
      </div>
    `;
    const textContent = `💕 LoveNotes\n\n${content}\n\nCopy this message and send it to ${subscriber.wife_name} from your phone.\n\nTheme: ${messageTheme}`;

    const emailResult = await sendEmail(env, subscriber.email as string, subject, htmlContent, textContent);

    if (emailResult.success) {
      await env.DB.prepare(`UPDATE send_log SET status = 'sent' WHERE id = ?`).bind(sendId).run();
      return jsonResponse({
        success: true,
        method: 'email',
        to: subscriber.email,
        theme: messageTheme,
        content,
      }, 200, env);
    } else {
      await env.DB.prepare(`UPDATE send_log SET status = 'failed', error_message = ? WHERE id = ?`)
        .bind(emailResult.error || 'Unknown', sendId).run();
      return jsonResponse({
        success: false,
        error: emailResult.error,
        content, // Still return content so you can see what would have been sent
      }, 500, env);
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
  }, 200, env);
}

/**
 * Scheduled handler - runs daily to generate messages for all active subscribers
 */
async function handleScheduled(env: Env): Promise<void> {
  console.log('Running scheduled message generation...');

  // Get today's date in MM-DD format for anniversary checking
  const today = new Date();
  const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get all active subscribers who should receive messages today
  const subscribers = await env.DB.prepare(`
    SELECT id, email, phone, wife_name, theme, frequency, anniversary_date, wife_birthday
    FROM subscribers
    WHERE status IN ('active', 'trial')
  `).all();

  if (!subscribers.results || subscribers.results.length === 0) {
    console.log('No active subscribers found');
    return;
  }

  for (const subscriber of subscribers.results) {
    try {
      // Check frequency - skip if not due
      if (subscriber.frequency === 'weekly') {
        // Send on Sundays only
        if (today.getDay() !== 0) continue;
      } else if (subscriber.frequency === 'bi-weekly') {
        // Send on 1st and 15th of month
        if (today.getDate() !== 1 && today.getDate() !== 15) continue;
      }

      // Determine if today is a special occasion
      let occasionType: string | null = null;
      let messageTheme = subscriber.theme as string;

      // Check anniversary (format: YYYY-MM-DD)
      if (subscriber.anniversary_date) {
        const annivMMDD = (subscriber.anniversary_date as string).substring(5);
        if (annivMMDD === todayMMDD) {
          occasionType = 'anniversary';
        }
      }

      // Check birthday (format: YYYY-MM-DD)
      if (subscriber.wife_birthday) {
        const bdayMMDD = (subscriber.wife_birthday as string).substring(5);
        if (bdayMMDD === todayMMDD) {
          occasionType = 'birthday';
        }
      }

      // Get message - either occasion-specific or random theme
      let message;
      if (occasionType) {
        // Get occasion-specific message
        message = await env.DB.prepare(`
          SELECT id, theme, occasion, content
          FROM messages
          WHERE occasion = ?
          ORDER BY RANDOM()
          LIMIT 1
        `).bind(occasionType).first();
      }

      // If no occasion message or not a special day, get a random-themed message
      if (!message) {
        // Pick random theme for variety (user can always get their preferred in dashboard)
        const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
        messageTheme = randomTheme;

        message = await env.DB.prepare(`
          SELECT m.id, m.theme, m.occasion, m.content
          FROM messages m
          WHERE m.theme = ?
            AND m.occasion IS NULL
            AND m.id NOT IN (
              SELECT message_id FROM subscriber_message_history WHERE subscriber_id = ?
            )
          ORDER BY RANDOM()
          LIMIT 1
        `).bind(randomTheme, subscriber.id).first();

        // If all messages seen, reset history and get one
        if (!message) {
          await env.DB.prepare(
            'DELETE FROM subscriber_message_history WHERE subscriber_id = ?'
          ).bind(subscriber.id).run();

          message = await env.DB.prepare(`
            SELECT id, theme, occasion, content
            FROM messages
            WHERE theme = ? AND occasion IS NULL
            ORDER BY RANDOM()
            LIMIT 1
          `).bind(randomTheme).first();
        }
      }

      if (!message) {
        console.log(`No message found for subscriber ${subscriber.id}`);
        continue;
      }

      // Replace placeholder with wife's name
      const content = (message.content as string).replace(/{wife_name}/g, subscriber.wife_name as string);

      // Record the message in send_log
      const sendId = generateId();
      await env.DB.prepare(`
        INSERT INTO send_log (id, subscriber_id, message_id, status)
        VALUES (?, ?, ?, 'pending')
      `).bind(sendId, subscriber.id, message.id).run();

      // Record in history to prevent repeats
      await env.DB.prepare(`
        INSERT OR IGNORE INTO subscriber_message_history (subscriber_id, message_id)
        VALUES (?, ?)
      `).bind(subscriber.id, message.id).run();

      // Send via Twilio SMS if configured
      if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
        try {
          const twilioResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: `+1${subscriber.phone}`,
                From: env.TWILIO_PHONE_NUMBER,
                Body: `💕 Today's LoveNote for ${subscriber.wife_name}:\n\n${content}\n\n(Reply STOP to unsubscribe)`,
              }).toString(),
            }
          );

          const twilioResult = await twilioResponse.json() as { sid?: string; error_message?: string };

          if (twilioResponse.ok && twilioResult.sid) {
            await env.DB.prepare(`
              UPDATE send_log SET status = 'sent', twilio_sid = ? WHERE id = ?
            `).bind(twilioResult.sid, sendId).run();
            console.log(`SMS sent to subscriber ${subscriber.id}`);
          } else {
            await env.DB.prepare(`
              UPDATE send_log SET status = 'failed', error_message = ? WHERE id = ?
            `).bind(twilioResult.error_message || 'Unknown error', sendId).run();
            console.error(`SMS failed for ${subscriber.id}:`, twilioResult.error_message);
          }
        } catch (twilioError) {
          await env.DB.prepare(`
            UPDATE send_log SET status = 'failed', error_message = ? WHERE id = ?
          `).bind(String(twilioError), sendId).run();
          console.error(`Twilio error for ${subscriber.id}:`, twilioError);
        }
      }
      // Fallback to SendGrid email if Twilio not configured
      else if (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) {
        const subject = occasionType
          ? `💕 Happy ${occasionType.charAt(0).toUpperCase() + occasionType.slice(1)}! A special LoveNote for ${subscriber.wife_name}`
          : `💕 Today's LoveNote for ${subscriber.wife_name}`;

        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 48px;">💕</span>
              <h1 style="color: #e11d48; margin: 10px 0;">LoveNotes</h1>
            </div>
            <div style="background: linear-gradient(135deg, #fef2f2, #fdf4ff); padding: 24px; border-radius: 12px; margin-bottom: 20px;">
              <p style="font-size: 18px; line-height: 1.6; color: #374151; margin: 0;">
                ${content}
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Copy this message and send it to ${subscriber.wife_name} from your phone 📱
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              <a href="https://app-lovenotes-nextjs.pages.dev/dashboard" style="color: #e11d48;">View Dashboard</a> |
              <a href="mailto:support@lovenotes.app" style="color: #e11d48;">Unsubscribe</a>
            </p>
          </div>
        `;

        const textContent = `💕 LoveNotes\n\n${content}\n\nCopy this message and send it to ${subscriber.wife_name} from your phone.\n\nView Dashboard: https://app-lovenotes-nextjs.pages.dev/dashboard`;

        const emailResult = await sendEmail(env, subscriber.email as string, subject, htmlContent, textContent);

        if (emailResult.success) {
          await env.DB.prepare(`
            UPDATE send_log SET status = 'sent' WHERE id = ?
          `).bind(sendId).run();
          console.log(`Email sent to subscriber ${subscriber.id}`);
        } else {
          await env.DB.prepare(`
            UPDATE send_log SET status = 'failed', error_message = ? WHERE id = ?
          `).bind(emailResult.error || 'Email failed', sendId).run();
          console.error(`Email failed for ${subscriber.id}:`, emailResult.error);
        }
      }
      // Neither configured - mark as ready for manual send
      else {
        await env.DB.prepare(`
          UPDATE send_log SET status = 'ready' WHERE id = ?
        `).bind(sendId).run();
        console.log(`Message queued for subscriber ${subscriber.id} (no SMS/email configured)`);
      }

    } catch (err) {
      console.error(`Error processing subscriber ${subscriber.id}:`, err);
    }
  }

  console.log('Scheduled message generation complete');
}
