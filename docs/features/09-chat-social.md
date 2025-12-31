# Chat & Social

## Overview

The chat system enables real-time communication between players through public rooms, faction channels, and private direct messages.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chat/rooms` | Get available rooms |
| POST | `/chat/rooms` | Create custom room |
| GET | `/chat/rooms/{id}` | Get room details |
| POST | `/chat/rooms/{id}/join` | Join a room |
| POST | `/chat/rooms/{id}/leave` | Leave a room |
| POST | `/chat/messages` | Send a message |
| POST | `/chat/private` | Create private DM room |
| GET | `/chat/rooms/{id}/messages` | Get message history |

## Data Types

### ChatRoom
```typescript
interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'faction' | 'private' | 'custom';
  member_count: number;
  is_member: boolean;
  created_at: string;
}
```

### ChatMessage
```typescript
interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
}
```

### CreateRoomRequest
```typescript
interface CreateRoomRequest {
  name: string;
  type: 'custom';
  description?: string;
}
```

### SendMessageRequest
```typescript
interface SendMessageRequest {
  room_id: string;
  content: string;
}
```

### CreatePrivateRoomRequest
```typescript
interface CreatePrivateRoomRequest {
  target_player_id: string;
}
```

## Room Types

| Type | Description |
|------|-------------|
| public | Open to all players |
| faction | Limited to faction members |
| private | Direct message between two players |
| custom | Player-created rooms |

## Source Files

| File | Purpose |
|------|---------|
| `api/chat.ts` | API client methods |
| `hooks/useChatEvents.ts` | SSE event handlers |
| `components/chat/ChatPanel.tsx` | Chat UI |

## Chat Flow

1. **Room Selection**
   - View available rooms
   - Join/leave rooms
   - Create custom or DM rooms

2. **Messaging**
   - Type message in input
   - Send to current room
   - Messages broadcast to members

3. **Real-Time Updates**
   - SSE delivers new messages
   - User join/leave notifications
   - Typing indicators (if implemented)

## Real-Time Events

Chat events received via SSE:

| Event | Description |
|-------|-------------|
| `chat_message` | New message in room |
| `user_joined` | Player joined room |
| `user_left` | Player left room |

## Components

### ChatPanel
- Room selector dropdown
- Message list (scrollable)
- Message input
- Send button
- Room info header

## Features

- **Message History**: Paginated retrieval of past messages
- **Unread Indicators**: Badge showing unread count
- **Timestamps**: Relative or absolute timestamps
- **Mentions**: @username highlighting
- **Emotes**: Text-based emotes

## Integration Points

- **Factions**: Auto-join faction chat rooms
- **Location**: Sector-based local chat
- **Friends**: Easy DM creation (if friends list exists)
- **Notifications**: Message alerts
