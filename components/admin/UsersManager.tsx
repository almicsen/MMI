'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUsers } from '@/lib/firebase/firestore';
import { updateUserRole } from '@/lib/firebase/auth';
import { User, UserRole } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';
import Input from '@/components/ui/Input';

export default function UsersManager() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        console.log('Loaded users:', data); // Debug log
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.showError('Error loading users. Check console for details.');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const userIdParam = searchParams.get('userId');
    if (userIdParam) {
      setFilter(userIdParam);
    }
  }, [searchParams]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      await updateUserRole(uid, newRole);
      setUsers(users.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
      
      // Send notification about role change
      const user = users.find((u) => u.uid === uid);
      if (user?.email) {
        const { MMINotifications } = await import('@/lib/notifications');
        await MMINotifications.email(user.email, 'role-changed', { role: newRole });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.showError('Error updating user role');
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading users...</div>;
  }

  const filteredUsers = users.filter((user) => {
    const query = filter.toLowerCase();
    if (!query) return true;
    return (
      user.uid.toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.displayName || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search by email or user ID"
      />
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Email
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Role
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No users found
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <tr key={user.uid} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {user.email || user.displayName || user.uid || 'No email'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{user.role || 'guest'}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role || 'guest'}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="guest">Guest</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}
