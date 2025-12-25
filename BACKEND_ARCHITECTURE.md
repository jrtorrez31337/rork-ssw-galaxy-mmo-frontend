# Backend Architecture & URL Configuration

## Complete Architecture Map

Your backend uses a **microservices architecture with an API Gateway** pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React Native)                                        │
│  http://192.168.122.76:8080/v1/*                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  API GATEWAY (Port 8080)                                        │
│  - Routing                                                      │
│  - Rate Limiting                                                │
│  - Request Logging                                              │
│  - JWT Validation                                               │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
┌────────┐┌─────────┐┌────────┐┌─────────┐┌────────┐
│Identity││WorldSim ││Economy ││ Social  ││  Chat  │
│  :8081 ││  :8082  ││  :8084 ││  :8085  ││  :8087 │
└────────┘└─────────┘└────────┘└─────────┘└────────┘
                               │
                               └─ Reputation System
```

## Service Port Mapping

### External (Public) Ports
```
Gateway: 192.168.122.76:8080  ← Your frontend connects here
```

### Internal (Backend) Ports
```
Identity Service:  localhost:8081  (Auth, Characters, Ships)
WorldSim Service:  localhost:8082  (Sectors, Inventory, Actions)
Combat Service:    localhost:8083  (Combat mechanics)
Economy Service:   localhost:8084  (Markets, Trading)
Social Service:    localhost:8085  (Factions, Reputation) ← Reputation lives here
SSE Fanout:        localhost:8086  (Real-time events)
Chat Service:      localhost:8087  (Chat messages)
ProcGen Service:   localhost:8088  (Procedural generation)
Moderation:        localhost:8089  (Content moderation)
```

## Gateway Routing Rules

The gateway routes requests based on path prefixes:

| Path Pattern | Routed To | Service Port |
|--------------|-----------|--------------|
| `/v1/auth/*` | Identity | 8081 |
| `/v1/characters/*` | Identity | 8081 |
| `/v1/ships/*` | Identity | 8081 |
| `/v1/inventory/*` | WorldSim | 8082 |
| `/v1/sectors/*` | WorldSim | 8082 |
| `/v1/actions/*` | WorldSim | 8082 |
| `/v1/markets/*` | Economy | 8084 |
| `/v1/orders/*` | Economy | 8084 |
| `/v1/combat/*` | Combat | 8083 |
| `/v1/factions/*` | Social | 8085 |
| **`/v1/players/*`** | **Social** | **8085** ← **Reputation endpoints** |
| `/v1/chat/*` | Chat | 8087 |
| `/v1/stream/gameplay` | SSE Fanout | 8086 |

## Reputation Endpoint Flow

When your frontend calls:
```typescript
await reputationApi.getAllReputations(playerId);
```

**Complete Request Flow:**

1. **Frontend makes request:**
   ```
   GET http://192.168.122.76:8080/v1/players/{player_id}/reputation
   Headers: Authorization: Bearer {jwt_token}
   ```

2. **Gateway receives and processes:**
   ```
   ┌─ Gateway :8080
   │  ├─ Validates JWT token
   │  ├─ Applies rate limiting
   │  ├─ Matches path: /v1/players/* → social service
   │  └─ Strips /v1 prefix
   ```

3. **Gateway forwards to Social Service:**
   ```
   GET http://localhost:8085/players/{player_id}/reputation
   Headers:
     Authorization: Bearer {jwt_token}
     X-Forwarded-Host: 192.168.122.76:8080
     X-Origin-Service: gateway
   ```

4. **Social Service responds:**
   ```json
   {
     "data": {
       "player_id": "uuid",
       "reputations": [...]
     }
   }
   ```

5. **Gateway returns to frontend** (unchanged)

## Why Port 8085 vs Documentation's Port 8005?

The documentation says "Service: Social (Port 8005)" but your actual config uses **8085**. Here's why:

### Documentation Standard Ports:
```
Gateway:    8000
Identity:   8001
WorldSim:   8002
Combat:     8003
Economy:    8004
Social:     8005 ← Documentation says this
Fanout:     8006
Chat:       8007
ProcGen:    8008
Moderation: 8009
```

### Your Actual Ports (Development Mode):
```
Gateway:    8080 ← Changed for dev convenience
Identity:   8081
WorldSim:   8082
Combat:     8083
Economy:    8084
Social:     8085 ← Actual port
Fanout:     8086
Chat:       8087
ProcGen:    8088
Moderation: 8089
```

**Reason:** Your `services/gateway/config/config.yaml` uses a **+80 offset** for all ports in development mode, likely to avoid conflicts with other services or because ports below 1024 require root privileges on Linux.

## Frontend Configuration - What You Have vs What You Need

### ✅ Current Config (CORRECT)
```typescript
// constants/config.ts
const getApiBaseUrl = () => {
  return 'http://192.168.122.76:8080/v1';
};
```

**This is correct!** You connect to the gateway at port 8080, and it handles routing to the appropriate service.

### ❌ What NOT to Do
```typescript
// DON'T DO THIS - Service ports are internal only
const config = {
  SOCIAL_SERVICE_URL: 'http://192.168.122.76:8085/v1', // Won't work!
};
```

Port 8085 is **localhost only** and not accessible from your mobile device/emulator.

## Testing Your Reputation Endpoints

### 1. Verify Gateway is Running
```bash
curl http://192.168.122.76:8080/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Get a Valid JWT Token
Login through your app or use curl:
```bash
curl -X POST http://192.168.122.76:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Save the `access_token` from the response.

### 3. Test Reputation Endpoint
```bash
TOKEN="your_access_token_here"
PLAYER_ID="your_player_id_here"

# Get all reputations
curl http://192.168.122.76:8080/v1/players/${PLAYER_ID}/reputation \
  -H "Authorization: Bearer ${TOKEN}"

# Get reputation tiers
curl http://192.168.122.76:8080/v1/reputation/tiers \
  -H "Authorization: Bearer ${TOKEN}"
```

## SSE (Server-Sent Events) Configuration

For real-time reputation updates, the SSE endpoint would be:

```typescript
const eventSource = new EventSource(
  'http://192.168.122.76:8080/v1/stream/gameplay?channels=social.reputation.tier_change',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);
```

**Note:** This routes through gateway port 8080 to SSE Fanout service on port 8086.

## Common Issues & Solutions

### Issue 1: "404 Not Found" on Reputation Endpoints

**Possible causes:**
1. Social service isn't running
2. Gateway routing not configured
3. Wrong path format

**Check:**
```bash
# Verify social service is running
curl http://localhost:8085/health  # From backend server

# Check gateway logs
tail -f ../ssw/logs/gateway.log

# Verify routing in gateway config
grep -A5 "players" ../ssw/services/gateway/cmd/main.go
```

### Issue 2: "401 Unauthorized"

**Cause:** Missing or invalid JWT token

**Solution:** Ensure your API client includes the Authorization header (already handled by `apiClient.ts`).

### Issue 3: "Service Unavailable"

**Cause:** Social service is down or can't be reached

**Check:**
```bash
# From backend server
ps aux | grep social  # Check if service is running
curl http://localhost:8085/health  # Direct health check
```

### Issue 4: CORS Errors (If testing from browser)

**Cause:** Frontend origin not allowed

**Solution:** The gateway should be configured to allow your frontend origin. Check `gateway/config/config.yaml` for CORS settings.

## Network Configuration Notes

### Your Current Setup:
- Backend IP: `192.168.122.76`
- This appears to be a VM or container IP
- Gateway exposed on port 8080
- All other services are localhost-only

### For Production:
1. Gateway should be behind HTTPS/TLS
2. Use environment-based configuration
3. Consider service mesh for service-to-service communication
4. Implement proper CORS policies
5. Add rate limiting per user, not just per IP

## Summary

**Question: Do I need to change my frontend config to use port 8005?**

**Answer: NO! Your current config is correct.**

✅ **Keep using:** `http://192.168.122.76:8080/v1`

The documentation mentioning port 8005 refers to the **internal** Social Service port, which is actually port 8085 in your development environment. Your frontend should **always** connect to the Gateway (port 8080), never directly to backend services.

The gateway handles:
- Routing requests to the correct service
- Authentication validation
- Rate limiting
- Logging and monitoring
- Load balancing (in production)

Your reputation integration will work as-is once the Social Service is running and has reputation data!
