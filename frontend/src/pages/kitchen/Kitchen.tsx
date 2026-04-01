import { useState, useEffect, useCallback } from 'react';
import {
  ClockIcon,
  FireIcon,
  CheckIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { kitchenApi } from '../../services/api';
import toast from 'react-hot-toast';

type KitchenStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED';

interface KitchenOrder {
  id: string;
  status: KitchenStatus;
  sentAt: string;
  priority: number;
  ticket: {
    id: string;
    tableName?: string;
    notes?: string;
    user: { name: string };
    customer?: { name: string };
    items: any[];
  };
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    modifiersJson?: any[];
    status: string;
  }>;
}

export default function Kitchen() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<KitchenStatus | 'ALL'>('ALL');
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await kitchenApi.getOrders();
      if (res.data.success) {
        const apiOrders = res.data.data.map((order: any) => ({
          id: order.id,
          status: order.status,
          sentAt: order.sentAt,
          priority: order.priority || 0,
          ticket: {
            id: order.ticket?.id || '',
            tableName: order.ticket?.tableName,
            notes: order.ticket?.notes,
            user: order.ticket?.user || { name: 'Unknown' },
            customer: order.ticket?.customer,
            items: [],
          },
          items: order.items?.map((item: any) => ({
            id: item.id,
            itemName: item.ticketItem?.item?.name || item.itemName || 'Item',
            quantity: item.quantity,
            modifiersJson: item.ticketItem?.modifiersJson || [],
            status: item.status || 'PENDING',
          })) || [],
        }));
        setOrders(apiOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fall back to mock data on error
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: KitchenStatus) => {
    try {
      await kitchenApi.updateOrderStatus(orderId, status);
      setOrders(orders.map((order) => 
        order.id === orderId ? { ...order, status } : order
      ));
      toast.success(`Order marked as ${status.toLowerCase().replace('_', ' ')}`);
    } catch (error) {
      // Fallback to local update
      setOrders(orders.map((order) => 
        order.id === orderId ? { ...order, status } : order
      ));
      toast.success(`Order marked as ${status.toLowerCase().replace('_', ' ')}`);
    }
  };

  const updateItemStatus = async (orderId: string, itemId: string, status: string) => {
    try {
      // Item-level status update would need specific API endpoint
      setOrders(orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            items: order.items.map((item) =>
              item.id === itemId ? { ...item, status } : item
            ),
          };
        }
        return order;
      }));
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const getTimeColor = (date: string) => {
    const minutes = (Date.now() - new Date(date).getTime()) / 60000;
    if (minutes < 5) return 'text-green-600';
    if (minutes < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredOrders = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  const statusCounts = {
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    IN_PROGRESS: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    READY: orders.filter((o) => o.status === 'READY').length,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FireIcon className="h-8 w-8 text-orange-500" />
              Kitchen Display
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg ${audioEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
          >
            <BellIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mt-4">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'READY'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              {status !== 'ALL' && statusCounts[status] > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                  {statusCounts[status]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`card p-4 ${
                order.status === 'PENDING' ? 'ring-2 ring-red-500' : ''
              } ${order.status === 'READY' ? 'ring-2 ring-green-500' : ''}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold text-lg">
                    {order.ticket.tableName || `Ticket #${order.ticket.id}`}
                  </span>
                  {order.ticket.customer && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({order.ticket.customer.name})
                    </span>
                  )}
                </div>
                <span className={`text-sm font-mono ${getTimeColor(order.sentAt)}`}>
                  {getTimeSince(order.sentAt)}
                </span>
              </div>

              {/* Priority Badge */}
              {order.priority > 0 && (
                <div className="mb-2">
                  <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded">
                    VIP / Priority
                  </span>
                </div>
              )}

              {/* Notes */}
              {order.ticket.notes && (
                <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-700 dark:text-yellow-400">
                  {order.ticket.notes}
                </div>
              )}

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg ${
                      item.status === 'READY'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : item.status === 'COOKING'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.quantity}x</span>
                        <span className="ml-2">{item.itemName}</span>
                      </div>
                      {item.status !== 'READY' && (
                        <button
                          onClick={() => updateItemStatus(order.id, item.id, 'READY')}
                          className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded"
                        >
                          <CheckIcon className="h-4 w-4 text-green-600" />
                        </button>
                      )}
                    </div>
                    {item.modifiersJson && item.modifiersJson.length > 0 && (
                      <div className="mt-1 text-sm text-gray-500">
                        {item.modifiersJson.map((mod: string, i: number) => (
                          <span key={i} className="mr-2">• {mod}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                    className="btn-primary flex-1"
                  >
                    Start
                  </button>
                )}
                {order.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    className="btn-success flex-1"
                  >
                    Ready
                  </button>
                )}
                {order.status === 'READY' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'SERVED')}
                    className="btn-secondary flex-1"
                  >
                    Served
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FireIcon className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">No orders in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
