import { useState, useCallback, useRef } from 'react'

import { unblindTransaction, unblindMessage, UnblindTransactionRequest, UnblindMessageRequest, UnblindResponse } from '@web/utils/unblind'

const UNBLIND_API_KEY = process.env.REACT_APP_UNBLIND_API_KEY

interface UseUnblindReturn {
  analyzeTransaction: (transaction: UnblindTransactionRequest) => Promise<UnblindResponse | null>
  analyzeMessage: (message: UnblindMessageRequest) => Promise<UnblindResponse | null>
  loading: boolean
  error: string | null
  result: UnblindResponse | null
}

/**
 * React hook for using the Unblind API to analyze transactions and messages
 */
export function useUnblind(): UseUnblindReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UnblindResponse | null>(null)
  const lastRequestRef = useRef<string | null>(null)
  const lastResultRef = useRef<UnblindResponse | null>(null)

  const analyzeTransaction = useCallback(
    async (transaction: UnblindTransactionRequest): Promise<UnblindResponse | null> => {
      // Create a cache key from transaction data
      const cacheKey = JSON.stringify(transaction)
      
      // Skip if this is the same request and we already have a result
      if (lastRequestRef.current === cacheKey && lastResultRef.current) {
        setResult(lastResultRef.current)
        return lastResultRef.current
      }

      // Don't make duplicate requests
      if (lastRequestRef.current === cacheKey && loading) {
        return lastResultRef.current
      }

      setLoading(true)
      setError(null)
      lastRequestRef.current = cacheKey

      try {
        const response = await unblindTransaction(transaction, UNBLIND_API_KEY)
        setResult(response)
        lastResultRef.current = response
        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        // Don't throw - return null so UI can handle gracefully
        return null
      } finally {
        setLoading(false)
      }
    },
    [loading]
  )

  const analyzeMessage = useCallback(
    async (message: UnblindMessageRequest): Promise<UnblindResponse | null> => {
      // Create a cache key from message data
      const cacheKey = JSON.stringify(message)
      
      // Skip if this is the same request and we already have a result
      if (lastRequestRef.current === cacheKey && lastResultRef.current) {
        setResult(lastResultRef.current)
        return lastResultRef.current
      }

      // Don't make duplicate requests
      if (lastRequestRef.current === cacheKey && loading) {
        return lastResultRef.current
      }

      setLoading(true)
      setError(null)
      lastRequestRef.current = cacheKey

      try {
        const response = await unblindMessage(message, UNBLIND_API_KEY)
        setResult(response)
        lastResultRef.current = response
        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        // Don't throw - return null so UI can handle gracefully
        return null
      } finally {
        setLoading(false)
      }
    },
    [loading]
  )

  return {
    analyzeTransaction,
    analyzeMessage,
    loading,
    error,
    result
  }
}

