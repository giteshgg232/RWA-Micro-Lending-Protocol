'use client';

import { useEffect, useState } from 'react';
import { CONTRACTS } from '../lib/contracts';
import { ethers } from 'ethers';

export default function YourContributions() {
  const [contribs, setContribs] = useState([]);
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadContributions();
  }, []);

  async function loadContributions() {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const user = await signer.getAddress();
    setAddress(user);

    const contract = new ethers.Contract(
      CONTRACTS.loanManager.address,
      CONTRACTS.loanManager.abi,
      provider
    );

    const count = await contract.loanCounter();
    let list = [];

    for (let i = 1; i <= count; i++) {
      const contributed = await contract.contributions(i, user);
      if (contributed.gt(0)) {
        const loan = await contract.loans(i);
        list.push({ id: i, contributed, loan });
      }
    }

    setContribs(list);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Your Contributions</h2>

      {contribs.length === 0 ? (
        <p className="text-gray-500">No contributions yet.</p>
      ) : (
        contribs.map(({ id, contributed, loan }) => (
          <div key={id} className="card">
            <p>Loan #{id}</p>
            <p>You funded: {Number(contributed) / 1e6} USDC</p>
            <p>Total principal: {Number(loan.principal) / 1e6}</p>
          </div>
        ))
      )}
    </div>
  );
}
