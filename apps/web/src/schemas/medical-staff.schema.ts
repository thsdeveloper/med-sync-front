import { z } from 'zod';

// Re-export from shared for backward compatibility
// The canonical schemas are now in @medsync/shared
export {
    medicalStaffSchema,
    searchStaffByCrmSchema,
    especialidadeSchema,
    type Especialidade,
    type MedicalStaff,
    type MedicalStaffFormData,
    type StaffOrganization,
    type MedicalStaffWithOrganization,
    type SearchStaffByCrmData,
} from '@medsync/shared';

// Web-specific extensions can go here if needed
