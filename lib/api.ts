// API client for LoveNotes backend (Cloudflare Worker)

// Production worker URL
const PRODUCTION_API_URL = 'https://lovenotes-api.bmangum1.workers.dev/api';

// Use env var if set, otherwise detect environment
const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? PRODUCTION_API_URL
    : 'http://localhost:8787/api');

export interface SignupData {
  email: string;
  phone: string;
  wifeName: string;
  nickname?: string;
  theme: string;
  frequency: string;
  anniversaryDate?: string;
  wifeBirthday?: string;
}

export interface SignupResponse {
  success: boolean;
  checkoutUrl?: string;
  subscriberId?: string;
  error?: string;
}

export async function submitSignup(data: SignupData): Promise<SignupResponse> {
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Required to receive cross-origin cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Something went wrong' };
    }

    return await response.json();
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Phone number formatting and validation
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

export function validatePhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
