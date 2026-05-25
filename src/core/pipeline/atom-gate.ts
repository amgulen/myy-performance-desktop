import type { CalculationInputCandidate, CandidateIssue } from '../domain/models'

export interface AtomGateDecision {
  accepted: boolean
  reason?: CandidateIssue
}

export function evaluateAtomForCalculation(input: CalculationInputCandidate): AtomGateDecision {
  if ('issue' in input) {
    return { accepted: false, reason: input.issue }
  }

  return { accepted: true }
}
