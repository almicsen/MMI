'use client';

import { useEffect, useState } from 'react';
import InstantLink from '@/components/InstantLink';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { getProjects, getCollaborations, getComingSoon } from '@/lib/firebase/firestore';
import { Project, Collaboration, ComingSoonContent } from '@/lib/firebase/types';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { cx } from '@/lib/utils/cx';

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

  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  const getStatusTone = (status: string): 'success' | 'warning' | 'info' | 'neutral' => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'success';
      case 'in-progress':
      case 'development':
        return 'warning';
      case 'pending':
      case 'announced':
      case 'relaunching':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const tabConfig: { id: Tab; label: string; description: string }[] = [
    { id: 'projects', label: 'Projects', description: 'Experiences we are actively delivering.' },
    { id: 'collaborations', label: 'Collaborations', description: 'Partnerships shaping future releases.' },
    { id: 'coming-soon', label: 'Coming Soon', description: 'The pipeline of upcoming drops.' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="section">
        <SectionHeading
          eyebrow="Portfolio"
          title="A living slate of experiences"
          subtitle="Explore ongoing projects, collaborations, and the next wave of MMI launches."
        />
      </section>

      <section className="section-tight">
        <div className="flex flex-wrap gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-2">
          {tabConfig.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cx(
                'rounded-full',
                activeTab === tab.id ? '' : 'text-[color:var(--text-3)]'
              )}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <p className="mt-4 text-sm text-[color:var(--text-3)]">
          {tabConfig.find((tab) => tab.id === activeTab)?.description}
        </p>
      </section>

      <section className="section">
        {loading ? (
          <LoadingState skeleton count={6} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        ) : (
          <>
            {activeTab === 'projects' && (
              <div>
                {projects.length === 0 ? (
                  <EmptyState message="No projects available." />
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                      <Card key={project.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge tone={getStatusTone(project.status)}>{project.status}</Badge>
                          {project.isFeatured && (
                            <span className="text-xs font-semibold text-[color:var(--brand-secondary)]">Featured</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[color:var(--text-1)]">
                            {project.link ? (
                              <InstantLink
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[color:var(--brand-primary)]"
                              >
                                {project.title}
                              </InstantLink>
                            ) : (
                              project.title
                            )}
                          </h3>
                          <p className="text-sm text-[color:var(--text-3)]">{project.description}</p>
                        </div>
                        {(project.startDate || project.endDate) && (
                          <p className="text-xs text-[color:var(--text-4)]">
                            {project.startDate && <span>Start: {project.startDate}</span>}
                            {project.endDate && <span className="ml-2">End: {project.endDate}</span>}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'collaborations' && (
              <div>
                {collaborations.length === 0 ? (
                  <EmptyState message="No collaborations available." />
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {collaborations.map((collaboration) => (
                      <Card key={collaboration.id} className="space-y-4">
                        <Badge tone={getStatusTone(collaboration.status)}>{collaboration.status}</Badge>
                        <div>
                          <h3 className="text-lg font-semibold text-[color:var(--text-1)]">
                            {collaboration.link ? (
                              <InstantLink
                                href={collaboration.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[color:var(--brand-primary)]"
                              >
                                {collaboration.name}
                              </InstantLink>
                            ) : (
                              collaboration.name
                            )}
                          </h3>
                          <p className="text-sm text-[color:var(--text-3)]">{collaboration.summary}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'coming-soon' && (
              <div>
                {comingSoon.length === 0 ? (
                  <EmptyState message="No upcoming content at this time." icon="📅" />
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {comingSoon.map((item) => (
                      <Card key={item.id} className="space-y-4">
                        <Badge tone="info">{item.type === 'series' ? 'Series' : item.type === 'movie' ? 'Movie' : 'Podcast'}</Badge>
                        <div>
                          <h3 className="text-lg font-semibold text-[color:var(--text-1)]">{item.title}</h3>
                          <p className="text-sm text-[color:var(--text-3)]">{item.description}</p>
                        </div>
                        {item.releaseDate && (
                          <p className="text-xs text-[color:var(--text-4)]">
                            Release: {new Date(item.releaseDate).toLocaleDateString()}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
