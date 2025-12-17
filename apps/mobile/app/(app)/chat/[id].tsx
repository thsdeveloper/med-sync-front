import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isYesterday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import AttachmentPicker from '@/components/molecules/AttachmentPicker';
import AttachmentPreview from '@/components/molecules/AttachmentPreview';
import AttachmentDisplay from '@/components/molecules/AttachmentDisplay';
import ImageViewer from '@/components/organisms/ImageViewer';
import { useAttachmentUpload, linkAttachmentsToMessage } from '@/hooks/useAttachmentUpload';
import { useAttachmentDownload } from '@/hooks/useAttachmentDownload';
import * as Sharing from 'expo-sharing';
import type { SelectedFile } from '@/lib/attachment-utils';
import type { MessageWithSender, ConversationWithDetails, ChatAttachment } from '@medsync/shared';

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staff } = useAuth();
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; attachment: ChatAttachment } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { isUploading, uploadProgress, uploadFiles, reset: resetUpload } = useAttachmentUpload();
  const { downloadAttachment } = useAttachmentDownload();

  const loadConversation = useCallback(async () => {
    if (!id) return;

    try {
      // Load conversation details with organization for support chats
      const { data: convData } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          participants:chat_participants (
            staff_id,
            staff:medical_staff (id, name, color, avatar_url)
          ),
          organization:organizations (id, name, logo_url)
        `)
        .eq('id', id)
        .single();

      if (convData) {
        setConversation(convData);
      }

      // Load messages with attachments
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:medical_staff (id, name, color, avatar_url),
          attachments:chat_attachments (
            id,
            file_name,
            file_type,
            file_path,
            file_size,
            status,
            rejected_reason,
            created_at
          )
        `)
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (messagesData) {
        const enrichedMessages = messagesData.map((msg) => ({
          ...msg,
          is_own: msg.sender_id === staff?.id,
        }));
        setMessages(enrichedMessages);
      }

      // Update last_read_at
      if (staff?.id) {
        await supabase
          .from('chat_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', id)
          .eq('staff_id', staff.id);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, staff?.id]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Subscribe to new messages
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`chat_messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${id}`,
        },
        async (payload) => {
          // Fetch the full message with sender info and attachments
          const { data: newMsg } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:medical_staff (id, name, color, avatar_url),
              attachments:chat_attachments (
                id,
                file_name,
                file_type,
                file_path,
                file_size,
                status,
                rejected_reason,
                created_at
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMsg) {
            setMessages((prev) => [
              ...prev,
              { ...newMsg, is_own: newMsg.sender_id === staff?.id },
            ]);

            // Update last_read_at
            if (staff?.id) {
              await supabase
                .from('chat_participants')
                .update({ last_read_at: new Date().toISOString() })
                .eq('conversation_id', id)
                .eq('staff_id', staff.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, staff?.id]);

  const handleFilesSelected = useCallback((files: SelectedFile[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Handle image attachment press - open fullscreen viewer
   */
  const handleImagePress = useCallback((attachment: ChatAttachment, imageUri: string) => {
    setSelectedImage({ uri: imageUri, attachment });
    setImageViewerVisible(true);
  }, []);

  /**
   * Handle PDF attachment press - download and share
   */
  const handlePdfPress = useCallback(
    async (attachment: ChatAttachment, pdfUri: string) => {
      try {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo.');
          return;
        }

        // Share the PDF
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: attachment.file_name,
        });
      } catch (error) {
        console.error('Error sharing PDF:', error);
        Alert.alert('Erro', 'Não foi possível abrir o documento.');
      }
    },
    []
  );

  /**
   * Close image viewer
   */
  const handleCloseImageViewer = useCallback(() => {
    setImageViewerVisible(false);
    setSelectedImage(null);
  }, []);

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !id || !staff?.id || isSending) {
      return;
    }

    setIsSending(true);
    const messageContent = newMessage.trim();
    const filesToUpload = [...selectedFiles];
    setNewMessage('');
    setSelectedFiles([]);

    try {
      // Get organization ID from conversation
      const convAny = conversation as any;
      const organizationId = convAny?.organization_id || staff.organization_id;

      if (!organizationId) {
        throw new Error('Organization ID not found');
      }

      // If there are attachments, upload them first
      let attachmentIds: string[] = [];
      if (filesToUpload.length > 0) {
        const uploadResults = await uploadFiles(
          filesToUpload,
          id,
          organizationId,
          staff.id
        );

        // Check for upload failures
        const failures = uploadResults.filter((r) => !r.success);
        if (failures.length > 0) {
          const errorMsg = failures.map((f) => `${f.fileName}: ${f.error}`).join('\n');
          Alert.alert(
            'Erro no Upload',
            `Alguns arquivos não puderam ser enviados:\n\n${errorMsg}`,
            [{ text: 'OK' }]
          );
        }

        // Collect successful attachment IDs
        attachmentIds = uploadResults
          .filter((r) => r.success && r.attachmentId)
          .map((r) => r.attachmentId!);
      }

      // Insert message (even if content is empty but has attachments)
      const messageToSend = messageContent || '📎 Anexo enviado';
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: id,
          sender_id: staff.id,
          content: messageToSend,
        })
        .select('id')
        .single();

      if (messageError) throw messageError;

      // Link attachments to message
      if (attachmentIds.length > 0 && messageData?.id) {
        await linkAttachmentsToMessage(attachmentIds, messageData.id);
      }

      // Update conversation updated_at
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      // Reset upload state
      resetUpload();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Erro',
        'Não foi possível enviar a mensagem. Tente novamente.',
        [{ text: 'OK' }]
      );
      // Restore message and files on error
      setNewMessage(messageContent);
      setSelectedFiles(filesToUpload);
    } finally {
      setIsSending(false);
    }
  };

  const getConversationTitle = () => {
    // For support conversations, show organization name
    const convAny = conversation as any;
    if (convAny?.conversation_type === 'support' && convAny?.organization?.name) {
      return convAny.organization.name;
    }

    if (conversation?.name) return conversation.name;

    const otherParticipant = conversation?.participants.find(
      (p: any) => p.staff_id !== staff?.id
    );
    return otherParticipant?.staff?.name || 'Conversa';
  };

  const isSupport = (conversation as any)?.conversation_type === 'support';

  const formatMessageDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const shouldShowDateSeparator = (current: MessageWithSender, index: number) => {
    if (index === 0) return true;
    const previous = messages[index - 1];
    return !isSameDay(parseISO(current.created_at), parseISO(previous.created_at));
  };

  const renderMessage = ({ item, index }: { item: MessageWithSender; index: number }) => {
    const showDate = shouldShowDateSeparator(item, index);
    const isOwn = item.is_own;

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatMessageDate(item.created_at)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          {!isOwn && (
            <Avatar
              name={item.sender?.name || '?'}
              color={item.sender?.color || '#6B7280'}
              size="sm"
              style={styles.messageAvatar}
              imageUrl={item.sender?.avatar_url || null}
            />
          )}
          <View
            style={[
              styles.messageBubble,
              isOwn ? styles.ownBubble : styles.otherBubble,
            ]}
          >
            {!isOwn && conversation?.type === 'group' && (
              <Text style={styles.senderName}>{item.sender?.name}</Text>
            )}
            <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
              {item.content}
            </Text>

            {/* Display attachments if present */}
            {item.attachments && item.attachments.length > 0 && (
              <AttachmentDisplay
                attachments={item.attachments}
                onImagePress={handleImagePress}
                onPdfPress={handlePdfPress}
                isOwnMessage={isOwn}
              />
            )}

            <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
              {format(parseISO(item.created_at), 'HH:mm')}
            </Text>
          </View>
        </View>
      </>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      </SafeAreaView>
    );
  }

  const canSend = (newMessage.trim() || selectedFiles.length > 0) && !isSending && !isUploading;

  return (
    <>
      <Stack.Screen
        options={{
          title: getConversationTitle(),
          headerBackTitle: 'Chat',
        }}
      />

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          visible={imageViewerVisible}
          imageUri={selectedImage.uri}
          attachment={selectedImage.attachment}
          onClose={handleCloseImageViewer}
        />
      )}

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
                <Text style={styles.emptySubtext}>
                  Envie a primeira mensagem para iniciar a conversa
                </Text>
              </View>
            }
          />

          {/* Attachment Preview */}
          <AttachmentPreview
            files={selectedFiles}
            onRemoveFile={handleRemoveFile}
          />

          {/* Upload Progress Indicator */}
          {isUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#0066CC" />
              <Text style={styles.uploadingText}>
                Enviando arquivos... ({uploadProgress.filter((p) => p.status === 'success').length}/
                {uploadProgress.length})
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            {/* Attachment Picker Button */}
            <AttachmentPicker
              currentFileCount={selectedFiles.length}
              onFilesSelected={handleFilesSelected}
              disabled={isSending || isUploading}
            />

            <TextInput
              style={styles.input}
              placeholder="Digite uma mensagem..."
              placeholderTextColor="#9CA3AF"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={2000}
              editable={!isSending && !isUploading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !canSend && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!canSend}
            >
              {isSending || isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: '#0066CC',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  uploadingText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
