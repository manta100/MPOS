import { useState, useEffect } from 'react';
import {
  ClockIcon,
  PlayIcon,
  StopIcon,
  BanknotesIcon,
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Shift {
  id: string;
  userId: string;
  userName: string;
  storeId: string;
  openingCash: number;
  closingCash: number;
  expectedCash: number;
  cashDifference: number;
  startTime: string;
  endTime?: string;
  status: 'OPEN' | 'CLOSED';
  cashEvents: CashEvent[];
}

interface CashEvent {
  id: string;
  shiftId: string;
  eventType: 'CASH_IN' | 'CASH_OUT' | 'PAYIN' | 'PAYOUT';
  amount: number;
  note: string;
  createdAt: string;
}

interface TimeClock {
  id: string;
  userId: string;
  userName: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  status: 'CLOCKED_IN' | 'CLOCKED_OUT';
}

export default function Shifts() {
  const [activeTab, setActiveTab] = useState<'shifts' | 'timeclock' | 'cash'>('shifts');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeClocks, setTimeClocks] = useState<TimeClock[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [eventType, setEventType] = useState<'CASH_IN' | 'CASH_OUT' | 'PAYIN' | 'PAYOUT'>('CASH_IN');

  useEffect(() => {
    fetchShifts();
    fetchCurrentShift();
  }, []);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/shifts');
      if (res.data.success) {
        setShifts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentShift = async () => {
    try {
      const res = await api.get('/shifts/current');
      if (res.data.success) {
        setCurrentShift(res.data.data);
      }
    } catch (error) {
      console.error('No active shift');
    }
  };

  const openShift = async (openingCash: number) => {
    try {
      const res = await api.post('/shifts/open', { openingCash });
      if (res.data.success) {
        toast.success('Shift opened successfully');
        fetchCurrentShift();
        fetchShifts();
      }
    } catch (error) {
      toast.error('Failed to open shift');
    }
  };

  const closeShift = async (closingCash: number) => {
    if (!currentShift) return;
    try {
      const res = await api.post('/shifts/close', { closingCash });
      if (res.data.success) {
        toast.success('Shift closed successfully');
        setCurrentShift(null);
        fetchShifts();
      }
    } catch (error) {
      toast.error('Failed to close shift');
    }
  };

  const addCashEvent = async (amount: number, note: string) => {
    if (!currentShift) return;
    try {
      const res = await api.post('/shifts/cash-event', {
        shiftId: currentShift.id,
        eventType,
        amount,
        note,
      });
      if (res.data.success) {
        toast.success('Cash event added');
        setShowCashModal(false);
        fetchCurrentShift();
      }
    } catch (error) {
      toast.error('Failed to add cash event');
    }
  };

  const clockIn = async () => {
    try {
      const res = await api.post('/shifts/timeclock', { action: 'clock_in' });
      if (res.data.success) {
        toast.success('Clocked in');
        fetchTimeClocks();
      }
    } catch (error) {
      toast.error('Failed to clock in');
    }
  };

  const clockOut = async () => {
    try {
      const res = await api.post('/shifts/timeclock', { action: 'clock_out' });
      if (res.data.success) {
        toast.success('Clocked out');
        fetchTimeClocks();
      }
    } catch (error) {
      toast.error('Failed to clock out');
    }
  };

  const fetchTimeClocks = async () => {
    try {
      const res = await api.get('/shifts/timeclock');
      if (res.data.success) {
        setTimeClocks(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching time clocks:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'timeclock') {
      fetchTimeClocks();
    }
  }, [activeTab]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shifts & Time Clock</h1>
          <p className="text-gray-500">Manage employee shifts and time tracking</p>
        </div>
        {currentShift ? (
          <button onClick={() => setShowModal(true)} className="btn-danger flex items-center gap-2">
            <StopIcon className="h-5 w-5" />
            Close Shift
          </button>
        ) : (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <PlayIcon className="h-5 w-5" />
            Open Shift
          </button>
        )}
      </div>

      {currentShift && (
        <div className="card p-4 mb-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold">Active Shift</h3>
                <p className="text-sm text-gray-500">
                  Started at {new Date(currentShift.startTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-sm text-gray-500">Opening Cash</p>
                <p className="font-semibold font-mono">${currentShift.openingCash.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Cash Sales</p>
                <p className="font-semibold font-mono text-green-600">${currentShift.expectedCash.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Expected</p>
                <p className="font-semibold font-mono">${(currentShift.openingCash + currentShift.expectedCash).toFixed(2)}</p>
              </div>
              <button
                onClick={() => setShowCashModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <BanknotesIcon className="h-5 w-5" />
                Cash Event
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'shifts'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Shift History
        </button>
        <button
          onClick={() => setActiveTab('timeclock')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'timeclock'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Time Clock
        </button>
      </div>

      {activeTab === 'shifts' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Difference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : shifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No shifts found
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="font-medium">{shift.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(shift.startTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {shift.endTime
                          ? `${Math.round((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 3600000)}h`
                          : 'In progress'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        ${shift.openingCash.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-green-600">
                        ${shift.expectedCash.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        ${shift.closingCash.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-mono ${shift.cashDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {shift.cashDifference >= 0 ? '+' : ''}${shift.cashDifference.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          shift.status === 'OPEN'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {shift.status === 'OPEN' && <CheckCircleIcon className="h-3 w-3" />}
                          {shift.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'timeclock' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <button onClick={clockIn} className="btn-primary flex items-center gap-2">
              <PlayIcon className="h-5 w-5" />
              Clock In
            </button>
            <button onClick={clockOut} className="btn-secondary flex items-center gap-2">
              <StopIcon className="h-5 w-5" />
              Clock Out
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {timeClocks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No time clock records
                      </td>
                    </tr>
                  ) : (
                    timeClocks.map((clock) => (
                      <tr key={clock.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                            </div>
                            <span className="font-medium">{clock.userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {new Date(clock.clockIn).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(clock.clockIn).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          {clock.clockOut ? new Date(clock.clockOut).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {clock.clockOut
                            ? `${(8 - clock.breakMinutes / 60).toFixed(1)}h`
                            : 'In progress'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            clock.status === 'CLOCKED_IN'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {clock.status === 'CLOCKED_IN' ? 'Clocked In' : 'Clocked Out'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ShiftModal
          isOpen={!!currentShift}
          openingCash={currentShift?.openingCash || 0}
          onClose={() => setShowModal(false)}
          onSubmit={currentShift ? closeShift : openShift}
        />
      )}

      {showCashModal && (
        <CashEventModal
          eventType={eventType}
          onEventTypeChange={setEventType}
          onClose={() => setShowCashModal(false)}
          onSubmit={addCashEvent}
        />
      )}
    </div>
  );
}

function ShiftModal({
  isOpen,
  openingCash,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  openingCash: number;
  onClose: () => void;
  onSubmit: (cash: number) => void;
}) {
  const [cash, setCash] = useState(openingCash.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseFloat(cash) || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isOpen ? 'Close Shift' : 'Open Shift'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {isOpen ? 'Closing Cash Amount' : 'Opening Cash Amount'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                className="input pl-8"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isOpen ? 'Close Shift' : 'Open Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CashEventModal({
  eventType,
  onEventTypeChange,
  onClose,
  onSubmit,
}: {
  eventType: string;
  onEventTypeChange: (type: 'CASH_IN' | 'CASH_OUT' | 'PAYIN' | 'PAYOUT') => void;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseFloat(amount) || 0, note);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Cash Event</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => onEventTypeChange(e.target.value as any)}
              className="input"
            >
              <option value="CASH_IN">Cash In (Float)</option>
              <option value="CASH_OUT">Cash Out</option>
              <option value="PAYIN">Pay In</option>
              <option value="PAYOUT">Pay Out</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input pl-8"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input"
              placeholder="Enter note..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
