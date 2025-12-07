const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const RPC = process.env.RPC || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const INVOICE_NFT_ADDRESS = process.env.INVOICE_NFT_ADDRESS;
const ABI_PATH = process.env.INVOICE_NFT_ABI_PATH || './abis/InvoiceNFT.json';

if (!PRIVATE_KEY || !INVOICE_NFT_ADDRESS) {
  console.error("Set RELAYER_PRIVATE_KEY and INVOICE_NFT_ADDRESS in .env");
}

const provider = new ethers.providers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY || ethers.constants.AddressZero, provider);

let abi = [];
try { abi = JSON.parse(fs.readFileSync(ABI_PATH)).abi; } catch(e){}

const invoiceContract = new ethers.Contract(INVOICE_NFT_ADDRESS || ethers.constants.AddressZero, abi, wallet);

app.post('/webhook/verify', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.tokenId) return res.status(400).send('bad request');
    if (body.status !== 'VERIFIED' && body.status !== 'PAID') return res.status(200).send('ignored');

    const tx = await invoiceContract.verifyInvoiceByOracle(body.tokenId, { gasLimit: 200000 });
    const receipt = await tx.wait();
    console.log('Verified onchain', receipt.transactionHash);
    return res.json({ status: 'ok', txHash: receipt.transactionHash });
  } catch (err) {
    console.error('Relayer error:', err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log('Relayer running on', PORT));
