
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('LoanManager fractional flow', function() {
  let deployer, borrower, lender1, lender2;
  let usdc, invoice, loanManager;

  beforeEach(async function() {
    [deployer, borrower, lender1, lender2] = await ethers.getSigners();
    const ERC20 = await ethers.getContractFactory('ERC20PresetMinterPauser');
    usdc = await ERC20.deploy('MockUSDC', 'mUSDC');
    await usdc.deployed();

    const Invoice = await ethers.getContractFactory('InvoiceNFT');
    invoice = await Invoice.deploy(deployer.address);
    await invoice.deployed();

    const LoanManager = await ethers.getContractFactory('LoanManager');
    loanManager = await LoanManager.deploy(invoice.address, usdc.address, deployer.address, deployer.address, 50);
    await loanManager.deployed();

    // give lender funds
    await usdc.mint(lender1.address, ethers.utils.parseUnits('5000', 6));
    await usdc.mint(lender2.address, ethers.utils.parseUnits('5000', 6));
  });

  it('mint -> verify -> request -> fractional fund -> repay', async function() {
    // borrower mints invoice
    const amount = ethers.utils.parseUnits('1000', 6);
    const now = (await ethers.provider.getBlock()).timestamp;
    const due = now + 14 * 24 * 3600;
    await invoice.connect(borrower).mintInvoice(borrower.address, amount, due, 'INV-1', 'ipfs://Qm');
    await invoice.connect(deployer).addAttestor(deployer.address);
    await invoice.connect(deployer).verifyInvoice(1);

    await loanManager.connect(borrower).requestLoan(1, ethers.utils.parseUnits('700',6), 500, 14);

    // lender1 funds 400
    await usdc.connect(lender1).approve(loanManager.address, ethers.utils.parseUnits('400',6));
    await loanManager.connect(lender1).fundPartial(1, ethers.utils.parseUnits('400',6));

    // lender2 funds 300
    await usdc.connect(lender2).approve(loanManager.address, ethers.utils.parseUnits('300',6));
    await loanManager.connect(lender2).fundPartial(1, ethers.utils.parseUnits('300',6));

    // simulate repay by payer (deployer)
    const totalDue = ethers.utils.parseUnits('700',6).add(ethers.utils.parseUnits('700',6).mul(500).div(10000));
    await usdc.mint(deployer.address, totalDue);
    await usdc.connect(deployer).approve(loanManager.address, totalDue);
    await loanManager.connect(deployer).repayLoan(1);

    // check loan state
    const loan = await loanManager.loans(1);
    expect(loan.state).to.equal(3); // Repaid
  });
});
