#!/bin/bash
# Clear all React Native / Expo caches
# Usage: ./clear-cache.sh [--deep]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Clearing app caches...${NC}"

# Clear Expo cache
echo -e "${GREEN}[1/5]${NC} Clearing Expo cache..."
rm -rf .expo
npx expo start --clear --offline &
EXPO_PID=$!
sleep 2
kill $EXPO_PID 2>/dev/null || true

# Clear Metro bundler cache
echo -e "${GREEN}[2/5]${NC} Clearing Metro cache..."
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-* 2>/dev/null || rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-map-* 2>/dev/null || rm -rf /tmp/haste-map-* 2>/dev/null || true

# Clear React Native cache
echo -e "${GREEN}[3/5]${NC} Clearing React Native cache..."
rm -rf $TMPDIR/react-* 2>/dev/null || rm -rf /tmp/react-* 2>/dev/null || true

# Clear Watchman (if installed)
echo -e "${GREEN}[4/5]${NC} Clearing Watchman cache..."
if command -v watchman &> /dev/null; then
    watchman watch-del-all 2>/dev/null || true
fi

# Deep clean (optional)
if [ "$1" == "--deep" ]; then
    echo -e "${YELLOW}[5/5] Deep clean: Reinstalling node_modules...${NC}"
    rm -rf node_modules
    rm -rf bun.lock package-lock.json yarn.lock 2>/dev/null || true

    # Detect package manager and reinstall
    if command -v bun &> /dev/null; then
        bun install
    elif [ -f "yarn.lock" ] || command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
else
    echo -e "${GREEN}[5/5]${NC} Skipping node_modules (use --deep to reinstall)"
fi

echo ""
echo -e "${GREEN}Cache cleared successfully!${NC}"
echo -e "Run ${YELLOW}npx expo start --clear${NC} to start fresh."
