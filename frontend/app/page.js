'use client';

import DashboardStats from '../components/DashboardStats';
import YourLoans from '../components/YourLoans';
import YourContributions from '../components/YourContributions';
import GlobalStats from '../components/GlobalStats';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <DashboardStats />
      <YourLoans />
      <YourContributions />
      <GlobalStats />
    </div>
  );
}
