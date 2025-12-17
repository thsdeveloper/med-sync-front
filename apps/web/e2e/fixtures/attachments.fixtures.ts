import { test as base } from '@playwright/test';
import { ChatAttachmentsPage } from '../pages/ChatAttachmentsPage';

/**
 * Extended test fixtures for chat attachments testing
 */
type AttachmentsFixtures = {
  chatAttachmentsPage: ChatAttachmentsPage;
};

export const test = base.extend<AttachmentsFixtures>({
  chatAttachmentsPage: async ({ page }, use) => {
    const chatAttachmentsPage = new ChatAttachmentsPage(page);
    await use(chatAttachmentsPage);
  },
});

export { expect } from '@playwright/test';
