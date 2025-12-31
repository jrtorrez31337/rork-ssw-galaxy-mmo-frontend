#!/usr/bin/env node
/**
 * SSE Event Test Utility
 *
 * Standalone tool to test SSE connections and events against the live backend.
 * Not part of the app codebase - used for debugging and verification.
 *
 * Usage:
 *   node tools/sse-test.js --email <email> --password <password>
 *   node tools/sse-test.js --token <access_token> --player <player_id>
 *   node tools/sse-test.js --help
 *
 * Examples:
 *   node tools/sse-test.js --email test@example.com --password secret123
 *   node tools/sse-test.js --token eyJhbGc... --player abc-123-def
 */

const EventSource = require('eventsource');

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.SSW_API_URL || 'http://192.168.122.76:8080/v1',
  FANOUT_URL: process.env.SSW_FANOUT_URL || 'http://192.168.122.76:8080',
};

// ANSI colors for terminal output
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

// Event type to color mapping
const eventColors = {
  'connected': colors.green,
  'heartbeat': colors.dim,
  'game.combat': colors.red,
  'game.movement': colors.blue,
  'game.missions': colors.magenta,
  'game.economy': colors.yellow,
  'game.mining': colors.cyan,
  'game.sector': colors.white,
  'game.social': colors.green,
  'game.travel': colors.blue,
  'game.services': colors.yellow,
  'game.chat': colors.cyan,
};

function getEventColor(eventType) {
  for (const [prefix, color] of Object.entries(eventColors)) {
    if (eventType.startsWith(prefix)) return color;
  }
  return colors.white;
}

function timestamp() {
  return new Date().toISOString().split('T')[1].slice(0, 12);
}

function log(message, color = colors.white) {
  console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${color}${message}${colors.reset}`);
}

function logEvent(eventType, data) {
  const color = getEventColor(eventType);
  const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
  console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${color}${colors.bright}${eventType}${colors.reset}`);
  if (data && eventType !== 'heartbeat') {
    console.log(`${colors.dim}${dataStr}${colors.reset}`);
  }
  console.log('');
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    email: null,
    password: null,
    token: null,
    playerId: null,
    channels: [],
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
      case '--channel':
      case '-c':
        parsed.channels.push(args[++i]);
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
${colors.bright}SSE Event Test Utility${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node tools/sse-test.js [options]

${colors.cyan}Authentication (one required):${colors.reset}
  --email, -e <email>       Login email
  --password, -p <password> Login password
  --token, -t <token>       Access token (skip login)
  --player <id>             Player ID (required with --token)

${colors.cyan}Options:${colors.reset}
  --channel, -c <channel>   Subscribe to channel (can repeat)
  --verbose, -v             Show detailed connection info
  --help, -h                Show this help

${colors.cyan}Examples:${colors.reset}
  # Login and connect
  node tools/sse-test.js -e test@example.com -p secret123

  # Use existing token
  node tools/sse-test.js -t eyJhbGc... --player abc-123

  # Subscribe to specific channels
  node tools/sse-test.js -e test@example.com -p secret -c sector.0.0.0 -c market.sol

${colors.cyan}Environment Variables:${colors.reset}
  SSW_API_URL     API base URL (default: ${CONFIG.API_BASE_URL})
  SSW_FANOUT_URL  Fanout URL (default: ${CONFIG.FANOUT_URL})

${colors.cyan}Event Types Monitored:${colors.reset}
  ${colors.red}game.combat.*${colors.reset}    - Combat events (start, tick, loot, end)
  ${colors.blue}game.movement.*${colors.reset}  - Movement events (jump, dock, undock)
  ${colors.magenta}game.missions.*${colors.reset}  - Mission events (assigned, objective, completed)
  ${colors.yellow}game.economy.*${colors.reset}   - Economy events (trade, price_update)
  ${colors.cyan}game.mining.*${colors.reset}    - Mining events (extract)
  ${colors.white}game.sector.*${colors.reset}    - Sector events (delta)
  ${colors.green}game.social.*${colors.reset}    - Social events (reputation)
  ${colors.blue}game.travel.*${colors.reset}    - Travel events (started, completed)
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
  log(`Login successful!`, colors.green);

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
  };
}

async function getProfile(accessToken) {
  log(`Fetching profile...`, colors.cyan);

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

async function subscribeToChannel(accessToken, subscriberId, channel) {
  log(`Subscribing to channel: ${channel}...`, colors.cyan);

  const response = await fetch(`${CONFIG.FANOUT_URL}/v1/stream/gameplay/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      subscriber_id: subscriberId,
      channels: [channel],
    }),
  });

  if (response.ok) {
    log(`Subscribed to: ${channel}`, colors.green);
  } else if (response.status === 404) {
    log(`Subscription endpoint not available (broadcast mode)`, colors.yellow);
  } else {
    log(`Subscription failed: ${response.status}`, colors.red);
  }
}

function connectSSE(accessToken, playerId, options = {}) {
  const initialChannels = `player.${playerId}`;
  const url = `${CONFIG.FANOUT_URL}/v1/stream/gameplay?channels=${initialChannels}`;

  log(`Connecting to SSE: ${url}`, colors.cyan);

  const eventSource = new EventSource(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Player-ID': playerId,
      'Accept': 'text/event-stream',
    },
  });

  let subscriberId = null;

  // Connection opened
  eventSource.onopen = () => {
    log(`Connection opened, waiting for 'connected' event...`, colors.green);
  };

  // Handle 'connected' event
  eventSource.addEventListener('connected', async (event) => {
    try {
      const data = JSON.parse(event.data);
      subscriberId = data.subscriber_id;
      logEvent('connected', data);

      // Subscribe to additional channels
      for (const channel of options.channels || []) {
        await subscribeToChannel(accessToken, subscriberId, channel);
      }

      log(`${colors.bright}Ready to receive events. Press Ctrl+C to exit.${colors.reset}`, colors.green);
      console.log('');
    } catch (error) {
      log(`Failed to parse connected event: ${error.message}`, colors.red);
    }
  });

  // Handle heartbeat
  eventSource.addEventListener('heartbeat', (event) => {
    if (options.verbose) {
      logEvent('heartbeat', null);
    }
  });

  // Handle generic messages
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const eventType = data.type || data.event || 'message';
      logEvent(eventType, data);
    } catch (error) {
      logEvent('message', event.data);
    }
  };

  // Register handlers for all named event types
  const eventTypes = [
    'game.movement.jump', 'game.movement.dock', 'game.movement.undock',
    'game.travel.started', 'game.travel.completed', 'game.travel.cancelled', 'game.travel.interrupted',
    'game.combat.start', 'game.combat.tick', 'game.combat.action', 'game.combat.outcome',
    'game.combat.loot', 'game.combat.end',
    'game.economy.trade', 'game.economy.order_placed', 'game.economy.order_cancelled', 'game.economy.price_update',
    'game.mining.extract',
    'game.missions.assigned', 'game.missions.objective', 'game.missions.completed',
    'game.services.fuel_purchase', 'game.services.repair',
    'game.social.reputation',
    'game.chat.message',
    'game.sector.delta',
  ];

  eventTypes.forEach(eventType => {
    eventSource.addEventListener(eventType, (event) => {
      try {
        const data = JSON.parse(event.data);
        logEvent(eventType, data);
      } catch (error) {
        logEvent(eventType, event.data);
      }
    });
  });

  // Handle errors
  eventSource.onerror = (error) => {
    if (eventSource.readyState === EventSource.CLOSED) {
      log(`Connection closed`, colors.red);
    } else if (eventSource.readyState === EventSource.CONNECTING) {
      log(`Reconnecting...`, colors.yellow);
    } else {
      log(`Connection error: ${error.message || 'Unknown error'}`, colors.red);
    }
  };

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('');
    log(`Closing connection...`, colors.yellow);
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
  log(`${colors.bright}SSE Event Test Utility${colors.reset}`, colors.cyan);
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

  // Validate we have what we need
  if (!accessToken) {
    log(`Error: Access token required. Use --email/--password or --token`, colors.red);
    process.exit(1);
  }

  if (!playerId) {
    log(`Error: Player ID required. Use --player with --token, or login with credentials`, colors.red);
    process.exit(1);
  }

  console.log('');
  log(`Player ID: ${playerId}`, colors.green);
  console.log('');

  // Connect to SSE
  connectSSE(accessToken, playerId, {
    channels: args.channels,
    verbose: args.verbose,
  });
}

// Run
main().catch((error) => {
  log(`Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});
