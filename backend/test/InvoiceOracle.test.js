const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InvoiceNFT Oracle verification", function () {
  it("allows only oracle to verify", async function () {
    const [deployer, alice, relayer] = await ethers.getSigners();
    const Invoice = await ethers.getContractFactory("InvoiceNFT");
    const invoice = await Invoice.deploy(deployer.address);
    await invoice.deployed();

    // mint for alice
    await invoice.connect(alice).mintInvoice(alice.address, 1000, Math.floor(Date.now()/1000)+86400, "INV-1", "uri");
    await expect(invoice.connect(alice).verifyInvoiceByOracle(1)).to.be.reverted;

    // grant oracle role to relayer
    const ORACLE_ROLE = await ethers.utils.id("ORACLE_ROLE");
    await invoice.connect(deployer).grantRole(ORACLE_ROLE, relayer.address);

    await invoice.connect(relayer).verifyInvoiceByOracle(1);
    const inv = await invoice.getInvoice(1);
    expect(inv.verified).to.equal(true);
  });
});
