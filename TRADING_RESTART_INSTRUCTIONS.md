# Trading Interface Fix - Restart Required

## Issue
The trading route was not registered in the app layout.

## Fix Applied
✓ Added trading route to app/_layout.tsx
✓ Added ship-inventory route (was also missing)

## Required Steps to See Trading Interface

### Step 1: Stop Expo Server
Press `Ctrl+C` in the terminal where Expo is running

### Step 2: Clear Expo Cache
```bash
npx expo start --clear
```

OR restart on the existing port:
```bash
npm run start
```

### Step 3: Reload App
- **Web**: Refresh browser (Cmd+R / Ctrl+R)
- **Mobile**: Shake device → "Reload"
- **iOS Simulator**: Cmd+R
- **Android Emulator**: RR

## How to Access Trading

1. **Go to Dashboard** - You should see your ships
2. **Dock your ship** - Use "Ship Controls" → Dock at a station
3. **Click "Trading"** button - Should now be visible and clickable
4. **Select commodity** - Choose what to trade
5. **Place orders** - Buy or sell at your desired price

## Troubleshooting

### If "Trading" button is greyed out:
- Your ship is not docked
- Dock at a station first using Ship Controls

### If you don't see any ships:
- Create a ship using "New" button in Ships section
- Or check if you need to create a character first

### If trading screen shows "No ships available":
- Make sure you have at least one ship
- Pass `shipId` parameter or it will auto-select first ship

### If you see "Ship Not Docked":
- This is correct behavior when undocked
- Dock at a station to access trading

## Quick Test
1. Dashboard → Ships → Ship Controls → Dock
2. Dashboard → Ships → Trading ✓
3. Select commodity (e.g., "Ore")
4. View orderbook
5. Place test order
