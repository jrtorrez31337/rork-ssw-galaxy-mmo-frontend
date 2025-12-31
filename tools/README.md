# SSW Frontend Testing Tools

Standalone CLI utilities for testing backend APIs independent of the React Native frontend.

## Setup

```bash
cd tools
npm install
```

## Available Tools

### SSE Event Tester (`sse-test.js`)

Test Server-Sent Events (SSE) connection and real-time game events.

```bash
# Login and listen for events
node sse-test.js -e test@example.com -p secret

# With additional channel subscriptions
node sse-test.js -e test@example.com -p secret -c sector.0.0.0 -c market.sol

# Using existing token
node sse-test.js -t <access_token> --player <player_id>
```

Events monitored:
- `game.combat.*` - Combat events (start, tick, loot, end)
- `game.movement.*` - Movement events (jump, dock, undock)
- `game.missions.*` - Mission events (assigned, objective, completed)
- `game.economy.*` - Economy events (trade, price_update)
- `game.sector.*` - Sector events (delta)
- `game.chat.*` - Chat messages

---

### Trading/Economy Tester (`trading-test.js`)

Test market and trading API endpoints.

```bash
# View orderbook for a commodity
node trading-test.js -e test@example.com -p secret --orderbook ore

# View trade history
node trading-test.js -e test@example.com -p secret --history fuel

# Place a buy order
node trading-test.js -e test@example.com -p secret \
  --place-order --side buy --commodity ore --price 100 --quantity 10

# View your active orders
node trading-test.js -e test@example.com -p secret --my-orders
```

Commands:
- `--list-commodities` - List available commodities at market
- `--orderbook <commodity>` - View buy/sell orders
- `--history <commodity>` - View recent trades
- `--place-order` - Place an order (requires --side, --price, --quantity, --commodity)
- `--my-orders` - List player's active orders

---

### Chat Tester (`chat-test.js`)

Test chat API endpoints and real-time messaging.

```bash
# List available chat rooms
node chat-test.js -e test@example.com -p secret --list-rooms

# Join a room and send a message
node chat-test.js -e test@example.com -p secret --join <room_id>
node chat-test.js -e test@example.com -p secret --send <room_id> -m "Hello!"

# View message history
node chat-test.js -e test@example.com -p secret --history <room_id>

# Listen for real-time messages
node chat-test.js -e test@example.com -p secret --listen

# Create a DM with another player
node chat-test.js -e test@example.com -p secret --create-dm <other_player_id>
```

Commands:
- `--list-rooms` - List available chat rooms
- `--join <room_id>` - Join a chat room
- `--leave <room_id>` - Leave a chat room
- `--send <room_id>` - Send a message (requires --message)
- `--history <room_id>` - Get message history
- `--listen` - Listen for real-time chat via SSE
- `--create-dm <player_id>` - Create private DM room

---

### Respawn Tester (`respawn-test.js`)

Test death and respawn flow endpoints.

```bash
# Check respawn location
node respawn-test.js -e test@example.com -p secret --location

# View ship status
node respawn-test.js -e test@example.com -p secret --ship-status

# Find nearby stations
node respawn-test.js -e test@example.com -p secret --nearest-stations

# Simulate death (shows what would happen)
node respawn-test.js -e test@example.com -p secret --simulate-death

# Actually respawn (WARNING: affects your ship!)
node respawn-test.js -e test@example.com -p secret --respawn --confirm
```

Commands:
- `--location` - Get respawn location info
- `--ship-status` - Show current ship status (hull, shields, fuel)
- `--nearest-stations` - Find nearest stations to current sector
- `--simulate-death` - Preview what happens on death
- `--respawn` - Execute respawn (use with `--confirm`)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SSW_API_URL` | `http://192.168.122.76:8080/v1` | Backend API base URL |
| `SSW_FANOUT_URL` | `http://192.168.122.76:8080` | SSE/Fanout server URL |

## Authentication

All tools support two authentication methods:

1. **Email/Password Login:**
   ```bash
   node <tool>.js -e user@example.com -p password123
   ```

2. **Direct Token:**
   ```bash
   node <tool>.js -t <access_token> --player <player_id>
   ```

## Sprint 2 Features Tested

| Feature | Tool | Key Commands |
|---------|------|--------------|
| Trading/Economy | `trading-test.js` | `--orderbook`, `--place-order` |
| Chat System | `chat-test.js` | `--list-rooms`, `--send`, `--listen` |
| Respawn Flow | `respawn-test.js` | `--location`, `--simulate-death`, `--respawn` |
| SSE Events | `sse-test.js` | All real-time events |
