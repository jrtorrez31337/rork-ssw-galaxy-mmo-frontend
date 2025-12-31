#!/usr/bin/env node
/**
 * Chat API Test Utility
 *
 * Standalone tool to test chat endpoints and real-time messaging.
 * Part of Sprint 2 test suite.
 *
 * Usage:
 *   node tools/chat-test.js --email <email> --password <password>
 *   node tools/chat-test.js --token <access_token> --player <player_id>
 *   node tools/chat-test.js --help
 *
 * Commands:
 *   --list-rooms              List available chat rooms
 *   --join <room_id>          Join a chat room
 *   --leave <room_id>         Leave a chat room
 *   --send <room_id>          Send a message (requires --message)
 *   --history <room_id>       Get message history
 *   --listen                  Listen for real-time chat messages via SSE
 *   --create-dm <player_id>   Create a private DM room with another player
 */

const EventSource = require('eventsource');

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.SSW_API_URL || 'http://192.168.122.76:8080/v1',
  FANOUT_URL: process.env.SSW_FANOUT_URL || 'http://192.168.122.76:8080',
};

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Room type colors
const roomColors = {
  global: colors.yellow,
  sector: colors.blue,
  faction: colors.magenta,
  private: colors.green,
  custom: colors.cyan,
};

function timestamp() {
  return new Date().toISOString().split('T')[1].slice(0, 12);
}

function log(message, color = colors.white) {
  console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}=== ${title} ===${colors.reset}`);
  console.log('');
}

function logMessage(msg) {
  const time = new Date(msg.sent_at || msg.timestamp).toLocaleTimeString();
  const sender = msg.sender_name || msg.player_name || 'Unknown';
  const roomColor = roomColors[msg.room_type] || colors.white;

  console.log(
    `${colors.dim}[${time}]${colors.reset} ` +
    `${roomColor}[${msg.room_name || msg.room_id?.slice(0, 8)}]${colors.reset} ` +
    `${colors.bright}${sender}:${colors.reset} ${msg.content}`
  );
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    email: null,
    password: null,
    token: null,
    playerId: null,
    command: 'list-rooms',
    roomId: null,
    targetPlayerId: null,
    message: null,
    help: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--email':
      case '-e':
        parsed.email = args[++i];
        break;
      case '--password':
      case '-p':
        parsed.password = args[++i];
        break;
      case '--token':
      case '-t':
        parsed.token = args[++i];
        break;
      case '--player':
        parsed.playerId = args[++i];
        break;
      case '--list-rooms':
        parsed.command = 'list-rooms';
        break;
      case '--join':
        parsed.command = 'join';
        parsed.roomId = args[++i];
        break;
      case '--leave':
        parsed.command = 'leave';
        parsed.roomId = args[++i];
        break;
      case '--send':
        parsed.command = 'send';
        parsed.roomId = args[++i];
        break;
      case '--history':
        parsed.command = 'history';
        parsed.roomId = args[++i];
        break;
      case '--listen':
        parsed.command = 'listen';
        break;
      case '--create-dm':
        parsed.command = 'create-dm';
        parsed.targetPlayerId = args[++i];
        break;
      case '--message':
      case '-m':
        parsed.message = args[++i];
        break;
      case '--room':
      case '-r':
        parsed.roomId = args[++i];
        break;
      case '--verbose':
      case '-v':
        parsed.verbose = true;
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
    }
  }

  return parsed;
}

function showHelp() {
  console.log(`
${colors.bright}Chat API Test Utility${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node tools/chat-test.js [auth] [options] [command]

${colors.cyan}Authentication (one required):${colors.reset}
  --email, -e <email>       Login email
  --password, -p <password> Login password
  --token, -t <token>       Access token (skip login)
  --player <id>             Player ID (required with --token)

${colors.cyan}Commands:${colors.reset}
  --list-rooms              List available chat rooms (default)
  --join <room_id>          Join a specific chat room
  --leave <room_id>         Leave a chat room
  --send <room_id>          Send a message (requires --message)
  --history <room_id>       Get message history for a room
  --listen                  Listen for real-time chat messages via SSE
  --create-dm <player_id>   Create a private DM room with another player

${colors.cyan}Options:${colors.reset}
  --message, -m <text>      Message content (for --send)
  --room, -r <room_id>      Room ID (alternative to command argument)
  --verbose, -v             Show detailed connection info
  --help, -h                Show this help

${colors.cyan}Examples:${colors.reset}
  # List available rooms
  node tools/chat-test.js -e test@example.com -p secret --list-rooms

  # Join and send a message
  node tools/chat-test.js -e test@example.com -p secret --join <room_id>
  node tools/chat-test.js -e test@example.com -p secret --send <room_id> -m "Hello!"

  # Listen for real-time messages
  node tools/chat-test.js -e test@example.com -p secret --listen

  # Create a DM with another player
  node tools/chat-test.js -e test@example.com -p secret --create-dm <other_player_id>

${colors.cyan}Environment Variables:${colors.reset}
  SSW_API_URL     API base URL (default: ${CONFIG.API_BASE_URL})
  SSW_FANOUT_URL  Fanout URL (default: ${CONFIG.FANOUT_URL})

${colors.cyan}Room Types:${colors.reset}
  ${colors.yellow}global${colors.reset}    - Server-wide public chat
  ${colors.blue}sector${colors.reset}    - Sector-specific chat
  ${colors.magenta}faction${colors.reset}   - Faction members only
  ${colors.green}private${colors.reset}   - Direct messages (1:1)
  ${colors.cyan}custom${colors.reset}    - Player-created rooms
`);
}

async function login(email, password) {
  log(`Logging in as ${email}...`, colors.cyan);

  const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  log('Login successful!', colors.green);

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
  };
}

async function getProfile(accessToken) {
  log('Fetching profile...', colors.cyan);

  const response = await fetch(`${CONFIG.API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Profile fetch failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  log(`Profile: ${data.data.display_name} (${data.data.profile_id})`, colors.green);

  return data.data;
}

async function apiRequest(endpoint, accessToken, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Request failed: ${response.status}`);
  }

  return data.data;
}

async function listRooms(accessToken, playerId) {
  logSection('Available Chat Rooms');

  try {
    const data = await apiRequest(`/chat/rooms?player_id=${playerId}`, accessToken);
    const rooms = data.rooms || data || [];

    if (rooms.length === 0) {
      log('No chat rooms available', colors.dim);
      return;
    }

    rooms.forEach(room => {
      const color = roomColors[room.room_type] || colors.white;
      const memberCount = room.member_count || room.members?.length || '?';
      const joined = room.is_member ? `${colors.green}[joined]${colors.reset}` : '';

      console.log(
        `${color}[${room.room_type}]${colors.reset} ` +
        `${colors.bright}${room.room_name || room.name}${colors.reset} ` +
        `${colors.dim}(${room.room_id})${colors.reset} ` +
        `${colors.dim}${memberCount} members${colors.reset} ${joined}`
      );
    });
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function joinRoom(accessToken, roomId) {
  logSection('Join Room');

  try {
    const data = await apiRequest(`/chat/rooms/${roomId}/join`, accessToken, 'POST', {});
    log(`Successfully joined room: ${roomId}`, colors.green);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function leaveRoom(accessToken, roomId) {
  logSection('Leave Room');

  try {
    const data = await apiRequest(`/chat/rooms/${roomId}/leave`, accessToken, 'POST', {});
    log(`Successfully left room: ${roomId}`, colors.green);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function sendMessage(accessToken, playerId, roomId, message) {
  logSection('Send Message');

  if (!message) {
    log('Error: Message content required (--message)', colors.red);
    return;
  }

  try {
    const data = await apiRequest('/chat/messages', accessToken, 'POST', {
      room_id: roomId,
      player_id: playerId,
      content: message,
    });
    log('Message sent!', colors.green);
    logMessage(data);
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function getHistory(accessToken, roomId) {
  logSection(`Message History: ${roomId}`);

  try {
    const data = await apiRequest(`/chat/rooms/${roomId}/messages?limit=50`, accessToken);
    const messages = data.messages || data || [];

    if (messages.length === 0) {
      log('No messages in this room', colors.dim);
      return;
    }

    // Sort by timestamp (oldest first)
    messages.sort((a, b) => {
      const timeA = new Date(a.sent_at || a.timestamp).getTime();
      const timeB = new Date(b.sent_at || b.timestamp).getTime();
      return timeA - timeB;
    });

    messages.forEach(logMessage);

    console.log('');
    log(`Showing ${messages.length} messages`, colors.dim);
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function createDM(accessToken, playerId, targetPlayerId) {
  logSection('Create Private DM');

  try {
    const data = await apiRequest('/chat/private', accessToken, 'POST', {
      player_id: playerId,
      target_player_id: targetPlayerId,
    });
    log('Private room created!', colors.green);
    log(`Room ID: ${data.room_id}`, colors.cyan);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function listenForMessages(accessToken, playerId, options = {}) {
  logSection('Real-time Chat Listener');

  const url = `${CONFIG.FANOUT_URL}/v1/stream/gameplay?channels=player.${playerId}`;
  log(`Connecting to SSE: ${url}`, colors.cyan);

  const eventSource = new EventSource(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Player-ID': playerId,
      'Accept': 'text/event-stream',
    },
  });

  eventSource.onopen = () => {
    log('SSE connection opened', colors.green);
  };

  eventSource.addEventListener('connected', (event) => {
    try {
      const data = JSON.parse(event.data);
      log(`Connected! Subscriber ID: ${data.subscriber_id}`, colors.green);
      log('Listening for chat messages. Press Ctrl+C to exit.', colors.cyan);
      console.log('');
    } catch (error) {
      log(`Connected event parse error: ${error.message}`, colors.yellow);
    }
  });

  eventSource.addEventListener('heartbeat', () => {
    if (options.verbose) {
      log('heartbeat', colors.dim);
    }
  });

  // Listen for chat messages
  eventSource.addEventListener('game.chat.message', (event) => {
    try {
      const data = JSON.parse(event.data);
      logMessage(data);
    } catch (error) {
      log(`Chat message parse error: ${error.message}`, colors.red);
    }
  });

  eventSource.onerror = (error) => {
    if (eventSource.readyState === EventSource.CLOSED) {
      log('Connection closed', colors.red);
    } else if (eventSource.readyState === EventSource.CONNECTING) {
      log('Reconnecting...', colors.yellow);
    } else {
      log(`Connection error: ${error.message || 'Unknown'}`, colors.red);
    }
  };

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('');
    log('Closing connection...', colors.yellow);
    eventSource.close();
    process.exit(0);
  });

  return eventSource;
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  console.log('');
  log(`${colors.bright}Chat API Test Utility${colors.reset}`, colors.cyan);
  log(`API: ${CONFIG.API_BASE_URL}`, colors.dim);
  log(`Fanout: ${CONFIG.FANOUT_URL}`, colors.dim);
  console.log('');

  let accessToken = args.token;
  let playerId = args.playerId;

  // Login if credentials provided
  if (args.email && args.password) {
    try {
      const tokens = await login(args.email, args.password);
      accessToken = tokens.accessToken;

      const profile = await getProfile(accessToken);
      playerId = profile.profile_id;
    } catch (error) {
      log(`Authentication failed: ${error.message}`, colors.red);
      process.exit(1);
    }
  }

  // Validate auth
  if (!accessToken) {
    log('Error: Access token required. Use --email/--password or --token', colors.red);
    process.exit(1);
  }

  if (!playerId) {
    log('Error: Player ID required. Use --player with --token, or login with credentials', colors.red);
    process.exit(1);
  }

  console.log('');
  log(`Player ID: ${playerId}`, colors.green);

  // Execute command
  switch (args.command) {
    case 'list-rooms':
      await listRooms(accessToken, playerId);
      break;
    case 'join':
      if (!args.roomId) {
        log('Error: Room ID required', colors.red);
        process.exit(1);
      }
      await joinRoom(accessToken, args.roomId);
      break;
    case 'leave':
      if (!args.roomId) {
        log('Error: Room ID required', colors.red);
        process.exit(1);
      }
      await leaveRoom(accessToken, args.roomId);
      break;
    case 'send':
      if (!args.roomId) {
        log('Error: Room ID required', colors.red);
        process.exit(1);
      }
      await sendMessage(accessToken, playerId, args.roomId, args.message);
      break;
    case 'history':
      if (!args.roomId) {
        log('Error: Room ID required', colors.red);
        process.exit(1);
      }
      await getHistory(accessToken, args.roomId);
      break;
    case 'listen':
      await listenForMessages(accessToken, playerId, { verbose: args.verbose });
      // Keep process running for SSE
      return;
    case 'create-dm':
      if (!args.targetPlayerId) {
        log('Error: Target player ID required', colors.red);
        process.exit(1);
      }
      await createDM(accessToken, playerId, args.targetPlayerId);
      break;
    default:
      log(`Unknown command: ${args.command}`, colors.red);
      process.exit(1);
  }

  console.log('');
  log('Done!', colors.green);
}

// Run
main().catch((error) => {
  log(`Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});
