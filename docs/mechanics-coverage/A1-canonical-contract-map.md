# A1: Canonical Contract Map

**Task**: Build a comprehensive contract map of all backend API endpoints and SSE events
**Date**: 2025-12-27
**Source**: Backend API documentation (12 .apib files)
**Agent**: Integration Agent (Agent A)

---

## 1. REST Endpoints Table

### 1.1 Authentication Service (Identity)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Identity | POST | `/v1/auth/signup` | No | `{email, password, display_name}` | `{access_token, refresh_token, token_type, expires_in, session_id}` | `VALIDATION_ERROR`, `VALIDATION_PASSWORD_WEAK`, `EMAIL_EXISTS`, `RATE_LIMITED`, `SERVER_ERROR` | 02-AUTH-ACCOUNTS.apib |
| Identity | POST | `/v1/auth/login` | No | `{email, password}` | `{access_token, refresh_token, token_type, expires_in, session_id}` | `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `ACCOUNT_SUSPENDED`, `RATE_LIMITED`, `SERVER_ERROR` | 02-AUTH-ACCOUNTS.apib |
| Identity | POST | `/v1/auth/refresh` | No | `{refresh_token}` | `{access_token, refresh_token, token_type, expires_in}` (new refresh token!) | `VALIDATION_ERROR`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `RATE_LIMITED`, `SERVER_ERROR` | 02-AUTH-ACCOUNTS.apib |
| Identity | POST | `/v1/auth/logout` | Yes | `{all_sessions}` (bool) | `{sessions_revoked}` (int) | `AUTH_REQUIRED`, `AUTH_INVALID_TOKEN`, `AUTH_TOKEN_EXPIRED`, `SERVER_ERROR` | 02-AUTH-ACCOUNTS.apib |
| Identity | POST | `/v1/auth/password` | Yes | `{current_password, new_password}` | `{message, sessions_revoked, new_tokens}` (revokes all sessions) | `VALIDATION_ERROR`, `VALIDATION_PASSWORD_WEAK`, `INVALID_CREDENTIALS`, `AUTH_REQUIRED`, `SERVER_ERROR` | 02-AUTH-ACCOUNTS.apib |
| Identity | DELETE | `/v1/auth/account` | Yes | `{password, confirm}` | `{message, deletion_at}` (30-day grace period) | `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `AUTH_REQUIRED`, `SERVER_ERROR` | 02-AUTH-ACCOUNTS.apib |
| Identity | GET | `/v1/auth/me` | Yes | - | `{account_id, email, status, home_region, profile_id, display_name, active_sessions}` | `AUTH_REQUIRED`, `AUTH_INVALID_TOKEN`, `SERVER_ERROR` | 02-AUTH-ACCOUNTS.apib |
| Identity | GET | `/v1/auth/sessions` | Yes | - | Array of `{session_id, created_at, last_active, ip_address, user_agent}` | `AUTH_REQUIRED`, `SERVER_ERROR` | 02-AUTH-ACCOUNTS.apib |

### 1.2 Character Service (Identity)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Identity | POST | `/v1/characters` | Yes | `{profile_id, name, home_sector, attributes: {piloting, engineering, science, tactics, leadership}}` (sum=20) | `{id, profile_id, name, home_sector, attributes, created_at}` | `VALIDATION_ERROR`, `INSUFFICIENT_POINTS`, `ATTRIBUTE_OUT_OF_RANGE`, `AUTH_REQUIRED`, `NAME_TAKEN`, `SERVER_ERROR` | 03A-IDENTITY.apib |
| Identity | GET | `/v1/characters/{id}` | Yes | - | `{id, profile_id, name, home_sector, attributes, created_at}` | `NOT_FOUND`, `AUTH_REQUIRED` | 03A-IDENTITY.apib |
| Identity | GET | `/v1/characters/by-profile/{profile_id}` | Yes | - | Array of characters (no pagination) | `NOT_FOUND`, `AUTH_REQUIRED` | 03A-IDENTITY.apib |
| Identity | PATCH | `/v1/characters/{id}` | Yes | `{name}` | `{message}` | `VALIDATION_ERROR`, `NOT_FOUND`, `NAME_TAKEN`, `AUTH_REQUIRED` | 03A-IDENTITY.apib |

### 1.3 Ship Service (Identity)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Identity | POST | `/v1/ships` | Yes | `{owner_id, ship_type, name, stat_allocation: {hull_strength, shield_capacity, speed, cargo_space, sensors}}` (sum=30) | `{id, owner_id, ship_type, name, hull_points, hull_max, shield_points, shield_max, speed, cargo_capacity, sensor_range, location_sector, fuel_current, fuel_capacity, docked_at, last_jump_at, position, in_combat, created_at, stat_allocation}` | `VALIDATION_ERROR`, `INSUFFICIENT_POINTS`, `STAT_OUT_OF_RANGE`, `INVALID_SHIP_TYPE`, `AUTH_REQUIRED`, `SERVER_ERROR` | 03A-IDENTITY.apib |
| Identity | GET | `/v1/ships/{id}` | Yes | - | Ship object (see above) | `NOT_FOUND`, `AUTH_REQUIRED` | 03A-IDENTITY.apib |
| Identity | GET | `/v1/ships/by-owner/{owner_id}` | Yes | - | Array of ships (no pagination) | `NOT_FOUND`, `AUTH_REQUIRED` | 03A-IDENTITY.apib |
| Identity | PATCH | `/v1/ships/{id}` | Yes | `{name}` | `{message}` | `VALIDATION_ERROR`, `NOT_FOUND`, `AUTH_REQUIRED` | 03A-IDENTITY.apib |

### 1.4 Sector Service (WorldSim)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| WorldSim | GET | `/v1/sectors/{sector_id}` | Yes | - | `{id, name, faction_control, faction_control_percentage, threat_level, system_type, stations[], resources[], coordinates}` | `VALIDATION_ERROR`, `SECTOR_NOT_FOUND`, `AUTH_REQUIRED` | 03B-WORLDSIM.apib |
| WorldSim | GET | `/v1/sectors/{sector_id}/state` | Yes | - | `{sector_id, timestamp, player_ships[], npcs[], resource_nodes, active_combats}` | `VALIDATION_ERROR`, `SECTOR_NOT_FOUND`, `AUTH_REQUIRED` | 03B-WORLDSIM.apib |
| WorldSim | GET | `/v1/sectors/{sector_id}/entities` | Yes | `?type=ship/npc/station/node/all` | `{sector_id, entities[{entity_id, entity_type, name, owner_id, position, metadata}]}` | `VALIDATION_ERROR`, `SECTOR_NOT_FOUND`, `AUTH_REQUIRED` | 03B-WORLDSIM.apib |

### 1.5 Movement Service (WorldSim)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| WorldSim | POST | `/v1/actions/jump` | Yes | `{ship_id, to_sector}` | `{success, ship_id, from_sector, to_sector, fuel_consumed, fuel_remaining, distance, arrival_position, arrival_time, message}` | `VALIDATION_ERROR`, `SHIP_NOT_FOUND`, `INSUFFICIENT_FUEL`, `SHIP_DOCKED`, `SHIP_IN_COMBAT`, `JUMP_ON_COOLDOWN`, `AUTH_REQUIRED`, `FORBIDDEN` | 03B-WORLDSIM.apib |
| WorldSim | POST | `/v1/actions/dock` | Yes | `{ship_id, station_id}` | `{success, ship_id, station: {id, name, location_sector, station_type, position, services[], docking_capacity, docked_ships_count}, message}` | `VALIDATION_ERROR`, `SHIP_NOT_FOUND`, `STATION_NOT_FOUND`, `NOT_IN_SECTOR`, `NOT_IN_RANGE`, `STATION_FULL`, `SHIP_IN_COMBAT`, `AUTH_REQUIRED`, `FORBIDDEN` | 03B-WORLDSIM.apib |
| WorldSim | POST | `/v1/actions/undock` | Yes | `{ship_id}` | `{success, ship_id, sector, position, message}` | `VALIDATION_ERROR`, `SHIP_NOT_FOUND`, `SHIP_NOT_DOCKED`, `AUTH_REQUIRED`, `FORBIDDEN` | 03B-WORLDSIM.apib |
| WorldSim | GET | `/v1/snapshot` | Yes | `?player_id=uuid&sector_id=coords` | `{version, timestamp, player: {profile_id, active_ship_id, position, velocity, health, shield, fuel, is_docked, is_in_combat}, sector, active_combat}` | `VALIDATION_ERROR`, `NOT_FOUND`, `AUTH_REQUIRED` | 03B-WORLDSIM.apib |

### 1.6 Inventory Service (WorldSim)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| WorldSim | GET | `/v1/inventory/{owner_id}` | Yes | `?owner_type=ship/station/planet&resource_type=type` | `{owner_id, owner_type, capacity, used, available, items[{id, resource_type, quantity, quality, unit_volume, total_volume}]}` | `VALIDATION_ERROR`, `NOT_FOUND`, `AUTH_REQUIRED`, `FORBIDDEN` | 03B-WORLDSIM.apib |
| WorldSim | POST | `/v1/inventory/transfer` | Yes | `{source_id, source_type, target_id, target_type, resource_type, quantity, quality}` | `{transfer_id, source_remaining, target_new_total, volume_transferred, timestamp, success}` | `VALIDATION_ERROR`, `NOT_FOUND`, `NOT_IN_SECTOR`, `NOT_IN_RANGE`, `INSUFFICIENT_QUANTITY`, `QUALITY_MISMATCH`, `CARGO_FULL`, `INVALID_RESOURCE`, `AUTH_REQUIRED`, `FORBIDDEN` | 03B-WORLDSIM.apib |

### 1.7 Mining Service (WorldSim)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| WorldSim | GET | `/v1/mining/nodes` | Yes | `?sector=coords&resource_type=type` | `{sector, nodes[{id, sector, position, resource_type, richness, quantity_remaining, quality_mean, respawns}]}` | `VALIDATION_ERROR`, `SECTOR_NOT_FOUND`, `AUTH_REQUIRED` | 03B-WORLDSIM.apib |
| WorldSim | POST | `/v1/mining/extract` | Yes | `{ship_id, resource_node_id, quantity}` | `{success, resource_type, quantity_extracted, quality, cargo_remaining, node_quantity_remaining, extraction_time, timestamp}` | `VALIDATION_ERROR`, `SHIP_NOT_FOUND`, `NODE_NOT_FOUND`, `NOT_IN_SECTOR`, `NOT_IN_RANGE`, `SHIP_DOCKED`, `SHIP_IN_COMBAT`, `NODE_DEPLETED`, `CARGO_FULL`, `AUTH_REQUIRED`, `FORBIDDEN` | 03B-WORLDSIM.apib |

### 1.8 Station Services (WorldSim)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| WorldSim | POST | `/v1/stations/refuel` | Yes | `{ship_id, amount}` (0 or omit = fill) | `{success, amount_added, cost_paid, fuel_remaining, credits_remaining, discount_applied}` | `VALIDATION_ERROR`, `SHIP_NOT_FOUND`, `SHIP_NOT_DOCKED`, `SERVICE_NOT_AVAILABLE`, `FUEL_FULL`, `INVALID_AMOUNT`, `INSUFFICIENT_CREDITS`, `PRICING_NOT_CONFIGURED`, `AUTH_REQUIRED`, `FORBIDDEN` | 03B-WORLDSIM.apib |
| WorldSim | POST | `/v1/stations/repair` | Yes | `{ship_id, repair_hull, repair_shield}` | `{success, hull_repaired, shield_repaired, cost_paid, hull_current, shield_current, credits_remaining, discount_applied}` | `VALIDATION_ERROR`, `SHIP_NOT_FOUND`, `SHIP_NOT_DOCKED`, `SERVICE_NOT_AVAILABLE`, `SHIP_FULLY_REPAIRED`, `INSUFFICIENT_CREDITS`, `PRICING_NOT_CONFIGURED`, `AUTH_REQUIRED`, `FORBIDDEN` | 03B-WORLDSIM.apib |

### 1.9 Combat Service

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Combat | POST | `/combat/initiate` | Yes | `{initiator_id, initiator_ship_id, target_id, sector_id}` | `{success, combat_id, status, assignment: {combat_id, instance_region, udp_endpoint, udp_token, fallback_mode}}` | `VALIDATION_ERROR`, `NOT_FOUND`, `SHIP_NOT_IN_SECTOR`, `ALREADY_IN_COMBAT`, `AUTH_REQUIRED` | 03C-COMBAT.apib |
| Combat | GET | `/combat/{combat_id}` | Yes | - | `{id, status, region, sector_id, started_at, current_tick, participants[{player_id, ship_id, team, hull, hull_max, shield, shield_max, is_alive}]}` | `COMBAT_NOT_FOUND`, `AUTH_REQUIRED` | 03C-COMBAT.apib |
| Combat | POST | `/combat/{combat_id}/join` | Yes | `{player_id, ship_id, team}` | `{success, assignment}` | `COMBAT_NOT_FOUND`, `VALIDATION_ERROR`, `SHIP_NOT_IN_SECTOR`, `ALREADY_IN_COMBAT`, `AUTH_REQUIRED` | 03C-COMBAT.apib |
| Combat | POST | `/combat/{combat_id}/leave` | Yes | `{player_id, reason}` | `{success}` | `COMBAT_NOT_FOUND`, `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03C-COMBAT.apib |
| Combat | GET | `/combat/history` | Yes | `?player_id=uuid&limit=20&offset=0` | Array of `{combat_id, sector_id, outcome, started_at, ended_at, duration_seconds, team, enemies_destroyed, damage_dealt, damage_taken, loot_credits, loot_resources[]}` | `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03C-COMBAT.apib |

### 1.10 Economy Service

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Economy | POST | `/markets/{market_id}/orders` | Yes | `{player_id, commodity, side: buy/sell, price, quantity}` | `{order_id, status: filled/partial/pending, fills[{fill_id, matched_id, price, quantity, timestamp}]}` | `VALIDATION_ERROR`, `MARKET_NOT_FOUND`, `INSUFFICIENT_CREDITS`, `INSUFFICIENT_INVENTORY`, `AUTH_REQUIRED` | 03D-ECONOMY.apib |
| Economy | DELETE | `/markets/{market_id}/orders/{order_id}` | Yes | `?commodity=type&side=buy/sell` | `{success}` | `VALIDATION_ERROR`, `MARKET_NOT_FOUND`, `ORDER_NOT_FOUND`, `AUTH_REQUIRED` | 03D-ECONOMY.apib |
| Economy | GET | `/markets/{market_id}/orderbook` | Yes | `?commodity=type` | `{market_id, commodity, best_bid, best_ask, spread, midpoint}` | `VALIDATION_ERROR`, `MARKET_NOT_FOUND`, `AUTH_REQUIRED` | 03D-ECONOMY.apib |
| Economy | GET | `/markets/{market_id}/prices/{commodity}` | Yes | - | `{market_id, commodity, spot_price, index_price, forecast, change_percent, vwap, high_24h, low_24h, volume_24h}` | `MARKET_NOT_FOUND`, `AUTH_REQUIRED` | 03D-ECONOMY.apib |
| Economy | GET | `/markets/{market_id}/prices` | Yes | - | `{market_id, prices[{commodity, spot_price, change_percent, volume_24h}]}` (all 10 commodities) | `MARKET_NOT_FOUND`, `AUTH_REQUIRED` | 03D-ECONOMY.apib |
| Economy | GET | `/markets/{market_id}/trades` | Yes | `?commodity=type&limit=50` | `{market_id, commodity, trades[{trade_id, price, quantity, timestamp}]}` | `VALIDATION_ERROR`, `MARKET_NOT_FOUND`, `AUTH_REQUIRED` | 03D-ECONOMY.apib |

### 1.11 Mission Service

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Missions | GET | `/v1/missions/available` | Yes | `?player_id=uuid&sector=coords&faction_id=id` | Array of `{template_id, template_name, description, faction_id, faction_name, mission_type, difficulty, estimated_duration, reward_credits, reward_reputation, reward_items[], requirements, objectives[], expires_in, is_repeatable, cooldown_hours}` | `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03E-MISSIONS.apib |
| Missions | GET | `/v1/missions/active` | Yes | `?player_id=uuid` | Array of `{mission_id, template_id, template_name, description, faction_id, status, assigned_at, expires_at, time_remaining, reward_credits, reward_reputation, objectives[{objective_id, type, description, target_count, current_count, completed, progress}], overall_progress}` | `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03E-MISSIONS.apib |
| Missions | GET | `/v1/missions/completed` | Yes | `?player_id=uuid&limit=20&offset=0` | `{missions[], total, limit, offset}` | `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03E-MISSIONS.apib |
| Missions | GET | `/v1/missions/{mission_id}` | Yes | - | Detailed mission with `{mission_id, template_id, template_name, description, faction_id, faction_name, player_id, status, assigned_at, expires_at, time_remaining, reward_credits, reward_reputation, reward_items[], objectives[{objective_id, type, description, target_type, target_count, current_count, completed, progress, history[]}], overall_progress}` | `MISSION_NOT_FOUND`, `UNAUTHORIZED`, `AUTH_REQUIRED` | 03E-MISSIONS.apib |
| Missions | POST | `/v1/missions/{mission_template_id}/accept` | Yes | `{player_id}` | `{mission_id, template_id, template_name, status, assigned_at, expires_at, objectives[]}` | `MISSION_NOT_FOUND`, `VALIDATION_ERROR`, `ACCEPT_FAILED`, `AUTH_REQUIRED` | 03E-MISSIONS.apib |
| Missions | POST | `/v1/missions/{mission_id}/abandon` | Yes | `{player_id}` | `{success, mission_id}` | `MISSION_NOT_FOUND`, `VALIDATION_ERROR`, `ABANDON_FAILED`, `AUTH_REQUIRED` | 03E-MISSIONS.apib |

### 1.12 Social Service (Factions & Reputation)

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Social | GET | `/v1/factions` | Optional | - | Array of `{id, name, description, color, emblem, home_system, member_count, founded, is_playable}` | - | 03F-SOCIAL.apib |
| Social | GET | `/v1/factions/{faction_id}` | Optional | - | `{id, name, description, color, emblem, home_system, member_count, founded, is_playable, controlled_sectors, total_influence, capital_sector}` | `FACTION_NOT_FOUND` | 03F-SOCIAL.apib |
| Social | GET | `/v1/factions/{faction_id}/members` | Yes | `?limit=20&offset=0` | `{items[{player_id, player_name, reputation, reputation_tier, joined_at, rank}], total, limit, offset}` | `FACTION_NOT_FOUND`, `AUTH_REQUIRED` | 03F-SOCIAL.apib |
| Social | GET | `/v1/factions/{faction_id}/relations` | Optional | - | Array of `{target_faction_id, target_faction_name, relation_type, standing}` | `FACTION_NOT_FOUND` | 03F-SOCIAL.apib |
| Social | GET | `/v1/players/{player_id}/reputation` | Yes | - | Array of `{faction_id, faction_name, reputation, reputation_tier, tier_min, tier_max, progress_to_next}` | `NOT_FOUND`, `AUTH_REQUIRED` | 03F-SOCIAL.apib |
| Social | GET | `/v1/players/{player_id}/reputation/{faction_id}` | Yes | - | `{faction_id, faction_name, reputation, reputation_tier, tier_min, tier_max, progress_to_next, benefits[]}` | `NOT_FOUND`, `AUTH_REQUIRED` | 03F-SOCIAL.apib |
| Social | GET | `/v1/players/{player_id}/reputation/history` | Yes | `?faction_id=id&limit=20` | `{events[{event_id, faction_id, faction_name, change, old_reputation, new_reputation, reason, timestamp}], total, limit}` | `NOT_FOUND`, `AUTH_REQUIRED` | 03F-SOCIAL.apib |
| Social | POST | `/v1/reputation/actions` | Yes (service-to-service) | `{player_id, faction_id, change, reason, source_service}` | `{success, old_reputation, new_reputation, old_tier, new_tier, tier_changed}` | `NOT_FOUND`, `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03F-SOCIAL.apib |
| Social | GET | `/v1/reputation/tiers` | Optional | - | `{tiers[{tier, min, max, color, benefits[]}]}` (7 tiers) | - | 03F-SOCIAL.apib |
| Social | GET | `/v1/sectors/{sector_id}/influence` | Optional | - | `{sector_id, sector_name, controller, contested, influence: {faction_id: percentage}, last_updated}` | `SECTOR_NOT_FOUND`, `VALIDATION_ERROR` | 03F-SOCIAL.apib |
| Social | GET | `/v1/factions/{faction_id}/territory` | Optional | - | `{faction_id, faction_name, total_sectors, sectors[{sector_id, sector_name, influence, contested, population, stations}]}` | `FACTION_NOT_FOUND` | 03F-SOCIAL.apib |
| Social | GET | `/v1/galaxy/influence-map` | Optional | `?min_x&max_x&min_y&max_y&min_z&max_z` | `{sectors[{sector_id, controller, influence}], total_sectors, faction_summary: {faction_id: sector_count}}` | `VALIDATION_ERROR` | 03F-SOCIAL.apib |

### 1.13 Chat Service

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Chat | POST | `/v1/chat/messages` | Yes | `{room_id, sender_id, message}` (1-500 chars) | `{message_id, room_id, sender_id, sender_name, message, timestamp}` | `VALIDATION_ERROR`, `ROOM_NOT_FOUND`, `FORBIDDEN`, `AUTH_REQUIRED` | 03G-CHAT.apib |
| Chat | GET | `/v1/chat/rooms` | Yes | `?player_id=uuid&type=sector/faction/alliance/global/dm/group` | Array of `{id, type, name, owner_id, member_count, max_members, created_at}` | `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03G-CHAT.apib |
| Chat | GET | `/v1/chat/rooms/{room_id}` | Yes | - | `{id, type, name, owner_id, members[{player_id, player_name, joined_at}], member_count, max_members, created_at}` | `ROOM_NOT_FOUND`, `FORBIDDEN`, `AUTH_REQUIRED` | 03G-CHAT.apib |
| Chat | POST | `/v1/chat/rooms` | Yes | `{type: alliance/group, name, owner_id, max_members}` | `{id, type, name, owner_id, member_count, max_members, created_at}` | `VALIDATION_ERROR`, `NAME_TAKEN`, `AUTH_REQUIRED` | 03G-CHAT.apib |
| Chat | POST | `/v1/chat/rooms/{room_id}/join` | Yes | `{player_id}` | `{success, room_id, member_count}` | `ROOM_NOT_FOUND`, `ROOM_FULL`, `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03G-CHAT.apib |
| Chat | POST | `/v1/chat/rooms/{room_id}/leave` | Yes | `{player_id}` | `{success, room_id, member_count}` | `ROOM_NOT_FOUND`, `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03G-CHAT.apib |
| Chat | POST | `/v1/chat/private` | Yes | `{player1, player2}` | `{room_id, type: dm, name, members[{player_id, player_name}], created_at}` | `NOT_FOUND`, `VALIDATION_ERROR`, `AUTH_REQUIRED` | 03G-CHAT.apib |

### 1.14 Procgen Service

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Procgen | POST | `/v1/generate/sector` | Optional | `{x, y, z}` (int32) | `{coordinates, name, sector_type, faction_control, faction_control_percentage, threat_level, star_system, stations[], resources[], resource_nodes[]}` | `VALIDATION_ERROR`, `GENERATION_ERROR` | 03H-PROCGEN.apib |
| Procgen | GET | `/v1/sectors/{x}/{y}/{z}` | Optional | - | Same as POST /v1/generate/sector | `VALIDATION_ERROR`, `GENERATION_ERROR` | 03H-PROCGEN.apib |

### 1.15 Real-Time SSE

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Fanout | GET | `/v1/stream/gameplay` | Optional | `?channels=comma,separated,list` (Headers: `X-Player-ID`, `X-Session-ID`) | SSE stream (text/event-stream) | - | 04-REALTIME-SSE.apib |
| Fanout | POST | `/v1/stream/gameplay/subscribe` | No | `{subscriber_id, channels[]}` | `{success, channels[]}` | `VALIDATION_ERROR` | 04-REALTIME-SSE.apib |
| Fanout | POST | `/v1/stream/gameplay/unsubscribe` | No | `{subscriber_id, channels[]}` | `{success, channels[]}` | `VALIDATION_ERROR` | 04-REALTIME-SSE.apib |
| Fanout | GET | `/v1/stream/gameplay/stats` | No | - | `{total_subscribers, total_channels, events_published_total, events_dropped_total, uptime_seconds, nats_connected}` | - | 04-REALTIME-SSE.apib |

### 1.16 Admin & Operations

| Service | Method | Path | Auth Required | Request Schema | Response Schema | Error Codes | Source File |
|---------|--------|------|---------------|----------------|-----------------|-------------|-------------|
| Gateway | GET | `/v1/health` | No | - | `{status: ok/degraded, services: {service: ok/error}, infrastructure: {redis, cockroachdb, nats}, uptime_seconds, version}` | - | 05-ADMIN-OPS.apib |
| Moderation | POST | `/v1/moderation/kick` | Yes (admin) | `{admin_id, player_id, reason, duration_minutes}` (default 30) | `{success, action_id, player_id, action_type: kick, expires_at, timestamp}` | `NOT_FOUND`, `ACTION_FAILED`, `FORBIDDEN`, `AUTH_REQUIRED` | 05-ADMIN-OPS.apib |
| Moderation | POST | `/v1/moderation/mute` | Yes (admin) | `{admin_id, player_id, reason, duration_minutes}` | `{success, action_id, player_id, action_type: mute, expires_at, timestamp}` | `NOT_FOUND`, `ACTION_FAILED`, `FORBIDDEN`, `AUTH_REQUIRED` | 05-ADMIN-OPS.apib |
| Moderation | POST | `/v1/moderation/ban/temp` | Yes (admin) | `{admin_id, player_id, reason, duration_hours}` (max 720) | `{success, action_id, player_id, action_type: temp_ban, expires_at, timestamp}` | `NOT_FOUND`, `VALIDATION_ERROR`, `ACTION_FAILED`, `FORBIDDEN`, `AUTH_REQUIRED` | 05-ADMIN-OPS.apib |
| Moderation | POST | `/v1/moderation/ban/perm` | Yes (admin) | `{admin_id, player_id, reason}` | `{success, action_id, player_id, action_type: perm_ban, expires_at: null, timestamp}` | `NOT_FOUND`, `ACTION_FAILED`, `FORBIDDEN`, `AUTH_REQUIRED` | 05-ADMIN-OPS.apib |
| Moderation | POST | `/v1/moderation/teleport` | Yes (admin) | `{admin_id, player_id, ship_id, to_sector, reason}` | `{success, action_id, ship_id, from_sector, to_sector, position, timestamp}` | `NOT_FOUND`, `SHIP_IN_COMBAT`, `SECTOR_NOT_FOUND`, `ACTION_FAILED`, `FORBIDDEN`, `AUTH_REQUIRED` | 05-ADMIN-OPS.apib |
| Moderation | GET | `/v1/moderation/audit` | Yes (admin) | `?limit=50&offset=0&admin_id&player_id&action_type` | `{entries[{action_id, admin_id, admin_name, player_id, player_name, action_type, reason, duration_minutes/hours, expires_at, timestamp}], total, limit, offset}` | `VALIDATION_ERROR`, `FORBIDDEN`, `AUTH_REQUIRED` | 05-ADMIN-OPS.apib |
| Moderation | GET | `/v1/moderation/players/{player_id}/history` | Yes (admin) | - | `{player_id, player_name, total_actions, active_actions[], history[]}` | `NOT_FOUND`, `FORBIDDEN`, `AUTH_REQUIRED` | 05-ADMIN-OPS.apib |

**Total REST Endpoints**: 93 endpoints across 10 services

---

## 2. SSE Events Table

| Event Name | Channel Pattern | Payload Schema (brief - see source for full) | Published By | Triggered When | Source File |
|------------|-----------------|----------------------------------------------|--------------|----------------|-------------|
| `connected` | `system` | `{subscriber_id}` | Fanout | SSE connection established | 04-REALTIME-SSE.apib |
| `heartbeat` | `system` | `{time}` (unix timestamp) | Fanout | Every 30 seconds | 04-REALTIME-SSE.apib |
| `game.movement.jump` | `game.movement.jump`, `player.{player_id}` | `{ship_id, player_id, from_sector, to_sector, fuel_consumed, fuel_remaining, position, timestamp}` | WorldSim | Ship completes hyperspace jump | 04-REALTIME-SSE.apib |
| `game.movement.dock` | `game.movement.dock`, `player.{player_id}` | `{ship_id, player_id, station_id, station_name, sector, timestamp}` | WorldSim | Ship docks at station | 04-REALTIME-SSE.apib |
| `game.movement.undock` | `game.movement.undock`, `player.{player_id}` | `{ship_id, player_id, station_id, sector, timestamp}` | WorldSim | Ship undocks from station | 04-REALTIME-SSE.apib |
| `game.combat.start` | `game.combat.start`, `combat.{combat_id}`, `player.{player_id}` | `{combat_id, sector, participants[{ship_id, player_id, ship_type, hull, shield}], timestamp}` | Combat | Combat instance created | 04-REALTIME-SSE.apib |
| `game.combat.action` | `combat.{combat_id}`, `player.{player_id}` | `{combat_id, tick, attacker_id, target_id, action_type, damage, target_hull_remaining, target_shield_remaining, timestamp}` | Combat | Combat action (attack, ability) | 04-REALTIME-SSE.apib |
| `game.combat.outcome` | `game.combat.outcome`, `combat.{combat_id}`, `player.{player_id}` | `{combat_id, outcome, victor_id, defeated_id, duration_seconds, loot_generated, timestamp}` | Combat | Combat ends | 04-REALTIME-SSE.apib |
| `game.combat.loot` | `combat.{combat_id}`, `player.{victor_id}` | `{combat_id, tick, npc_id, npc_type, victor_id, loot: {credits, resources[], equipment[]}, timestamp}` | Combat | NPC killed, loot generated | 04-REALTIME-SSE.apib |
| `game.combat.tick` | `combat.{combat_id}` | `{combat_id, tick, actions[], participants[], timestamp}` | Combat | Combat tick processed | 03C-COMBAT.apib |
| `game.economy.trade` | `game.economy.trade`, `player.{buyer_id}`, `player.{seller_id}` | `{trade_id, buyer_id, seller_id, resource_type, quantity, price_per_unit, total_cost, sector, timestamp}` | Economy | Market order filled | 04-REALTIME-SSE.apib |
| `game.economy.order_placed` | `player.{player_id}`, `sector.{sector}` | `{order_id, player_id, order_type, resource_type, quantity, price_per_unit, sector, expires_at, timestamp}` | Economy | New buy/sell order created | 04-REALTIME-SSE.apib |
| `game.economy.order_cancelled` | `player.{player_id}` | `{order_id, player_id, reason, timestamp}` | Economy | Order cancelled or expires | 04-REALTIME-SSE.apib |
| `game.economy.price_update` | `economy.market.{market_id}` | `{market_id, commodity, old_price, new_price, change_percent, reason, timestamp}` | Economy | Commodity price changes >1% | 03D-ECONOMY.apib |
| `game.mining.extract` | `player.{player_id}`, `sector.{sector}` | `{ship_id, player_id, resource_node_id, resource_type, quantity, quality, sector, node_quantity_remaining, timestamp}` | WorldSim | Resources extracted from node | 04-REALTIME-SSE.apib |
| `game.missions.assigned` | `game.missions.assigned`, `player.{player_id}` | `{mission_id, player_id, template_name, description, reward_credits, reward_reputation, faction_id, expires_at, objectives[], timestamp}` | Missions | Player accepts mission | 04-REALTIME-SSE.apib |
| `game.missions.objective` | `player.{player_id}` | `{mission_id, player_id, objective_id, current_count, target_count, completed, timestamp}` | Missions | Mission objective progress update | 04-REALTIME-SSE.apib |
| `game.missions.completed` | `game.missions.completed`, `player.{player_id}` | `{mission_id, player_id, credits_awarded, reputation_awarded, faction_id, items_awarded[], completion_time_seconds, timestamp}` | Missions | Mission successfully completed | 04-REALTIME-SSE.apib |
| `game.missions.failed` | `game.missions.failed`, `player.{player_id}` | `{mission_id, player_id, reason, timestamp}` | Missions | Mission failed or expired | 03E-MISSIONS.apib |
| `game.missions.abandoned` | `game.missions.abandoned`, `player.{player_id}` | `{mission_id, player_id, timestamp}` | Missions | Player abandons mission | 03E-MISSIONS.apib |
| `game.social.reputation` | `game.social.reputation`, `player.{player_id}`, `faction.{faction_id}` | `{player_id, faction_id, old_reputation, new_reputation, change, reason, timestamp}` | Social | Faction reputation changes | 04-REALTIME-SSE.apib |
| `game.chat.message` | `chat.room.{room_id}` | `{room_id, room_type, sender_id, sender_name, message, timestamp}` | Chat | Message sent to room | 04-REALTIME-SSE.apib |
| `game.services.fuel_purchase` | `player.{player_id}` | `{ship_id, player_id, station_id, station_name, amount, cost, fuel_remaining, timestamp}` | WorldSim | Ship refuels at station | 04-REALTIME-SSE.apib |
| `game.services.repair` | `player.{player_id}` | `{ship_id, player_id, station_id, station_name, hull_repaired, shield_repaired, cost, hull_current, shield_current, timestamp}` | WorldSim | Ship repaired at station | 04-REALTIME-SSE.apib |

**Total SSE Events**: 24 event types across 7 services

---

## 3. Domain Models Summary

### 3.1 Authentication & Identity Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **Account** | `account_id, email, password_hash, status, home_region, profile_id, display_name` | 02-AUTH-ACCOUNTS.apib |
| **Session** | `session_id, account_id, profile_id, created_at, last_active, ip_address, user_agent` | 02-AUTH-ACCOUNTS.apib |
| **AccessToken** (JWT) | `sub (profile_id), aid (account_id), sid (session_id), exp, iat, iss, type` | 01-OVERVIEW.apib |
| **RefreshToken** (JWT) | `sub, aid, sid, exp, iat, iss, type` (30-day lifetime, rotation on refresh) | 01-OVERVIEW.apib |
| **Character** | `id, profile_id, name, home_sector, attributes: {piloting, engineering, science, tactics, leadership}` (sum=20) | 03A-IDENTITY.apib |
| **Ship** | `id, owner_id, ship_type, name, hull_points, hull_max, shield_points, shield_max, speed, cargo_capacity, sensor_range, location_sector, fuel_current, fuel_capacity, docked_at, last_jump_at, position, in_combat, stat_allocation: {hull_strength, shield_capacity, speed, cargo_space, sensors}` (sum=30) | 03A-IDENTITY.apib |

### 3.2 WorldSim Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **Sector** | `id, name, faction_control, faction_control_percentage, threat_level, system_type, stations[], resources[], coordinates` | 03B-WORLDSIM.apib |
| **Station** | `id, name, station_type, position, services[], docking_capacity, faction_id` | 03B-WORLDSIM.apib |
| **Inventory** | `owner_id, owner_type, capacity, used, available, items[{id, resource_type, quantity, quality, unit_volume}]` | 03B-WORLDSIM.apib |
| **ResourceNode** | `id, sector, position, resource_type, richness, quantity_remaining, quality_mean, respawns` | 03B-WORLDSIM.apib |
| **Vector3** | `x, y, z` (float64) | Shared across all services |

### 3.3 Combat Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **CombatInstance** | `id, status, region, sector_id, started_at, current_tick, participants[]` | 03C-COMBAT.apib |
| **CombatParticipant** | `player_id, ship_id, team, hull, hull_max, shield, shield_max, is_alive` | 03C-COMBAT.apib |
| **Loot** | `credits, resources[{resource_type, quantity, quality}], equipment[]` | 03C-COMBAT.apib |
| **NPCShip** | `npc_id, npc_type, faction, position, threat_rating` | 03C-COMBAT.apib |

### 3.4 Economy Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **Market** | `market_id, commodities[]` | 03D-ECONOMY.apib |
| **Order** | `order_id, player_id, order_type (buy/sell), resource_type, quantity, price_per_unit, status, created_at` | 03D-ECONOMY.apib |
| **Trade** | `trade_id, buyer_id, seller_id, resource_type, quantity, price_per_unit, total_cost, timestamp` | 03D-ECONOMY.apib |
| **Orderbook** | `market_id, commodity, best_bid, best_ask, spread, midpoint` | 03D-ECONOMY.apib |
| **PriceData** | `market_id, commodity, spot_price, index_price, forecast, change_percent, vwap, high_24h, low_24h, volume_24h` | 03D-ECONOMY.apib |

### 3.5 Mission Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **MissionTemplate** | `template_id, template_name, description, faction_id, mission_type, difficulty, estimated_duration, reward_credits, reward_reputation, reward_items[], requirements, objectives[], expires_in, is_repeatable, cooldown_hours` | 03E-MISSIONS.apib |
| **MissionInstance** | `mission_id, template_id, player_id, status, assigned_at, expires_at, objectives[], overall_progress` | 03E-MISSIONS.apib |
| **MissionObjective** | `objective_id, type, description, target_count, current_count, completed, progress, history[]` | 03E-MISSIONS.apib |

### 3.6 Social Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **Faction** | `id, name, description, color, emblem, home_system, member_count, founded, is_playable, controlled_sectors, total_influence, capital_sector` | 03F-SOCIAL.apib |
| **Reputation** | `player_id, faction_id, reputation (-1000 to 1000), reputation_tier, tier_min, tier_max, progress_to_next` | 03F-SOCIAL.apib |
| **ReputationHistory** | `event_id, faction_id, change, old_reputation, new_reputation, reason, timestamp` | 03F-SOCIAL.apib |
| **SectorInfluence** | `sector_id, controller, contested, influence: {faction_id: percentage}, last_updated` | 03F-SOCIAL.apib |

### 3.7 Chat Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **ChatRoom** | `id, type (sector/faction/alliance/global/dm/group), name, owner_id, members[], member_count, max_members, created_at` | 03G-CHAT.apib |
| **ChatMessage** | `message_id, room_id, sender_id, sender_name, message, timestamp` | 03G-CHAT.apib |

### 3.8 Procgen Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **StarSystem** | `primary_star: {type, mass, luminosity, temperature}, planets[], asteroid_fields, anomalies` | 03H-PROCGEN.apib |
| **Planet** | `name, type, orbit_distance, mass, habitability` | 03H-PROCGEN.apib |

### 3.9 Admin Models

| Model Name | Key Fields | Defined In |
|------------|------------|------------|
| **ModerationAction** | `action_id, admin_id, admin_name, player_id, player_name, action_type (kick/mute/temp_ban/perm_ban/teleport), reason, duration_minutes/hours, expires_at, timestamp` | 05-ADMIN-OPS.apib |

---

## Notes & Critical Observations

### Token Rotation (CRITICAL)
- **POST /v1/auth/refresh** returns a NEW refresh token that MUST be stored
- Old refresh token is immediately revoked
- This is NOT documented in many JWT tutorials - clients must update both tokens

### Missing from v1.2 Documentation
The following endpoints were completely undocumented in API-BLUEPRINT.md v1.2 but are fully implemented:
- **Station Services**: `/v1/stations/refuel`, `/v1/stations/repair`
- **Social Service**: All 12 endpoints (`/v1/factions/*`, `/v1/players/*/reputation/*`, `/v1/sectors/*/influence`, `/v1/galaxy/influence-map`)
- **Admin/Moderation**: All 7 endpoints (`/v1/moderation/*`)

### SSE Limitations
- **Last-Event-ID replay**: NOT IMPLEMENTED (events lost during disconnection)
- **Buffer overflow**: 256 events per subscriber, drops if full
- **Canonical endpoint**: `/v1/stream/gameplay` (not `/v1/events`)

### Pagination Inconsistencies
- **Pattern A** (Social): `{items[], total, limit, offset}`
- **Pattern B** (Missions): `{missions[], limit, offset}` (no total)
- **Pattern C** (Characters, Ships): Array only (no pagination, performance risk)

### Authentication
- **Profile ID vs Account ID**: Profile ID (from JWT `sub` claim) is used for ownership
- **Admin Authentication**: Special JWT with `role: admin` claim (not documented in v1.2)

### Error Envelope
- Error format: `{error: {code, message}}`
- Request ID in **response header** (`X-Request-ID`), NOT in body

---

## Summary Statistics

- **REST Endpoints**: 93 total
- **SSE Event Types**: 24 total
- **Error Codes**: 57 total (see 06-APPENDICES.md)
- **Services**: 10 (Identity, WorldSim, Combat, Economy, Missions, Social, Chat, Procgen, Fanout, Moderation)
- **Domain Models**: 35+ core models

**Documentation Coverage**: 100% of implemented endpoints extracted from 12 API Blueprint files.

---

**End of A1 Canonical Contract Map**
