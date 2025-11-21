'use client';

import { useState } from 'react';
import PagesManager from './PagesManager';
import UsersManager from './UsersManager';
import ContentManager from './ContentManager';
import ComingSoonManager from './ComingSoonManager';
import ProjectsCollaborationsManager from './ProjectsCollaborationsManager';
import ConfigManager from './ConfigManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import PlayerConfigManager from './PlayerConfigManager';
import RecommendationsPanel from './RecommendationsPanel';
import NotificationsManager from './NotificationsManager';
import ActiveUsersPanel from './ActiveUsersPanel';

type Tab = 'pages' | 'users' | 'content' | 'coming-soon' | 'projects-collaborations' | 'config' | 'analytics' | 'player-config' | 'recommendations' | 'notifications' | 'active-users';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('pages');

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Admin Dashboard</h1>

      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {(['pages', 'users', 'content', 'coming-soon', 'projects-collaborations', 'config', 'analytics', 'player-config', 'recommendations', 'notifications', 'active-users'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab === 'coming-soon' ? 'Coming Soon' : 
             tab === 'player-config' ? 'Player Config' : 
             tab === 'projects-collaborations' ? 'Projects & Collaborations' : 
             tab === 'active-users' ? 'Active Users' :
             tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'pages' && <PagesManager />}
        {activeTab === 'users' && <UsersManager />}
        {activeTab === 'content' && <ContentManager />}
        {activeTab === 'coming-soon' && <ComingSoonManager />}
        {activeTab === 'projects-collaborations' && <ProjectsCollaborationsManager />}
        {activeTab === 'config' && <ConfigManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'player-config' && <PlayerConfigManager />}
        {activeTab === 'recommendations' && <RecommendationsPanel />}
        {activeTab === 'notifications' && <NotificationsManager />}
        {activeTab === 'active-users' && <ActiveUsersPanel />}
      </div>
    </div>
  );
}

