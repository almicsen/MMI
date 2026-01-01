'use client';

import { useEffect, useState } from 'react';
import InstantLink from '@/components/InstantLink';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { getProjects } from '@/lib/firebase/firestore';
import { Project } from '@/lib/firebase/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

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
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="section">
        <div className="hero-shell px-6 py-10 sm:px-10 sm:py-14">
          <div className="hero-orb hero-orb--primary -left-10 -top-10 h-44 w-44" aria-hidden />
          <div className="hero-orb hero-orb--accent right-8 top-2 h-32 w-32" aria-hidden />
          <div className="hero-orb hero-orb--secondary bottom-[-20%] left-[45%] h-56 w-56" aria-hidden />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[color:var(--brand-accent)]">
                Premium media studio
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-[color:var(--text-1)] sm:text-5xl lg:text-6xl">
                MobileMediaInteractions builds cinematic digital experiences that feel native everywhere.
              </h1>
              <p className="text-base text-[color:var(--text-3)] sm:text-lg">
                From interactive storytelling to next-generation content hubs, we design and deliver moments audiences
                remember.
              </p>
              <div className="flex flex-wrap gap-3">
                <InstantLink href="/mmi-plus">
                  <Button size="lg">Explore MMI+</Button>
                </InstantLink>
                <InstantLink href="/projects">
                  <Button size="lg" variant="outline">View projects</Button>
                </InstantLink>
                {!user && (
                  <InstantLink href="/login">
                    <Button size="lg" variant="ghost">Sign in</Button>
                  </InstantLink>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--text-4)]">
                <span className="stat-pill px-4 py-2 text-[color:var(--text-2)]">Immersive originals</span>
                <span className="stat-pill px-4 py-2 text-[color:var(--text-2)]">Live ops</span>
                <span className="stat-pill px-4 py-2 text-[color:var(--text-2)]">Enterprise partners</span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="surface-card p-6 sm:p-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
                      Studio briefing
                    </p>
                    <p className="text-lg font-semibold text-[color:var(--text-1)]">
                      Human-first digital entertainment.
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {[
                      {
                        title: 'Interactive Originals',
                        description: 'Immersive series that blend narrative with real-time engagement.',
                      },
                      {
                        title: 'MMI+ Streaming',
                        description: 'A curated hub for podcasts, films, and premium audio experiences.',
                      },
                      {
                        title: 'Partner Launchpads',
                        description: 'Go-to-market support for entertainment brands and creators.',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-3)] p-4"
                      >
                        <p className="text-base font-semibold text-[color:var(--text-1)]">{item.title}</p>
                        <p className="text-sm text-[color:var(--text-3)]">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="surface-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">Experience</p>
                  <p className="text-2xl font-semibold text-[color:var(--text-1)]">120+ launches</p>
                  <p className="text-sm text-[color:var(--text-3)]">From MVP pilots to premium-scale platforms.</p>
                </div>
                <div className="surface-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">Capability</p>
                  <p className="text-2xl font-semibold text-[color:var(--text-1)]">Live + adaptive</p>
                  <p className="text-sm text-[color:var(--text-3)]">Realtime, personalized, and deeply responsive.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Live portfolio"
            title="Projects with cinematic ambition"
            subtitle="A snapshot of the worlds, platforms, and experiences our studio is actively shaping."
          />

          {loading ? (
            <LoadingState skeleton count={6} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => window.location.reload()} />
          ) : projects.length === 0 ? (
            <EmptyState message="No projects available right now." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Badge tone={getStatusTone(project.status)}>{project.status}</Badge>
                    {project.isFeatured && (
                      <span className="text-xs font-semibold text-[color:var(--brand-secondary)]">Featured</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--text-1)]">{project.title}</h3>
                    <p className="text-sm text-[color:var(--text-3)]">{project.description}</p>
                  </div>
                  {project.link && (
                    <InstantLink
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[color:var(--brand-primary)]"
                    >
                      Learn more →
                    </InstantLink>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-tight">
        <div className="surface-card px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
                Ready for what’s next
              </p>
              <h2 className="text-3xl font-semibold text-[color:var(--text-1)] sm:text-4xl">
                Let’s build the next flagship entertainment experience.
              </h2>
              <p className="text-base text-[color:var(--text-3)]">
                We partner with teams that care about craft, scale, and measurable impact.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <InstantLink href="/contact">
                  <Button size="lg">Start a project</Button>
                </InstantLink>
              ) : (
                <InstantLink href="/login">
                  <Button size="lg">Sign in to start</Button>
                </InstantLink>
              )}
              <InstantLink href="/about">
                <Button size="lg" variant="outline">Our story</Button>
              </InstantLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
