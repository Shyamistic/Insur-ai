# InsurAI Full Upgrade — Implementation Tasks

## Phase 1: Critical Fixes & Core Infrastructure
- [x] 1. Fix deploy.ts syntax error (imports inside main)
- [x] 2. Fix sensors/stream/route.ts duplicate code
- [x] 3. Add mainnet chain config to contract.ts and hardhat.config.cjs
- [x] 4. Add 0G Private Computer API integration to compute.ts
- [x] 5. Add real 0G Storage SDK upload to storage.ts + decryptPolicyMetadata
- [x] 6. Add audit trail module (src/lib/0g/audit.ts)
- [x] 7. Add payout calculation pure function (src/lib/payout.ts)
- [x] 8. Add .env.local with all required keys

## Phase 2: Smart Contract Upgrades
- [x] 9. Add CryptoPortfolioShield to InsurancePolicy.sol enum
- [x] 10. Update deploy.ts for mainnet support

## Phase 3: API Route Upgrades
- [x] 11. Upgrade /api/claims/evaluate to multi-agent + audit trail
- [x] 12. Upgrade /api/policies/mint to use real 0G Storage
- [x] 13. Add /api/health endpoint
- [x] 14. Add /api/network-status endpoint
- [x] 15. Add /api/evidence/upload endpoint
- [x] 16. Add /api/sensors/trigger endpoint
- [x] 17. Fix /api/sensors/stream (deduplicate + threshold trigger)

## Phase 4: Frontend Component Upgrades
- [x] 18. Upgrade BuyPolicy.tsx (call mint API first, real CID, explorer links)
- [x] 19. Upgrade SubmitClaim.tsx (real TEE eval, multi-agent display, audit trail)
- [x] 20. Upgrade PolicyList.tsx (on-chain reads, real block height, explorer links)
- [x] 21. Upgrade ClaimHistory.tsx (on-chain reads, multi-agent display, audit trail)
- [x] 22. Upgrade InsurerDashboard.tsx (real stats, real provider count)
- [x] 23. Add 5th product (Crypto Portfolio Shield) to data.ts
- [x] 24. Add demo mode support (?demo=true)

## Phase 5: New Pages
- [x] 25. Add /demo autonomous trigger page
- [x] 26. Add /api/chat/session route (fix missing route)

## Phase 6: Testing
- [x] 27. Add property-based tests (fast-check) for claim evaluation
- [x] 28. Add property-based tests for encryption round-trip
- [x] 29. Add property-based tests for payout bounds

## Phase 7: Documentation & Polish
- [ ] 30. Upgrade README.md with architecture diagram and judging criteria mapping
