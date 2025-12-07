import addresses from "./addresses.json";

import InvoiceNFTABI from "./abis/InvoiceNFT.json";
import LoanManagerABI from "./abis/LoanManager.json";
import PoolABI from "./abis/Pool.json";
import ERC20ABI from "./abis/ERC20.json";

console.log("📦 Loaded LoanManager ABI FROM:", require.resolve("./abis/LoanManager.json"));
console.log("📦 LoanManager ABI KEYS:", Object.keys(LoanManagerABI));
console.log("📦 LoanManager ABI LENGTH:", LoanManagerABI.abi?.length);


export const CONTRACTS = {
  invoiceNFT: { address: addresses.invoiceNFT, abi: InvoiceNFTABI.abi },
  loanManager: { address: addresses.loanManager, abi: LoanManagerABI.abi },
  pool: { address: addresses.pool, abi: PoolABI.abi },
  stablecoin: { address: addresses.stablecoin, abi: ERC20ABI.abi }
};

if (typeof window !== "undefined") {
  window.__contracts = CONTRACTS;
}
