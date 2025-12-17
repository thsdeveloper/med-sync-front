import { test, expect } from './fixtures/attachments.fixtures';

test.describe('Chat Document Attachments - Admin Review Workflow', () => {
  test.beforeEach(async ({ chatAttachmentsPage }) => {
    await chatAttachmentsPage.goto();
  });

  test.describe('Attachment Display', () => {
    test('should display document attachments in chat messages', async ({ chatAttachmentsPage }) => {
      // Navigate to conversation with attachments
      await chatAttachmentsPage.openConversation('Test Conversation');

      // Verify attachment card is visible
      await expect(chatAttachmentsPage.attachmentCard).toBeVisible();
    });

    test('should display attachment metadata (filename, size, date)', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Test Conversation');

      // Verify metadata fields are visible
      await expect(chatAttachmentsPage.attachmentFileName).toBeVisible();
      await expect(chatAttachmentsPage.attachmentFileSize).toBeVisible();
      await expect(chatAttachmentsPage.attachmentUploadDate).toBeVisible();
    });

    test('should display image thumbnails for image attachments', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Test Conversation');

      // Verify image thumbnail is displayed
      await expect(chatAttachmentsPage.attachmentThumbnail).toBeVisible();

      // Verify thumbnail has src attribute
      const thumbnail = chatAttachmentsPage.attachmentThumbnail;
      const src = await thumbnail.getAttribute('src');
      expect(src).toBeTruthy();
    });

    test('should display PDF icon for PDF attachments', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Test PDF Conversation');

      // Verify PDF icon is displayed
      const pdfIcon = chatAttachmentsPage.page.locator('[data-testid="pdf-icon"]');
      await expect(pdfIcon).toBeVisible();
    });

    test('should display status badge for each attachment', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Test Conversation');

      // Verify status badge exists
      await expect(chatAttachmentsPage.statusBadge).toBeVisible();
    });
  });

  test.describe('Status Badges', () => {
    test('should display pending badge for pending attachments', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.expectAttachmentStatus('pending');
      await expect(chatAttachmentsPage.pendingBadge).toContainText('Pendente');
    });

    test('should display accepted badge for approved attachments', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Approved Attachments');

      await chatAttachmentsPage.expectAttachmentStatus('accepted');
      await expect(chatAttachmentsPage.acceptedBadge).toContainText('Aprovado');
    });

    test('should display rejected badge for rejected attachments', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Rejected Attachments');

      await chatAttachmentsPage.expectAttachmentStatus('rejected');
      await expect(chatAttachmentsPage.rejectedBadge).toContainText('Rejeitado');
    });

    test('should display rejection reason for rejected attachments', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Rejected Attachments');

      await chatAttachmentsPage.expectRejectionReason('Documento ilegível');
    });
  });

  test.describe('Admin Actions - Accept', () => {
    test('should show accept button for pending attachments', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.expectAdminActionsVisible();
    });

    test('should open confirmation dialog when accept clicked', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.acceptButton.click();

      await chatAttachmentsPage.expectReviewDialogOpen('Aprovar');
    });

    test('should display attachment info in accept dialog', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.acceptButton.click();

      // Verify attachment info is shown
      await expect(chatAttachmentsPage.reviewDialogAttachmentInfo).toBeVisible();
    });

    test('should accept attachment on confirmation', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.acceptAttachment(0);

      // Wait for status update
      await chatAttachmentsPage.waitForStatusUpdate('accepted');

      // Verify accepted badge is displayed
      await chatAttachmentsPage.expectAttachmentStatus('accepted');
    });

    test('should close dialog after accepting', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.acceptAttachment(0);

      await chatAttachmentsPage.expectReviewDialogClosed();
    });

    test('should hide accept/reject buttons after approval', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.acceptAttachment(0);

      // Wait for UI update
      await chatAttachmentsPage.waitForStatusUpdate('accepted');

      // Action buttons should be hidden
      await expect(chatAttachmentsPage.acceptButton).not.toBeVisible();
      await expect(chatAttachmentsPage.rejectButton).not.toBeVisible();
    });
  });

  test.describe('Admin Actions - Reject', () => {
    test('should show reject button for pending attachments', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await expect(chatAttachmentsPage.rejectButton).toBeVisible();
    });

    test('should open rejection dialog when reject clicked', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.rejectButton.click();

      await chatAttachmentsPage.expectReviewDialogOpen('Rejeitar');
    });

    test('should display rejection reason textarea', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.rejectButton.click();

      await expect(chatAttachmentsPage.rejectionReasonTextarea).toBeVisible();
    });

    test('should show character count for rejection reason', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.rejectButton.click();

      await chatAttachmentsPage.expectCharacterCount(0);

      await chatAttachmentsPage.typeRejectionReason('Documento inválido');

      await chatAttachmentsPage.expectCharacterCount(18);
    });

    test('should disable reject button when reason is empty', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.rejectButton.click();

      await chatAttachmentsPage.expectRejectButtonDisabled();
    });

    test('should reject attachment with reason', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      const rejectionReason = 'Documento está borrado e ilegível';
      await chatAttachmentsPage.rejectAttachment(0, rejectionReason);

      // Wait for status update
      await chatAttachmentsPage.waitForStatusUpdate('rejected');

      // Verify rejected badge and reason
      await chatAttachmentsPage.expectAttachmentStatus('rejected');
      await chatAttachmentsPage.expectRejectionReason(rejectionReason);
    });

    test('should enforce 500 character limit on rejection reason', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.rejectButton.click();

      const longReason = 'a'.repeat(501);
      await chatAttachmentsPage.rejectionReasonTextarea.fill(longReason);

      // Should only accept 500 characters
      const value = await chatAttachmentsPage.rejectionReasonTextarea.inputValue();
      expect(value.length).toBeLessThanOrEqual(500);
    });

    test('should hide accept/reject buttons after rejection', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.rejectAttachment(0, 'Documento inválido');

      // Wait for UI update
      await chatAttachmentsPage.waitForStatusUpdate('rejected');

      // Action buttons should be hidden
      await expect(chatAttachmentsPage.acceptButton).not.toBeVisible();
      await expect(chatAttachmentsPage.rejectButton).not.toBeVisible();
    });
  });

  test.describe('Dialog Cancel Behavior', () => {
    test('should close accept dialog on cancel', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.acceptButton.click();
      await chatAttachmentsPage.cancelReview();

      await chatAttachmentsPage.expectReviewDialogClosed();

      // Status should remain pending
      await chatAttachmentsPage.expectAttachmentStatus('pending');
    });

    test('should close reject dialog on cancel', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.rejectButton.click();
      await chatAttachmentsPage.typeRejectionReason('Some reason');
      await chatAttachmentsPage.cancelReview();

      await chatAttachmentsPage.expectReviewDialogClosed();

      // Status should remain pending
      await chatAttachmentsPage.expectAttachmentStatus('pending');
    });

    test('should not save rejection reason when canceled', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      // Open reject dialog, type reason, cancel
      await chatAttachmentsPage.rejectButton.click();
      await chatAttachmentsPage.typeRejectionReason('Test reason');
      await chatAttachmentsPage.cancelReview();

      // Re-open dialog - reason should be empty
      await chatAttachmentsPage.rejectButton.click();
      const value = await chatAttachmentsPage.rejectionReasonTextarea.inputValue();
      expect(value).toBe('');
    });
  });

  test.describe('Attachment Viewing', () => {
    test('should open fullscreen viewer for images', async ({ chatAttachmentsPage, page }) => {
      await chatAttachmentsPage.openConversation('Image Attachments');

      await chatAttachmentsPage.viewAttachment(0);

      // Wait for new tab/window or fullscreen modal
      const newTab = await page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);

      if (newTab) {
        // Opened in new tab
        expect(newTab.url()).toContain('.jpg');
        await newTab.close();
      } else {
        // Opened in modal/fullscreen
        await expect(chatAttachmentsPage.fullscreenImage).toBeVisible();
      }
    });

    test('should download PDF when clicked', async ({ chatAttachmentsPage, page }) => {
      await chatAttachmentsPage.openConversation('PDF Attachments');

      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      await chatAttachmentsPage.viewAttachment(0);

      // Wait for download to start
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    });

    test('should generate signed URL for attachment access', async ({ chatAttachmentsPage, page }) => {
      await chatAttachmentsPage.openConversation('Image Attachments');

      // Click attachment to view
      await chatAttachmentsPage.viewAttachment(0);

      // Check if new tab opened with signed URL
      const newTab = await page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);

      if (newTab) {
        const url = newTab.url();
        // Supabase signed URLs contain a token parameter
        expect(url).toMatch(/token=|X-Amz-/);
        await newTab.close();
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should update UI immediately after status change', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      const initialStatus = await chatAttachmentsPage.statusBadge.textContent();
      expect(initialStatus).toContain('Pendente');

      await chatAttachmentsPage.acceptAttachment(0);

      // UI should update without refresh
      await chatAttachmentsPage.waitForStatusUpdate('accepted', 5000);

      const updatedStatus = await chatAttachmentsPage.statusBadge.textContent();
      expect(updatedStatus).toContain('Aprovado');
    });

    test('should persist status after page refresh', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.acceptAttachment(0);
      await chatAttachmentsPage.waitForStatusUpdate('accepted');

      // Refresh page
      await chatAttachmentsPage.refresh();
      await chatAttachmentsPage.openConversation('Pending Attachments');

      // Status should still be accepted
      await chatAttachmentsPage.expectAttachmentStatus('accepted');
    });
  });

  test.describe('Multiple Attachments', () => {
    test('should handle multiple attachments in single message', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Multiple Attachments');

      const count = await chatAttachmentsPage.getAttachmentCount();
      expect(count).toBeGreaterThan(1);
    });

    test('should accept first attachment and leave others pending', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Multiple Attachments');

      // Accept first attachment
      await chatAttachmentsPage.acceptAttachment(0);
      await chatAttachmentsPage.waitForStatusUpdate('accepted');

      // Second attachment should still be pending
      const secondAttachment = chatAttachmentsPage.attachmentCardByIndex(1);
      const statusBadge = secondAttachment.locator('[data-testid="attachment-status-badge"]');
      await expect(statusBadge).toContainText('Pendente');
    });

    test('should handle mixed statuses in same message', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Mixed Status Attachments');

      // Should have both accepted and pending badges visible
      await expect(chatAttachmentsPage.acceptedBadge).toBeVisible();
      await expect(chatAttachmentsPage.pendingBadge).toBeVisible();
    });
  });

  test.describe('Permission and Access Control', () => {
    test('should only show admin actions for admin users', async ({ chatAttachmentsPage }) => {
      // Assuming test user is admin
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.expectAdminActionsVisible();
    });

    test('should hide admin actions for non-admin users', async ({ page, chatAttachmentsPage }) => {
      // This test would require logging in as non-admin user
      // For now, we'll skip or mark as TODO
      test.skip();

      // Expected behavior:
      // await chatAttachmentsPage.openConversation('Pending Attachments');
      // await chatAttachmentsPage.expectAdminActionsHidden();
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message if status update fails', async ({ chatAttachmentsPage, page }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      // Mock network failure
      await page.route('**/update_attachment_status', (route) => route.abort());

      await chatAttachmentsPage.acceptButton.click();
      await chatAttachmentsPage.confirmAcceptButton.click();

      // Should show error toast/alert
      const errorToast = page.locator('[role="alert"]', { hasText: /erro|falha/i });
      await expect(errorToast).toBeVisible({ timeout: 5000 });
    });

    test('should maintain pending status if update fails', async ({ chatAttachmentsPage, page }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      // Mock network failure
      await page.route('**/update_attachment_status', (route) => route.abort());

      await chatAttachmentsPage.acceptButton.click();
      await chatAttachmentsPage.confirmAcceptButton.click();

      // Wait for error
      await page.waitForTimeout(2000);

      // Status should remain pending
      await chatAttachmentsPage.expectAttachmentStatus('pending');
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible button labels', async ({ chatAttachmentsPage }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      const acceptBtn = chatAttachmentsPage.acceptButton;
      const rejectBtn = chatAttachmentsPage.rejectButton;

      // Buttons should have accessible names
      await expect(acceptBtn).toHaveAccessibleName(/aprovar/i);
      await expect(rejectBtn).toHaveAccessibleName(/rejeitar/i);
    });

    test('should support keyboard navigation in dialog', async ({ chatAttachmentsPage, page }) => {
      await chatAttachmentsPage.openConversation('Pending Attachments');

      await chatAttachmentsPage.rejectButton.click();

      // Tab should move focus through dialog elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Escape should close dialog
      await page.keyboard.press('Escape');

      await chatAttachmentsPage.expectReviewDialogClosed();
    });
  });
});
