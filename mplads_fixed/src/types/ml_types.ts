export interface HistoricalObservation {
  anomalyDetected?: boolean;
  featureSnapshot?: Record<string, any>;
  modelVersion?: string;
  id: string; // constituency_year
  constituency: string;
  state: string;
  financialYear: number;
  anomalyScore: number;
  isAnomaly: boolean;
  mlRiskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string[];
  features: {
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
  };
}

export interface MlSummaryStats {
  totalObservations: number;
  anomaliesDetected: number;
  criticalAnomalies: number;
  highAnomalies: number;
}
