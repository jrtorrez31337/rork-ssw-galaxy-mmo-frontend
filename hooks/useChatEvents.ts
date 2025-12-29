import { useEffect } from 'react';
import { sseManager } from '@/lib/sseManager';
import { ChatEvent, ChatMessageEvent } from '@/types/chat';

type EventCallback = (event: ChatEvent) => void;

/**
 * Hook to subscribe to real-time chat events via SSE Manager
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 *
 * Based on backend spec: 04-REALTIME-SSE.apib
 *
 * Chat events:
 * - chat_message / game.chat.message: New message in joined room
 */
export function useChatEvents(playerId: string, onEvent: EventCallback) {
  useEffect(() => {
    if (!playerId) return;

    console.log('[Chat Events] Setting up listeners via SSE Manager');

    // Handle chat_message event
    const cleanupChatMessage = sseManager.addEventListener('chat_message', (data: any) => {
      console.log('[Chat Events] Chat message received:', data);
      const payload: ChatMessageEvent = data.payload || data;
      onEvent({
        type: 'CHAT_MESSAGE',
        data: payload,
      });
    });

    // Also listen for game.chat.message (alternative event name)
    const cleanupGameChatMessage = sseManager.addEventListener('game.chat.message', (data: any) => {
      console.log('[Chat Events] Game chat message received:', data);
      const payload: ChatMessageEvent = data.payload || data;
      onEvent({
        type: 'CHAT_MESSAGE',
        data: payload,
      });
    });

    // Cleanup all listeners on unmount
    return () => {
      console.log('[Chat Events] Cleaning up listeners');
      cleanupChatMessage();
      cleanupGameChatMessage();
    };
  }, [playerId, onEvent]);
}
