// NDA Service Functions
export {
  acceptNDA,
  getNDAStatus,
  getCurrentNDA,
  hasPlatformAccess,
  type NDAAcceptanceData,
  type NDAStatus,
  type CurrentNDA
} from '../ndaService'

// NDA Hook
export { default as useNDAStatus } from '../hooks/useNDAStatus'

// NDA Utils
export {
  getUserIP,
  getUserAgent,
  getUserLocale,
  generateSimpleHash,
  formatDate,
  validateNDAAcceptanceData
} from '../utils/ndaUtils'


