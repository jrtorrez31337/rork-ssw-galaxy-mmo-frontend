# Frontend Implementation Checklist - Inventory System

Quick reference checklist for implementing the inventory system frontend.

---

## Pre-Implementation

- [ ] Read `FRONTEND_IMPLEMENTATION_GUIDE.md`
- [ ] Review `frontend_update_prompt.md` for code samples
- [ ] Verify backend services are running (`http://localhost:8080/health`)
- [ ] Create feature branch: `git checkout -b feature/inventory-ui`
- [ ] Confirm you have a test ship with ID for testing

---

## Step 1: API Layer (30 min)

### File: `src/api/inventory.ts`

- [ ] Import `apiClient` from `./client`
- [ ] Define TypeScript types:
  - [ ] `OwnerType`
  - [ ] `ResourceType`
  - [ ] `ResourceRarity`
  - [ ] `InventoryItem` interface
  - [ ] `Inventory` interface
  - [ ] `TransferRequest` interface
  - [ ] `TransferResponse` interface
- [ ] Create `inventoryApi` object with:
  - [ ] `getInventory()` method
  - [ ] `transfer()` method
- [ ] Test API calls with curl or Postman

---

## Step 2: Constants (15 min)

### File: `src/constants/resources.ts`

- [ ] Import types from `../api/inventory`
- [ ] Define `ResourceMetadata` interface
- [ ] Create `RESOURCE_METADATA` object with all 12 resources:
  - [ ] Tier 1: iron_ore, ice_water, silicates, hydrogen, carbon
  - [ ] Tier 2: titanium_ore, platinum, rare_earth, xenon_gas
  - [ ] Tier 3: antimatter, exotic_crystals, ancient_artifacts
- [ ] Define `RARITY_COLORS` object
- [ ] Verify all colors are accessible (contrast ratio)

---

## Step 3: Components (2 hours)

### Component A: `src/components/inventory/ResourceItem.tsx`

- [ ] Import dependencies (React, types, constants)
- [ ] Define `ResourceItemProps` interface
- [ ] Create functional component
- [ ] Render resource icon with color
- [ ] Display resource name and description
- [ ] Show quantity and rarity
- [ ] Implement quality bar (conditional on quality !== 1.0)
- [ ] Add volume display
- [ ] Handle click event
- [ ] Apply selected styling
- [ ] Create CSS file with styles
- [ ] Test component in isolation

### Component B: `src/components/inventory/CargoCapacityBar.tsx`

- [ ] Define `CargoCapacityBarProps` interface
- [ ] Create functional component
- [ ] Calculate percentage
- [ ] Implement warning state (>= 80%)
- [ ] Implement full state (>= 100%)
- [ ] Render header with stats
- [ ] Render progress bar
- [ ] Create CSS file with animations
- [ ] Test with various capacity values

### Component C: `src/components/inventory/TransferModal.tsx`

- [ ] Import dependencies (React, React Query, types)
- [ ] Define `TransferModalProps` interface
- [ ] Create functional component
- [ ] Initialize state (targetId, targetType, quantity)
- [ ] Set up transfer mutation with React Query
- [ ] Implement form validation
- [ ] Handle form submission
- [ ] Render modal overlay
- [ ] Render modal content with close button
- [ ] Display resource info
- [ ] Create form fields:
  - [ ] Target type selector
  - [ ] Target ID input
  - [ ] Quantity input
  - [ ] Quantity slider
- [ ] Show error messages
- [ ] Show loading state
- [ ] Handle modal close
- [ ] Create CSS file with animations
- [ ] Test all form validations
- [ ] Test error scenarios

---

## Step 4: Inventory Page (1.5 hours)

### File: `src/pages/ShipInventoryPage.tsx`

- [ ] Import all dependencies
- [ ] Get shipId from URL params
- [ ] Set up ship query with React Query
- [ ] Set up inventory query with React Query
- [ ] Initialize selected item state
- [ ] Initialize transfer modal state
- [ ] Implement item click handler
- [ ] Implement transfer button handler
- [ ] Render page header with back button
- [ ] Render ship title with type badge
- [ ] Render cargo capacity bar
- [ ] Handle empty state
- [ ] Render resource grid
- [ ] Render inventory actions (when item selected)
- [ ] Render ship details card
- [ ] Conditionally render transfer modal
- [ ] Create CSS file with responsive layout
- [ ] Test loading states
- [ ] Test empty inventory
- [ ] Test with multiple resources
- [ ] Test resource selection
- [ ] Test transfer modal opening

---

## Step 5: Integration (30 min)

### Update: `src/pages/DashboardPage.tsx`

- [ ] Add "View Inventory" button to ship card template
- [ ] Use `navigate()` to route to `/ship/${ship.id}/inventory`
- [ ] Add styling for new button
- [ ] Test navigation from dashboard

### Update: `src/router.tsx`

- [ ] Import `ShipInventoryPage`
- [ ] Add route: `/ship/:shipId/inventory`
- [ ] Wrap with `ProtectedRoute`
- [ ] Test route navigation

### Update: `src/api/ships.ts`

- [ ] Add `current_cargo_used?: number` to `Ship` interface
- [ ] Verify TypeScript compilation

---

## Step 6: Testing (1 hour)

### Component Testing
- [ ] ResourceItem displays all resource types correctly
- [ ] ResourceItem shows quality bar for non-1.0 quality
- [ ] ResourceItem handles selection state
- [ ] CargoCapacityBar shows correct percentage
- [ ] CargoCapacityBar warning state at 80%
- [ ] CargoCapacityBar full state at 100%
- [ ] TransferModal validates all inputs
- [ ] TransferModal shows errors
- [ ] TransferModal disables submit when invalid

### Page Testing
- [ ] Inventory page loads with valid ship ID
- [ ] Loading state displays correctly
- [ ] Empty state shows when no items
- [ ] Resources display in grid
- [ ] Cargo bar shows correct usage
- [ ] Ship details sidebar shows data
- [ ] Back button returns to dashboard

### Integration Testing
- [ ] Create ship through normal flow
- [ ] Navigate to inventory from dashboard
- [ ] Select resource
- [ ] Open transfer modal
- [ ] Enter valid transfer details
- [ ] Submit transfer (will fail without target, expected)
- [ ] Check error handling
- [ ] Verify React Query cache invalidation

### Edge Cases
- [ ] Invalid ship ID shows error
- [ ] Network error handling
- [ ] Very long resource names
- [ ] Cargo at exactly 100%
- [ ] Quality at minimum (0.50)
- [ ] Quality at maximum (2.00)
- [ ] Large quantities (999+)

### Visual/UX
- [ ] Colors match resource tiers
- [ ] Icons display correctly
- [ ] Animations smooth
- [ ] Responsive on various screen sizes
- [ ] Hover effects work
- [ ] Focus states for accessibility
- [ ] Modal backdrop blur works
- [ ] Loading spinners visible

---

## Step 7: Polish (1 hour)

### Code Quality
- [ ] Remove console.logs
- [ ] Add TypeScript types to all props
- [ ] Fix any TypeScript errors
- [ ] Format code consistently
- [ ] Add comments for complex logic
- [ ] Remove unused imports

### Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on tab navigation
- [ ] ARIA labels where needed
- [ ] Color contrast meets WCAG AA
- [ ] Error messages descriptive

### Performance
- [ ] React Query caching configured
- [ ] No unnecessary re-renders
- [ ] Images/icons optimized
- [ ] CSS animations performant

### Documentation
- [ ] Add JSDoc comments to components
- [ ] Update component README if exists
- [ ] Document any workarounds or TODOs

---

## Step 8: Review & Deploy

- [ ] Run `npm run build` successfully
- [ ] Fix any build warnings
- [ ] Test production build locally
- [ ] Self code review (diff check)
- [ ] Commit with descriptive message
- [ ] Push feature branch
- [ ] Create pull request
- [ ] Request code review
- [ ] Address review comments
- [ ] Merge to main
- [ ] Verify in staging environment
- [ ] Deploy to production

---

## Common Issues & Solutions

### Issue: API returns 401 Unauthorized
**Solution**: Check that JWT token is valid and not expired

### Issue: Inventory returns empty array
**Solution**: Verify ship exists and has inventory in database

### Issue: Transfer fails with CARGO_FULL
**Solution**: Expected behavior - verify target ship has space

### Issue: Colors not showing
**Solution**: Check that resource_type matches exactly (case-sensitive)

### Issue: Quality bar not appearing
**Solution**: Quality must be !== 1.0 to show bar

### Issue: Modal not closing
**Solution**: Ensure onClick on overlay calls onClose prop

### Issue: React Query not refetching
**Solution**: Check queryKey and invalidateQueries call

---

## File Checklist

New Files:
- [ ] `src/api/inventory.ts`
- [ ] `src/constants/resources.ts`
- [ ] `src/components/inventory/ResourceItem.tsx`
- [ ] `src/components/inventory/ResourceItem.css`
- [ ] `src/components/inventory/CargoCapacityBar.tsx`
- [ ] `src/components/inventory/CargoCapacityBar.css`
- [ ] `src/components/inventory/TransferModal.tsx`
- [ ] `src/components/inventory/TransferModal.css`
- [ ] `src/pages/ShipInventoryPage.tsx`
- [ ] `src/pages/ShipInventoryPage.css`

Modified Files:
- [ ] `src/pages/DashboardPage.tsx`
- [ ] `src/router.tsx`
- [ ] `src/api/ships.ts`

---

## Estimated Time Breakdown

- [ ] API Layer: 30 min
- [ ] Constants: 15 min
- [ ] ResourceItem: 45 min
- [ ] CargoCapacityBar: 30 min
- [ ] TransferModal: 45 min
- [ ] Inventory Page: 90 min
- [ ] Integration: 30 min
- [ ] Testing: 60 min
- [ ] Polish: 60 min

**Total**: ~6.5 hours

---

## Success Metrics

### Functionality
- ✅ Inventory displays correctly for any ship
- ✅ Resources show accurate data (quantity, quality)
- ✅ Cargo capacity visually clear
- ✅ Transfer modal validates inputs
- ✅ Error handling covers all cases
- ✅ Navigation flows smoothly

### Code Quality
- ✅ TypeScript strict mode passes
- ✅ No console errors
- ✅ No memory leaks
- ✅ Code follows project conventions
- ✅ Components reusable

### User Experience
- ✅ Interface intuitive
- ✅ Loading states clear
- ✅ Error messages helpful
- ✅ Visual feedback immediate
- ✅ Design consistent with app

---

**Status**: Ready to implement
**Start**: [ ] Date: ___________
**Complete**: [ ] Date: ___________

---

## Quick Commands

```bash
# Start frontend dev server
cd /home/jon/code/ssw-fe-genspark
npm run dev

# Start backend services
cd /home/jon/code/ssw
make start

# Check backend health
curl http://localhost:8080/health

# Test inventory endpoint
curl "http://localhost:8080/v1/inventory/{ship-id}?owner_type=ship" \
  -H "Authorization: Bearer {token}"

# Build frontend
npm run build

# Run linter
npm run lint
```

---

*Use this checklist to track progress as you implement each step*
