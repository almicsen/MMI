'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import EmployeeDashboard from '@/components/EmployeeDashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['employee', 'admin']}>
      <EmployeeDashboard />
    </ProtectedRoute>
  );
}

