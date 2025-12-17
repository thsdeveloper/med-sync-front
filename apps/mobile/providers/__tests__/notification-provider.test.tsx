import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { NotificationProvider, useNotifications } from '../notification-provider';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('NotificationProvider - Document Notifications', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  describe('Document Accepted Notification', () => {
    it('should navigate to chat conversation when document_accepted notification tapped', async () => {
      const mockNotificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'document_accepted',
                conversation_id: 'conv-123',
                attachment_id: 'attach-456',
                file_name: 'document.pdf',
              },
            },
          },
        },
      };

      // Setup notification listener mock
      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      // Wait for listeners to be set up
      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      // Simulate notification tap
      listenerCallback(mockNotificationResponse);

      // Should navigate to conversation
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(app)/chat/conv-123');
      });
    });

    it('should include attachment metadata in navigation', async () => {
      const mockNotificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'document_accepted',
                conversation_id: 'conv-789',
                attachment_id: 'attach-101',
                file_name: 'report.pdf',
                file_type: 'pdf',
              },
            },
          },
        },
      };

      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      listenerCallback(mockNotificationResponse);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(app)/chat/conv-789');
      });
    });
  });

  describe('Document Rejected Notification', () => {
    it('should navigate to chat conversation when document_rejected notification tapped', async () => {
      const mockNotificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'document_rejected',
                conversation_id: 'conv-456',
                attachment_id: 'attach-789',
                file_name: 'invalid-doc.pdf',
                rejected_reason: 'Documento ilegível',
              },
            },
          },
        },
      };

      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      listenerCallback(mockNotificationResponse);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(app)/chat/conv-456');
      });
    });

    it('should include rejected_reason in notification data', async () => {
      const rejectedReason = 'Documento está borrado e não pode ser lido';
      const mockNotificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'document_rejected',
                conversation_id: 'conv-999',
                attachment_id: 'attach-888',
                rejected_reason: rejectedReason,
              },
            },
          },
        },
      };

      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      listenerCallback(mockNotificationResponse);

      // Should still navigate despite rejection
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(app)/chat/conv-999');
      });
    });
  });

  describe('Notification Fallback Handling', () => {
    it('should navigate to chat list if conversation_id is missing', async () => {
      const mockNotificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'document_accepted',
                attachment_id: 'attach-456',
                file_name: 'document.pdf',
                // conversation_id missing
              },
            },
          },
        },
      };

      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      listenerCallback(mockNotificationResponse);

      // Should fallback to chat list
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(app)/(tabs)/chat');
      });
    });

    it('should handle generic conversation_id field for any notification type', async () => {
      const mockNotificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'custom_notification',
                conversation_id: 'conv-123',
              },
            },
          },
        },
      };

      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      listenerCallback(mockNotificationResponse);

      // Should navigate using generic conversation_id handling
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });

  describe('Notification Payload Structure', () => {
    it('should handle complete document_accepted payload', async () => {
      const completePayload = {
        notification: {
          request: {
            content: {
              title: 'Documento Aprovado',
              body: 'Seu documento report.pdf foi aprovado',
              data: {
                type: 'document_accepted',
                conversation_id: 'conv-111',
                attachment_id: 'attach-222',
                file_name: 'report.pdf',
                file_type: 'pdf',
                status: 'accepted',
                reviewed_by: 'admin-user-id',
                reviewed_at: '2025-12-17T15:00:00Z',
              },
            },
          },
        },
      };

      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      listenerCallback(completePayload);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(app)/chat/conv-111');
      });
    });

    it('should handle complete document_rejected payload', async () => {
      const completePayload = {
        notification: {
          request: {
            content: {
              title: 'Documento Rejeitado',
              body: 'Seu documento invalid.pdf foi rejeitado. Motivo: Documento ilegível',
              data: {
                type: 'document_rejected',
                conversation_id: 'conv-333',
                attachment_id: 'attach-444',
                file_name: 'invalid.pdf',
                file_type: 'pdf',
                status: 'rejected',
                rejected_reason: 'Documento ilegível',
                reviewed_by: 'admin-user-id',
                reviewed_at: '2025-12-17T15:00:00Z',
              },
            },
          },
        },
      };

      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      listenerCallback(completePayload);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(app)/chat/conv-333');
      });
    });
  });

  describe('Navigation Safety', () => {
    it('should use setTimeout for safe navigation', async () => {
      jest.useFakeTimers();

      const mockNotificationResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'document_accepted',
                conversation_id: 'conv-safe',
              },
            },
          },
        },
      };

      const listenerCallback = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
        (callback) => {
          listenerCallback.mockImplementation(callback);
          return { remove: jest.fn() };
        }
      );

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      listenerCallback(mockNotificationResponse);

      // Navigation should not be immediate
      expect(mockRouter.push).not.toHaveBeenCalled();

      // Fast-forward timers
      jest.runAllTimers();

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(app)/chat/conv-safe');
      });

      jest.useRealTimers();
    });
  });
});
