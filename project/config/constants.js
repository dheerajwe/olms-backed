// Global constants for the application
module.exports = {
  // Number of outings allowed per month
  MAX_OUTINGS_PER_MONTH: 4,
  
  // Number of leaves allowed per semester
  MAX_LEAVES_PER_SEMESTER: 10,
  
  // Status options for leaves and outings
  STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    FORWARDED: 'forwarded'
  },
  
  // Admin roles hierarchy (from lowest to highest)
  ADMIN_ROLES: {
    CARETAKER: 'caretaker',
    CHIEF_WARDEN: 'chiefwarden',
    WARDEN: 'warden',
    ADSW: 'adsw',
    DSW: 'dsw'
  },
  
  // Admin role hierarchy levels (for permission checks)
  ROLE_HIERARCHY: {
    'caretaker': 1,
    'chiefwarden': 2,
    'warden': 3,
    'adsw': 4,
    'dsw': 5
  }
};