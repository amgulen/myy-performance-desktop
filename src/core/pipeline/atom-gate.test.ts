import { describe, expect, it } from 'vitest'
import type { PerformanceAtom } from '../domain/models'
import { evaluateAtomForCalculation } from './atom-gate'

function atom(processingState: PerformanceAtom['processingState']): PerformanceAtom {
  return {
    id: 'atom-1',
    staffId: 'staff-1',
    departmentId: 'department-1',
    projectId: 'project-1',
    projectCategoryId: 'category-1',
    quantity: '1',
    amount: '100.00',
    occurredAt: '2026-05-01T09:00:00+08:00',
    periodId: '2026-05',
    processingState,
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
    expect(evaluateAtomForCalculation(atom('READY')).accepted).toBe(true)
    expect(evaluateAtomForCalculation(atom('REVERSAL_READY')).accepted).toBe(true)
  })

  it('keeps unresolved mapping outside calculation', () => {
    expect(evaluateAtomForCalculation(atom('PENDING_MAPPING'))).toEqual({
      accepted: false,
      reason: 'PENDING_MAPPING'
    })
  })

  it('keeps an unlinked reversal outside calculation', () => {
    expect(evaluateAtomForCalculation(atom('PENDING_REVERSAL_LINK'))).toEqual({
      accepted: false,
      reason: 'PENDING_REVERSAL_LINK'
    })
  })
})
