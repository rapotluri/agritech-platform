/**
 * Get user's IP address from request headers
 * This function should be used on the server side
 */
export function getUserIPFromHeaders(headers: Headers): string {
  // Check for forwarded headers first (common in production with proxies)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Check for real IP header
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Check for client IP header
  const clientIP = headers.get('x-client-ip');
  if (clientIP) {
    return clientIP;
  }

  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1';
  }

  return 'Unknown';
}

/**
 * Get user agent from request headers
 * This function should be used on the server side
 */
export function getUserAgentFromHeaders(headers: Headers): string {
  const userAgent = headers.get('user-agent');
  return userAgent || 'Unknown';
}

/**
 * Get user's locale from request headers
 * This function should be used on the server side
 */
export function getUserLocaleFromHeaders(headers: Headers): string {
  // Check for Accept-Language header
  const acceptLanguage = headers.get('accept-language');
  if (acceptLanguage) {
    // Parse the Accept-Language header and get the first preferred language
    const languages = acceptLanguage.split(',');
    if (languages.length > 0) {
      const primaryLang = languages[0].split(';')[0].trim();
      return primaryLang;
    }
  }

  // Check for custom locale header
  const locale = headers.get('x-locale');
  if (locale) {
    return locale;
  }

  return 'en-US';
}

/**
 * Get user's IP address
 * Note: This is a placeholder implementation
 * In production, you should get the real IP from the server side
 */
export function getUserIP(): string {
  // TODO: Implement proper IP detection
  // Options:
  // 1. Use a service like ipify.org API
  // 2. Get IP from server-side (recommended)
  // 3. Use environment variable for development
  
  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1' // Local development
  }
  
  // For production, you might want to use a service like:
  // return fetch('https://api.ipify.org?format=json')
  //   .then(response => response.json())
  //   .then(data => data.ip)
  //   .catch(() => 'Unknown')
  
  return 'Unknown'
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent
  }
  return 'Unknown'
}

/**
 * Get user's locale
 */
export function getUserLocale(): string {
  if (typeof window !== 'undefined') {
    return window.navigator.language || 'en-US'
  }
  return 'en-US'
}

/**
 * Generate a simple hash for development/testing
 * In production, use proper SHA-256 hashing
 */
export function generateSimpleHash(content: string): string {
  let hash = 0
  if (content.length === 0) return hash.toString()
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16)
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Validate NDA acceptance data
 */
export function validateNDAAcceptanceData(data: {
  nda_title: string
  nda_pdf_url: string
  nda_sha256: string
  ip: string
  user_agent: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.nda_title || data.nda_title.trim().length === 0) {
    errors.push('NDA title is required')
  }
  
  if (!data.nda_pdf_url || data.nda_pdf_url.trim().length === 0) {
    errors.push('NDA PDF URL is required')
  }
  
  if (!data.nda_sha256 || data.nda_sha256.trim().length === 0) {
    errors.push('NDA SHA-256 hash is required')
  }
  
  if (!data.ip || data.ip.trim().length === 0) {
    errors.push('IP address is required')
  }
  
  if (!data.user_agent || data.user_agent.trim().length === 0) {
    errors.push('User agent is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
