export type SourceType = 'ABC' | 'EXCEL' | 'MANUAL'

export type AtomProcessingState =
  | 'READY'
  | 'REVERSAL_READY'
  | 'PENDING_MAPPING'
  | 'PENDING_REVERSAL_LINK'

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

export interface PerformanceAtom {
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
  processingState: AtomProcessingState
  reversalOfAtomId?: string
  trace: SourceTrace
}

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
