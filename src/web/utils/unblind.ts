/**
 * Unblind API service for transaction and message analysis
 * Documentation: https://api.unblind.app/docs
 */

// Use local API for development, or configure via environment variable
const UNBLIND_API_BASE_URL = 'https://api.unblind.app'

export interface UnblindTransactionRequest {
  chainId: string
  from: string
  to?: string
  origin?: string
  gas: string
  value?: string
  data?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce?: string
}

export interface UnblindMessageRequest {
  signatureMethod: 'eth_signTypedData' | 'eth_signTypedData_v3' | 'eth_signTypedData_v4' | 'personal_sign' | 'eth_sign'
  data: string | object
  from?: string
}

export interface UnblindResponse {
  hash: string
  chainId: number
  analysis: string
  warnings: string[]
  messageJSON: string
}

export interface UnblindError {
  success?: boolean
  error: string
  code: string
  details?: object
}

/**
 * Analyze a blockchain transaction using the Unblind API
 */
export async function unblindTransaction(
  transaction: UnblindTransactionRequest,
  apiKey?: string
): Promise<UnblindResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  const response = await fetch(`${UNBLIND_API_BASE_URL}/unblind/transaction`, {
    method: 'POST',
    headers,
    body: JSON.stringify(transaction)
  })

  if (!response.ok) {
    const error: UnblindError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
      code: 'HTTP_ERROR'
    }))
    throw new Error(error.error || `Failed to analyze transaction: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Analyze a message signature request using the Unblind API
 */
export async function unblindMessage(
  message: UnblindMessageRequest,
  apiKey?: string
): Promise<UnblindResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  const response = await fetch(`${UNBLIND_API_BASE_URL}/unblind/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify(message)
  })

  if (!response.ok) {
    const error: UnblindError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
      code: 'HTTP_ERROR'
    }))
    throw new Error(error.error || `Failed to analyze message: ${response.statusText}`)
  }

  return await response.json()
}

