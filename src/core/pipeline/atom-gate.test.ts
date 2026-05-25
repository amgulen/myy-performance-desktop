import { describe, expect, it } from 'vitest'
import type { CalculationInputCandidate, PerformanceAtom, PerformanceAtomCandidate } from '../domain/models'
import { evaluateAtomForCalculation } from './atom-gate'

function atom(kind: PerformanceAtom['kind']): PerformanceAtom {
  const base = {
    id: 'atom-1',
    staffId: 'staff-1',
    departmentId: 'department-1',
    projectId: 'project-1',
    projectCategoryId: 'category-1',
    quantity: '1',
    amount: '100.00',
    occurredAt: '2026-05-01T09:00:00+08:00',
    periodId: '2026-05',
    trace: {
      sourceType: 'EXCEL' as const,
      sourceRecordId: 'record-1',
      sourceBatchId: 'batch-1',
      originalBusinessNo: 'business-1'
    }
  }

  if (kind === 'REVERSAL') {
    return { ...base, kind, reversalOfAtomId: 'atom-original' }
  }

  return { ...base, kind }
}

function candidate(issue: PerformanceAtomCandidate['issue']): CalculationInputCandidate {
  return {
    id: 'candidate-1',
    issue,
    trace: {
      sourceType: 'EXCEL',
      sourceRecordId: 'record-1',
      sourceBatchId: 'batch-1',
      originalBusinessNo: 'business-1'
    }
  }
}

describe('evaluateAtomForCalculation', () => {
  it('accepts normalized business and reversal atoms', () => {
    expect(evaluateAtomForCalculation(atom('BUSINESS')).accepted).toBe(true)
    expect(evaluateAtomForCalculation(atom('REVERSAL')).accepted).toBe(true)
  })

  it('keeps a source record with unresolved mapping outside calculation', () => {
    expect(evaluateAtomForCalculation(candidate('PENDING_MAPPING'))).toEqual({
      accepted: false,
      reason: 'PENDING_MAPPING'
    })
  })

  it('keeps a source reversal candidate without an original atom outside calculation', () => {
    expect(evaluateAtomForCalculation(candidate('PENDING_REVERSAL_LINK'))).toEqual({
      accepted: false,
      reason: 'PENDING_REVERSAL_LINK'
    })
  })
})
