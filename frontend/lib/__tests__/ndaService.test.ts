import { acceptNDA, getNDAStatus, hasPlatformAccess, getCurrentNDA } from '../ndaService'
import { getUserIP, getUserAgent, getUserLocale, validateNDAAcceptanceData } from '../utils/ndaUtils'

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      single: jest.fn()
    }))
  })
}))

describe('NDA Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('acceptNDA', () => {
    it('should accept NDA with valid data', async () => {
      const mockUser = { id: 'test-user-id' }
      const mockSupabase = require('@/utils/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      mockSupabase.from().insert.mockResolvedValue({
        error: null
      })

      const result = await acceptNDA({
        nda_title: 'Test NDA',
        nda_pdf_url: 'https://example.com/nda.pdf',
        nda_sha256: 'test-hash'
      })

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return error when user is not authenticated', async () => {
      const mockSupabase = require('@/utils/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: 'Auth error'
      })

      const result = await acceptNDA({
        nda_title: 'Test NDA',
        nda_pdf_url: 'https://example.com/nda.pdf',
        nda_sha256: 'test-hash'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })
  })

  describe('getNDAStatus', () => {
    it('should return NDA status when user has accepted', async () => {
      const mockUser = { id: 'test-user-id' }
      const mockSupabase = require('@/utils/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      mockSupabase.from().eq().order().limit().single.mockResolvedValue({
        data: {
          accepted_at: '2024-01-01T00:00:00Z',
          nda_title: 'Test NDA',
          nda_pdf_url: 'https://example.com/nda.pdf',
          nda_sha256: 'test-hash'
        },
        error: null
      })

      const result = await getNDAStatus()

      expect(result.hasAccepted).toBe(true)
      expect(result.acceptedAt).toBe('2024-01-01T00:00:00Z')
      expect(result.ndaTitle).toBe('Test NDA')
    })

    it('should return not accepted when user has no NDA record', async () => {
      const mockUser = { id: 'test-user-id' }
      const mockSupabase = require('@/utils/supabase/client').createClient()
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      mockSupabase.from().eq().order().limit().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No rows returned
      })

      const result = await getNDAStatus()

      expect(result.hasAccepted).toBe(false)
    })
  })

  describe('getCurrentNDA', () => {
    it('should return current NDA information', async () => {
      const result = await getCurrentNDA()

      expect(result.title).toBe('Non-Disclosure and Use Limitation Agreement')
      expect(result.version).toBe('1.0')
      expect(result.pdf_url).toBeDefined()
      expect(result.sha256).toBeDefined()
    })
  })
})

describe('NDA Utils', () => {
  describe('validateNDAAcceptanceData', () => {
    it('should validate correct data', () => {
      const validData = {
        nda_title: 'Test NDA',
        nda_pdf_url: 'https://example.com/nda.pdf',
        nda_sha256: 'test-hash',
        ip: '127.0.0.1',
        user_agent: 'Test Browser'
      }

      const result = validateNDAAcceptanceData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch missing required fields', () => {
      const invalidData = {
        nda_title: '',
        nda_pdf_url: 'https://example.com/nda.pdf',
        nda_sha256: 'test-hash',
        ip: '127.0.0.1',
        user_agent: 'Test Browser'
      }

      const result = validateNDAAcceptanceData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('NDA title is required')
    })
  })

  describe('getUserAgent', () => {
    it('should return user agent string in browser environment', () => {
      // Mock window object
      Object.defineProperty(window, 'navigator', {
        value: { userAgent: 'Test Browser' },
        writable: true
      })

      const result = getUserAgent()
      expect(result).toBe('Test Browser')
    })
  })

  describe('getUserLocale', () => {
    it('should return user locale in browser environment', () => {
      // Mock window object
      Object.defineProperty(window, 'navigator', {
        value: { language: 'en-US' },
        writable: true
      })

      const result = getUserLocale()
      expect(result).toBe('en-US')
    })
  })
})
