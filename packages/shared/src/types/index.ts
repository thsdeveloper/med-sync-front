// Re-export types from schemas for convenience
export type {
    Sector,
    SectorFormData,
    Shift,
    ShiftFormData,
} from '../schemas/shifts.schema';

export type {
    MedicalStaff,
    MedicalStaffFormData,
    MedicalStaffWithOrganization,
    StaffOrganization,
    SearchStaffByCrmData,
} from '../schemas/medical-staff.schema';

export type {
    Facility,
    FacilityFormData,
    StaffFacility,
} from '../schemas/facility.schema';

export type {
    FixedSchedule,
    FixedScheduleFormData,
    FixedScheduleConflict,
    ShiftType,
    DurationType,
} from '../schemas/fixed-schedule.schema';

export type {
    CompanyRegistrationFormData,
} from '../schemas/company-registration.schema';

export type {
    OrganizationSettingsFormData,
} from '../schemas/organization-settings.schema';
