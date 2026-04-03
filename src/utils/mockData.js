// ============================================
// Certify.cx — Mock Data for UI
// ============================================

export const mockCompanies = [
  { id: 1, name: 'Al Rajhi Industries', region: 'asia', certifications: ['ISO 9001', 'ISO 14001'], status: 'active', contact: 'ahmed@alrajhi.com', employees: 450 },
  { id: 2, name: 'TechVista Solutions', region: 'asia', certifications: ['ISO 27001'], status: 'active', contact: 'info@techvista.com', employees: 120 },
  { id: 3, name: 'Tata Compliance Corp', region: 'asia', certifications: ['ISO 9001', 'ISO 45001'], status: 'pending', contact: 'admin@tatacompliance.in', employees: 800 },
  { id: 4, name: 'Nordic Safety Group', region: 'europe', certifications: ['ISO 45001'], status: 'active', contact: 'ops@nordicsafety.eu', employees: 230 },
  { id: 5, name: 'MapleTech Inc.', region: 'north_america', certifications: ['ISO 9001', 'ISO 27001'], status: 'active', contact: 'hello@mapletech.ca', employees: 340 },
  { id: 6, name: 'Sahara Mining Co.', region: 'africa', certifications: ['ISO 14001'], status: 'active', contact: 'admin@saharamining.ng', employees: 90 },
  { id: 7, name: 'SinoGreen Energy', region: 'asia', certifications: ['ISO 14001', 'ISO 22000'], status: 'active', contact: 'contact@sinogreen.cn', employees: 560 },
  { id: 8, name: 'BrazilCert Ltda', region: 'south_america', certifications: ['ISO 13485'], status: 'pending', contact: 'reg@brazilcert.com.br', employees: 1200 },
  { id: 9, name: 'EuroStandards GmbH', region: 'europe', certifications: ['ISO 9001', 'ISO 14001', 'ISO 27001'], status: 'active', contact: 'info@eurostandards.de', employees: 180 },
  { id: 10, name: 'AmeriCert Solutions', region: 'north_america', certifications: ['ISO 9001'], status: 'active', contact: 'sales@americert.com', employees: 75 },
];
export const mockCertificationRequests = [
  { id: 'CR-001', company_id: 1, company: 'Al Rajhi Industries', iso_standard: 'ISO 14001', region: 'asia', status: 'pending', assigned_auditor: null, created_at: '2026-03-10', priority: 'high' },
  { id: 'CR-002', company_id: 2, company: 'TechVista Solutions', iso_standard: 'ISO 27001', region: 'asia', status: 'in_review', assigned_auditor: 'Lin Wei', created_at: '2026-03-08', priority: 'medium' },
  { id: 'CR-003', company_id: 3, company: 'Tata Compliance Corp', iso_standard: 'ISO 45001', region: 'asia', status: 'approved', assigned_auditor: 'Priya Sharma', created_at: '2026-02-28', priority: 'low' },
  { id: 'CR-004', company_id: 4, company: 'Nordic Safety Group', iso_standard: 'ISO 45001', region: 'europe', status: 'audit_scheduled', assigned_auditor: 'Erik Johansson', created_at: '2026-03-12', priority: 'medium' },
  { id: 'CR-005', company_id: 5, company: 'MapleTech Inc.', iso_standard: 'ISO 9001', region: 'north_america', status: 'rejected', assigned_auditor: 'Sarah Chen', created_at: '2026-03-01', priority: 'high' },
  { id: 'CR-006', company_id: 6, company: 'Sahara Mining Co.', iso_standard: 'ISO 9001', region: 'africa', status: 'pending', assigned_auditor: null, created_at: '2026-03-14', priority: 'medium' },
  { id: 'CR-007', company_id: 7, company: 'SinoGreen Energy', iso_standard: 'ISO 22000', region: 'asia', status: 'audit_scheduled', assigned_auditor: 'Kenji Tanaka', created_at: '2026-02-20', priority: 'low' },
  { id: 'CR-008', company_id: 8, company: 'BrazilCert Ltda', iso_standard: 'ISO 13485', region: 'south_america', status: 'in_review', assigned_auditor: 'Carlos Silva', created_at: '2026-03-05', priority: 'high' },
  { id: 'CR-009', company_id: 9, company: 'EuroStandards GmbH', iso_standard: 'ISO 27001', region: 'europe', status: 'pending', assigned_auditor: null, created_at: '2026-03-15', priority: 'medium' },
  { id: 'CR-010', company_id: 10, company: 'AmeriCert Solutions', iso_standard: 'ISO 9001', region: 'north_america', status: 'approved', assigned_auditor: 'James Miller', created_at: '2026-02-25', priority: 'low' },
];

export const mockAuditors = [
  { id: 1, name: 'Mohammed Al-Farsi', email: 'mfarsi@certifycx.com', region: 'asia', certifications: 3, status: 'active', specialization: 'ISO 9001, ISO 14001' },
  { id: 2, name: 'Lin Wei', email: 'lwei@certifycx.com', region: 'asia', certifications: 5, status: 'active', specialization: 'ISO 27001, ISO 9001' },
  { id: 3, name: 'Priya Sharma', email: 'psharma@certifycx.com', region: 'asia', certifications: 4, status: 'active', specialization: 'ISO 45001, ISO 9001' },
  { id: 4, name: 'Erik Johansson', email: 'ejohansson@certifycx.com', region: 'europe', certifications: 2, status: 'on_leave', specialization: 'ISO 45001' },
  { id: 5, name: 'Sarah Chen', email: 'schen@certifycx.com', region: 'north_america', certifications: 6, status: 'active', specialization: 'ISO 9001, ISO 27001, ISO 14001' },
  { id: 6, name: 'Amara Okafor', email: 'aokafor@certifycx.com', region: 'africa', certifications: 3, status: 'active', specialization: 'ISO 22000, ISO 14001' },
  { id: 7, name: 'Carlos Silva', email: 'csilva@certifycx.com', region: 'south_america', certifications: 7, status: 'active', specialization: 'ISO 13485, ISO 9001' },
  { id: 8, name: 'James Miller', email: 'jmiller@certifycx.com', region: 'north_america', certifications: 4, status: 'active', specialization: 'ISO 9001, ISO 14001' },
];

export const mockCertificationBodies = [
  { id: 1, name: 'TÜV SÜD Asia Pacific', region: 'asia', activeCertifications: 78, status: 'active', accreditation: 'DAkkS' },
  { id: 2, name: 'Bureau Veritas Africa', region: 'africa', activeCertifications: 45, status: 'active', accreditation: 'UKAS' },
  { id: 3, name: 'DNV GL Europe', region: 'europe', activeCertifications: 95, status: 'active', accreditation: 'RvA' },
  { id: 4, name: 'SGS North America', region: 'north_america', activeCertifications: 62, status: 'active', accreditation: 'ANAB' },
  { id: 5, name: 'ABNT Certificadora', region: 'south_america', activeCertifications: 55, status: 'active', accreditation: 'INMETRO' },
  { id: 6, name: 'BSI Asia', region: 'asia', activeCertifications: 120, status: 'active', accreditation: 'UKAS' },
];

export const isoStandards = [
  { id: 'iso_9001', name: 'ISO 9001', title: 'Quality Management', icon: 'Shield' },
  { id: 'iso_14001', name: 'ISO 14001', title: 'Environmental Management', icon: 'Leaf' },
  { id: 'iso_27001', name: 'ISO 27001', title: 'Information Security', icon: 'Lock' },
  { id: 'iso_45001', name: 'ISO 45001', title: 'Health & Safety', icon: 'Heart' },
  { id: 'iso_22000', name: 'ISO 22000', title: 'Food Safety', icon: 'Apple' },
  { id: 'iso_13485', name: 'ISO 13485', title: 'Medical Devices', icon: 'Stethoscope' },
];
