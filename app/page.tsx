'use client';

import { useEffect, useState } from 'react';
import InstantLink from '@/components/InstantLink';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { getProjects } from '@/lib/firebase/firestore';
import { Project } from '@/lib/firebase/types';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError(err instanceof Error ? err : new Error('Failed to load projects'));
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

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
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="hero min-h-[60vh] flex items-center justify-center text-center mb-16">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-white">
            MobileMediaInteractions
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
            Innovating Entertainment, Building Experiences.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Our Projects
        </h2>
        
        {loading ? (
          <LoadingState skeleton count={6} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        ) : projects.length === 0 ? (
          <EmptyState message="No projects available at this time." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getStatusColor(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {project.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                {project.link && (
                  <InstantLink
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    Learn more →
                  </InstantLink>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
