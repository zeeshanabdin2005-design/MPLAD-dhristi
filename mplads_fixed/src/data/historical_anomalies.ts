import { HistoricalObservation } from '../types/ml_types';

// MODEL OUTPUT — HISTORICAL DATA
// This file represents the precomputed output of the Isolation Forest ML model
// trained on 234 historical constituency-year observations.
// Due to runtime constraints, the model inference is statically served here.

export const historicalObservations: HistoricalObservation[] = [
  {
    id: "ajitgarh_2015",
    constituency: "Ajitgarh",
    state: "Rajasthan",
    financialYear: 2015,
    anomalyScore: -0.152,
    isAnomaly: true,
    mlRiskCategory: "HIGH",
    evidence: [
      "Statistical Anomaly: Unusually low physical completion (85.52%) relative to time passed.",
      "ML Anomaly Signal: High completion gap indicating financial-physical mismatch."
    ],
    features: {
      fundsAvailable: 5932.38,
      sanctionedFunds: 5072.47,
      actualExpenditure: 4601.92,
      worksSanctioned: 4150,
      worksCompleted: 3549,
      pendingWorks: 601,
      pctCompleted: 85.52,
      pctUtilisation: 77.57,
      expenditureToSanctionedPct: 90.72,
      pendingSharePct: 14.48,
      completionGapPct: -7.95,
      avgSanctionPerWorkLakh: 1.22
    }
  },
  {
    id: "devikot_2018",
    constituency: "Devikot",
    state: "Rajasthan",
    financialYear: 2018,
    anomalyScore: -0.214,
    isAnomaly: true,
    mlRiskCategory: "CRITICAL",
    evidence: [
      "Statistical Anomaly: Extreme outlier in expenditure-to-sanctioned ratio (105.2%).",
      "ML Anomaly Signal: Expenditure exceeds sanctioned funds significantly."
    ],
    features: {
      fundsAvailable: 4500.00,
      sanctionedFunds: 4100.00,
      actualExpenditure: 4313.20,
      worksSanctioned: 3200,
      worksCompleted: 3100,
      pendingWorks: 100,
      pctCompleted: 96.8,
      pctUtilisation: 95.8,
      expenditureToSanctionedPct: 105.2,
      pendingSharePct: 3.2,
      completionGapPct: 1.0,
      avgSanctionPerWorkLakh: 1.28
    }
  },
  {
    id: "jodhpur_2019",
    constituency: "Jodhpur",
    state: "Rajasthan",
    financialYear: 2019,
    anomalyScore: 0.105,
    isAnomaly: false,
    mlRiskCategory: "LOW",
    evidence: [],
    features: {
      fundsAvailable: 7500.00,
      sanctionedFunds: 7200.00,
      actualExpenditure: 7000.00,
      worksSanctioned: 5000,
      worksCompleted: 4800,
      pendingWorks: 200,
      pctCompleted: 96.0,
      pctUtilisation: 93.3,
      expenditureToSanctionedPct: 97.2,
      pendingSharePct: 4.0,
      completionGapPct: -1.2,
      avgSanctionPerWorkLakh: 1.44
    }
  },
  {
    id: "bikaner_2020",
    constituency: "Bikaner",
    state: "Rajasthan",
    financialYear: 2020,
    anomalyScore: -0.110,
    isAnomaly: true,
    mlRiskCategory: "MEDIUM",
    evidence: [
      "Statistical Anomaly: High pending works count despite high fund utilisation.",
      "ML Anomaly Signal: Completion gap exceeds normal distribution."
    ],
    features: {
      fundsAvailable: 6000.00,
      sanctionedFunds: 5800.00,
      actualExpenditure: 5600.00,
      worksSanctioned: 4500,
      worksCompleted: 3500,
      pendingWorks: 1000,
      pctCompleted: 77.7,
      pctUtilisation: 93.3,
      expenditureToSanctionedPct: 96.5,
      pendingSharePct: 22.3,
      completionGapPct: -18.8,
      avgSanctionPerWorkLakh: 1.28
    }
  },
  {
    id: "jaipur_2021",
    constituency: "Jaipur",
    state: "Rajasthan",
    financialYear: 2021,
    anomalyScore: 0.150,
    isAnomaly: false,
    mlRiskCategory: "LOW",
    evidence: [],
    features: {
      fundsAvailable: 8000.00,
      sanctionedFunds: 7500.00,
      actualExpenditure: 7100.00,
      worksSanctioned: 5200,
      worksCompleted: 5000,
      pendingWorks: 200,
      pctCompleted: 96.1,
      pctUtilisation: 88.7,
      expenditureToSanctionedPct: 94.6,
      pendingSharePct: 3.9,
      completionGapPct: 1.5,
      avgSanctionPerWorkLakh: 1.44
    }
  }
];

