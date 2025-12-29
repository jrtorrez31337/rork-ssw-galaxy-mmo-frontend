# SSE Streaming Fix - Frontend Integration Guide

**Date:** 2025-12-29
**Status:** Resolved
**Affects:** `/v1/stream/gameplay` endpoint

---

## Issue Summary

The frontend team reported repeated SSE connection failures with the following error:

```json
{
  "message": "Streaming not supported",
  "type": "error",
  "xhrState": 3,
  "xhrStatus": 500
}
```

This was a **backend issue**, not a frontend bug. The root cause has been identified and fixed.

---

## Root Cause

The backend middleware (metrics and tracing) wrapped the HTTP response writer without implementing the `http.Flusher` interface required for SSE streaming. When the SSE handler checked for streaming support, the type assertion failed, returning HTTP 500.

**Technical Details:**
- Location: `pkg/metrics/middleware.go` and `pkg/tracing/middleware.go`
- Issue: Response writer wrappers missing `Flush()` method
- Impact: All SSE connections through gateway or fanout service failed

---

## Resolution

Added `Flush()` method implementations to both middleware response writers. The fix has been deployed and verified with 21 passing tests.

---

## SSE Endpoint Integration Guide

### Endpoint

```
GET /v1/stream/gameplay?channels=<channel-list>
```

### Required Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-Player-ID` | Yes | Player's unique identifier |
| `X-Session-ID` | No | Current session ID (optional) |
| `Accept` | Recommended | Should be `text/event-stream` |

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `channels` | No | Comma-separated list of channels to subscribe to |

### Example Connection

```javascript
const eventSource = new EventSource(
  '/v1/stream/gameplay?channels=sector.alpha-centauri,market.updates',
  {
    headers: {
      'X-Player-ID': playerId
    }
  }
);

// Note: EventSource doesn't support custom headers natively.
// Use a polyfill like 'eventsource' npm package or pass player ID via query param
// if your implementation requires it.
```

### Alternative with Fetch API

```javascript
async function connectSSE(playerId, channels) {
  const url = `/v1/stream/gameplay?channels=${channels.join(',')}`;

  const response = await fetch(url, {
    headers: {
      'X-Player-ID': playerId,
      'Accept': 'text/event-stream'
    }
  });

  if (!response.ok) {
    throw new Error(`SSE connection failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    // Parse SSE events from text
    parseSSEEvents(text);
  }
}
```

---

## Event Format

All events follow standard SSE format:

```
id: <uuid>
event: <event-type>
data: <json-payload>

```

### Initial Connection Event

Upon successful connection, you'll receive:

```
id: 550e8400-e29b-41d4-a716-446655440000
event: connected
data: {"subscriber_id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}

```

**Important:** Store the `subscriber_id` for dynamic channel subscription.

### Heartbeat Events

Sent every 30 seconds to keep the connection alive:

```
id: <uuid>
event: heartbeat
data: {"time":1703836800}

```

### Game Events

```
id: <uuid>
event: ship.moved
data: {"ship_id":"...","sector":"alpha-centauri","position":{"x":100,"y":200}}

```

---

## Channel Subscription

### Available Channel Patterns

| Pattern | Description |
|---------|-------------|
| `player.<player-id>` | Player-specific events (auto-subscribed) |
| `sector.<sector-name>` | Sector activity events |
| `market.<market-id>` | Market price updates |
| `combat.<instance-id>` | Combat instance events |
| `chat.<channel-name>` | Chat messages |

### Dynamic Subscription

After connecting, you can add/remove channels:

**Subscribe:**
```javascript
await fetch('/v1/stream/gameplay/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriber_id: subscriberId,
    channels: ['sector.sol', 'market.station-alpha']
  })
});
```

**Unsubscribe:**
```javascript
await fetch('/v1/stream/gameplay/unsubscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscriber_id: subscriberId,
    channels: ['sector.sol']
  })
});
```

---

## Response Headers

Successful SSE connections return these headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Type` | `text/event-stream` | SSE content type |
| `Cache-Control` | `no-cache` | Prevent caching |
| `Connection` | `keep-alive` | Persistent connection |
| `X-Accel-Buffering` | `no` | Disable nginx buffering |

---

## Error Handling

### Connection Errors

| Status | Error | Cause | Action |
|--------|-------|-------|--------|
| 500 | `Streaming not supported` | **FIXED** - Was middleware issue | Upgrade backend |
| 503 | `SSE service unavailable` | Fanout service down | Retry with backoff |
| 401 | `Unauthorized` | Missing/invalid auth | Re-authenticate |

### Reconnection Strategy

```javascript
class SSEManager {
  constructor(playerId) {
    this.playerId = playerId;
    this.maxRetries = 5;
    this.retryCount = 0;
    this.baseDelay = 1000;
  }

  connect() {
    const url = `/v1/stream/gameplay?channels=player.${this.playerId}`;

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('[SSE] Connected');
      this.retryCount = 0; // Reset on successful connection
    };

    this.eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      this.eventSource.close();
      this.scheduleReconnect();
    };

    this.eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      this.subscriberId = data.subscriber_id;
    });
  }

  scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      console.error('[SSE] Max reconnection attempts reached');
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.retryCount);
    this.retryCount++;

    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.retryCount})`);
    setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}
```

---

## Debugging

### Check Connection Status

```javascript
// EventSource readyState values:
// 0 = CONNECTING
// 1 = OPEN
// 2 = CLOSED

console.log('SSE State:', eventSource.readyState);
```

### Stats Endpoint

Check server-side SSE statistics:

```bash
curl http://localhost:8080/v1/stream/gameplay/stats
```

Response:
```json
{
  "data": {
    "active_subscribers": 42,
    "total_events_sent": 15230,
    "channels": ["sector.sol", "market.station-alpha", ...]
  }
}
```

### Test Script

A test script is available to verify SSE functionality:

```bash
./scripts/test/test-sse-streaming.sh --quick
```

---

## Migration Notes

### If Using Polyfills

If you were using workarounds for the streaming issue, you can now remove them:

```javascript
// REMOVE: Polling fallback
// REMOVE: WebSocket alternative for SSE
// REMOVE: Manual reconnection with shorter intervals

// The native SSE endpoint now works correctly
```

### Browser Compatibility

SSE is supported in all modern browsers. For older browsers, consider:
- [eventsource polyfill](https://github.com/EventSource/eventsource)
- [event-source-polyfill](https://github.com/AlessandroLovo/event-source-polyfill) (supports headers)

---

## Support

If you encounter any issues with the SSE endpoint:

1. Check the browser console for connection errors
2. Verify the `X-Player-ID` header is being sent
3. Run the test script to verify backend health
4. Check backend logs: `tail -f logs/fanout.log`

**Backend Contact:** Check service health at `/health` and `/ready` endpoints.

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-29 | Fixed "Streaming not supported" error by implementing `http.Flusher` interface in middleware |
| 2025-12-29 | Added comprehensive SSE endpoint tests |
| 2025-12-29 | Created this integration guide |
