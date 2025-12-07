const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // ================= Deploy Contracts ==================
  const ERC20 = await ethers.getContractFactory("ERC20PresetMinterPauser");
  const usdc = await ERC20.deploy("MockUSDC", "mUSDC");
  await usdc.deployed();

  const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
  const invoice = await InvoiceNFT.deploy(deployer.address);
  await invoice.deployed();

  const LoanManager = await ethers.getContractFactory("LoanManager");
  const loanManager = await LoanManager.deploy(
    invoice.address,
    usdc.address,
    deployer.address,
    deployer.address,
    50
  );
  await loanManager.deployed();

  const Pool = await ethers.getContractFactory("Pool");
  const pool = await Pool.deploy(usdc.address, loanManager.address, deployer.address);
  await pool.deployed();

  // ================= Print addresses ==================
  console.log("\n=== DEPLOYED ADDRESSES ===");
  console.log("MockUSDC:", usdc.address);
  console.log("InvoiceNFT:", invoice.address);
  console.log("LoanManager:", loanManager.address);
  console.log("Pool:", pool.address);
  console.log("==========================\n");

  // ================= Write frontend configs ==================
  const frontendDir = path.join(__dirname, "../../frontend/lib");
  const abisDir = path.join(frontendDir, "abis");

  if (!fs.existsSync(frontendDir)) {
    console.log("Frontend folder missing:", frontendDir);
    return;
  }

  console.log("✔ Frontend folder detected:", frontendDir);

  fs.writeFileSync(
    path.join(frontendDir, "addresses.json"),
    JSON.stringify(
      {
        invoiceNFT: invoice.address,
        loanManager: loanManager.address,
        pool: pool.address,
        stablecoin: usdc.address,
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log("✔ Saved addresses.json");


  const abiSources = {
    InvoiceNFT: "contracts/InvoiceNFT.sol/InvoiceNFT.json",
    LoanManager: "contracts/LoanManager.sol/LoanManager.json",
    Pool: "contracts/Pool.sol/Pool.json",
    ERC20: "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol/ERC20PresetMinterPauser.json",
  };

  for (const [name, localPath] of Object.entries(abiSources)) {
    const src = path.join(__dirname, "../artifacts", localPath);
    const dest = path.join(abisDir, `${name}.json`);

    try {
      fs.copyFileSync(src, dest);
      console.log(`Copied ABI → ${name}.json`);
    } catch (err) {
      console.log(`Failed copying ${name}.json →`, err.message);
    }
  }

  console.log("Deployment completed successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
