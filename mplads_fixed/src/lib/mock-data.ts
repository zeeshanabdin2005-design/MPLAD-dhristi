

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'ACTIVE' | 'DELAYED' | 'UNDER VERIFICATION' | 'VERIFIED' | 'COMPLETED';

export interface Project {
  id: string;
  name: string;
  category: string;
  state: string;
  district: string;
  constituency: string;
  implementingAgency: string;
  contractor: string;
  approvedAmount: number;
  releasedAmount: number;
  utilizedAmount: number;
  physicalProgress: number;
  financialProgress: number;
  riskScore: number;
  riskLevel: RiskLevel;
  status: ProjectStatus;
  startDate: string;
  expectedCompletion: string;
  lat: number;
  lng: number;
  imageSignature?: string;
  extractedInvoiceAmount?: number;
  databasePaymentAmount?: number;
  signals: {
    type: string;
    description: string;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    contribution: number;
    metadata?: any;
  }[];
  summary?: string;
}

const rawProjects: any[] = [
  {
    id: 'P-1042',
    name: 'Road Construction - Sector 4 to NH-46',
    category: 'Road',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    constituency: 'Bhopal Central',
    implementingAgency: 'PWD Madhya Pradesh',
    contractor: 'ABC Construction Group',
    approvedAmount: 1000000,
    releasedAmount: 950000,
    utilizedAmount: 870000,
    physicalProgress: 51,
    status: 'UNDER VERIFICATION',
    startDate: '2026-02-15',
    expectedCompletion: '2026-08-30',
    lat: 23.2599,
    lng: 77.4126,
    imageSignature: 'A1B2C3D4E5F6G7H8',
    extractedInvoiceAmount: 850000,
    databasePaymentAmount: 1250000,
  },
  {
    id: 'P-0922', // Historical project used for duplication checking
    name: 'Road Construction - Sector 3',
    category: 'Road',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    constituency: 'Bhopal Central',
    implementingAgency: 'PWD Madhya Pradesh',
    contractor: 'XYZ Construction',
    approvedAmount: 950000,
    releasedAmount: 950000,
    utilizedAmount: 950000,
    physicalProgress: 100,
    status: 'COMPLETED',
    startDate: '2024-01-10',
    expectedCompletion: '2024-12-10',
    lat: 23.2598, // Close to P-1042
    lng: 77.4128, 
    imageSignature: 'A1B2C3D4E5F6G7K9', // Highly similar signature to P-1042
  },
  {
    id: 'P-2381',
    name: 'Community Water Facility',
    category: 'Water',
    state: 'Madhya Pradesh',
    district: 'Indore',
    constituency: 'Indore I',
    implementingAgency: 'Municipal Corporation',
    contractor: 'JalTech Solutions',
    approvedAmount: 700000,
    releasedAmount: 700000,
    utilizedAmount: 680000,
    physicalProgress: 42,
    status: 'ACTIVE',
    startDate: '2026-01-10',
    expectedCompletion: '2026-06-15',
    lat: 22.7196,
    lng: 75.8577,
    imageSignature: 'W1W2W3W4',
  },
  {
    id: 'P-4432',
    name: 'Village Community Hall',
    category: 'Community',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    constituency: 'Sehore',
    implementingAgency: 'Panchayat Department',
    contractor: 'Shiv Builders',
    approvedAmount: 1200000,
    releasedAmount: 1200000,
    utilizedAmount: 1090000,
    physicalProgress: 68,
    status: 'ACTIVE',
    startDate: '2025-11-01',
    expectedCompletion: '2026-05-30',
    lat: 23.2032,
    lng: 77.0844,
    imageSignature: 'C1C2C3C4',
  },
  {
    id: 'P-5012',
    name: 'Primary School Renovation',
    category: 'Education',
    state: 'Rajasthan',
    district: 'Jaipur',
    constituency: 'Jaipur Rural',
    implementingAgency: 'Education Board',
    contractor: 'EduInfra',
    approvedAmount: 500000,
    releasedAmount: 250000,
    utilizedAmount: 240000,
    physicalProgress: 50,
    status: 'ACTIVE',
    startDate: '2026-04-01',
    expectedCompletion: '2026-09-01',
    lat: 26.9124,
    lng: 75.7873,
    imageSignature: 'E1E2E3E4',
  }
];

export const mockProjects: Project[] = rawProjects.map(p => ({ ...p, riskScore: 85, riskLevel: 'HIGH', signals: [] }) as unknown as Project);

export const mockDashboardStats = {
  totalProjects: 12481,
  totalAllocation: 4380000000,
  activeProjects: 8742,
  delayedProjects: 126,
  highRiskProjects: mockProjects.filter(p => p.riskScore > 75).length + 35,
  pendingVerifications: mockProjects.filter(p => p.status === 'UNDER VERIFICATION').length + 23,
};

export const mockAlerts = mockProjects
  .filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL')
  .map(p => ({
    id: `A-${p.id.split('-')[1]}`,
    projectId: p.id,
    severity: p.riskLevel,
    signal: p.signals[0]?.description || 'Anomalies detected',
    time: p.status === 'UNDER VERIFICATION' ? '2 hours ago' : '1 day ago',
    status: p.status === 'UNDER VERIFICATION' ? 'IN REVIEW' : 'NEW'
  }));
