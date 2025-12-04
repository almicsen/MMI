'use client';

import { useState, useEffect } from 'react';
import { getSiteIssues, getTelemetryLogs, resolveTelemetryLog, SiteIssue, TelemetryLog } from '@/lib/telemetry';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function SiteIssuesPanel() {
  const { user } = useAuth();
  const toast = useToast();
  const [issues, setIssues] = useState<SiteIssue[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<SiteIssue | null>(null);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [issuesData, logsData] = await Promise.all([
        getSiteIssues(),
        getTelemetryLogs(100, filter === 'all' ? undefined : filter),
      ]);
      setIssues(issuesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading site issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issue: SiteIssue) => {
    if (!user?.uid) return;

    try {
      // Resolve all related logs
      if (issue.relatedLogs) {
        await Promise.all(
          issue.relatedLogs.map((logId) => resolveTelemetryLog(logId, user.uid))
        );
      }
      toast.showSuccess('Issue resolved');
      loadData();
    } catch (error) {
      toast.showError('Error resolving issue');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading site issues...</div>;
  }

  const filteredIssues = filter === 'all' ? issues : issues.filter((i) => i.type === filter);
  const unresolvedIssues = filteredIssues.filter((i) => !i.resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Site Issues & Warnings
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All</option>
          <option value="error">Errors</option>
          <option value="warning">Warnings</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
          <div className="text-sm text-cyan-300/80 mb-1">Total Issues</div>
          <div className="text-2xl font-bold text-white">{issues.length}</div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-red-500/20 shadow-lg shadow-red-500/5">
          <div className="text-sm text-red-300/80 mb-1">Unresolved</div>
          <div className="text-2xl font-bold text-red-400">{unresolvedIssues.length}</div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-orange-500/20 shadow-lg shadow-orange-500/5">
          <div className="text-sm text-orange-300/80 mb-1">Errors</div>
          <div className="text-2xl font-bold text-orange-400">
            {issues.filter((i) => i.type === 'error').length}
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
          <div className="text-sm text-yellow-300/80 mb-1">Warnings</div>
          <div className="text-2xl font-bold text-yellow-400">
            {issues.filter((i) => i.type === 'warning').length}
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 overflow-hidden">
        <div className="divide-y divide-cyan-500/10">
          {unresolvedIssues.length === 0 ? (
            <div className="p-8 text-center text-cyan-300/80">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-lg font-semibold">No unresolved issues found!</p>
              <p className="text-sm text-cyan-400/60 mt-2">All systems operational</p>
            </div>
          ) : (
            unresolvedIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-6 hover:bg-slate-800/50 transition-all border-l-4 border-transparent hover:border-cyan-500/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(issue.severity)}`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {issue.type}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Count: {issue.count}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {issue.title}
                    </h3>
                    {issue.impact && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mb-2 font-medium">
                        {issue.impact}
                      </p>
                    )}
                    {issue.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {issue.description}
                      </p>
                    )}
                    {issue.suggestedFixes && issue.suggestedFixes.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          💡 Suggested Fixes:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                          {issue.suggestedFixes.map((fix, idx) => (
                            <li key={idx}>{fix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      First seen: {new Date(issue.firstSeen).toLocaleString()} | Last seen:{' '}
                      {new Date(issue.lastSeen).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveIssue(issue)}
                    className="ml-4 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all text-sm shadow-lg shadow-green-500/20"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Logs */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Telemetry Logs</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.slice(0, 50).map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {log.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {log.message}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(log.severity)}`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.resolved ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

