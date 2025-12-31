#!/usr/bin/env node
/**
 * Respawn API Test Utility
 *
 * Standalone tool to test respawn flow endpoints against the live backend.
 * Part of Sprint 2 test suite.
 *
 * Usage:
 *   node tools/respawn-test.js --email <email> --password <password>
 *   node tools/respawn-test.js --token <access_token> --player <player_id>
 *   node tools/respawn-test.js --help
 *
 * Commands:
 *   --location                Get respawn location info
 *   --nearest-stations        Find nearest stations to current sector
 *   --respawn                 Execute respawn (WARNING: will respawn your ship!)
 *   --ship-status             Show current ship status (hull, shields, fuel)
 *   --simulate-death          Simulate a death scenario (shows what would happen)
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

function drawHealthBar(current, max, width = 30, color = colors.green) {
  const percentage = max > 0 ? current / max : 0;
  const filled = Math.round(percentage * width);
  const empty = width - filled;
  const bar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  const pct = `${Math.round(percentage * 100)}%`;
  return `${color}${bar}${colors.reset} ${current}/${max} (${pct})`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    email: null,
    password: null,
    token: null,
    playerId: null,
    sector: null,
    factionId: null,
    command: 'location',
    confirm: false,
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
      case '--location':
        parsed.command = 'location';
        break;
      case '--nearest-stations':
        parsed.command = 'nearest-stations';
        break;
      case '--respawn':
        parsed.command = 'respawn';
        break;
      case '--ship-status':
        parsed.command = 'ship-status';
        break;
      case '--simulate-death':
        parsed.command = 'simulate-death';
        break;
      case '--sector':
      case '-s':
        parsed.sector = args[++i];
        break;
      case '--faction':
      case '-f':
        parsed.factionId = args[++i];
        break;
      case '--confirm':
      case '-y':
        parsed.confirm = true;
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
${colors.bright}Respawn API Test Utility${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node tools/respawn-test.js [auth] [options] [command]

${colors.cyan}Authentication (one required):${colors.reset}
  --email, -e <email>       Login email
  --password, -p <password> Login password
  --token, -t <token>       Access token (skip login)
  --player <id>             Player ID (required with --token)

${colors.cyan}Commands:${colors.reset}
  --location                Get respawn location info (default)
  --nearest-stations        Find nearest stations to current/specified sector
  --ship-status             Show current ship status (hull, shields, fuel)
  --simulate-death          Simulate what happens on death
  --respawn                 Execute respawn (WARNING: actually respawns!)

${colors.cyan}Options:${colors.reset}
  --sector, -s <sector>     Sector ID for station search
  --faction, -f <id>        Filter stations by faction
  --confirm, -y             Skip confirmation prompts (for --respawn)
  --help, -h                Show this help

${colors.cyan}Examples:${colors.reset}
  # Check respawn location
  node tools/respawn-test.js -e test@example.com -p secret --location

  # View ship status
  node tools/respawn-test.js -e test@example.com -p secret --ship-status

  # Find nearby stations
  node tools/respawn-test.js -e test@example.com -p secret --nearest-stations

  # Simulate death scenario
  node tools/respawn-test.js -e test@example.com -p secret --simulate-death

  # Execute respawn (be careful!)
  node tools/respawn-test.js -e test@example.com -p secret --respawn --confirm

${colors.cyan}Environment Variables:${colors.reset}
  SSW_API_URL     API base URL (default: ${CONFIG.API_BASE_URL})

${colors.cyan}Respawn Rules:${colors.reset}
  - Players respawn at their faction's nearest station
  - Ship respawns with reduced hull (25%), shields (50%), and fuel (25%)
  - If no faction station is available, respawn at home sector
  - Cargo is lost on death (not recovered)
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
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} - ${text}`);
    }
    return {};
  }

  if (!response.ok) {
    throw new Error(data.error?.message || `Request failed: ${response.status}`);
  }

  return data.data;
}

async function getShipStatus(accessToken, playerId) {
  logSection('Ship Status');

  try {
    const data = await apiRequest(`/ships/by-owner/${playerId}`, accessToken);
    const ships = Array.isArray(data) ? data : data.ships || [data];
    const ship = ships[0];

    if (!ship) {
      log('No ship found', colors.red);
      return null;
    }

    console.log(`${colors.bright}Ship: ${ship.name || ship.ship_name || 'Unnamed'}${colors.reset}`);
    console.log(`Type: ${ship.ship_type || 'Unknown'}`);
    console.log(`Sector: ${ship.location_sector || ship.sector || ship.current_sector || 'Unknown'}`);
    console.log(`Docked: ${ship.docked_at ? 'Yes' : 'No'}`);
    console.log('');

    // Health bars
    const hull = ship.hull_points || ship.hull || ship.hull_current || 0;
    const hullMax = ship.hull_max || 100;
    const hullColor = hull / hullMax > 0.5 ? colors.green : hull / hullMax > 0.25 ? colors.yellow : colors.red;
    console.log(`Hull:    ${drawHealthBar(hull, hullMax, 30, hullColor)}`);

    const shield = ship.shield_points || ship.shield || ship.shield_current || 0;
    const shieldMax = ship.shield_max || 100;
    console.log(`Shields: ${drawHealthBar(shield, shieldMax, 30, colors.cyan)}`);

    const fuel = ship.fuel_current || ship.fuel || 0;
    const fuelMax = ship.fuel_capacity || ship.fuel_max || 100;
    console.log(`Fuel:    ${drawHealthBar(fuel, fuelMax, 30, colors.yellow)}`);

    console.log('');
    console.log(`${colors.dim}Ship ID: ${ship.id || ship.ship_id}${colors.reset}`);

    return ship;
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    return null;
  }
}

async function getRespawnLocation(accessToken, playerId) {
  logSection('Respawn Location');

  try {
    const data = await apiRequest(`/respawn/location?player_id=${playerId}`, accessToken);

    if (!data) {
      log('No respawn location available', colors.yellow);
      return null;
    }

    console.log(`${colors.bright}Respawn Type:${colors.reset} ${data.respawn_type}`);
    console.log(`${colors.bright}Sector:${colors.reset} ${data.sector}`);

    if (data.station_id) {
      console.log(`${colors.bright}Station:${colors.reset} ${data.station_name || data.station_id}`);
    }

    if (data.distance_from_death !== undefined) {
      console.log(`${colors.bright}Distance:${colors.reset} ${data.distance_from_death.toFixed(1)} sectors`);
    }

    console.log('');
    console.log(`${colors.yellow}Warning: Respawning will reset your ship to:${colors.reset}`);
    console.log(`  - Hull: 25% of max`);
    console.log(`  - Shields: 50% of max`);
    console.log(`  - Fuel: 25% of max`);
    console.log(`  - Cargo: LOST`);

    return data;
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    return null;
  }
}

async function getNearestStations(accessToken, sector, factionId) {
  logSection('Nearest Stations');

  if (!sector) {
    log('Sector required. Use --sector or let it be auto-detected from ship.', colors.yellow);
    return;
  }

  try {
    let endpoint = `/stations/nearest?sector=${encodeURIComponent(sector)}&limit=5`;
    if (factionId) {
      endpoint += `&faction_id=${factionId}`;
    }

    const data = await apiRequest(endpoint, accessToken);
    const stations = data.stations || data || [];

    if (stations.length === 0) {
      log('No stations found', colors.dim);
      return;
    }

    stations.forEach((station, index) => {
      const color = index === 0 ? colors.green : colors.white;
      console.log(
        `${color}${index + 1}. ${colors.bright}${station.station_name}${colors.reset}${color} ` +
        `(${station.sector}) - ${station.distance.toFixed(1)} sectors away${colors.reset}`
      );
      console.log(
        `   ${colors.dim}Faction: ${station.faction_name || 'Neutral'} ` +
        `| ID: ${station.station_id}${colors.reset}`
      );
    });
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
  }
}

async function simulateDeath(accessToken, playerId) {
  logSection('Death Simulation');

  log('Simulating what would happen if your ship was destroyed...', colors.yellow);
  console.log('');

  // Get current ship status
  const ship = await getShipStatus(accessToken, playerId);
  if (!ship) {
    return;
  }

  // Get respawn location
  const respawnLoc = await getRespawnLocation(accessToken, playerId);
  if (!respawnLoc) {
    return;
  }

  // Calculate post-respawn stats
  const hullMax = ship.hull_max || 100;
  const shieldMax = ship.shield_max || 100;
  const fuelMax = ship.fuel_max || 100;

  logSection('After Respawn');

  console.log(`${colors.bright}Location:${colors.reset} ${respawnLoc.sector}`);
  if (respawnLoc.station_name) {
    console.log(`${colors.bright}Docked at:${colors.reset} ${respawnLoc.station_name}`);
  }
  console.log('');
  console.log(`Hull:    ${drawHealthBar(Math.floor(hullMax * 0.25), hullMax, 30, colors.red)}`);
  console.log(`Shields: ${drawHealthBar(Math.floor(shieldMax * 0.50), shieldMax, 30, colors.cyan)}`);
  console.log(`Fuel:    ${drawHealthBar(Math.floor(fuelMax * 0.25), fuelMax, 30, colors.yellow)}`);

  console.log('');
  log('This is a simulation. Your ship has not been affected.', colors.dim);
  log('Use --respawn --confirm to actually respawn.', colors.dim);
}

async function executeRespawn(accessToken, playerId, confirmed) {
  logSection('Execute Respawn');

  if (!confirmed) {
    console.log(`${colors.red}${colors.bright}WARNING: This will respawn your ship!${colors.reset}`);
    console.log('');
    console.log('Effects:');
    console.log(`  - Ship moved to respawn location`);
    console.log(`  - Hull reduced to 25%`);
    console.log(`  - Shields reduced to 50%`);
    console.log(`  - Fuel reduced to 25%`);
    console.log(`  ${colors.red}- All cargo LOST${colors.reset}`);
    console.log('');
    log('Add --confirm to execute respawn', colors.yellow);
    return;
  }

  log('Executing respawn...', colors.yellow);

  try {
    const data = await apiRequest('/respawn/execute', accessToken, 'POST', {
      player_id: playerId,
    });

    log('Respawn successful!', colors.green);
    console.log('');
    console.log(`${colors.bright}New Location:${colors.reset} ${data.respawn_sector}`);

    if (data.station_id) {
      console.log(`${colors.bright}Docked at:${colors.reset} ${data.station_id}`);
    }

    console.log('');
    console.log(`Hull: ${data.hull_percent}%`);
    console.log(`Shields: ${data.shield_percent}%`);
    console.log(`Fuel: ${data.fuel_percent}%`);

    console.log('');
    console.log(`${colors.dim}Ship ID: ${data.ship_id}${colors.reset}`);
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
  log(`${colors.bright}Respawn API Test Utility${colors.reset}`, colors.cyan);
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

  console.log('');
  log(`Player ID: ${playerId}`, colors.green);

  // Get ship sector for station searches if not specified
  let sector = args.sector;

  // Execute command
  switch (args.command) {
    case 'location':
      await getRespawnLocation(accessToken, playerId);
      break;

    case 'ship-status':
      await getShipStatus(accessToken, playerId);
      break;

    case 'nearest-stations':
      if (!sector) {
        // Try to get sector from ship
        const ships = await apiRequest(`/ships/by-owner/${playerId}`, accessToken).catch(() => null);
        const shipList = Array.isArray(ships) ? ships : ships?.ships || [];
        sector = shipList[0]?.location_sector;
      }
      await getNearestStations(accessToken, sector, args.factionId);
      break;

    case 'simulate-death':
      await simulateDeath(accessToken, playerId);
      break;

    case 'respawn':
      await executeRespawn(accessToken, playerId, args.confirm);
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
