import { calculateRisk } from './src/lib/risk-engine';
import { MpladsProject } from './src/types';

// Mock context of projects for percentiles
const context: MpladsProject[] = Array.from({ length: 50 }, (_, i) => ({
  id: `P-${i}`,
  state: 'State',
  constituency: 'Const',
  financialYear: 2021,
  fundsAvailable: 100,
  sanctionedFunds: 100,
  actualExpenditure: 50,
  worksSanctioned: 10,
  worksCompleted: 5,
  pendingWorks: 5,
  pctCompleted: 50,
  pctUtilisation: 50,
  expenditureToSanctionedPct: 50,
  pendingSharePct: 50,
  completionGapPct: 0,
  avgSanctionPerWorkLakh: 10,
  dataSource: 'CSV_DATASET'
}));

// Case 1: Normal record
const p1: MpladsProject = { ...context[0], id: 'TEST-1', pctCompleted: 80, pctUtilisation: 80, completionGapPct: 0, pendingSharePct: 20, expenditureToSanctionedPct: 80, avgSanctionPerWorkLakh: 10, actualExpenditure: 80, sanctionedFunds: 100, worksSanctioned: 10 };
const r1 = calculateRisk(p1, context);
console.log('Case 1 (Normal):', r1.level, r1.score, r1.signals.length === 0 ? 'No signals' : r1.signals.map(s => s.type));

// Case 2: High completion + normal utilization
const p2: MpladsProject = { ...context[0], id: 'TEST-2', pctCompleted: 95, pctUtilisation: 80, completionGapPct: -15, pendingSharePct: 5, expenditureToSanctionedPct: 80, avgSanctionPerWorkLakh: 10, actualExpenditure: 80, sanctionedFunds: 100, worksSanctioned: 10 };
const r2 = calculateRisk(p2, context);
console.log('Case 2 (High Comp, Norm Util):', r2.level, r2.score, r2.signals.map(s => s.type));

// Case 3: High utilization + low completion
const p3: MpladsProject = { ...context[0], id: 'TEST-3', pctCompleted: 20, pctUtilisation: 95, completionGapPct: 75, pendingSharePct: 20, expenditureToSanctionedPct: 95, avgSanctionPerWorkLakh: 10, actualExpenditure: 95, sanctionedFunds: 100, worksSanctioned: 10 };
const r3 = calculateRisk(p3, context);
console.log('Case 3 (High Util, Low Comp):', r3.level, r3.score, r3.signals.map(s => s.type));

// Case 4: High pending share
const p4: MpladsProject = { ...context[0], id: 'TEST-4', pctCompleted: 50, pctUtilisation: 50, completionGapPct: 0, pendingSharePct: 95, expenditureToSanctionedPct: 50, avgSanctionPerWorkLakh: 10, actualExpenditure: 50, sanctionedFunds: 100, worksSanctioned: 10 };
const r4 = calculateRisk(p4, context);
console.log('Case 4 (High Pending Share):', r4.level, r4.score, r4.signals.map(s => s.type));

// Case 5: Missing required data
const p5: MpladsProject = { ...context[0], id: 'TEST-5', pctCompleted: undefined as any, pctUtilisation: undefined as any };
const r5 = calculateRisk(p5, context);
console.log('Case 5 (Missing Data):', r5.level, r5.score, r5.confidence, r5.signals.map(s => s.type));

// Case 6: Statistical outlier (avgSanctionPerWorkLakh)
const p6: MpladsProject = { ...context[0], id: 'TEST-6', pctCompleted: 50, pctUtilisation: 50, completionGapPct: 0, pendingSharePct: 50, expenditureToSanctionedPct: 50, avgSanctionPerWorkLakh: 5000, actualExpenditure: 50, sanctionedFunds: 100, worksSanctioned: 10 };
const r6 = calculateRisk(p6, context);
console.log('Case 6 (Outlier Sanction):', r6.level, r6.score, r6.signals.map(s => s.type));

// Case 7: Same input twice
const r7_1 = calculateRisk(p3, context);
const r7_2 = calculateRisk(p3, context);
console.log('Case 7 (Deterministic):', r7_1.score === r7_2.score && r7_1.level === r7_2.level ? 'Pass' : 'Fail');
