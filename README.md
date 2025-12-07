# RWA Lending DApp – Full Monorepo Documentation

## 📌 Overview
The **RWA Lending DApp** is a decentralized lending platform where users tokenize invoices (as NFTs), request loans, fund loans, repay loans, and earn yield.  
This monorepo contains:

- **Smart Contracts (Hardhat)**
- **Frontend (Next.js + Tailwind)**
- **Auto ABI Sync System**
- **Deploy Scripts**
- **Dashboard with Live Stats**

---

## 🏗 Project Structure

```
rwa-lending-dapp/
│
├── backend/                 # Hardhat contracts + scripts
│   ├── contracts/           # InvoiceNFT, LoanManager, Pool, ERC20
│   ├── scripts/             # deploy.js (auto ABI + address sync)
│   ├── artifacts/           # Generated ABI + bytecode
│   ├── hardhat.config.js
│
├── frontend/                # Next.js app
│   ├── app/                 # UI pages
│   ├── lib/
│   │   ├── abis/            # Auto-synced ABIs
│   │   ├── addresses.json   # Auto-synced addresses
│   │   └── contracts.js     # Export CONTRACTS object
│   ├── components/          # Dashboard components
│
└── README.md
```

---

## ⚙️ Backend Setup (Hardhat)

### Install dependencies
```
cd backend
npm install
```

### Start local Hardhat node
```
npx hardhat node
```

### Deploy all contracts + sync ABIs & addresses
```
npx hardhat run scripts/deploy.js --network localhost
```

This script:

- Deploys **MockUSDC**
- Deploys **InvoiceNFT**
- Deploys **LoanManager**
- Deploys **Pool**
- Writes:
  - `frontend/lib/addresses.json`
  - `frontend/lib/abis/*.json`
  - `frontend/lib/contracts.js`

---

## 🌐 Frontend Setup (Next.js + Tailwind)

### Install dependencies
```
cd frontend
npm install
```

### Start development server
```
npm run dev
```

### The dashboard includes:
- Loan stats
- Funding activity
- Contribution history
- Invoice NFT creation flow
- Borrower & lender UI

---

## 🔄 Auto ABI & Address Sync

During deployment, the script:

✔ Copies ABI from  
`backend/artifacts/contracts/.../*.json`  
to  
`frontend/lib/abis/*.json`

✔ Writes deployed contract addresses into  
`frontend/lib/addresses.json`

✔ Generates a fully mapped CONTRACTS object  
`frontend/lib/contracts.js`

No manual updates required.

---

## 📝 Smart Contracts Summary

### **InvoiceNFT.sol**
- Stores invoice metadata
- Mintable verified NFTs
- Used as collateral for loans

### **LoanManager.sol**
Handles:
- Loan creation  
- Funding  
- Repayments  
- Distribution to lenders  
- Defaults  
- Cancelling requests  

Tracks:
- `loanCounter`
- Loan states: Requested → Funding → Funded → Repaid → Defaulted

### **Pool.sol**
- Aggregates liquidity
- Allows lenders to deposit / withdraw
- Interacts with LoanManager

### **MockUSDC.sol**
- ERC20 preset with minting for testing

---

## 📊 Dashboard Components (Next.js)

### **DashboardStats.jsx**
Displays:
- Total loans  
- Requested  
- Funding  
- Funded  
- Repaid  
- Defaulted  

Queries:
```
contract.loanCounter()
contract.loans(i)
```

---

## 🔥 Common Commands

### Recompile contracts
```
npx hardhat compile
```

### Redeploy quickly
```
npx hardhat run scripts/deploy.js --network localhost
```

### Hardhat console
```
npx hardhat console --network localhost
```

---

## 🧪 Testing

Add tests under:
```
backend/test/
```

Run:
```
npx hardhat test
```

---

## 🚀 Production Deployment Steps

1. Deploy contracts on testnet/mainnet  
2. Deployment script auto-generates frontend config  
3. Build frontend:
```
npm run build
```
4. Upload `.next/` output or containerize

---

## © Giteshgg
Built for RWA Lending Hackathons & Production-Grade Blockchain Applications.

