import { useState, useEffect } from 'react'
import { getNDAStatus, hasPlatformAccess, NDAStatus } from '../ndaService'

export function useNDAStatus() {
  const [ndaStatus, setNdaStatus] = useState<NDAStatus>({ hasAccepted: false })
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkNDAStatus()
  }, [])

  const checkNDAStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check both NDA status and platform access
      const [ndaResult, accessResult] = await Promise.all([
        getNDAStatus(),
        hasPlatformAccess()
      ])

      setNdaStatus(ndaResult)
      setHasAccess(accessResult)
    } catch (err) {
      console.error('Error checking NDA status:', err)
      setError('Failed to check NDA status')
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = () => {
    checkNDAStatus()
  }

  return {
    ndaStatus,
    hasAccess,
    loading,
    error,
    refreshStatus,
    // Convenience getters
    isAccepted: ndaStatus.hasAccepted,
    acceptedAt: ndaStatus.acceptedAt,
    ndaTitle: ndaStatus.ndaTitle,
    ndaPdfUrl: ndaStatus.ndaPdfUrl,
    ndaSha256: ndaStatus.ndaSha256,
  }
}

export default useNDAStatus
