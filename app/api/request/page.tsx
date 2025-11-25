'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function APIRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    company: '',
    useCase: '',
    expectedMonthlyVolume: '',
    deploymentPreference: 'saas' as 'saas' | 'self-hosted',
    agreeToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast.showError('You must agree to the Terms of Service and Acceptable Use Policy');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expectedMonthlyVolume: parseInt(formData.expectedMonthlyVolume) || 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit request');
      }

      toast.showSuccess('API key request submitted! We\'ll review it and get back to you soon.');
      router.push('/');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.showError(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Request API Access
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Get programmatic access to the MMI platform. We'll review your request and get back to you within 24-48 hours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Company (Optional)
            </label>
            <input
              type="text"
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="useCase" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Detailed Use Case <span className="text-red-500">*</span>
            </label>
            <textarea
              id="useCase"
              required
              rows={6}
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              placeholder="Please describe in detail what you plan to build with the API. What problem are you solving? What features will you use?"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This helps us understand your needs and approve appropriate access levels.
            </p>
          </div>

          <div>
            <label htmlFor="expectedMonthlyVolume" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Expected Monthly API Requests <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="expectedMonthlyVolume"
              required
              min="0"
              value={formData.expectedMonthlyVolume}
              onChange={(e) => setFormData({ ...formData, expectedMonthlyVolume: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Estimate how many API requests you expect to make per month.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Deployment Preference <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deploymentPreference"
                  value="saas"
                  checked={formData.deploymentPreference === 'saas'}
                  onChange={(e) => setFormData({ ...formData, deploymentPreference: e.target.value as 'saas' | 'self-hosted' })}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">SaaS (We host - API key access)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deploymentPreference"
                  value="self-hosted"
                  checked={formData.deploymentPreference === 'self-hosted'}
                  onChange={(e) => setFormData({ ...formData, deploymentPreference: e.target.value as 'saas' | 'self-hosted' })}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Self-Hosted (Docker image - coming soon)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className="mr-2"
                required
              />
              <span className="text-gray-700 dark:text-gray-300">
                I agree to the <a href="/terms" className="text-blue-500 hover:underline">Terms of Service</a> and{' '}
                <a href="/aup" className="text-blue-500 hover:underline">Acceptable Use Policy</a>{' '}
                <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

