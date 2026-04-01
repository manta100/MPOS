import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon,
  PrinterIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { ticketsApi } from '../../services/api';
import toast from 'react-hot-toast';

interface TicketItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  discount?: number;
  modifiers?: string[];
}

interface Ticket {
  id: string;
  ticketNumber: string;
  status: 'OPEN' | 'HELD' | 'PAID' | 'VOID' | 'REFUNDED';
  customerId?: string;
  customerName?: string;
  items: TicketItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  employeeName: string;
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchTickets();
  }, [search, statusFilter, dateRange, pagination.page]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await ticketsApi.getAll({
        status: statusFilter || undefined,
        page: pagination.page,
        limit: 20,
      });
      if (res.data.success) {
        setTickets(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchTickets();
  };

  const printReceipt = async (ticket: Ticket) => {
    toast.success('Sending to printer...');
  };

  const reopenTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to reopen this ticket?')) return;
    
    try {
      const res = await ticketsApi.reopen(ticketId);
      if (res.data.success) {
        toast.success('Ticket reopened');
        fetchTickets();
      }
    } catch (error) {
      toast.error('Failed to reopen ticket');
    }
  };

  const voidTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to void this ticket? This cannot be undone.')) return;
    
    try {
      const res = await ticketsApi.update(ticketId, { status: 'VOID' });
      if (res.data.success) {
        toast.success('Ticket voided');
        fetchTickets();
      }
    } catch (error) {
      toast.error('Failed to void ticket');
    }
  };

  const viewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetails(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      HELD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      VOID: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
      REFUNDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status === 'PAID' && <CheckCircleIcon className="h-3 w-3" />}
        {status === 'VOID' && <XCircleIcon className="h-3 w-3" />}
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
          <p className="text-gray-500">View and manage sales history</p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket #, customer, or item..."
              className="input pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-40"
          >
            <option value="">All Status</option>
            <option value="PAID">Paid</option>
            <option value="HELD">Held</option>
            <option value="VOID">Void</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="input w-40"
          />
          
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="input w-40"
          />

          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <span className="font-mono font-medium">{ticket.ticketNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.customerName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.employeeName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ticket.items.length}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold">
                      ${ticket.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewDetails(ticket)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => printReceipt(ticket)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Print Receipt"
                        >
                          <PrinterIcon className="h-4 w-4 text-gray-500" />
                        </button>
                        {ticket.status === 'PAID' && (
                          <button
                            onClick={() => reopenTicket(ticket.id)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                            title="Reopen Ticket"
                          >
                            <ArrowPathIcon className="h-4 w-4 text-blue-500" />
                          </button>
                        )}
                        {(ticket.status === 'OPEN' || ticket.status === 'HELD') && (
                          <button
                            onClick={() => voidTicket(ticket.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                            title="Void Ticket"
                          >
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetails && selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}

function TicketDetailsModal({
  ticket,
  onClose,
}: {
  ticket: Ticket;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Ticket #{ticket.ticketNumber}</h2>
              <p className="text-sm text-gray-500">
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Items</h3>
              <div className="space-y-2">
                {ticket.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-xs text-gray-500">{item.modifiers.join(', ')}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono">{item.quantity} x ${item.price.toFixed(2)}</p>
                      {item.discount && item.discount > 0 && (
                        <p className="text-xs text-green-600">-${item.discount.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono">${ticket.subtotal.toFixed(2)}</span>
              </div>
              {ticket.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-mono">-${ticket.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-mono">${ticket.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span className="font-mono">${ticket.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {ticket.customerName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer</span>
                  <span>{ticket.customerName}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Employee</span>
                <span>{ticket.employeeName}</span>
              </div>
              {ticket.paymentMethod && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment</span>
                  <span>{ticket.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
          <button className="btn-primary flex-1 flex items-center justify-center gap-2">
            <PrinterIcon className="h-5 w-5" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
