const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts with:", deployer.address);

  // -------------------------------
  // 1. Deploy Mock USDC (ERC20)
  // -------------------------------
  const ERC20 = await hre.ethers.getContractFactory("ERC20PresetMinterPauser");
  const usdc = await ERC20.deploy("MockUSDC", "mUSDC");
  await usdc.deployed();
  console.log("✔ MockUSDC deployed at:", usdc.address);

  // -------------------------------
  // 2. Deploy InvoiceNFT
  // -------------------------------
  const InvoiceNFT = await hre.ethers.getContractFactory("InvoiceNFT");
  const invoice = await InvoiceNFT.deploy(deployer.address);
  await invoice.deployed();
  console.log("✔ InvoiceNFT deployed at:", invoice.address);

  // -------------------------------
  // 3. Deploy LoanManager (50 bps fee)
  // -------------------------------
  const LoanManager = await hre.ethers.getContractFactory("LoanManager");
  const loanManager = await LoanManager.deploy(
    invoice.address,
    usdc.address,
    deployer.address,  // fee receiver
    deployer.address,  // treasury
    50                 // fee: 50 = 0.5%
  );
  await loanManager.deployed();
  console.log("✔ LoanManager deployed at:", loanManager.address);

  // -------------------------------
  // 4. Deploy Pool
  // -------------------------------
  const Pool = await hre.ethers.getContractFactory("Pool");
  const pool = await Pool.deploy(
    usdc.address,
    loanManager.address,
    deployer.address
  );
  await pool.deployed();
  console.log("✔ Pool deployed at:", pool.address);

  // -------------------------------
  // 5. Sync contract addresses to frontend
  // -------------------------------
  const addressesPath = path.join(__dirname, "../../frontend/lib/addresses.json");

  const addresses = {
    invoiceNFT: invoice.address,
    loanManager: loanManager.address,
    pool: pool.address,
    stablecoin: usdc.address,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("📁 Saved frontend/lib/addresses.json");

  // -------------------------------
  // 6. Copy ABIs to frontend/lib/abis/
  // -------------------------------
  const abiDir = path.join(__dirname, "../../frontend/lib/abis");
  if (!fs.existsSync(abiDir)) fs.mkdirSync(abiDir, { recursive: true });

  const artifacts = [
    { name: "InvoiceNFT", file: "InvoiceNFT.sol/InvoiceNFT.json" },
    { name: "LoanManager", file: "LoanManager.sol/LoanManager.json" },
    { name: "Pool", file: "Pool.sol/Pool.json" },
    { name: "ERC20", file: "MockUSDC.sol/MockUSDC.json" }
  ];

  for (const a of artifacts) {
    const source = path.join(__dirname, `../artifacts/contracts/${a.file}`);
    const dest = path.join(abiDir, `${a.name}.json`);
    fs.copyFileSync(source, dest);
    console.log(`✔ Copied ABI: ${a.name}`);
  }

  console.log("\n🎉 Deployment & ABI sync complete!");
  console.log("Frontend is ready to use new contracts.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
