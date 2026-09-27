import { historicalObservations } from '../data/historical_anomalies';
import { HistoricalObservation, MlSummaryStats } from '../types/ml_types';

/**
 * Service for accessing precomputed Historical ML Anomaly Intelligence.
 * This reads from dataset-backed outputs (isolation_forest.pkl results)
 * without trusting client-supplied authoritative feature values.
 */

export const getHistoricalObservations = (): HistoricalObservation[] => {
  return historicalObservations;
};

export const getTopAnomalies = (limit: number = 10): HistoricalObservation[] => {
  return historicalObservations
    .filter(obs => obs.isAnomaly)
    .sort((a, b) => a.anomalyScore - b.anomalyScore) // Lower score = more anomalous in Isolation Forest
    .slice(0, limit);
};

export const getObservationByConstituencyYear = (constituency: string, year: number): HistoricalObservation | null => {
  const match = historicalObservations.find(
    obs => obs.constituency.toLowerCase() === constituency.toLowerCase() && obs.financialYear === year
  );
  return match || null;
};

export const getMlSummaryStats = (): MlSummaryStats => {
  const anomalies = historicalObservations.filter(obs => obs.isAnomaly);
  return {
    totalObservations: historicalObservations.length,
    anomaliesDetected: anomalies.length,
    criticalAnomalies: anomalies.filter(a => a.mlRiskCategory === 'CRITICAL').length,
    highAnomalies: anomalies.filter(a => a.mlRiskCategory === 'HIGH').length
  };
};
