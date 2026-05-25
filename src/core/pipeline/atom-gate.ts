import type { PerformanceAtom } from '../domain/models'

export interface AtomGateDecision {
  accepted: boolean
  reason?: 'PENDING_MAPPING' | 'PENDING_REVERSAL_LINK'
}

export function evaluateAtomForCalculation(atom: PerformanceAtom): AtomGateDecision {
  if (atom.processingState === 'PENDING_MAPPING') {
    return { accepted: false, reason: 'PENDING_MAPPING' }
  }

  if (atom.processingState === 'PENDING_REVERSAL_LINK') {
    return { accepted: false, reason: 'PENDING_REVERSAL_LINK' }
  }

  return { accepted: true }
}
