/**
 * LoveNotes API Worker
 * Handles signup, message retrieval, and subscription management
 */

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
}

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

function getCORSHeaders(env: Env): Record<string, string> {
  // Use specific origin in production, allow localhost in development
  const origin = env.ENVIRONMENT === 'production'
    ? env.ALLOWED_ORIGIN || 'https://lovenotes.app'
    : 'http://localhost:3000';

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
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
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
  `).bind(subscriber.theme, subscriberId).first();

  if (!result) {
    // All messages sent, reset and start over
    await env.DB.prepare(
      'DELETE FROM subscriber_message_history WHERE subscriber_id = ?'
    ).bind(subscriberId).run();

    // Get first message
    const firstResult = await env.DB.prepare(`
      SELECT id, theme, occasion, content
      FROM messages
      WHERE theme = ? AND occasion IS NULL
      ORDER BY id
      LIMIT 1
    `).bind(subscriber.theme).first();

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
