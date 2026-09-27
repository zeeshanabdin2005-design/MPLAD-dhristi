import { commitBatchWithRetry } from '../lib/batch-utils';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { MpladsProject } from '../types';
import Papa from 'papaparse';

export const importCsvData = async (file: File, type: 'historical' | 'ml_ready' | 'generic') => {
  return new Promise<number>((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          let importedCount = 0;
          
          let batch = writeBatch(db);
          let batchCount = 0;

          for (const row of data) {
            const constituency = row['constituency'] || row['Constituency'] || row['district'] || 'Unknown';
            const state = row['state'] || row['State'] || 'Unknown';
            
            // Financial year might be string or number
            let financialYear = parseInt(row['financial_year'] || row['Year'] || '2023', 10);
            if (isNaN(financialYear)) financialYear = 2023;
            
            // Generate stable, deterministic ID to prevent duplicates on re-upload
            const stateClean = state.toLowerCase().replace(/[^a-z0-9]/g, '');
            const constClean = constituency.toLowerCase().replace(/[^a-z0-9]/g, '');
            const id = `${stateClean}_${constClean}_${financialYear}`;
            
            const fundsAvailable = parseFloat(row['funds_available'] || row['FundsAvailable'] || row['Funds_Available']) || 0;
            const sanctionedFunds = parseFloat(row['sanctioned_funds'] || row['sanctioned_cost'] || row['SanctionedFunds']) || 0;
            const actualExpenditure = parseFloat(row['actual_expenditure'] || row['Expenditure']) || 0;
            
            const worksSanctioned = parseInt(row['works_sanctioned'] || row['WorksSanctioned'], 10) || 0;
            const worksCompleted = parseInt(row['works_completed'] || row['WorksCompleted'], 10) || 0;
            const pendingWorks = parseInt(row['pending_works'] || row['PendingWorks'], 10) || 0;
            
            const pctCompleted = parseFloat(row['pct_completed'] || row['pct_physical_completed'] || '0') || 0;
            const pctUtilisation = parseFloat(row['pct_utilisation'] || row['pct_funds_utilized'] || '0') || 0;
            
            // Use derived fields if provided, otherwise compute them
            let expenditureToSanctionedPct = parseFloat(row['expenditure_to_sanctioned_pct'] || '0');
            if (!expenditureToSanctionedPct && sanctionedFunds > 0) {
              expenditureToSanctionedPct = (actualExpenditure / sanctionedFunds) * 100;
            }

            let pendingSharePct = parseFloat(row['pending_share_pct'] || '0');
            if (!pendingSharePct && worksSanctioned > 0) {
              pendingSharePct = (pendingWorks / worksSanctioned) * 100;
            }

            let completionGapPct = parseFloat(row['completion_gap_pct'] || '0');
            if (!completionGapPct) {
              completionGapPct = pctUtilisation - pctCompleted;
            }

            let avgSanctionPerWorkLakh = parseFloat(row['avg_sanction_per_work_lakh'] || '0');
            if (!avgSanctionPerWorkLakh && worksSanctioned > 0) {
              avgSanctionPerWorkLakh = sanctionedFunds / worksSanctioned;
            }
            
            const project: MpladsProject = {
              id,
              state,
              constituency,
              financialYear,
              fundsAvailable,
              sanctionedFunds,
              actualExpenditure,
              worksSanctioned,
              worksCompleted,
              pendingWorks,
              pctCompleted,
              pctUtilisation,
              expenditureToSanctionedPct,
              pendingSharePct,
              completionGapPct,
              avgSanctionPerWorkLakh,
              dataSource: 'CSV_DATASET',
              name: `MPLADS ${constituency} ${financialYear}`,
              category: 'General',
              district: constituency,
              implementingAgency: 'Local Administration',
              contractor: 'N/A',
              riskScore: type === 'ml_ready' ? parseFloat(row['risk_score'] || '0') || 0 : 0,
              riskLevel: 'LOW',
              status: 'ACTIVE'
            };
            
            if (project.riskScore > 75) project.riskLevel = 'CRITICAL';
            else if (project.riskScore > 50) project.riskLevel = 'HIGH';
            else if (project.riskScore > 30) project.riskLevel = 'MEDIUM';

            const docRef = doc(db, 'projects', id);
            batch.set(docRef, project, { merge: true }); // Use merge to upsert (allow re-uploading)
            batchCount++;
            importedCount++;

            if (batchCount === 400) { // Keep under 500 limit for safety
              await commitBatchWithRetry(batch);
              batch = writeBatch(db);
              batchCount = 0;
            }
          }
          
          if (batchCount > 0) {
            await commitBatchWithRetry(batch);
          }

          resolve(importedCount);
        } catch (error) {
          console.error("Batch commit failed", error);
          reject(error);
        }
      },
      error: (error) => {
        console.error("Papa parse failed", error);
        reject(error);
      }
    });
  });
};
