import { apiClient } from './client';
import {
  ChatRoom,
  ChatMessage,
  CreateRoomRequest,
  JoinRoomRequest,
  SendMessageRequest,
  CreatePrivateRoomRequest,
} from '@/types/chat';

/**
 * Chat API Client
 * Backend endpoints from 03G-CHAT.apib
 */
export const chatApi = {
  /**
   * Get all available chat rooms for a player
   * GET /v1/chat/rooms?player_id={playerId}
   */
  getRooms: (playerId: string) =>
    apiClient.get<{ rooms: ChatRoom[] }>(`/chat/rooms?player_id=${playerId}`),

  /**
   * Create a new chat room (custom rooms only)
   * POST /v1/chat/rooms
   */
  createRoom: (data: CreateRoomRequest) =>
    apiClient.post<ChatRoom>('/chat/rooms', data),

  /**
   * Get room details
   * GET /v1/chat/rooms/{room_id}
   */
  getRoom: (roomId: string) =>
    apiClient.get<ChatRoom>(`/chat/rooms/${roomId}`),

  /**
   * Join a chat room
   * POST /v1/chat/rooms/{room_id}/join
   */
  joinRoom: (roomId: string) =>
    apiClient.post<{ message: string }>(`/chat/rooms/${roomId}/join`, {}),

  /**
   * Leave a chat room
   * POST /v1/chat/rooms/{room_id}/leave
   */
  leaveRoom: (roomId: string) =>
    apiClient.post<{ message: string }>(`/chat/rooms/${roomId}/leave`, {}),

  /**
   * Send a message to a room
   * POST /v1/chat/messages
   */
  sendMessage: (data: SendMessageRequest) =>
    apiClient.post<ChatMessage>('/chat/messages', data),

  /**
   * Create a private DM room
   * POST /v1/chat/private
   */
  createPrivateRoom: (data: CreatePrivateRoomRequest) =>
    apiClient.post<ChatRoom>('/chat/private', data),

  /**
   * Get message history for a room
   * Note: This endpoint may not be in the spec, using a reasonable assumption
   * GET /v1/chat/rooms/{room_id}/messages
   */
  getMessages: (roomId: string, limit: number = 50) =>
    apiClient.get<{ messages: ChatMessage[] }>(`/chat/rooms/${roomId}/messages?limit=${limit}`),
};
