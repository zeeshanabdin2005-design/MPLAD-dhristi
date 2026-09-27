import { MpladsProject, RiskAssessment, RiskSignal } from '../types';

export const ENGINE_VERSION = '3.0.0';

export const RISK_WEIGHTS = {
  progressMismatch: 35,
  pendingWorkAnomaly: 25,
  financialAnomaly: 20,
  outlierSanction: 20
};

export const RISK_THRESHOLDS = {
  LOW_MAX: 29,
  MEDIUM_MAX: 59,
  // HIGH is 60+
};

/**
 * Calculates a percentile for a value given a sorted array of values.
 */
function calculatePercentile(val: number, sortedArray: number[]): number {
  if (sortedArray.length === 0) return 0;
  const index = sortedArray.findIndex(v => v >= val);
  if (index === -1) return 100;
  return Math.round((index / sortedArray.length) * 100);
}

/**
 * Main Deterministic Risk Calculation Function
 * @param project The project to analyze
 * @param allProjects Context for percentile/outlier detection
 */
export function calculateRisk(project: MpladsProject, allProjects: MpladsProject[] = []): RiskAssessment {
  let score = 0;
  const signals: RiskSignal[] = [];
  
  let confidence: 'LOW' | 'MODERATE' | 'HIGH' = 'HIGH';
  const missingFields: string[] = [];
  
  if (project.pctCompleted === undefined) missingFields.push('pctCompleted');
  if (project.pctUtilisation === undefined) missingFields.push('pctUtilisation');
  if (project.sanctionedFunds === undefined) missingFields.push('sanctionedFunds');
  
  if (missingFields.length > 0) {
    confidence = 'LOW';
    signals.push({
      type: 'Data Quality Warning',
      title: 'Missing Required Execution Data',
      description: `Required numerical fields (${missingFields.join(', ')}) are missing; risk assessment confidence is reduced.`,
      severity: 'LOW',
      contribution: 0,
      evidence: { missingFields },
      sourceField: 'data_completeness'
    });
  } else if (project.worksSanctioned === 0 || project.sanctionedFunds === 0) {
    confidence = 'MODERATE';
    signals.push({
      type: 'Data Quality Warning',
      title: 'Zero Denominator in Execution Data',
      description: `Project has 0 works sanctioned or 0 sanctioned funds, making utilization metrics unreliable.`,
      severity: 'LOW',
      contribution: 0,
      evidence: { worksSanctioned: project.worksSanctioned, sanctionedFunds: project.sanctionedFunds },
      sourceField: 'worksSanctioned'
    });
  }

  // 1. Progress Mismatch (Up to 35 pts)
  let gap = project.completionGapPct !== undefined ? project.completionGapPct : (project.pctUtilisation || 0) - (project.pctCompleted || 0);
  
  if (gap > 40) {
    score += RISK_WEIGHTS.progressMismatch;
    signals.push({
      type: 'Progress Mismatch',
      title: 'Critical Progress Mismatch',
      description: `Financial utilization is substantially ahead of physical completion by ${gap.toFixed(1)} percentage points.`,
      severity: 'CRITICAL',
      contribution: RISK_WEIGHTS.progressMismatch,
      evidence: { pctUtilisation: project.pctUtilisation, pctCompleted: project.pctCompleted, gap },
      sourceField: 'completionGapPct'
    });
  } else if (gap > 20) {
    let pts = Math.round(RISK_WEIGHTS.progressMismatch * 0.6);
    score += pts;
    signals.push({
      type: 'Progress Mismatch',
      title: 'Moderate Progress Mismatch',
      description: `Financial utilization is somewhat ahead of physical completion by ${gap.toFixed(1)} percentage points.`,
      severity: 'MEDIUM',
      contribution: pts,
      evidence: { pctUtilisation: project.pctUtilisation, pctCompleted: project.pctCompleted, gap },
      sourceField: 'completionGapPct'
    });
  }

  // 2. Pending Work Anomaly (Up to 25 pts)
  let pendingShare = project.pendingSharePct || 0;
  if (allProjects.length > 10) {
    const sortedPending = allProjects.map(p => p.pendingSharePct || 0).sort((a,b) => a - b);
    const percentile = calculatePercentile(pendingShare, sortedPending);
    
    if (percentile > 90 && pendingShare > 30) {
      score += RISK_WEIGHTS.pendingWorkAnomaly;
      signals.push({
        type: 'Pending Work Anomaly',
        title: 'Unusually High Pending Work',
        description: `Pending work share is unusually high relative to the dataset (${percentile}th percentile).`,
        severity: 'HIGH',
        contribution: RISK_WEIGHTS.pendingWorkAnomaly,
        evidence: { pendingSharePct: pendingShare, percentile },
        sourceField: 'pendingSharePct'
      });
    } else if (percentile > 75 && pendingShare > 20) {
      let pts = Math.round(RISK_WEIGHTS.pendingWorkAnomaly * 0.5);
      score += pts;
      signals.push({
        type: 'Pending Work Anomaly',
        title: 'Elevated Pending Work',
        description: `Pending work share is elevated compared to historical peers.`,
        severity: 'MEDIUM',
        contribution: pts,
        evidence: { pendingSharePct: pendingShare, percentile },
        sourceField: 'pendingSharePct'
      });
    }
  } else {
    if (pendingShare > 50) {
      score += RISK_WEIGHTS.pendingWorkAnomaly;
      signals.push({
        type: 'Pending Work Anomaly',
        title: 'High Pending Work',
        description: `More than half of the works are pending.`,
        severity: 'HIGH',
        contribution: RISK_WEIGHTS.pendingWorkAnomaly,
        evidence: { pendingSharePct: pendingShare },
        sourceField: 'pendingSharePct'
      });
    }
  }

  // 3. Financial Utilization Anomaly (Up to 20 pts)
  let expToSanction = project.expenditureToSanctionedPct !== undefined ? project.expenditureToSanctionedPct : 
                      (project.sanctionedFunds > 0 ? (project.actualExpenditure / project.sanctionedFunds * 100) : 0);
  
  if (expToSanction > 110) {
    score += RISK_WEIGHTS.financialAnomaly;
    signals.push({
      type: 'Financial Utilization Anomaly',
      title: 'Over-expenditure Detected',
      description: `Actual expenditure exceeds sanctioned funds by ${Math.round(expToSanction - 100)}%.`,
      severity: 'HIGH',
      contribution: RISK_WEIGHTS.financialAnomaly,
      evidence: { actualExpenditure: project.actualExpenditure, sanctionedFunds: project.sanctionedFunds, expToSanction },
      sourceField: 'expenditureToSanctionedPct'
    });
  } else if (expToSanction > 100) {
    let pts = Math.round(RISK_WEIGHTS.financialAnomaly * 0.5);
    score += pts;
    signals.push({
      type: 'Financial Utilization Anomaly',
      title: 'Expenditure Exceeds Sanction',
      description: `Actual expenditure slightly exceeds sanctioned funds.`,
      severity: 'MEDIUM',
      contribution: pts,
      evidence: { actualExpenditure: project.actualExpenditure, sanctionedFunds: project.sanctionedFunds, expToSanction },
      sourceField: 'expenditureToSanctionedPct'
    });
  }

  // 4. Outlier Sanction Amount (Up to 20 pts)
  let avgSanction = project.avgSanctionPerWorkLakh || 0;
  if (allProjects.length > 10 && avgSanction > 0) {
    const sortedSanction = allProjects.map(p => p.avgSanctionPerWorkLakh || 0).filter(v => v > 0).sort((a,b) => a - b);
    const percentile = calculatePercentile(avgSanction, sortedSanction);
    
    if (percentile > 95) {
      score += RISK_WEIGHTS.outlierSanction;
      signals.push({
        type: 'Outlier Sanction Amount',
        title: 'Statistically Unusual Sanction Amount',
        description: `Average sanction per work is significantly higher than historical peers (${percentile}th percentile).`,
        severity: 'HIGH',
        contribution: RISK_WEIGHTS.outlierSanction,
        evidence: { avgSanctionPerWorkLakh: avgSanction, percentile },
        sourceField: 'avgSanctionPerWorkLakh'
      });
    }
  }

  // Synthesize legacy project fields for backward compatibility if it's a synthetic demo
  if (project.dataSource === 'SYNTHETIC_DEMO' && project.signals && project.signals.length > 0) {
    project.signals.forEach(legacySig => {
       if (['GIS Proximity', 'Image Similarity', 'Document Discrepancy'].includes(legacySig.type)) {
          let pts = legacySig.contribution || 15;
          score += pts;
          signals.push({
             type: legacySig.type,
             title: `Synthetic Demo: ${legacySig.type}`,
             description: legacySig.description,
             severity: legacySig.level as any,
             contribution: pts,
             evidence: legacySig.metadata || {},
             sourceField: 'synthetic_legacy'
          });
       }
    });
  }

  score = Math.min(100, Math.max(0, score));
  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (score > 80) level = 'CRITICAL';
  else if (score > RISK_THRESHOLDS.MEDIUM_MAX) level = 'HIGH';
  else if (score > RISK_THRESHOLDS.LOW_MAX) level = 'MEDIUM';

  return {
    projectId: project.id,
    score,
    level,
    confidence,
    signals: signals.sort((a,b) => b.contribution - a.contribution),
    calculatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    source: 'RULE_BASED_ANALYTICS'
  };
}
