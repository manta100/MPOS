import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { usersApi } from '../../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [clockStatus, setClockStatus] = useState({ isClockedIn: false, isOnBreak: false });

  useEffect(() => {
    fetchEmployees();
    checkClockStatus();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getAll();
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkClockStatus = async () => {
    // Simulated status
    setClockStatus({ isClockedIn: true, isOnBreak: false });
  };

  const handleClockIn = async () => {
    toast.success('Clocked in successfully');
    setClockStatus({ isClockedIn: true, isOnBreak: false });
  };

  const handleClockOut = async () => {
    toast.success('Clocked out successfully');
    setClockStatus({ isClockedIn: false, isOnBreak: false });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    
    try {
      await usersApi.delete(id);
      toast.success('Employee deactivated');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to deactivate employee');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-500">Manage your team members</p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Employee
        </button>
      </div>

      {/* Time Clock Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              clockStatus.isClockedIn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <ClockIcon className={`h-6 w-6 ${clockStatus.isClockedIn ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-medium">
                {clockStatus.isClockedIn ? 'Currently Working' : 'Not Clocked In'}
              </p>
              {clockStatus.isOnBreak && (
                <span className="text-sm text-yellow-600">On Break</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!clockStatus.isClockedIn ? (
              <button onClick={handleClockIn} className="btn-success">
                Clock In
              </button>
            ) : (
              <button onClick={handleClockOut} className="btn-secondary">
                Clock Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{employee.name}</span>
                          <p className="text-sm text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(employee.role)}`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {employee.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {employee.lastLoginAt
                        ? new Date(employee.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingEmployee(employee); setShowModal(true); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <PencilIcon className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Modal */}
      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchEmployees(); }}
        />
      )}
    </div>
  );
}

function EmployeeModal({ employee, onClose, onSave }: { employee: User | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    password: '',
    role: employee?.role || 'CASHIER',
    pinCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (employee) {
        await usersApi.update(employee.id, form);
        toast.success('Employee updated');
      } else {
        await usersApi.create(form);
        toast.success('Employee created');
      }
      onSave();
    } catch (error) {
      toast.error('Failed to save employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password {employee && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              required={!employee}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">PIN Code</label>
            <input
              type="text"
              value={form.pinCode}
              onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
              className="input"
              placeholder="4-digit PIN"
              maxLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              className="input"
            >
              <option value="CASHIER">Cashier</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
