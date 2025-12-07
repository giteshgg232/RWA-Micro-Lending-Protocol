# RWA Micro-Lending Protocol - Production Monorepo

This repository contains a production-oriented monorepo for the RWA micro-lending protocol.
Folders:
- backend: Hardhat contracts, tests, deploy script
- frontend: Next.js + Tailwind v3 UI (skeleton)
- oracle-relayer: Node.js webhook relayer that calls verifyInvoiceByOracle

## Quick start (local)
1. Install backend deps
   cd backend
   npm install
2. Start Hardhat node
   npx hardhat node
3. Deploy contracts (in another shell)
   npx hardhat run scripts/deploy.js --network localhost
   Note: This script will print addresses and (if frontend/lib exists) write addresses.json + ABIs
4. Install and run frontend
   cd frontend
   npm install
   npm run dev
5. Oracle relayer
   cd oracle-relayer
   npm install
   copy ABI: backend/artifacts/contracts/InvoiceNFT.sol/InvoiceNFT.json -> oracle-relayer/abis/InvoiceNFT.json
   create .env from .env.example and run: npm start

## Notes
- Contracts are audited-style (structured, access control). Add more tests before production.
- Tailwind v3 is configured in frontend (tailwind.config.cjs + postcss).
- For production, use env-managed keys and multisig for ORACLE_ROLE.

