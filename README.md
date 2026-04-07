# Supply Chain Tracker dApp

An immutable, role-based supply chain tracker built for maximum transparency and zero fraud. Track agricultural products, dairy, or high-value goods (like jewelry) from origin to consumer.

## Tech Stack
- **Smart Contracts**: Solidity, Hardhat
- **Frontend**: React (TypeScript), Vite, Ethers.js
- **Design**: Premium Vanilla CSS (Glassmorphism, Dark Mode)
- **Role Based Access**: Farmer (Minter), Transporter, Retailer, Consumer

## Quick Start Local Demo

### 1. Start Local Blockchain
Open a terminal and run:
```bash
cd contracts
npx hardhat node
```

### 2. Deploy Smart Contract
Open a *new* terminal window and run:
```bash
cd contracts
npm run deploy:local
```
> Note the deployed contract address. It should be `0x5FbDB2315678afecb367f032d93F642f64180aa3`. If it's different, update `CONTRACT_ADDRESS` in `frontend/src/types.ts`.

### 3. Run Frontend
Open another terminal and run:
```bash
cd frontend
npm run dev
```

### 4. Connect MetaMask
1. Open your browser to `http://localhost:5173`
2. Add the Hardhat local network to MetaMask (`http://127.0.0.1:8545`, Chain ID `31337`).
3. Import one of the private keys provided by the Hardhat node terminal to have an account with ETH.

## Demo Flow
1. **Farmer Role**: Register as a Farmer, create a new product (e.g. "Arabica Beans Batch #1"), and get the generated QR code ID.
2. **Transfer**: The farmer transfers ownership to a Transporter address.
3. **Transporter Role**: Switch MetaMask account to the transporter, register the role, scan the ID, and update status to "In Transit".
4. **Consumer Role**: Use the Verification tab, type in the ID, and see the full tamper-proof origin timeline!
