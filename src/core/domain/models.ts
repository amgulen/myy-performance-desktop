export type SourceType = 'ABC' | 'EXCEL' | 'MANUAL'

export type RuleType =
  | 'FIXED_PERCENTAGE'
  | 'DYNAMIC_POINTS'
  | 'FIXED_AMOUNT'
  | 'PIECE_RATE'
  | 'THRESHOLD'
  | 'SCORE'
  | 'PENALTY'
  | 'MANUAL_ADJUSTMENT'

export interface SourceTrace {
  sourceType: SourceType
  sourceRecordId: string
  sourceBatchId: string
  originalBusinessNo: string
  originalLineNo?: string
}

interface PerformanceAtomBase {
  id: string
  staffId: string
  departmentId: string
  positionId?: string
  projectId: string
  projectCategoryId: string
  quantity: string
  amount: string
  occurredAt: string
  periodId: string
  trace: SourceTrace
}

export interface BusinessPerformanceAtom extends PerformanceAtomBase {
  kind: 'BUSINESS'
}

export interface ReversalPerformanceAtom extends PerformanceAtomBase {
  kind: 'REVERSAL'
  reversalOfAtomId: string
}

export type PerformanceAtom = BusinessPerformanceAtom | ReversalPerformanceAtom

export type CandidateIssue = 'PENDING_MAPPING' | 'PENDING_REVERSAL_LINK'

export interface PerformanceAtomCandidate {
  id: string
  issue: CandidateIssue
  trace: SourceTrace
}

export type CalculationInputCandidate = PerformanceAtom | PerformanceAtomCandidate

export interface RuleVersion {
  id: string
  ruleId: string
  version: string
  type: RuleType
  effectiveFrom: string
  effectiveTo?: string
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  parameters: Readonly<Record<string, unknown>>
  changeReason: string
}

export interface CalculationBatch {
  id: string
  periodId: string
  status: 'DRAFT' | 'CALCULATING' | 'CALCULATED' | 'LOCKED'
  createdAt: string
}
