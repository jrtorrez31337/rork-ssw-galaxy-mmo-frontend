#!/usr/bin/env node
/**
 * Trading/Economy API Test Utility
 *
 * Standalone tool to test trading and market endpoints against the live backend.
 * Part of Sprint 2 test suite.
 *
 * Usage:
 *   node tools/trading-test.js --email <email> --password <password>
 *   node tools/trading-test.js --token <access_token> --player <player_id>
 *   node tools/trading-test.js --help
 *
 * Commands:
 *   --list-commodities          List available commodities
 *   --orderbook <commodity>     Get orderbook for a commodity
 *   --history <commodity>       Get trade history for a commodity
 *   --place-order               Place a test order (interactive)
 *   --my-orders                 List player's active orders
 */

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.SSW_API_URL || 'http://192.168.122.76:8080/v1',
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

function logTable(data, headers) {
  if (!data || data.length === 0) {
    log('No data', colors.dim);
    return;
  }

  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxData = Math.max(...data.map(row => String(row[i] || '').length));
    return Math.max(h.length, maxData);
  });

  // Print header
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join(' | ');
  console.log(`${colors.bright}${headerRow}${colors.reset}`);
  console.log(widths.map(w => '-'.repeat(w)).join('-+-'));

  // Print data
  data.forEach(row => {
    const dataRow = row.map((cell, i) => String(cell || '').padEnd(widths[i])).join(' | ');
    console.log(dataRow);
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    email: null,
    password: null,
    token: null,
    playerId: null,
    marketId: null,
    command: 'list-commodities',
    commodity: null,
    side: null,
    price: null,
    quantity: null,
    help: false,
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
      case '--market':
      case '-m':
        parsed.marketId = args[++i];
        break;
      case '--list-commodities':
        parsed.command = 'list-commodities';
        break;
      case '--orderbook':
        parsed.command = 'orderbook';
        parsed.commodity = args[++i];
        break;
      case '--history':
        parsed.command = 'history';
        parsed.commodity = args[++i];
        break;
      case '--place-order':
        parsed.command = 'place-order';
        break;
      case '--my-orders':
        parsed.command = 'my-orders';
        break;
      case '--side':
        parsed.side = args[++i];
        break;
      case '--price':
        parsed.price = parseFloat(args[++i]);
        break;
      case '--quantity':
        parsed.quantity = parseInt(args[++i], 10);
        break;
      case '--commodity':
      case '-c':
        parsed.commodity = args[++i];
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
${colors.bright}Trading/Economy API Test Utility${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node tools/trading-test.js [auth] [options] [command]

${colors.cyan}Authentication (one required):${colors.reset}
  --email, -e <email>       Login email
  --password, -p <password> Login password
  --token, -t <token>       Access token (skip login)
  --player <id>             Player ID (required with --token)

${colors.cyan}Options:${colors.reset}
  --market, -m <id>         Market/Station ID for operations
  --commodity, -c <name>    Commodity name (e.g., "ore", "fuel")

${colors.cyan}Commands:${colors.reset}
  --list-commodities        List available commodities at a market (default)
  --orderbook <commodity>   View orderbook for a specific commodity
  --history <commodity>     View recent trade history
  --place-order             Place an order (requires --side, --price, --quantity, --commodity)
  --my-orders               List your active orders

${colors.cyan}Order Placement:${colors.reset}
  --side <buy|sell>         Order side
  --price <number>          Price per unit
  --quantity <number>       Quantity to trade

${colors.cyan}Examples:${colors.reset}
  # Login and view orderbook
  node tools/trading-test.js -e test@example.com -p secret --orderbook ore

  # Place a buy order
  node tools/trading-test.js -t <token> --player <id> -m <market_id> \\
    --place-order --side buy --commodity ore --price 100 --quantity 10

  # View your active orders
  node tools/trading-test.js -e test@example.com -p secret --my-orders

${colors.cyan}Environment Variables:${colors.reset}
  SSW_API_URL     API base URL (default: ${CONFIG.API_BASE_URL})
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

async function getDockedStation(accessToken, playerId) {
  log('Finding docked station...', colors.cyan);

  // Get player's current ship to find docked location
  const response = await fetch(`${CONFIG.API_BASE_URL}/ships?player_id=${playerId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    log('Could not get ship info - you may need to specify --market manually', colors.yellow);
    return null;
  }

  const data = await response.json();
  const ship = data.data?.ships?.[0] || data.data;

  if (ship?.docked_at) {
    log(`Docked at station: ${ship.docked_at}`, colors.green);
    return ship.docked_at;
  }

  log('Not docked at any station - specify --market for trading', colors.yellow);
  return null;
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

async function listCommodities(accessToken, marketId) {
  logSection('Available Commodities');

  try {
    // Try to get market info or commodities list
    const data = await apiRequest(`/markets/${marketId}`, accessToken);

    if (data.commodities) {
      const rows = data.commodities.map(c => [
        c.name || c.commodity,
        c.base_price || '-',
        c.supply || '-',
        c.demand || '-',
      ]);
      logTable(rows, ['Commodity', 'Base Price', 'Supply', 'Demand']);
    } else {
      log('Common commodities: ore, fuel, metals, electronics, food, medicine', colors.cyan);
    }
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    log('Common commodities: ore, fuel, metals, electronics, food, medicine', colors.cyan);
  }
}

async function getOrderbook(accessToken, marketId, commodity) {
  logSection(`Orderbook: ${commodity}`);

  try {
    const data = await apiRequest(
      `/markets/${marketId}/orderbook?commodity=${encodeURIComponent(commodity)}`,
      accessToken
    );

    console.log(`${colors.green}${colors.bright}BUY ORDERS (Bids)${colors.reset}`);
    if (data.bids && data.bids.length > 0) {
      const bidRows = data.bids.map(b => [b.price, b.quantity, b.player_id?.slice(0, 8) || 'NPC']);
      logTable(bidRows, ['Price', 'Quantity', 'Player']);
    } else {
      log('No buy orders', colors.dim);
    }

    console.log('');
    console.log(`${colors.red}${colors.bright}SELL ORDERS (Asks)${colors.reset}`);
    if (data.asks && data.asks.length > 0) {
      const askRows = data.asks.map(a => [a.price, a.quantity, a.player_id?.slice(0, 8) || 'NPC']);
      logTable(askRows, ['Price', 'Quantity', 'Player']);
    } else {
      log('No sell orders', colors.dim);
    }

    console.log('');
    if (data.spread !== undefined) {
      log(`Spread: ${data.spread.toFixed(2)}`, colors.cyan);
    }
    if (data.midpoint !== undefined) {
      log(`Midpoint: ${data.midpoint.toFixed(2)}`, colors.cyan);
    }
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function getTradeHistory(accessToken, marketId, commodity) {
  logSection(`Trade History: ${commodity}`);

  try {
    const data = await apiRequest(
      `/markets/${marketId}/trades?commodity=${encodeURIComponent(commodity)}&limit=20`,
      accessToken
    );

    if (data.trades && data.trades.length > 0) {
      const rows = data.trades.map(t => [
        new Date(t.executed_at).toLocaleTimeString(),
        t.price,
        t.quantity,
        t.side || '-',
      ]);
      logTable(rows, ['Time', 'Price', 'Quantity', 'Side']);
    } else {
      log('No recent trades', colors.dim);
    }
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function placeOrder(accessToken, marketId, playerId, commodity, side, price, quantity) {
  logSection('Place Order');

  if (!commodity || !side || !price || !quantity) {
    log('Error: Missing required parameters', colors.red);
    log('Required: --commodity, --side, --price, --quantity', colors.yellow);
    return;
  }

  log(`Placing ${side.toUpperCase()} order:`, colors.cyan);
  log(`  Commodity: ${commodity}`, colors.white);
  log(`  Price: ${price}`, colors.white);
  log(`  Quantity: ${quantity}`, colors.white);
  log(`  Total: ${price * quantity}`, colors.white);
  console.log('');

  try {
    const data = await apiRequest(
      `/markets/${marketId}/orders`,
      accessToken,
      'POST',
      {
        player_id: playerId,
        commodity,
        side,
        price,
        quantity,
      }
    );

    log('Order placed successfully!', colors.green);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function getMyOrders(accessToken, playerId) {
  logSection('My Active Orders');

  try {
    const data = await apiRequest(`/markets/orders?player_id=${playerId}`, accessToken);

    if (data.orders && data.orders.length > 0) {
      const rows = data.orders.map(o => [
        o.order_id?.slice(0, 8) || '-',
        o.commodity,
        o.side,
        o.price,
        o.quantity,
        o.filled || 0,
        o.status || 'open',
      ]);
      logTable(rows, ['ID', 'Commodity', 'Side', 'Price', 'Qty', 'Filled', 'Status']);
    } else {
      log('No active orders', colors.dim);
    }
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  console.log('');
  log(`${colors.bright}Trading/Economy API Test Utility${colors.reset}`, colors.cyan);
  log(`API: ${CONFIG.API_BASE_URL}`, colors.dim);
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

  // Get market ID
  let marketId = args.marketId;
  if (!marketId) {
    marketId = await getDockedStation(accessToken, playerId);
    if (!marketId) {
      log('Error: No market ID. Dock at a station or specify --market', colors.red);
      process.exit(1);
    }
  }

  console.log('');
  log(`Player ID: ${playerId}`, colors.green);
  log(`Market ID: ${marketId}`, colors.green);

  // Execute command
  switch (args.command) {
    case 'list-commodities':
      await listCommodities(accessToken, marketId);
      break;
    case 'orderbook':
      if (!args.commodity) {
        log('Error: Commodity required for orderbook', colors.red);
        process.exit(1);
      }
      await getOrderbook(accessToken, marketId, args.commodity);
      break;
    case 'history':
      if (!args.commodity) {
        log('Error: Commodity required for history', colors.red);
        process.exit(1);
      }
      await getTradeHistory(accessToken, marketId, args.commodity);
      break;
    case 'place-order':
      await placeOrder(
        accessToken,
        marketId,
        playerId,
        args.commodity,
        args.side,
        args.price,
        args.quantity
      );
      break;
    case 'my-orders':
      await getMyOrders(accessToken, playerId);
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
