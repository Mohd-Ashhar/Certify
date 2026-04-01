// ============================================
// Certify.cx — RBAC: Roles, Regions & Permissions
// ============================================

// ---------------------------------------------------
// Roles
// ---------------------------------------------------
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  REGIONAL_ADMIN: 'regional_admin',
  AUDITOR: 'auditor',
  CERTIFICATION_BODY: 'certification_body',
  CLIENT: 'client',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.REGIONAL_ADMIN]: 'Regional Admin',
  [ROLES.AUDITOR]: 'Auditor',
  [ROLES.CERTIFICATION_BODY]: 'Certification Body',
  [ROLES.CLIENT]: 'Client',
};

/** Ordered by privilege level (highest first) */
export const ROLE_HIERARCHY = [
  ROLES.SUPER_ADMIN,
  ROLES.REGIONAL_ADMIN,
  ROLES.CERTIFICATION_BODY,
  ROLES.AUDITOR,
  ROLES.CLIENT,
];

// ---------------------------------------------------
// Regions
// ---------------------------------------------------
export const REGIONS = [
  { id: 'middle_east', label: 'Middle East', emoji: '🌍' },
  { id: 'asia', label: 'Asia', emoji: '🌏' },
  { id: 'india', label: 'India', emoji: '🇮🇳' },
  { id: 'europe', label: 'Europe', emoji: '🇪🇺' },
  { id: 'north_america', label: 'North America', emoji: '🌎' },
];

export function getRegionLabel(regionId) {
  return REGIONS.find(r => r.id === regionId)?.label || regionId;
}

/**
 * Map a country name (from Geoapify or user input) to a region ID.
 * Returns null if no match is found.
 */
const COUNTRY_REGION_MAP = {
  // Middle East
  'united arab emirates': 'middle_east',
  'uae': 'middle_east',
  'saudi arabia': 'middle_east',
  'qatar': 'middle_east',
  'kuwait': 'middle_east',
  'bahrain': 'middle_east',
  'oman': 'middle_east',
  'jordan': 'middle_east',
  'lebanon': 'middle_east',
  'iraq': 'middle_east',
  'iran': 'middle_east',
  'yemen': 'middle_east',
  'syria': 'middle_east',
  'palestine': 'middle_east',
  'israel': 'middle_east',
  'egypt': 'middle_east',
  'turkey': 'middle_east',

  // India
  'india': 'india',

  // Asia (excluding India & Middle East)
  'china': 'asia',
  'japan': 'asia',
  'south korea': 'asia',
  'singapore': 'asia',
  'malaysia': 'asia',
  'indonesia': 'asia',
  'thailand': 'asia',
  'vietnam': 'asia',
  'philippines': 'asia',
  'pakistan': 'asia',
  'bangladesh': 'asia',
  'sri lanka': 'asia',
  'nepal': 'asia',
  'myanmar': 'asia',
  'cambodia': 'asia',
  'australia': 'asia',
  'new zealand': 'asia',
  'hong kong': 'asia',
  'taiwan': 'asia',

  // Europe
  'united kingdom': 'europe',
  'uk': 'europe',
  'france': 'europe',
  'germany': 'europe',
  'italy': 'europe',
  'spain': 'europe',
  'netherlands': 'europe',
  'belgium': 'europe',
  'switzerland': 'europe',
  'austria': 'europe',
  'sweden': 'europe',
  'norway': 'europe',
  'denmark': 'europe',
  'finland': 'europe',
  'ireland': 'europe',
  'portugal': 'europe',
  'poland': 'europe',
  'czech republic': 'europe',
  'czechia': 'europe',
  'greece': 'europe',
  'romania': 'europe',
  'hungary': 'europe',
  'russia': 'europe',
  'ukraine': 'europe',

  // North America
  'united states': 'north_america',
  'united states of america': 'north_america',
  'usa': 'north_america',
  'canada': 'north_america',
  'mexico': 'north_america',
};

export function getRegionFromCountry(country) {
  if (!country) return null;
  return COUNTRY_REGION_MAP[country.toLowerCase().trim()] || null;
}

// ---------------------------------------------------
// Certification Lifecycle Statuses
// ---------------------------------------------------
export const CERTIFICATION_STATUSES = {
  PENDING: 'pending',
  AUDIT_SCHEDULED: 'audit_scheduled',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const CERTIFICATION_STATUS_ORDER = [
  CERTIFICATION_STATUSES.PENDING,
  CERTIFICATION_STATUSES.AUDIT_SCHEDULED,
  CERTIFICATION_STATUSES.IN_REVIEW,
  CERTIFICATION_STATUSES.APPROVED,
  CERTIFICATION_STATUSES.REJECTED,
];

// ---------------------------------------------------
// Granular Permissions
// ---------------------------------------------------
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',

  // Companies
  VIEW_COMPANIES: 'view_companies',
  MANAGE_COMPANIES: 'manage_companies',
  REGISTER_COMPANY: 'register_company',

  // Certification Requests
  VIEW_CERTIFICATIONS: 'view_certifications',
  VIEW_ALL_CERTIFICATIONS: 'view_all_certifications',
  CREATE_CERTIFICATION: 'create_certification',
  MANAGE_CERTIFICATIONS: 'manage_certifications',
  APPROVE_CERTIFICATIONS: 'approve_certifications',
  VIEW_CERTIFICATION_STATUS: 'view_certification_status',

  // Auditors
  VIEW_AUDITORS: 'view_auditors',
  MANAGE_AUDITORS: 'manage_auditors',
  ASSIGN_AUDITORS: 'assign_auditors',
  SUBMIT_AUDIT_REPORT: 'submit_audit_report',

  // Certification Bodies
  VIEW_BODIES: 'view_bodies',
  MANAGE_BODIES: 'manage_bodies',
  REVIEW_AUDIT_REPORTS: 'review_audit_reports',

  // Reports
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',

  // Users & Settings
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_REGIONS: 'manage_regions',
  MANAGE_ROLES: 'manage_roles',
  CREATE_ADMINS: 'create_admins',
};

// ---------------------------------------------------
// Role → Permission Mapping
// ---------------------------------------------------
const ROLE_PERMISSIONS = {
  // ---- Super Admin: explicit full access (no CREATE_CERTIFICATION) ----
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_COMPANIES,
    PERMISSIONS.MANAGE_COMPANIES,
    PERMISSIONS.REGISTER_COMPANY,
    PERMISSIONS.VIEW_CERTIFICATIONS,
    PERMISSIONS.VIEW_ALL_CERTIFICATIONS,
    PERMISSIONS.MANAGE_CERTIFICATIONS,
    PERMISSIONS.APPROVE_CERTIFICATIONS,
    PERMISSIONS.VIEW_CERTIFICATION_STATUS,
    PERMISSIONS.VIEW_AUDITORS,
    PERMISSIONS.MANAGE_AUDITORS,
    PERMISSIONS.ASSIGN_AUDITORS,
    PERMISSIONS.SUBMIT_AUDIT_REPORT,
    PERMISSIONS.VIEW_BODIES,
    PERMISSIONS.MANAGE_BODIES,
    PERMISSIONS.REVIEW_AUDIT_REPORTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_REGIONS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.CREATE_ADMINS,
  ],

  // ---- Regional Admin ----
  [ROLES.REGIONAL_ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    // Companies — manage in own region
    PERMISSIONS.VIEW_COMPANIES,
    PERMISSIONS.MANAGE_COMPANIES,
    // Certifications — manage requests, view (no CREATE_CERTIFICATION)
    PERMISSIONS.VIEW_CERTIFICATIONS,
    PERMISSIONS.VIEW_ALL_CERTIFICATIONS,
    PERMISSIONS.MANAGE_CERTIFICATIONS,
    PERMISSIONS.VIEW_CERTIFICATION_STATUS,
    // Auditors — create & assign auditors in region
    PERMISSIONS.VIEW_AUDITORS,
    PERMISSIONS.MANAGE_AUDITORS,
    PERMISSIONS.ASSIGN_AUDITORS,
    // Bodies — create & manage in region
    PERMISSIONS.VIEW_BODIES,
    PERMISSIONS.MANAGE_BODIES,
    // Reports
    PERMISSIONS.VIEW_REPORTS,
    // Users & Settings
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],

  // ---- Auditor ----
  [ROLES.AUDITOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    // Certifications — view + submit audit reports
    PERMISSIONS.VIEW_CERTIFICATIONS,
    PERMISSIONS.VIEW_CERTIFICATION_STATUS,
    PERMISSIONS.SUBMIT_AUDIT_REPORT,
    // Settings (own profile)
    PERMISSIONS.MANAGE_SETTINGS,
  ],

  // ---- Certification Body ----
  [ROLES.CERTIFICATION_BODY]: [
    PERMISSIONS.VIEW_DASHBOARD,
    // Certifications — review + approve
    PERMISSIONS.VIEW_CERTIFICATIONS,
    PERMISSIONS.VIEW_CERTIFICATION_STATUS,
    PERMISSIONS.REVIEW_AUDIT_REPORTS,
    PERMISSIONS.APPROVE_CERTIFICATIONS,
    // Settings (own profile)
    PERMISSIONS.MANAGE_SETTINGS,
  ],

  // ---- Client (Company) ----
  [ROLES.CLIENT]: [
    PERMISSIONS.VIEW_DASHBOARD,
    // Certifications — create requests + view status
    PERMISSIONS.CREATE_CERTIFICATION,
    PERMISSIONS.VIEW_CERTIFICATION_STATUS,
    // Settings (own profile)
    PERMISSIONS.MANAGE_SETTINGS,
  ],
};

// ---------------------------------------------------
// Route → Required Permissions Mapping
// ---------------------------------------------------
export const ROUTE_PERMISSIONS = {
  '/dashboard': [PERMISSIONS.VIEW_DASHBOARD],
  '/companies': [PERMISSIONS.VIEW_COMPANIES, PERMISSIONS.REGISTER_COMPANY],
  '/certification-requests': [PERMISSIONS.VIEW_CERTIFICATIONS],
  '/auditors': [PERMISSIONS.VIEW_AUDITORS],
  '/certification-bodies': [PERMISSIONS.VIEW_BODIES],
  '/reports': [PERMISSIONS.VIEW_REPORTS],
  '/settings': [PERMISSIONS.MANAGE_SETTINGS],
};

// ---------------------------------------------------
// Helper Functions
// ---------------------------------------------------

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
}

/**
 * Check if a role has ANY of the given permissions.
 */
export function hasAnyPermission(role, permissions) {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the given permissions.
 */
export function hasAllPermissions(role, permissions) {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user can access a specific region's data.
 * Super admins can access all regions.
 * Other roles can only access their own region.
 */
export function canAccessRegion(userRole, userRegion, targetRegion) {
  if (userRole === ROLES.SUPER_ADMIN) return true;
  if (!targetRegion) return true; // no region restriction
  return userRegion === targetRegion;
}

/**
 * Check if a role can access a specific route.
 * Uses the ROUTE_PERMISSIONS map — user needs ANY of the listed permissions.
 */
export function canAccessRoute(role, path) {
  const required = ROUTE_PERMISSIONS[path];
  if (!required) return true; // no restriction defined
  return hasAnyPermission(role, required);
}

/**
 * Check if a role is at or above a given level in hierarchy.
 */
export function isRoleAtLeast(userRole, minimumRole) {
  const userIdx = ROLE_HIERARCHY.indexOf(userRole);
  const minIdx = ROLE_HIERARCHY.indexOf(minimumRole);
  if (userIdx === -1 || minIdx === -1) return false;
  return userIdx <= minIdx; // lower index = higher privilege
}

/**
 * Get accessible sidebar items for a role.
 */
export function getAccessibleRoutes(role) {
  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([, perms]) => hasAnyPermission(role, perms))
    .map(([path]) => path);
}

/**
 * Get the roles that a given admin role can create.
 * Super Admin → Regional Admin, Auditor, Certification Body
 * Regional Admin → Auditor, Certification Body
 */
export function getCreatableRoles(role) {
  const map = {
    [ROLES.SUPER_ADMIN]: [ROLES.REGIONAL_ADMIN, ROLES.AUDITOR, ROLES.CERTIFICATION_BODY],
    [ROLES.REGIONAL_ADMIN]: [ROLES.AUDITOR, ROLES.CERTIFICATION_BODY],
  };
  return map[role] || [];
}
