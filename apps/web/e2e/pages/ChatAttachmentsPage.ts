import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Chat Attachments and Admin Review
 *
 * Handles interactions with:
 * - Chat conversation view with attachments
 * - Document attachment cards
 * - Admin review actions (Accept/Reject)
 * - Rejection reason dialog
 * - Attachment status updates
 */
export class ChatAttachmentsPage {
  readonly page: Page;

  // Chat navigation
  readonly chatListItem: (conversationName: string) => Locator;

  // Message and attachment display
  readonly messageList: Locator;
  readonly messageWithAttachment: Locator;
  readonly attachmentCard: Locator;
  readonly attachmentCardByIndex: (index: number) => Locator;
  readonly attachmentThumbnail: Locator;
  readonly attachmentFileName: Locator;
  readonly attachmentFileSize: Locator;
  readonly attachmentUploadDate: Locator;

  // Status badges
  readonly statusBadge: Locator;
  readonly pendingBadge: Locator;
  readonly acceptedBadge: Locator;
  readonly rejectedBadge: Locator;
  readonly rejectedReason: Locator;

  // Admin action buttons
  readonly acceptButton: Locator;
  readonly rejectButton: Locator;
  readonly acceptButtonByIndex: (index: number) => Locator;
  readonly rejectButtonByIndex: (index: number) => Locator;

  // Review dialog
  readonly reviewDialog: Locator;
  readonly reviewDialogTitle: Locator;
  readonly reviewDialogAttachmentInfo: Locator;
  readonly rejectionReasonTextarea: Locator;
  readonly rejectionCharacterCount: Locator;
  readonly confirmAcceptButton: Locator;
  readonly confirmRejectButton: Locator;
  readonly cancelReviewButton: Locator;

  // View attachment
  readonly viewAttachmentButton: Locator;
  readonly fullscreenImage: Locator;
  readonly downloadLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Chat navigation
    this.chatListItem = (conversationName: string) =>
      page.locator(`[data-testid="chat-list-item"]`, { hasText: conversationName }).first();

    // Message and attachment display
    this.messageList = page.locator('[data-testid="chat-messages-list"]');
    this.messageWithAttachment = page.locator('[data-testid="message-with-attachment"]');
    this.attachmentCard = page.locator('[data-testid="attachment-card"]').first();
    this.attachmentCardByIndex = (index: number) =>
      page.locator('[data-testid="attachment-card"]').nth(index);
    this.attachmentThumbnail = page.locator('[data-testid="attachment-thumbnail"]');
    this.attachmentFileName = page.locator('[data-testid="attachment-filename"]');
    this.attachmentFileSize = page.locator('[data-testid="attachment-filesize"]');
    this.attachmentUploadDate = page.locator('[data-testid="attachment-upload-date"]');

    // Status badges
    this.statusBadge = page.locator('[data-testid="attachment-status-badge"]').first();
    this.pendingBadge = page.locator('[data-testid="status-badge-pending"]');
    this.acceptedBadge = page.locator('[data-testid="status-badge-accepted"]');
    this.rejectedBadge = page.locator('[data-testid="status-badge-rejected"]');
    this.rejectedReason = page.locator('[data-testid="rejected-reason-text"]');

    // Admin action buttons
    this.acceptButton = page.locator('[data-testid="accept-attachment-button"]').first();
    this.rejectButton = page.locator('[data-testid="reject-attachment-button"]').first();
    this.acceptButtonByIndex = (index: number) =>
      page.locator('[data-testid="accept-attachment-button"]').nth(index);
    this.rejectButtonByIndex = (index: number) =>
      page.locator('[data-testid="reject-attachment-button"]').nth(index);

    // Review dialog
    this.reviewDialog = page.locator('[role="dialog"][aria-labelledby*="review"]');
    this.reviewDialogTitle = this.reviewDialog.locator('[id*="title"]');
    this.reviewDialogAttachmentInfo = this.reviewDialog.locator('[data-testid="attachment-info"]');
    this.rejectionReasonTextarea = page.locator('[data-testid="rejection-reason-textarea"]');
    this.rejectionCharacterCount = page.locator('[data-testid="character-count"]');
    this.confirmAcceptButton = this.reviewDialog.locator('button', { hasText: /aprovar|confirmar/i });
    this.confirmRejectButton = this.reviewDialog.locator('button', { hasText: /rejeitar/i });
    this.cancelReviewButton = this.reviewDialog.locator('button', { hasText: /cancelar/i });

    // View attachment
    this.viewAttachmentButton = page.locator('[data-testid="view-attachment-button"]').first();
    this.fullscreenImage = page.locator('[data-testid="fullscreen-image"]');
    this.downloadLink = page.locator('[data-testid="download-attachment-link"]');
  }

  /**
   * Navigate to chat page
   */
  async goto() {
    await this.page.goto('/dashboard/chat');
    await this.waitForChatLoad();
  }

  /**
   * Wait for chat list to load
   */
  async waitForChatLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="chat-list"]', { timeout: 5000 });
  }

  /**
   * Navigate to specific conversation
   */
  async openConversation(conversationName: string) {
    await this.chatListItem(conversationName).click();
    await this.page.waitForLoadState('networkidle');
    await this.messageList.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Get count of visible attachments
   */
  async getAttachmentCount(): Promise<number> {
    return await this.page.locator('[data-testid="attachment-card"]').count();
  }

  /**
   * Get attachment data by index
   */
  async getAttachmentData(index: number) {
    const card = this.attachmentCardByIndex(index);

    return {
      fileName: await card.locator('[data-testid="attachment-filename"]').textContent(),
      fileSize: await card.locator('[data-testid="attachment-filesize"]').textContent(),
      status: await card.locator('[data-testid="attachment-status-badge"]').textContent(),
    };
  }

  /**
   * Accept attachment (opens dialog and confirms)
   */
  async acceptAttachment(index: number = 0) {
    await this.acceptButtonByIndex(index).click();
    await this.reviewDialog.waitFor({ state: 'visible', timeout: 2000 });
    await this.confirmAcceptButton.click();
    await this.reviewDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Reject attachment with reason
   */
  async rejectAttachment(index: number, reason: string) {
    await this.rejectButtonByIndex(index).click();
    await this.reviewDialog.waitFor({ state: 'visible', timeout: 2000 });
    await this.rejectionReasonTextarea.fill(reason);
    await this.confirmRejectButton.click();
    await this.reviewDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Cancel review dialog
   */
  async cancelReview() {
    await this.cancelReviewButton.click();
    await this.reviewDialog.waitFor({ state: 'hidden', timeout: 2000 });
  }

  /**
   * View attachment (click to open fullscreen/download)
   */
  async viewAttachment(index: number = 0) {
    await this.attachmentCardByIndex(index).click();
  }

  /**
   * Wait for attachment status update
   */
  async waitForStatusUpdate(expectedStatus: 'pending' | 'accepted' | 'rejected', timeout: number = 10000) {
    const statusBadgeLocator = this.page.locator(`[data-testid="status-badge-${expectedStatus}"]`).first();
    await statusBadgeLocator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Expect attachment status badge to be visible
   */
  async expectAttachmentStatus(status: 'pending' | 'accepted' | 'rejected') {
    const badge = this.page.locator(`[data-testid="status-badge-${status}"]`).first();
    await expect(badge).toBeVisible();
  }

  /**
   * Expect attachment with specific filename to be visible
   */
  async expectAttachmentVisible(fileName: string) {
    const attachment = this.page.locator('[data-testid="attachment-card"]', { hasText: fileName });
    await expect(attachment).toBeVisible();
  }

  /**
   * Expect rejection reason to be displayed
   */
  async expectRejectionReason(reason: string) {
    await expect(this.rejectedReason).toContainText(reason);
  }

  /**
   * Expect accept/reject buttons to be visible (admin only)
   */
  async expectAdminActionsVisible() {
    await expect(this.acceptButton).toBeVisible();
    await expect(this.rejectButton).toBeVisible();
  }

  /**
   * Expect accept/reject buttons to NOT be visible (non-admin)
   */
  async expectAdminActionsHidden() {
    await expect(this.acceptButton).not.toBeVisible();
    await expect(this.rejectButton).not.toBeVisible();
  }

  /**
   * Expect review dialog to be open
   */
  async expectReviewDialogOpen(title?: string) {
    await expect(this.reviewDialog).toBeVisible();
    if (title) {
      await expect(this.reviewDialogTitle).toContainText(title);
    }
  }

  /**
   * Expect review dialog to be closed
   */
  async expectReviewDialogClosed() {
    await expect(this.reviewDialog).not.toBeVisible();
  }

  /**
   * Expect character count to match value
   */
  async expectCharacterCount(count: number) {
    await expect(this.rejectionCharacterCount).toContainText(`${count}/500`);
  }

  /**
   * Expect reject button to be disabled (no reason provided)
   */
  async expectRejectButtonDisabled() {
    await expect(this.confirmRejectButton).toBeDisabled();
  }

  /**
   * Type rejection reason and verify character count
   */
  async typeRejectionReason(reason: string) {
    await this.rejectionReasonTextarea.fill(reason);
    await this.expectCharacterCount(reason.length);
  }

  /**
   * Refresh page and wait for load
   */
  async refresh() {
    await this.page.reload();
    await this.waitForChatLoad();
  }

  /**
   * Scroll to specific message by attachment filename
   */
  async scrollToAttachment(fileName: string) {
    const attachment = this.page.locator('[data-testid="attachment-card"]', { hasText: fileName });
    await attachment.scrollIntoViewIfNeeded();
  }

  /**
   * Get URL parameters
   */
  getURLParams(): URLSearchParams {
    const url = new URL(this.page.url());
    return url.searchParams;
  }

  /**
   * Expect URL to contain specific conversation ID
   */
  async expectURLConversation(conversationId: string) {
    const url = this.page.url();
    expect(url).toContain(conversationId);
  }
}
