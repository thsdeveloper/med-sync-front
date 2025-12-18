# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.


## 0.1.1 (2025-12-18)


### Novos Recursos

* **chat:** add delete message functionality 99e6495
* create unified UserAvatar component with image support ebea260
* implement F001 — Configure Supabase Storage bucket for profile images 5f75de4
* implement F001 — create address database schema and migration 5b6f35c
* implement F002 — Add avatar_url column to medical_staff table fdf886c
* implement F002 — create address Zod validation schema 626fc46
* implement F003 — facility address API endpoints feb19bb
* implement F003 — Install and configure expo-image-picker with permissions a726bb6
* implement F004 — Implement image cropping functionality with expo-image-manipulator 35a6ad0
* implement F004 — install and configure Leaflet.js for maps bfe00e7
* implement F005 — create AddressFormFields component with all address inputs 5dab8eb
* implement F005 — Create uploadProfileImage utility for Supabase Storage 807b941
* implement F006 — create interactive LocationPicker map component b015fc9
* implement F006 — Create updateUserAvatar API function to update profile table 68eeff6
* implement F007 — Build ProfileAvatarUpload component with picker and upload flow 1903f4d
* implement F007 — integrate address form into facility creation flow 7e41e84
* implement F008 — integrate address form into facility edit flow a643099
* implement F008 — Integrate ProfileAvatarUpload into profile.tsx screen 602a322
* implement F009 — create facility location display component for read-only views e21ccd6
* implement F009 — Investigate and document Calendário de Escalas implementation 5b0e08a
* implement F010 — add migration to populate existing facilities with default address fb28a89
* implement F010 — Fix calendar date navigation controls e84a4bb
* implement F011 — Fix month/year selector functionality 67729dd
* implement F012 — Fix view mode switcher (Mês/Semana/Dia/Agenda) b3b4e4c
* implement F012 — Specialty-based filtering in report metrics 06e3f24
* implement F013 — Facility-based filtering in report metrics d851ae2
* implement F013 — Integrate all calendar filters and verify complete functionality 23717e9
* implement F014 — Calculate real summary metrics from database ba58208
* implement F014 — Create Playwright e2e test setup with authentication 7f78341
* implement F015 — Generate specialty trend time series from shifts data b42d136
* implement F015 — Write comprehensive e2e tests for calendar date navigation controls 4baeea9
* implement F016 — Generate financial trend from payment records 3b1d13c
* implement F016 — Write comprehensive e2e tests for calendar month/year selectors and view modes 09e503f
* implement F017 — Add calendar e2e tests to CI/CD and document test usage 41f00a8
* implement F017 — Calculate efficiency metrics from attendance data 7ef0a7a
* implement F018 — Create reusable DataTable component architecture with Atomic Design b0c4b1c
* implement F018 — Generate top performers highlights from real data 90d7c04
* implement F019 — Install TanStack Table and configure core table utilities 8b1d080
* implement F019 — Update ReportFilters with dynamic facility and specialty options 290eeff
* implement F020 — Add organization-based RLS and filtering to reports 4886947
* implement F020 — Refactor Clínicas table to use TanStack Table with DataTable components 83914af
* implement F021 — Create calendar view database query function ac545a6
* implement F021 — Refactor Equipe table to use TanStack Table with DataTable components bf63ec7
* implement F022 — Create shifts calendar data hook 17d5a77
* implement F022 — Setup unit testing architecture with Vitest and React Testing Library 1964723
* implement F023 — Install and configure calendar library 1f08b33
* implement F023 — Write unit tests for DataTable component system 31376f7
* implement F024 — Create ShiftsCalendar display component c8f09e4
* implement F024 — Write unit tests for Clínicas and Equipe table implementations d7cc802
* implement F024 — Write unit tests for Clínicas and Equipe table implementations 246cfbd
* implement F025 — Add facility address to ShiftDetailModal 6cd2f81
* implement F026 — Create calendar filter controls component 6aa20a0
* implement F026 — Write e2e tests for Equipe table using Playwright d348dea
* implement F026 — Write e2e tests for Equipe table using Playwright 038228c
* implement F027 — Create database schema for chat document attachments ce7bf3d
* implement F027 — Create Escalas (Shifts) calendar page 169f09f
* implement F028 — Add calendar navigation to dashboard menu 2fcdaa0
* implement F028 — Update shared schemas for document attachments in chat e985cae
* implement F029 — Create SMTP configuration database schema and migration 6876948
* implement F029 — Implement file picker and upload in mobile chat ba96ef5
* implement F030 — Create SMTP settings Zod validation schema df96d04
* implement F030 — Display document attachments in mobile chat messages f325ab7
* implement F031 — Build admin document review UI in web dashboard 598a0f4
* implement F032 — Create push notification system for attachment status updates 907d1b3
* implement F032 — Create SMTP test connection endpoint c83784a
* implement F033 — Create SmtpSettingsForm component with all configuration fields c13b861
* implement F033 — Implement real-time updates for attachment status changes 3e3a462
* implement F034 — Add attachment management API endpoints and validation e379bb9
* implement F034 — Create useSmtpSettings hook for SMTP data management b3fa61b
* implement F035 — Add Email Notifications section to /dashboard/configuracoes page e3058e6
* implement F035 — Write tests for document upload and review workflow 19661b2
* implement F036 — Add SMTP settings e2e tests for configuration page 19a1f9a
* implement F037 — Create medical staff detail view database query function a37033b
* implement F038 — Create useMedicalStaffDetail hook for data fetching ef8814c
* implement F039 — Create MedicalStaffHeader atom component 895aedb
* implement F040 — Create MedicalStaffInfoCard molecule component e662665
* implement F041 — Create MedicalStaffShiftHistory molecule component d458a04
* implement F042 — Create MedicalStaffPerformanceMetrics organism component ee383db
* implement F043 — Create MedicalStaffDetailView page component 70c9aa7
* implement F044 — Add 'View Details' action to medical staff table and navigation 9b44503
* implement F044 — Add 'View Details' action to medical staff table and navigation 93320fe
* implement F045 — Add e2e tests for medical staff detail view 447cb63
* Introduce payment system configuration and add platform features section to homepage. be92d8c
* **release:** setup automatic versioning with commit-and-tag-version 6723269
* Revamp landing page with updated hero content, expanded benefits, new mobile app section, and added testimonials. 6761004
* **sidebar:** display app version in footer 5c602ee


### Correções de Bugs

* **calendar:** improve empty state layout d90da32
* preserve calendar navigation controls when no shifts found (B001) 76e7cf8


### Refatorações

* add interactive location with map integration to shift detail (R001) 5f74806
* create especialidades table with RLS and seed data (F001) c28b50d
* create useEspecialidades hook with React Query (F004) 1a958d9
* migrate medical_staff specialty data to especialidade_id foreign key (F002) b2889b3
* remove deprecated especialidade column and finalize refactoring (F008) ab9c4da
* replace specialty text input with searchable Select in medical staff forms (F005) 11ea70f
