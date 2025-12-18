# Document Attachment Testing Documentation

This document provides an overview of all tests created for the document attachment upload and review workflow (Feature F035).

## Test Coverage Summary

### Unit Tests

#### 1. **Attachment Schema Tests** (`packages/shared/src/schemas/__tests__/chat.schema.test.ts`)
- **Test Count**: 30+ tests
- **Coverage**:
  - AttachmentStatus enum validation
  - FileType enum validation
  - File size limits (MAX_FILE_SIZE, MAX_FILE_SIZE_MB)
  - Allowed file extensions (.pdf, .jpg, .jpeg, .png, .gif)
  - `uploadAttachmentSchema` validation (conversation_id, message_id, file_name, file_type, file_size)
  - `updateAttachmentStatusSchema` validation (attachment_id, status, rejected_reason)
  - Notification type integration (document_accepted, document_rejected)

**Key Test Cases**:
- Valid upload data acceptance
- Invalid UUID rejection
- File size limit enforcement (10MB)
- File extension validation
- Rejected reason requirement when status is rejected
- Character limits (filename: 255, rejected_reason: 500)

#### 2. **Attachment Validation Utilities Tests** (`packages/shared/src/utils/__tests__/attachment-validation.test.ts`)
- **Test Count**: 40+ tests
- **Coverage**:
  - `validateFileExtension()` - Accept/reject based on allowed extensions
  - `validateFileSize()` - Enforce 10MB limit
  - `validateMimeType()` - Validate MIME types (application/pdf, image/*)
  - `validateFile()` - Comprehensive file validation
  - `validateAttachmentCount()` - Enforce 3 attachments per message limit
  - `checkRateLimit()` - Enforce 10 uploads per hour
  - `formatFileSize()` - Human-readable file size formatting
  - `sanitizeFileName()` - Remove invalid characters
  - `generateStoragePath()` - Org/conversation/filename path generation
  - `getFileType()` - Detect PDF vs image
  - `getFileExtension()` - Extract file extension

**Key Test Cases**:
- Edge cases: zero bytes, negative size, missing extension
- Portuguese character handling in filenames
- Multiple dots in filenames
- Case-insensitive extension matching

#### 3. **Mobile Attachment Utils Tests** (`apps/mobile/lib/utils/__tests__/attachment-utils.test.ts`)
- **Test Count**: 20+ tests
- **Coverage**: Mobile-specific utility functions (mirrors shared utilities)
- **Platform**: React Native / Expo

### Integration Tests (Mobile)

#### 4. **AttachmentPicker Component Tests** (`apps/mobile/components/molecules/__tests__/AttachmentPicker.test.tsx`)
- **Test Count**: 15+ tests
- **Coverage**:
  - Component rendering (Camera/Gallery/Document options)
  - Camera permission handling (granted/denied)
  - Gallery permission handling (granted/denied)
  - Document picker functionality
  - File validation (size, type, extension)
  - Max file count enforcement (3 files)
  - Error alerts for invalid files
  - Bottom sheet dismiss behavior

**Mocked Dependencies**:
- expo-image-picker
- expo-document-picker
- React Native Alert

#### 5. **AttachmentPreview Component Tests** (`apps/mobile/components/molecules/__tests__/AttachmentPreview.test.tsx`)
- **Test Count**: 20+ tests
- **Coverage**:
  - Image thumbnail display
  - PDF file icon display
  - File metadata display (name, size, formatted)
  - Delete button functionality
  - File count badge (N/3)
  - Limit reached indicator
  - Horizontal scroll behavior
  - Accessibility labels

**Edge Cases**:
- Missing filename handling
- Very long filenames
- Zero file size
- Empty file list (no render)

#### 6. **useAttachmentUpload Hook Tests** (`apps/mobile/hooks/__tests__/useAttachmentUpload.test.ts`)
- **Test Count**: 12+ tests
- **Coverage**:
  - Initial state (empty uploadState, isUploading: false)
  - Single file upload flow
  - Multiple files parallel upload
  - Upload progress tracking
  - Retry logic (max 3 attempts with exponential backoff)
  - Error handling and user alerts
  - linkToMessage() function
  - resetUploadState() function
  - Progress percentage calculation

**Mocked Dependencies**:
- expo-file-system (Base64 encoding)
- Supabase storage upload
- Supabase database insert

#### 7. **Mobile E2E Test Specification** (`apps/mobile/e2e/attachment-upload.spec.md`)
- **Test Count**: 28 E2E test cases (specification only, requires Detox setup)
- **Coverage**:
  - Camera photo upload (5 tests)
  - Gallery image selection (3 tests)
  - PDF document upload (3 tests)
  - File validation (3 tests)
  - Upload progress and message creation (6 tests)
  - Error handling (2 tests)
  - Permission handling (2 tests)
  - Attachment display after upload (4 tests)

**Note**: Full Detox implementation requires additional setup. This document provides test structure for future implementation.

### E2E Tests (Web - Playwright)

#### 8. **Chat Attachments E2E Tests** (`apps/web/e2e/chat-attachments.spec.ts`)
- **Test Count**: 60+ tests
- **Coverage**:
  - **Attachment Display** (5 tests): Card rendering, metadata, thumbnails, PDF icons, status badges
  - **Status Badges** (4 tests): Pending, accepted, rejected badges, rejection reason display
  - **Admin Actions - Accept** (6 tests): Button visibility, dialog flow, confirmation, status update, UI changes
  - **Admin Actions - Reject** (8 tests): Button visibility, dialog flow, textarea validation, character count, status update
  - **Dialog Cancel Behavior** (3 tests): Accept/reject dialog cancellation, no data persistence
  - **Attachment Viewing** (3 tests): Fullscreen images, PDF download, signed URL generation
  - **Real-time Updates** (2 tests): Immediate UI update, persistence after refresh
  - **Multiple Attachments** (3 tests): Multiple in single message, independent status updates, mixed statuses
  - **Permission and Access Control** (2 tests): Admin actions visibility (admin vs non-admin)
  - **Error Handling** (2 tests): Network failure handling, status persistence on error
  - **Accessibility** (2 tests): Accessible button labels, keyboard navigation

**Page Object Model**: `apps/web/e2e/pages/ChatAttachmentsPage.ts` (500+ lines, 30+ helper methods)

**Test Fixtures**: `apps/web/e2e/fixtures/attachments.fixtures.ts`

**Key Features Tested**:
- Accept attachment workflow
- Reject attachment with reason (required, max 500 chars)
- Real-time status updates via React Query
- Signed URL generation for secure file access
- Admin-only action button visibility
- Fullscreen image viewer
- PDF download functionality

### Notification Tests

#### 9. **Notification Provider Tests** (`apps/mobile/providers/__tests__/notification-provider.test.tsx`)
- **Test Count**: 10+ tests
- **Coverage**:
  - document_accepted notification routing to chat conversation
  - document_rejected notification routing to chat conversation
  - Notification payload structure validation
  - Attachment metadata inclusion (attachment_id, file_name, file_type)
  - Rejected reason inclusion in notification
  - Fallback to chat list when conversation_id missing
  - Generic conversation_id field handling
  - Safe navigation with setTimeout (layout mount safety)

**Mocked Dependencies**:
- expo-router
- expo-notifications
- Supabase auth

**Notification Payload Examples**:
```typescript
{
  type: 'document_accepted',
  conversation_id: 'conv-123',
  attachment_id: 'attach-456',
  file_name: 'document.pdf',
  file_type: 'pdf',
  status: 'accepted',
  reviewed_by: 'admin-user-id',
  reviewed_at: '2025-12-17T15:00:00Z'
}
```

### Security Tests

#### 10. **RLS Policy Tests** (`apps/web/src/__tests__/rls-policies.test.ts`)
- **Test Count**: 20+ tests
- **Coverage**:
  - **Staff Upload Permissions** (2 tests): Allow upload to own conversations, prevent upload to other conversations
  - **Staff View Permissions** (4 tests): View accepted attachments, view own pending, view own rejected, prevent viewing other staff's pending
  - **Staff Update Permissions** (2 tests): Prevent status updates, prevent rejected_reason changes
  - **Admin View Permissions** (3 tests): View all organization attachments, view any pending, view rejected
  - **Admin Update Permissions** (4 tests): Accept attachments, reject with reason, prevent re-updating processed, require rejected_reason
  - **Storage Access Permissions** (3 tests): Staff upload to folders, staff download accepted, admin delete
  - **Cross-organization Access Prevention** (2 tests): Staff cross-org prevention, admin cross-org prevention

**Environment Requirements**:
- Test Supabase instance
- Test user credentials (staff, admin)
- Test conversation and attachment data

**Security Policies Verified**:
- `staff_insert_own_attachments` - Staff can upload in their conversations
- `staff_select_accepted_attachments` - Staff can view accepted attachments
- `staff_select_own_attachments` - Staff can view own pending/rejected
- `admin_select_all_attachments` - Admins view all in organization
- `admin_update_attachment_status` - Admins can update status
- Storage bucket RLS policies (upload, download, delete)

## Running Tests

### Unit Tests (Shared Package)
```bash
cd packages/shared
pnpm test
```

### Unit Tests (Web)
```bash
cd apps/web
pnpm test
```

### Unit Tests (Mobile)
```bash
cd apps/mobile
pnpm test
```

### E2E Tests (Web - Playwright)
```bash
cd apps/web

# Headless mode (CI)
pnpm test:e2e_OLD

# UI mode (interactive)
pnpm test:e2e_OLD:ui

# Specific test file
pnpm test:e2e_OLD chat-attachments.spec.ts
```

### E2E Tests (Mobile - Detox)
```bash
cd apps/mobile

# iOS
detox build --configuration ios.debug
detox test --configuration ios.debug

# Android
detox build --configuration android.debug
detox test --configuration android.debug
```

### RLS Policy Tests
```bash
cd apps/web

# Requires test Supabase instance
TEST_STAFF_EMAIL=staff@test.com \
TEST_STAFF_PASSWORD=password \
TEST_ADMIN_EMAIL=admin@test.com \
TEST_ADMIN_PASSWORD=password \
pnpm test rls-policies.test.ts
```

## Test Configuration

### Vitest (Unit Tests)
- Configuration: `vitest.config.ts` (web), `vitest.config.ts` (mobile)
- Framework: Vitest
- Coverage: Istanbul/c8

### Jest (Mobile Component Tests)
- Configuration: `jest.config.js`
- Framework: Jest
- Testing Library: @testing-library/react-native

### Playwright (Web E2E)
- Configuration: `playwright.config.ts`
- Browsers: Chromium, Firefox, WebKit
- Parallel execution: Yes
- Retries: 2 (CI), 0 (local)

### Detox (Mobile E2E)
- Configuration: `detox.config.js` (when implemented)
- Platforms: iOS Simulator, Android Emulator
- Test runner: Jest

## Test Data Requirements

### Database Test Data
- Organizations with staff and admin users
- Chat conversations with participants
- Attachments in various statuses (pending, accepted, rejected)
- Multiple attachments per message for testing

### File Test Data (Mobile E2E)
- Test images (.jpg, .png, .gif) - various sizes
- Test PDFs - various sizes including >10MB for rejection tests
- Invalid file types (.txt, .mp4) for validation tests

### User Accounts
- Staff user with conversation access
- Admin user with review permissions
- Non-participant user for access control tests

## Acceptance Criteria Coverage

✅ **Unit tests cover attachment schemas and validation logic**
- 30+ schema tests
- 40+ validation utility tests
- 20+ mobile utility tests

✅ **Integration tests verify mobile upload flow end-to-end**
- AttachmentPicker: 15+ tests
- AttachmentPreview: 20+ tests
- useAttachmentUpload: 12+ tests
- E2E specification: 28 test cases

✅ **E2e tests verify admin can review and update attachment status**
- 60+ Playwright E2E tests
- Complete accept/reject workflows
- Real-time status updates
- Dialog validation and character limits

✅ **Tests verify push notifications are sent and received correctly**
- 10+ notification provider tests
- document_accepted navigation
- document_rejected navigation
- Payload structure validation

✅ **Security tests confirm RLS policies work as expected**
- 20+ RLS policy tests
- Staff permissions (upload, view, update)
- Admin permissions (view all, update status)
- Cross-organization access prevention
- Storage bucket permissions

## Total Test Count: 250+ Tests

- Unit Tests: 90+ tests
- Integration Tests (Mobile): 47+ tests
- E2E Tests (Mobile Spec): 28 test cases
- E2E Tests (Web): 60+ tests
- Notification Tests: 10+ tests
- Security Tests: 20+ tests

## Future Improvements

1. **Mobile E2E Implementation**: Complete Detox setup and implement specification
2. **Test Coverage Reports**: Configure coverage thresholds (80%+)
3. **Visual Regression Tests**: Screenshot comparison for attachment cards
4. **Performance Tests**: Upload speed, parallel upload efficiency
5. **Load Tests**: Multiple concurrent uploads, rate limit verification
6. **Accessibility Tests**: WCAG compliance, screen reader support
7. **Cross-browser Tests**: Edge, Safari additional browsers
8. **Mobile Platform Tests**: Real device testing (iOS, Android)
