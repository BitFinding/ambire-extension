import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { Network } from '@ambire-common/interfaces/network'
import { getRpcProvider } from '@ambire-common/services/provider'
import { toBeHex } from 'ethers'

import AlertVertical from '@common/components/AlertVertical'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import { useUnblind } from '@web/hooks/useUnblind'
import { UnblindTransactionRequest } from '@web/utils/unblind'

interface Props {
  accountOp?: AccountOp
  network?: Network
}

/**
 * Component that displays Unblind API analysis for transactions
 */
const UnblindAnalysis: React.FC<Props> = ({ accountOp, network }) => {
  const { t } = useTranslation()
  const { analyzeTransaction, loading, error, result } = useUnblind()
  const hasRequestedRef = useRef<string | null>(null)
  const [fetchedNonce, setFetchedNonce] = useState<bigint | null>(null)

  // Convert AccountOp to Unblind transaction format and create a stable cache key
  const { transactionRequest, cacheKey } = useMemo(() => {
    if (!accountOp || !network || accountOp.calls.length === 0) {
      return { transactionRequest: null, cacheKey: null }
    }

    // Analyze the first call (primary transaction)
    const firstCall = accountOp.calls[0]

    // Convert chainId from bigint to string
    const chainId = accountOp.chainId.toString()

    // Convert value from bigint to hex string
    const value = firstCall.value ? toBeHex(firstCall.value) : '0x0'

    // Use 1M gas (hardcoded) to avoid gas limit issues during analysis
    // This ensures the Unblind API can simulate the transaction without gas constraints
    const GAS_LIMIT_1M = 1000000n
    const gas = toBeHex(GAS_LIMIT_1M)

    // Get gas fees if available (GasFeePayment uses gasPrice, not maxFeePerGas)
    const maxFeePerGas = accountOp.gasFeePayment?.gasPrice
      ? toBeHex(accountOp.gasFeePayment.gasPrice)
      : undefined

    const maxPriorityFeePerGas = accountOp.gasFeePayment?.maxPriorityFeePerGas
      ? toBeHex(accountOp.gasFeePayment.maxPriorityFeePerGas)
      : undefined

    const request: UnblindTransactionRequest = {
      chainId,
      from: accountOp.accountAddr,
      to: firstCall.to || undefined,
      gas,
      value,
      data: firstCall.data || '0x',
      maxFeePerGas,
      maxPriorityFeePerGas
    }

    // Create a stable cache key from the transaction data
    const key = JSON.stringify({
      chainId,
      from: accountOp.accountAddr,
      to: firstCall.to,
      value,
      data: firstCall.data,
      gas
    })

    return { transactionRequest: request, cacheKey: key }
  }, [accountOp, network])

  // Call Unblind API only once per unique transaction
  useEffect(() => {
    if (!transactionRequest || !cacheKey) return

    // Only make request if we haven't already requested for this transaction
    if (hasRequestedRef.current === cacheKey) return

    // Only make request if not currently loading
    if (loading) return

    hasRequestedRef.current = cacheKey
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    analyzeTransaction(transactionRequest)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]) // Only depend on cacheKey to prevent infinite loops

  // Don't render anything if there's no transaction
  if (!transactionRequest) {
    return null
  }

  // Show loading state
  if (loading) {
    return (
      <View style={spacings.mtMd}>
        <Text fontSize={14} style={{ opacity: 0.6 }}>
          {t('Analyzing transaction...')}
        </Text>
      </View>
    )
  }

  // Don't show error state - fail silently
  if (error || !result) {
    return null
  }

  return (
    <View style={spacings.mtMd}>
      {/* Display analysis */}
      {result.analysis && (
        <AlertVertical type="info" size="sm" title={t('Transaction Analysis')}>
          <AlertVertical.Text type="info" size="sm">
            {result.analysis}
          </AlertVertical.Text>
        </AlertVertical>
      )}

      {/* Display warnings if any */}
      {result.warnings && result.warnings.length > 0 && (
        <AlertVertical
          type="warning"
          size="sm"
          title={t('Security Warnings')}
          style={spacings.mtSm}
        >
          {result.warnings.map((warning) => (
            <AlertVertical.Text key={warning} type="warning" size="sm" style={spacings.mbTy}>
              {warning}
            </AlertVertical.Text>
          ))}
        </AlertVertical>
      )}
    </View>
  )
}

export default React.memo(UnblindAnalysis)
