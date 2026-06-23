// Chat Feature – Public API

// Components
export { ChatLayout } from './components/chat-layout'
export { ChatRoom } from './components/chat-room'
export { ChatSidebar } from './components/chat-sidebar'
export { MessageBubble } from './components/message-bubble'
export { MessageInput } from './components/message-input'
export { ChatEmptyState, ChatLoadingState, MessageLoadingState, TypingIndicator } from './components/chat-states'
export { ReportDialog, BlockDialog } from './components/chat-dialogs'

// Server Actions
export {
  getChatRooms,
  getMessages,
  createChatRoom,
  sendMessage,
  recallMessage,
  markMessagesRead,
  blockUser,
  unblockUser,
  reportUser,
  toggleArchiveRoom,
  toggleMuteRoom,
  togglePinRoom,
  updateChatSettings,
} from './actions/chat-actions'

// Validators / Types
export {
  sendMessageSchema,
  createChatRoomSchema,
  reportUserSchema,
  blockUserSchema,
  chatSettingsSchema,
} from './validators/chat-validators'

export type {
  SendMessageInput,
  CreateChatRoomInput,
  ReportUserInput,
  BlockUserInput,
  ChatSettingsInput,
} from './validators/chat-validators'
