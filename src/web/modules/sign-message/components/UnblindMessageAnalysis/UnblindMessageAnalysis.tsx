import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import { isPlainTextMessage } from '@ambire-common/libs/transfer/userRequest'

import AlertVertical from '@common/components/AlertVertical'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import { useUnblind } from '@web/hooks/useUnblind'
import { UnblindMessageRequest } from '@web/utils/unblind'

interface Props {
  messageToSign?: ISignMessageController['messageToSign']
}

/**
 * Component that displays Unblind API analysis for message signatures
 */
const UnblindMessageAnalysis: React.FC<Props> = ({ messageToSign }) => {
  const { t } = useTranslation()
  const { analyzeMessage, loading, error, result } = useUnblind()
  const hasRequestedRef = useRef<string | null>(null)

  // Convert message to Unblind API format and create a stable cache key
  const { messageRequest, cacheKey } = useMemo(() => {
    if (!messageToSign || !messageToSign.content) {
      return { messageRequest: null, cacheKey: null }
    }

    const { content, accountAddr } = messageToSign

    // Determine signature method and data format
    let signatureMethod: UnblindMessageRequest['signatureMethod']
    let data: string | object

    if (isPlainTextMessage(content)) {
      // Personal sign - message is hex string
      signatureMethod = 'personal_sign'
      data = content.message
    } else if (content.kind === 'typedMessage') {
      // EIP-712 typed data - use v4 (most common)
      signatureMethod = 'eth_signTypedData_v4'
      data = {
        domain: content.domain,
        types: content.types,
        primaryType: content.primaryType,
        message: content.message
      }
    } else if (content.kind === 'siwe') {
      // Sign-In with Ethereum - treat as personal_sign
      signatureMethod = 'personal_sign'
      data = content.message
    } else {
      // Skip other message types (authorization-7702)
      return { messageRequest: null, cacheKey: null }
    }

    const request: UnblindMessageRequest = {
      signatureMethod,
      data,
      from: accountAddr
    }

    // Create a stable cache key from the message data
    const key = JSON.stringify({
      signatureMethod,
      data,
      from: accountAddr
    })

    return { messageRequest: request, cacheKey: key }
  }, [messageToSign])

  // Call Unblind API only once per unique message
  useEffect(() => {
    if (!messageRequest || !cacheKey) return

    // Only make request if we haven't already requested for this message
    if (hasRequestedRef.current === cacheKey) return

    // Only make request if not currently loading
    if (loading) return

    hasRequestedRef.current = cacheKey
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    analyzeMessage(messageRequest)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]) // Only depend on cacheKey to prevent infinite loops

  // Don't render anything if there's no message
  if (!messageRequest) {
    return null
  }

  // Show loading state
  if (loading) {
    return (
      <View style={spacings.mtMd}>
        <Text fontSize={14} style={{ opacity: 0.6 }}>
          {t('Analyzing message...')}
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
        <AlertVertical type="info" size="sm" title={t('Message Analysis')}>
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

export default React.memo(UnblindMessageAnalysis)

