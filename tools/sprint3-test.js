#!/usr/bin/env node
/**
 * Sprint 3 Feature Test Utility
 *
 * Tests Sprint 3 backend endpoints:
 * - Sessions API (list/revoke)
 * - Password change
 * - Galaxy influence map
 * - Delta sync
 *
 * Usage:
 *   node tools/sprint3-test.js -e <email> -p <password>
 *   node tools/sprint3-test.js -t <token>
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
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function success(msg) { log(`✓ ${msg}`, colors.green); }
function error(msg) { log(`✗ ${msg}`, colors.red); }
function info(msg) { log(`ℹ ${msg}`, colors.blue); }
function warn(msg) { log(`⚠ ${msg}`, colors.yellow); }
function header(msg) { log(`\n${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}`, colors.cyan); }

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { email: null, password: null, token: null, help: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-e': case '--email': parsed.email = args[++i]; break;
      case '-p': case '--password': parsed.password = args[++i]; break;
      case '-t': case '--token': parsed.token = args[++i]; break;
      case '-h': case '--help': parsed.help = true; break;
    }
  }
  return parsed;
}

function showHelp() {
  console.log(`
Sprint 3 Feature Test Utility

Usage:
  node sprint3-test.js -e <email> -p <password>
  node sprint3-test.js -t <token>

Options:
  -e, --email     Account email
  -p, --password  Account password
  -t, --token     Access token (skip login)
  -h, --help      Show this help

Environment:
  SSW_API_URL     API base URL (default: http://192.168.122.76:8080/v1)
`);
}

async function login(email, password) {
  info(`Logging in as ${email}...`);
  const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Login failed: ${response.status} - ${err}`);
  }

  const data = await response.json();
  success(`Logged in! Player: ${data.data.player_id}`);
  return {
    token: data.data.access_token,
    playerId: data.data.player_id,
  };
}

async function apiGet(endpoint, token) {
  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return { status: response.status, data: await response.json().catch(() => null) };
}

async function apiPost(endpoint, token, body = {}) {
  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json().catch(() => null) };
}

async function apiDelete(endpoint, token) {
  const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return { status: response.status, data: await response.json().catch(() => null) };
}

// ============ Test Functions ============

async function testSessions(token) {
  header('Testing Sessions API');

  // List sessions
  info('GET /auth/sessions - List active sessions');
  const listResult = await apiGet('/auth/sessions', token);

  if (listResult.status === 200 && listResult.data?.data) {
    const sessions = listResult.data.data.sessions || [];
    success(`Found ${sessions.length} active session(s)`);

    sessions.forEach((s, i) => {
      const current = s.is_current ? ' (CURRENT)' : '';
      console.log(`  ${i + 1}. ${s.device_info || 'Unknown'}${current}`);
      console.log(`     IP: ${s.ip_address}`);
      console.log(`     Last active: ${s.last_active_at}`);
    });

    // Try to revoke a non-current session (if any)
    const otherSession = sessions.find(s => !s.is_current);
    if (otherSession) {
      info(`\nDELETE /auth/sessions/${otherSession.session_id} - Revoke session`);
      const revokeResult = await apiDelete(`/auth/sessions/${otherSession.session_id}`, token);
      if (revokeResult.status === 200) {
        success('Session revoked successfully');
      } else {
        warn(`Revoke returned ${revokeResult.status}: ${JSON.stringify(revokeResult.data)}`);
      }
    } else {
      info('No other sessions to revoke (only current session active)');
    }
  } else if (listResult.status === 404) {
    warn('Sessions endpoint not found (404) - may not be implemented');
  } else {
    error(`Sessions list failed: ${listResult.status}`);
    console.log(JSON.stringify(listResult.data, null, 2));
  }
}

async function testPasswordChange(token) {
  header('Testing Password Change API');

  // Note: We won't actually change the password, just test the endpoint exists
  info('POST /auth/password - Test endpoint (with invalid data)');

  const result = await apiPost('/auth/password', token, {
    current_password: 'wrong_password_test',
    new_password: 'NewTestPassword123!',
  });

  if (result.status === 401 || result.status === 400) {
    success('Password endpoint exists and validates input');
    info(`Response: ${result.status} - ${result.data?.error?.message || 'Invalid credentials'}`);
  } else if (result.status === 404) {
    warn('Password change endpoint not found (404) - may not be implemented');
  } else if (result.status === 200) {
    warn('Password was actually changed! (unexpected with wrong current password)');
  } else {
    error(`Unexpected response: ${result.status}`);
    console.log(JSON.stringify(result.data, null, 2));
  }
}

async function testGalaxyInfluenceMap(token) {
  header('Testing Galaxy Influence Map API');

  info('GET /galaxy/influence-map - Fetch galaxy-wide faction territories');
  const result = await apiGet('/galaxy/influence-map', token);

  if (result.status === 200 && result.data?.data) {
    const map = result.data.data;
    const sectorCount = map.sectors?.length || 0;
    success(`Galaxy map loaded: ${sectorCount} sectors`);

    if (map.updated_at) {
      info(`Last updated: ${map.updated_at}`);
    }

    // Count factions
    const factionCounts = {};
    (map.sectors || []).forEach(sector => {
      const controlling = sector.controlling_faction ||
        sector.influences?.find(i => i.is_controlling)?.faction_id ||
        'unclaimed';
      factionCounts[controlling] = (factionCounts[controlling] || 0) + 1;
    });

    if (Object.keys(factionCounts).length > 0) {
      info('\nFaction territory counts:');
      Object.entries(factionCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([faction, count]) => {
          console.log(`  ${faction}: ${count} sectors`);
        });
    }

    // Show sample sector
    if (map.sectors?.length > 0) {
      info('\nSample sector:');
      console.log(JSON.stringify(map.sectors[0], null, 2));
    }
  } else if (result.status === 404) {
    warn('Galaxy influence map endpoint not found (404) - may not be implemented');
  } else {
    error(`Galaxy map failed: ${result.status}`);
    console.log(JSON.stringify(result.data, null, 2));
  }
}

async function testDeltaSync(token) {
  header('Testing Delta Sync API');

  const testSectorId = '0.0.0';

  // Test sector version endpoint
  info(`GET /sectors/${testSectorId}/version - Check sector version`);
  const versionResult = await apiGet(`/sectors/${testSectorId}/version`, token);

  if (versionResult.status === 200 && versionResult.data?.data) {
    const v = versionResult.data.data;
    success(`Sector version: ${v.current_version}`);
    info(`Is pristine: ${v.is_pristine}`);
    if (v.total_deltas !== undefined) {
      info(`Total deltas: ${v.total_deltas}`);
    }
  } else if (versionResult.status === 404) {
    warn('Sector version endpoint not found - trying deltas directly');
  } else {
    warn(`Version check returned ${versionResult.status}`);
  }

  // Test delta fetch endpoint
  info(`\nGET /sectors/${testSectorId}/deltas?since_version=0 - Fetch deltas`);
  const deltaResult = await apiGet(`/sectors/${testSectorId}/deltas?since_version=0`, token);

  if (deltaResult.status === 200 && deltaResult.data?.data) {
    const d = deltaResult.data.data;
    success(`Delta sync successful`);
    info(`Current version: ${d.current_version}`);
    info(`Delta count: ${d.delta_count || d.deltas?.length || 0}`);

    if (d.deltas?.length > 0) {
      info('\nRecent deltas:');
      d.deltas.slice(0, 3).forEach((delta, i) => {
        console.log(`  ${i + 1}. ${delta.delta_type} (v${delta.version})`);
        if (delta.target_type) console.log(`     Target: ${delta.target_type}/${delta.target_id}`);
      });
    }
  } else if (deltaResult.status === 404) {
    warn('Delta sync endpoint not found (404) - may not be implemented');
  } else {
    error(`Delta fetch failed: ${deltaResult.status}`);
    console.log(JSON.stringify(deltaResult.data, null, 2));
  }

  // Test sector metadata endpoint
  info(`\nGET /sectors/${testSectorId}/metadata - Fetch sector metadata`);
  const metaResult = await apiGet(`/sectors/${testSectorId}/metadata`, token);

  if (metaResult.status === 200 && metaResult.data?.data) {
    const m = metaResult.data.data;
    success(`Sector metadata loaded`);
    if (m.name) info(`Name: ${m.name}`);
    if (m.faction_name) info(`Faction: ${m.faction_name} [${m.faction_tag}]`);
    if (m.threat_level !== undefined) info(`Threat level: ${m.threat_level}`);
    if (m.sector_type) info(`Type: ${m.sector_type}`);
  } else if (metaResult.status === 404) {
    info('Sector metadata not found (sector may be unexplored)');
  } else {
    warn(`Metadata returned ${metaResult.status}`);
  }
}

async function testFactionTerritory(token) {
  header('Testing Faction Territory API');

  // List factions
  info('GET /factions - List all factions');
  const factionsResult = await apiGet('/factions', token);

  if (factionsResult.status === 200 && factionsResult.data?.data) {
    const factions = factionsResult.data.data;
    success(`Found ${factions.length} factions`);

    // Show first few factions
    factions.slice(0, 5).forEach(f => {
      console.log(`  • ${f.name} (${f.id})`);
    });

    // Get territory for first faction
    if (factions.length > 0) {
      const testFaction = factions[0];
      info(`\nGET /factions/${testFaction.id}/territory - Get faction territory`);
      const territoryResult = await apiGet(`/factions/${testFaction.id}/territory`, token);

      if (territoryResult.status === 200 && territoryResult.data?.data) {
        const t = territoryResult.data.data;
        success(`Territory loaded for ${testFaction.name}`);
        info(`Controlled sectors: ${t.controlled_sectors?.length || 0}`);
        info(`Border sectors: ${t.border_sectors?.length || 0}`);
        if (t.capital_sector) info(`Capital: ${t.capital_sector}`);
        if (t.total_influence) info(`Total influence: ${t.total_influence}`);
      } else if (territoryResult.status === 404) {
        warn('Territory endpoint not found');
      } else {
        warn(`Territory returned ${territoryResult.status}`);
      }
    }
  } else if (factionsResult.status === 404) {
    warn('Factions endpoint not found');
  } else {
    error(`Factions list failed: ${factionsResult.status}`);
  }
}

// ============ Main ============

async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  log(`\n${colors.bright}Sprint 3 Feature Test${colors.reset}`);
  log(`API: ${CONFIG.API_BASE_URL}\n`);

  let token = args.token;

  // Login if needed
  if (!token) {
    if (!args.email || !args.password) {
      error('Either --token or --email/--password required');
      showHelp();
      process.exit(1);
    }

    try {
      const auth = await login(args.email, args.password);
      token = auth.token;
    } catch (err) {
      error(err.message);
      process.exit(1);
    }
  }

  // Run all tests
  try {
    await testSessions(token);
    await testPasswordChange(token);
    await testGalaxyInfluenceMap(token);
    await testDeltaSync(token);
    await testFactionTerritory(token);

    header('Test Summary');
    success('All Sprint 3 endpoint tests completed');
    info('Check output above for any warnings or failures');

  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
