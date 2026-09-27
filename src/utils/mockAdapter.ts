import { MpladsProject } from '../types';

export const mockProjectToMpladsProject = (mock: any): MpladsProject => {
  return {
    id: mock.id,
    state: mock.state,
    constituency: mock.constituency,
    financialYear: 2022, // fallback
    fundsAvailable: mock.approvedAmount,
    sanctionedFunds: mock.approvedAmount,
    actualExpenditure: mock.utilizedAmount,
    worksSanctioned: 100, // mock
    worksCompleted: Math.round(mock.physicalProgress),
    pendingWorks: 100 - Math.round(mock.physicalProgress),
    pctCompleted: mock.physicalProgress,
    pctUtilisation: mock.financialProgress,
    expenditureToSanctionedPct: mock.financialProgress,
    pendingSharePct: 100 - mock.physicalProgress,
    completionGapPct: mock.financialProgress - mock.physicalProgress,
    avgSanctionPerWorkLakh: mock.approvedAmount / 100000,
    dataSource: 'SYNTHETIC_DEMO',
    name: mock.name,
    category: mock.category,
    district: mock.district,
    implementingAgency: mock.implementingAgency,
    contractor: mock.contractor,
    riskScore: mock.riskScore || 0,
    riskLevel: mock.riskLevel || 'LOW',
    status: mock.status,
    lat: mock.lat,
    lng: mock.lng,
    signals: mock.signals
  };
};
