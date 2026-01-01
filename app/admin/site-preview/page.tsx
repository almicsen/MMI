'use client';

import { useState } from 'react';
import SitePreview from '@/components/admin/SitePreview';
import Select from '@/components/ui/Select';

const previewOptions = [
  { value: '/', label: 'Home' },
  { value: '/mmi-plus', label: 'MMI+' },
  { value: '/projects', label: 'Projects' },
  { value: '/services', label: 'Services' },
  { value: '/about', label: 'About' },
  { value: '/contact', label: 'Contact' },
  { value: '/live', label: 'Live' },
];

export default function AdminSitePreviewPage() {
  const [path, setPath] = useState('/');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[color:var(--text-1)]">Site Preview</p>
          <p className="text-sm text-[color:var(--text-3)]">Switch between key screens to verify layout and brand consistency.</p>
        </div>
        <div className="min-w-[220px]">
          <Select
            value={path}
            onChange={(event) => setPath(event.target.value)}
          >
            {previewOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-3xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-3 shadow-[var(--shadow-1)]">
        <div className="h-[70vh] min-h-[560px] w-full overflow-hidden rounded-2xl">
          <SitePreview className="h-full" visible onToggle={() => undefined} autoNavigateTo={path} />
        </div>
      </div>
    </div>
  );
}
