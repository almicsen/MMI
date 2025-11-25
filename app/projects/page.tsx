'use client';

import { useEffect, useState } from 'react';
import InstantLink from '@/components/InstantLink';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { getProjects, getCollaborations, getComingSoon } from '@/lib/firebase/firestore';
import { Project, Collaboration, ComingSoonContent } from '@/lib/firebase/types';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';

type Tab = 'projects' | 'collaborations' | 'coming-soon';

export default function ProjectsPage() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('projects');
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [comingSoon, setComingSoon] = useState<ComingSoonContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only load data if page is enabled
    if (pageCheckLoading || !enabled) {
      return;
    }
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectsData, collaborationsData, comingSoonData] = await Promise.all([
          getProjects(),
          getCollaborations(),
          getComingSoon(),
        ]);
        setProjects(projectsData);
        setCollaborations(collaborationsData);
        setComingSoon(comingSoonData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [pageCheckLoading, enabled]);

  // If page is disabled, the hook will redirect, so we don't need to render anything
  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'in-progress':
      case 'development':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending':
      case 'announced':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'archived':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'relaunching':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Tab Navigation */}
      <nav className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700" role="tablist">
        {(['projects', 'collaborations', 'coming-soon'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-800'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab === 'coming-soon' ? 'Coming Soon' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {loading ? (
        <LoadingState skeleton count={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      ) : (
        <>
          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <section role="tabpanel" aria-labelledby="tab-projects">
              <header className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Our Projects</h2>
                <div className="h-1 w-24 bg-gray-300 dark:bg-gray-600"></div>
              </header>
              {projects.length === 0 ? (
                <EmptyState message="No projects available." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        {project.isFeatured && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            {project.title}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        ) : (
                          project.title
                        )}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                        {project.description}
                      </p>
                      {(project.startDate || project.endDate) && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {project.startDate && <span>Start: {project.startDate}</span>}
                          {project.endDate && <span className="ml-2">End: {project.endDate}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Collaborations Tab */}
          {activeTab === 'collaborations' && (
            <section role="tabpanel" aria-labelledby="tab-collaborations">
              <header className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Our Collaborations</h2>
                <div className="h-1 w-24 bg-gray-300 dark:bg-gray-600"></div>
              </header>
              {collaborations.length === 0 ? (
                <EmptyState message="No collaborations available." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collaborations.map((collaboration) => (
                    <div
                      key={collaboration.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(collaboration.status)}`}>
                          {collaboration.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                        {collaboration.link ? (
                          <a
                            href={collaboration.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            {collaboration.name}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        ) : (
                          collaboration.name
                        )}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {collaboration.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Coming Soon Tab */}
          {activeTab === 'coming-soon' && (
            <section role="tabpanel" aria-labelledby="tab-coming-soon">
              <header className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Coming Soon</h2>
                <div className="h-1 w-24 bg-gray-300 dark:bg-gray-600"></div>
              </header>
              {comingSoon.length === 0 ? (
                <EmptyState message="No upcoming content at this time." icon="📅" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {comingSoon.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="mb-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {item.type === 'series' ? 'Series' : item.type === 'movie' ? 'Movie' : 'Podcast'}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                        {item.description}
                      </p>
                      {item.releaseDate && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Release: {new Date(item.releaseDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

