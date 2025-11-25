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
import CDNManager from './CDNManager';
import SiteIssuesPanel from './SiteIssuesPanel';
import SitePreview from './SitePreview';
import APIKeyManager from './APIKeyManager';
import MMIPlusManager from './MMIPlusManager';
import TriviaManager from './TriviaManager';

type Tab = 'mmi-plus' | 'pages' | 'users' | 'content' | 'coming-soon' | 'projects-collaborations' | 'config' | 'analytics' | 'player-config' | 'recommendations' | 'notifications' | 'active-users' | 'cdn' | 'site-issues' | 'api-keys' | 'trivia';

interface NavItem {
  id: Tab;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'mmi-plus', label: 'MMI+ Manager', icon: '⭐' },
  { id: 'pages', label: 'Pages', icon: '📄' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'content', label: 'Content', icon: '🎬' },
  { id: 'coming-soon', label: 'Coming Soon', icon: '📅' },
  { id: 'projects-collaborations', label: 'Projects & Collaborations', icon: '🤝' },
  { id: 'config', label: 'Config', icon: '⚙️' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'player-config', label: 'Player Config', icon: '🎮' },
  { id: 'recommendations', label: 'Recommendations', icon: '🤖' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'active-users', label: 'Active Users', icon: '👁️' },
  { id: 'cdn', label: 'CDN', icon: '📦' },
  { id: 'site-issues', label: 'Site Issues', icon: '⚠️' },
  { id: 'api-keys', label: 'API Keys', icon: '🔑' },
  { id: 'trivia', label: 'Trivia Challenges', icon: '🧠' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('mmi-plus');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [previewPath, setPreviewPath] = useState<string>('/');

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
      {/* Mobile Sidebar Toggle Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors"
          aria-label="Open sidebar"
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64 fixed lg:relative z-40' : 'w-0 -translate-x-full lg:translate-x-0'
        } bg-slate-900/90 backdrop-blur-xl border-r border-cyan-500/20 shadow-2xl shadow-cyan-500/5 transition-all duration-300 overflow-hidden flex flex-col h-full`}
      >
        <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Navigation</h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors p-1.5 hover:bg-cyan-500/10 rounded-lg"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <span className="text-xl">{sidebarOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all relative group ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-100 border border-transparent hover:border-cyan-500/30'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-cyan-500/20 bg-gradient-to-t from-slate-900/50 to-transparent">
          <button
            onClick={() => setPreviewVisible(!previewVisible)}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              previewVisible
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/40'
                : 'bg-slate-800/50 text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {previewVisible ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L12 12m-5.71-5.71L12 12" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </>
              )}
            </svg>
            <span>{previewVisible ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Content Panel */}
        <div
          className={`${
            previewVisible ? 'w-full lg:w-1/2' : 'w-full'
          } overflow-y-auto bg-slate-950/40 backdrop-blur-sm transition-all duration-300`}
        >
          <div className="p-4 lg:p-6">
            <div className="mb-4 lg:mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {navItems.find((item) => item.id === activeTab)?.label || 'Admin Dashboard'}
                </h1>
                <p className="text-purple-200 text-sm">
                  Manage and configure your site settings
                </p>
              </div>
              {/* Mobile Preview Toggle */}
              <button
                onClick={() => setPreviewVisible(!previewVisible)}
                className="lg:hidden px-3 py-2 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg transition-all text-sm shadow-lg shadow-cyan-500/20"
                title={previewVisible ? 'Hide Preview' : 'Show Preview'}
              >
                {previewVisible ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

                 <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 p-4 lg:p-6 admin-panel-content">
                   {activeTab === 'mmi-plus' && <MMIPlusManager />}
                   {activeTab === 'pages' && <PagesManager />}
                   {activeTab === 'users' && <UsersManager />}
                   {activeTab === 'content' && <ContentManager />}
              {activeTab === 'coming-soon' && <ComingSoonManager />}
              {activeTab === 'projects-collaborations' && <ProjectsCollaborationsManager />}
              {activeTab === 'config' && <ConfigManager />}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
              {activeTab === 'player-config' && (
                <PlayerConfigManager 
                  onContentSelect={(contentId) => {
                    if (contentId) {
                      setPreviewPath(`/mmi-plus/${contentId}`);
                    } else {
                      setPreviewPath('/mmi-plus');
                    }
                  }} 
                />
              )}
              {activeTab === 'recommendations' && <RecommendationsPanel />}
              {activeTab === 'notifications' && <NotificationsManager />}
              {activeTab === 'active-users' && <ActiveUsersPanel />}
              {activeTab === 'cdn' && <CDNManager />}
                   {activeTab === 'site-issues' && <SiteIssuesPanel />}
                   {activeTab === 'api-keys' && <APIKeyManager />}
                   {activeTab === 'trivia' && <TriviaManager />}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {previewVisible && (
          <div className="w-full lg:w-1/2 border-t lg:border-t-0 lg:border-l border-cyan-500/20 bg-slate-950/40 backdrop-blur-sm overflow-hidden flex flex-col">
            <SitePreview 
              className="h-full" 
              visible={previewVisible} 
              onToggle={() => setPreviewVisible(false)}
              autoNavigateTo={previewPath}
            />
          </div>
        )}
      </div>
    </div>
  );
}

