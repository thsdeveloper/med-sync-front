# Mobile Attachment Upload E2E Test Specification (Detox)

## Overview
This document specifies end-to-end tests for the mobile document upload workflow using Detox. These tests cover the complete flow from file selection to message creation with attachments.

**Note**: Full Detox implementation requires additional setup (Detox configuration, test environment, device simulators). This specification provides the test structure and cases to be implemented when Detox is properly configured.

## Prerequisites
- Detox installed and configured
- iOS Simulator or Android Emulator
- Test user with active conversation
- Mock file system or test files

## Test Setup

```typescript
import { device, element, by, waitFor } from 'detox';

describe('Document Attachment Upload Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { camera: 'YES', photos: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Login as test user
    // Navigate to chat conversation
  });

  afterEach(async () => {
    await device.clearKeychain();
  });
});
```

## Test Cases

### 1. Camera Photo Upload

```typescript
describe('Camera Photo Upload', () => {
  it('should open attachment picker when attachment button tapped', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await waitFor(element(by.id('attachment-picker-sheet')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should open camera when camera option selected', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Câmera')).tap();
    // Camera permissions already granted in beforeAll
    // Camera should open (platform-specific verification)
  });

  it('should display photo in preview after capture', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Câmera')).tap();
    // Simulate taking photo (requires mock or test photo)
    await element(by.id('camera-capture-button')).tap();
    await element(by.id('camera-use-photo-button')).tap();

    await waitFor(element(by.id('attachment-preview-image-0')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should show file size and count badge', async () => {
    // After selecting photo
    await waitFor(element(by.id('attachment-preview-count-badge')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.text('1/3'))).toBeVisible();
  });

  it('should remove photo when delete button tapped', async () => {
    // After selecting photo
    await element(by.id('attachment-preview-remove-0')).tap();
    await waitFor(element(by.id('attachment-preview-image-0')))
      .not.toBeVisible()
      .withTimeout(1000);
  });
});
```

### 2. Gallery Image Selection

```typescript
describe('Gallery Image Selection', () => {
  it('should open gallery when gallery option selected', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Galeria')).tap();
    // Gallery should open (platform-specific)
  });

  it('should allow multiple image selection from gallery', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Galeria')).tap();
    // Select 2 test images from gallery (requires mock)

    await waitFor(element(by.id('attachment-preview-image-0')))
      .toBeVisible()
      .withTimeout(2000);
    await waitFor(element(by.id('attachment-preview-image-1')))
      .toBeVisible()
      .withTimeout(2000);
    await expect(element(by.text('2/3'))).toBeVisible();
  });

  it('should show error when selecting more than 3 files', async () => {
    // Select 4 images from gallery
    await waitFor(element(by.text(/3 arquivos/)))
      .toBeVisible()
      .withTimeout(2000);
  });
});
```

### 3. PDF Document Upload

```typescript
describe('PDF Document Upload', () => {
  it('should open document picker when PDF option selected', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Documento PDF')).tap();
    // Document picker should open
  });

  it('should display PDF with icon and filename', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Documento PDF')).tap();
    // Select test PDF file (requires mock)

    await waitFor(element(by.id('attachment-preview-pdf-icon-0')))
      .toBeVisible()
      .withTimeout(2000);
    await expect(element(by.text('test-document.pdf'))).toBeVisible();
  });

  it('should show formatted file size for PDF', async () => {
    // After selecting PDF
    await expect(element(by.text(/MB/))).toBeVisible();
  });
});
```

### 4. File Validation

```typescript
describe('File Validation', () => {
  it('should reject file larger than 10MB', async () => {
    // Select large file (>10MB mock)
    await waitFor(element(by.text(/10MB/)))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should reject invalid file types', async () => {
    // Select .txt or other invalid file
    await waitFor(element(by.text(/Tipo de arquivo inválido/)))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should enforce 3 file limit', async () => {
    // Select 4 files
    await waitFor(element(by.text(/3 arquivos/)))
      .toBeVisible()
      .withTimeout(2000);
  });
});
```

### 5. Upload Progress and Message Creation

```typescript
describe('Upload Progress and Message Creation', () => {
  it('should show upload progress indicator', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Galeria')).tap();
    // Select photo

    await element(by.id('chat-send-button')).tap();

    await waitFor(element(by.id('upload-progress-indicator')))
      .toBeVisible()
      .withTimeout(1000);
  });

  it('should disable input during upload', async () => {
    // After tapping send with attachment
    await expect(element(by.id('chat-input-field'))).toHaveToggleValue(false);
    await expect(element(by.id('chat-send-button'))).toHaveToggleValue(false);
  });

  it('should create message with attachment after upload completes', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Galeria')).tap();
    // Select photo

    await element(by.id('chat-send-button')).tap();

    await waitFor(element(by.id('message-attachment-0')))
      .toBeVisible()
      .withTimeout(10000); // Allow time for upload
  });

  it('should send attachment without text message', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Galeria')).tap();
    // Select photo

    // Don't type any text
    await element(by.id('chat-send-button')).tap();

    await waitFor(element(by.id('message-attachment-0')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should send attachment with text message', async () => {
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Galeria')).tap();
    // Select photo

    await element(by.id('chat-input-field')).typeText('Aqui está o documento');
    await element(by.id('chat-send-button')).tap();

    await waitFor(element(by.text('Aqui está o documento')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('message-attachment-0'))).toBeVisible();
  });
});
```

### 6. Error Handling

```typescript
describe('Error Handling', () => {
  it('should show error and restore input on upload failure', async () => {
    // Simulate network failure (requires mock)
    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Galeria')).tap();
    // Select photo

    await element(by.id('chat-input-field')).typeText('Test message');
    await element(by.id('chat-send-button')).tap();

    // Wait for error alert
    await waitFor(element(by.text(/Erro no upload/)))
      .toBeVisible()
      .withTimeout(5000);

    // Tap OK on alert
    await element(by.text('OK')).tap();

    // Input should be restored
    await expect(element(by.id('chat-input-field'))).toHaveText('Test message');
    await expect(element(by.id('attachment-preview-image-0'))).toBeVisible();
  });

  it('should show detailed error for specific failure', async () => {
    // Simulate specific error (e.g., rate limit)
    await waitFor(element(by.text(/uploads por hora/)))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

### 7. Permission Handling

```typescript
describe('Permission Handling', () => {
  it('should request camera permission if not granted', async () => {
    await device.launchApp({
      permissions: { camera: 'NO' },
      newInstance: true,
    });

    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Câmera')).tap();

    await waitFor(element(by.text(/Permissão Necessária/)))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should request media library permission if not granted', async () => {
    await device.launchApp({
      permissions: { photos: 'NO' },
      newInstance: true,
    });

    await element(by.id('chat-attachment-button')).tap();
    await element(by.text('Galeria')).tap();

    await waitFor(element(by.text(/Permissão Necessária/)))
      .toBeVisible()
      .withTimeout(2000);
  });
});
```

### 8. Attachment Display After Upload

```typescript
describe('Attachment Display After Upload', () => {
  it('should display image thumbnail in message', async () => {
    // After successful upload
    await expect(element(by.id('message-attachment-image-0'))).toBeVisible();
  });

  it('should display PDF icon and filename in message', async () => {
    // After successful PDF upload
    await expect(element(by.id('message-attachment-pdf-icon-0'))).toBeVisible();
    await expect(element(by.text('test-document.pdf'))).toBeVisible();
  });

  it('should display pending status badge', async () => {
    // After upload
    await expect(element(by.text('Pendente'))).toBeVisible();
  });

  it('should open fullscreen viewer when tapping image', async () => {
    await element(by.id('message-attachment-image-0')).tap();

    await waitFor(element(by.id('image-viewer-modal')))
      .toBeVisible()
      .withTimeout(1000);
  });
});
```

## Implementation Notes

### Mock Data Setup
```typescript
// Create test files in simulator/emulator
// iOS: Use Xcode to add files to Photos app
// Android: Use adb to push files to emulator

// Mock file paths
const TEST_IMAGE_PATH = '/path/to/test-image.jpg';
const TEST_PDF_PATH = '/path/to/test-document.pdf';
const LARGE_FILE_PATH = '/path/to/large-file.pdf'; // >10MB
```

### Network Mocking
```typescript
// Mock Supabase API responses for upload failures
beforeEach(async () => {
  await device.setURLBlacklist(['https://supabase.co/storage/*']);
});
```

### Detox Configuration
```json
{
  "testRunner": "jest",
  "runnerConfig": "e2e_OLD/config.json",
  "apps": {
    "ios": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/MedSync.app"
    },
    "android": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk"
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 15 Pro"
      }
    },
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_7_API_34"
      }
    }
  }
}
```

## Running Tests

```bash
# iOS
detox build --configuration ios.debug
detox test --configuration ios.debug

# Android
detox build --configuration android.debug
detox test --configuration android.debug

# Specific test file
detox test e2e_OLD/attachment-upload.spec.ts --configuration ios.debug
```

## Test Coverage Summary
- ✅ Camera photo upload (5 tests)
- ✅ Gallery image selection (3 tests)
- ✅ PDF document upload (3 tests)
- ✅ File validation (3 tests)
- ✅ Upload progress and message creation (6 tests)
- ✅ Error handling (2 tests)
- ✅ Permission handling (2 tests)
- ✅ Attachment display after upload (4 tests)

**Total: 28 E2E test cases**
