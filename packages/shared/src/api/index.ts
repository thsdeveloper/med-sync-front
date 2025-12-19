// Chat API
export {
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  deleteMessage,
  createConversation,
  markConversationAsRead,
  getTotalUnreadCount,
} from './chat.api';
export type {
  GetConversationsParams,
  GetMessagesParams,
  GetMessagesResult,
  SendMessageParams,
  DeleteMessageParams,
} from './chat.api';

// Attachments API
export {
  validateFile as validateAttachmentFile,
  getFileTypeFromName,
  generateStoragePath as generateAttachmentPath,
  getAttachments,
  getPendingAttachments,
  getAttachmentById,
  uploadFileToStorage,
  createAttachmentRecord,
  updateAttachmentStatus,
  deleteAttachment,
  getAttachmentDownloadUrl as getAttachmentSignedUrl,
  formatFileSize as formatAttachmentSize,
  getFileIcon,
} from './attachments.api';
export type {
  UploadAttachmentParams as ApiUploadAttachmentParams,
  UploadFileParams,
  UpdateAttachmentStatusParams,
  GetAttachmentsParams,
  AttachmentUploadResult,
} from './attachments.api';
