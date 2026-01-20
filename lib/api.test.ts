import { describe, it, expect } from 'vitest'
import { validateEmail, validatePhoneNumber, formatPhoneNumber } from './api'

describe('validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.org')).toBe(true)
    expect(validateEmail('user+tag@example.co.uk')).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('invalid@')).toBe(false)
    expect(validateEmail('@domain.com')).toBe(false)
    expect(validateEmail('test@domain')).toBe(false)
  })
})

describe('validatePhoneNumber', () => {
  it('should accept valid 10-digit phone numbers', () => {
    expect(validatePhoneNumber('1234567890')).toBe(true)
    expect(validatePhoneNumber('(123) 456-7890')).toBe(true)
    expect(validatePhoneNumber('123-456-7890')).toBe(true)
    expect(validatePhoneNumber('123.456.7890')).toBe(true)
  })

  it('should reject invalid phone numbers', () => {
    expect(validatePhoneNumber('')).toBe(false)
    expect(validatePhoneNumber('123')).toBe(false)
    expect(validatePhoneNumber('12345678901')).toBe(false) // 11 digits
    expect(validatePhoneNumber('123456789')).toBe(false) // 9 digits
  })
})

describe('formatPhoneNumber', () => {
  it('should format phone numbers correctly', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
    expect(formatPhoneNumber('123456789')).toBe('(123) 456-789') // 9 digits
    expect(formatPhoneNumber('123')).toBe('123') // 3 or fewer digits stay unformatted
    expect(formatPhoneNumber('1234')).toBe('(123) 4') // 4 digits
    expect(formatPhoneNumber('1234567')).toBe('(123) 456-7') // 7 digits
  })

  it('should strip non-digits before formatting', () => {
    expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890')
    expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890')
  })
})
