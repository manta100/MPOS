import { useEffect, useState } from 'react';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';

interface DashboardStats {
  todaySales: number;
  ticketsCount: number;
  customersCount: number;
  avgTicketValue: number;
}

export default function Dashboard() {
  const { user, store } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    ticketsCount: 0,
    customersCount: 0,
    avgTicketValue: 0,
  });
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    // Simulated data for demo
    setStats({
      todaySales: 2456.80,
      ticketsCount: 47,
      customersCount: 1234,
      avgTicketValue: 52.27,
    });
  }, []);

  const statCards = [
    {
      name: 'Today\'s Sales',
      value: `$${stats.todaySales.toFixed(2)}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Tickets',
      value: stats.ticketsCount.toString(),
      change: '+8.2%',
      changeType: 'positive',
      icon: ShoppingCartIcon,
    },
    {
      name: 'Customers',
      value: stats.customersCount.toLocaleString(),
      change: '+15.3%',
      changeType: 'positive',
      icon: UsersIcon,
    },
    {
      name: 'Avg. Ticket',
      value: `$${stats.avgTicketValue.toFixed(2)}`,
      change: '-2.1%',
      changeType: 'negative',
      icon: ArrowTrendingUpIcon,
    },
  ];

  return (
    <div className="p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Here&apos;s what&apos;s happening at {store?.name} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span
                className={`${
                  stat.changeType === 'positive'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">vs yesterday</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Start */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/pos"
              className="flex flex-col items-center justify-center p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              <ShoppingCartIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                New Sale
              </span>
            </a>
            <a
              href="/items"
              className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Add Item
              </span>
            </a>
            <a
              href="/customers"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                New Customer
              </span>
            </a>
            <a
              href="/reports"
              className="flex flex-col items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
            >
              <ArrowTrendingUpIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                View Reports
              </span>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Sales
            </h2>
            <a href="/tickets" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {[
              { id: '001', amount: 45.50, time: '2 min ago' },
              { id: '002', amount: 128.00, time: '5 min ago' },
              { id: '003', amount: 23.00, time: '8 min ago' },
              { id: '004', amount: 67.25, time: '12 min ago' },
              { id: '005', amount: 156.80, time: '15 min ago' },
            ].map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <ShoppingCartIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Ticket #{ticket.id}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-3 w-3 inline mr-1" />
                      {ticket.time}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  ${ticket.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
