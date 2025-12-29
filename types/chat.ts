/**
 * Chat System Types
 * Based on backend spec: 03G-CHAT.apib
 */

export type ChatRoomType = 'sector' | 'faction' | 'alliance' | 'global' | 'dm' | 'group';

export interface ChatRoom {
  room_id: string;
  room_type: ChatRoomType;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  member_count: number;
  is_joined: boolean;
}

export interface ChatMessage {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  is_system_message: boolean;
}

export interface CreateRoomRequest {
  room_type: ChatRoomType;
  name: string;
  description?: string;
}

export interface JoinRoomRequest {
  room_id: string;
}

export interface SendMessageRequest {
  room_id: string;
  content: string;
}

export interface CreatePrivateRoomRequest {
  target_player_id: string;
}

// SSE Event Types
export interface ChatMessageEvent {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  is_system_message: boolean;
}

export type ChatEvent =
  | { type: 'CHAT_MESSAGE'; data: ChatMessageEvent };
