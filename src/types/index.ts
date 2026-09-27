export type UserRole = 'OFFICER' | 'CONTRACTOR';

export interface MpladsProject {
  projectType?: string;
  id: string; // Document ID: state_constituency_year (or state_constituency)
  state: string;
  constituency: string;
  financialYear: number;
  fundsAvailable: number;
  sanctionedFunds: number;
  actualExpenditure: number;
  worksSanctioned: number;
  worksCompleted: number;
  pendingWorks: number;
  pctCompleted: number;
  pctUtilisation: number;
  expenditureToSanctionedPct: number;
  pendingSharePct: number;
  completionGapPct: number;
  avgSanctionPerWorkLakh: number;
  dataSource: 'CSV_DATASET' | 'DERIVED' | 'SYNTHETIC_DEMO';
  
  // Optional / Synthetic fields for UI compat
  name?: string;
  category?: string;
  district?: string;
  implementingAgency?: string;
  contractor?: string;
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'ACTIVE' | 'DELAYED' | 'UNDER VERIFICATION' | 'VERIFIED' | 'COMPLETED';
  lat?: number;
  lng?: number;
  extractedInvoiceAmount?: number;
  databasePaymentAmount?: number;
  signals?: any[]; // Keep generic for backwards compatibility
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskSignal {
  type: string;
  title: string;
  description: string;
  severity: RiskLevel;
  contribution: number;
  evidence: Record<string, any>;
  sourceField: string;
}

export interface RiskAssessment {
  projectId: string;
  score: number;
  level: RiskLevel;
  confidence: 'LOW' | 'MODERATE' | 'HIGH';
  signals: RiskSignal[];
  calculatedAt: string;
  engineVersion: string;
  source: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  sceneDescription?: string;
  visibleWorkStage?: string;
  confidence?: number;

  storagePath: string;
  source: 'USER_UPLOAD' | 'SYNTHETIC_DEMO';
  uploadedBy: string;
  uploadedAt: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  ocrStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractedText?: string | null;
  extractedFields?: Record<string, any> | null;
  model?: string;
  evidenceSignals?: any[];
  observations?: string[];
  processingError?: string | null;
  uploadedByUid?: string;

  metadata?: Record<string, any>;
}

export interface ProjectImage {
  evidenceSignals?: any[];
  visibleText?: string[];
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  source: 'USER_UPLOAD' | 'SYNTHETIC_DEMO';
  uploadedBy: string;
  uploadedAt: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  sceneDescription?: string;
  visibleWorkStage?: string;
  confidence?: number;
  observations?: string[];
  model?: string;
  metadata?: Record<string, any>;
  similarityResults?: Record<string, any> | null;
  processingError?: string | null;
  uploadedByUid?: string;
}

export interface VerificationCase {
  id: string;
  projectId: string;
  riskAssessmentId: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'VERIFIED' | 'DISMISSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
  signals: RiskSignal[];
  evidenceIds: string[];
  source?: string; // e.g. RULE_ENGINE, ML_ANOMALY
  officerNotes: string;
  decision?: string | null;
  decisionReason?: string | null;
}

export interface ContractorAssignment {
  id: string;
  projectId: string;
  contractorUid: string;
  contractorEmail: string;
  contractorName: string;
  status: 'REQUESTED' | 'ACTIVE' | 'REVOKED';
  requestedAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ContractorUpdate {
  id: string;
  projectId: string;
  contractorUid: string;
  contractorName: string;
  contractorEmail: string;
  weekEnding: string;
  physicalProgress: number;
  previousProgress?: number | null;
  expenditureThisWeek?: number | null;
  workCompleted: string;
  blockers: string;
  nextWeekPlan: string;
  notes?: string;
  photoPath?: string | null;
  photoFileName?: string | null;
  status: 'SUBMITTED';
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  projectId: string;
  caseId?: string;
  action: string;
  actor: string;
  timestamp: string;
  metadata?: Record<string, any>;
}




export * from './ml_types';

export interface InvestigationSummary {
  summary: string;
  keyFindings: string[];
  evidenceToVerify: string[];
  dataLimitations: string[];
  recommendedVerificationSteps: string[];
}
