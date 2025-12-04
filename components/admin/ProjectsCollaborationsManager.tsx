'use client';

import { useState, useEffect } from 'react';
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/firebase/firestore';
import { getCollaborations, createCollaboration, updateCollaboration, deleteCollaboration } from '@/lib/firebase/firestore';
import { Project, Collaboration } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';

type Section = 'projects' | 'collaborations';

export default function ProjectsCollaborationsManager() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState<Section>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingCollaborationId, setEditingCollaborationId] = useState<string | null>(null);
  
  // Project form data
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    status: 'archived' as Project['status'],
    startDate: '',
    endDate: '',
    link: '',
    externalClients: false,
    isFeatured: false,
  });

  // Collaboration form data
  const [collaborationForm, setCollaborationForm] = useState({
    name: '',
    summary: '',
    status: 'completed' as Collaboration['status'],
    link: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, collaborationsData] = await Promise.all([
        getProjects(),
        getCollaborations(),
      ]);
      setProjects(projectsData);
      setCollaborations(collaborationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.showError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Project handlers
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const projectData = {
        ...projectForm,
        startDate: projectForm.startDate || undefined,
        endDate: projectForm.endDate || undefined,
        link: projectForm.link || undefined,
      };

      if (editingProjectId) {
        await updateProject(editingProjectId, projectData);
        toast.showSuccess('Project updated successfully!');
      } else {
        await createProject(projectData);
        toast.showSuccess('Project created successfully!');
      }

      resetProjectForm();
      loadData();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.showError('Error saving project');
    }
  };

  const handleProjectEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      description: project.description,
      status: project.status,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      link: project.link || '',
      externalClients: project.externalClients || false,
      isFeatured: project.isFeatured || false,
    });
  };

  const handleProjectDelete = async (id: string) => {
    const confirmed = await toast.confirm(
      'Are you sure you want to delete this project?',
      {
        title: 'Delete Project',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
      }
    );

    if (!confirmed) return;

    try {
      await deleteProject(id);
      toast.showSuccess('Project deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.showError('Error deleting project');
    }
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjectForm({
      title: '',
      description: '',
      status: 'archived',
      startDate: '',
      endDate: '',
      link: '',
      externalClients: false,
      isFeatured: false,
    });
  };

  // Collaboration handlers
  const handleCollaborationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const collaborationData = {
        ...collaborationForm,
        link: collaborationForm.link || undefined,
      };

      if (editingCollaborationId) {
        await updateCollaboration(editingCollaborationId, collaborationData);
        toast.showSuccess('Collaboration updated successfully!');
      } else {
        await createCollaboration(collaborationData);
        toast.showSuccess('Collaboration created successfully!');
      }

      resetCollaborationForm();
      loadData();
    } catch (error) {
      console.error('Error saving collaboration:', error);
      toast.showError('Error saving collaboration');
    }
  };

  const handleCollaborationEdit = (collaboration: Collaboration) => {
    setEditingCollaborationId(collaboration.id);
    setCollaborationForm({
      name: collaboration.name,
      summary: collaboration.summary,
      status: collaboration.status,
      link: collaboration.link || '',
    });
  };

  const handleCollaborationDelete = async (id: string) => {
    const confirmed = await toast.confirm(
      'Are you sure you want to delete this collaboration?',
      {
        title: 'Delete Collaboration',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
      }
    );

    if (!confirmed) return;

    try {
      await deleteCollaboration(id);
      toast.showSuccess('Collaboration deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Error deleting collaboration:', error);
      toast.showError('Error deleting collaboration');
    }
  };

  const resetCollaborationForm = () => {
    setEditingCollaborationId(null);
    setCollaborationForm({
      name: '',
      summary: '',
      status: 'completed',
      link: '',
    });
  };

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

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection('projects')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSection === 'projects'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveSection('collaborations')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSection === 'collaborations'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Collaborations
        </button>
      </div>

      {/* Projects Section */}
      {activeSection === 'projects' && (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingProjectId ? 'Edit Project' : 'Create New Project'}
            </h2>
            
            <form onSubmit={handleProjectSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Status *
                  </label>
                  <select
                    required
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as Project['status'] })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="development">Development</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                    <option value="relaunching">Relaunching</option>
                    <option value="announced">Announced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Link (optional)
                  </label>
                  <input
                    type="url"
                    value={projectForm.link}
                    onChange={(e) => setProjectForm({ ...projectForm, link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Start Date (optional)
                  </label>
                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={projectForm.externalClients}
                    onChange={(e) => setProjectForm({ ...projectForm, externalClients: e.target.checked })}
                    className="rounded"
                  />
                  External Clients
                </label>

                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={projectForm.isFeatured}
                    onChange={(e) => setProjectForm({ ...projectForm, isFeatured: e.target.checked })}
                    className="rounded"
                  />
                  Featured
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProjectId ? 'Update Project' : 'Create Project'}
                </button>
                {editingProjectId && (
                  <button
                    type="button"
                    onClick={resetProjectForm}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">All Projects</h2>
            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No projects yet.</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        {project.isFeatured && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">
                        {project.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{project.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-500">
                        {project.startDate && <span>Start: {project.startDate}</span>}
                        {project.endDate && <span>End: {project.endDate}</span>}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Project →
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleProjectEdit(project)}
                        className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleProjectDelete(project.id)}
                        className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Collaborations Section */}
      {activeSection === 'collaborations' && (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingCollaborationId ? 'Edit Collaboration' : 'Create New Collaboration'}
            </h2>
            
            <form onSubmit={handleCollaborationSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={collaborationForm.name}
                  onChange={(e) => setCollaborationForm({ ...collaborationForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Summary *
                </label>
                <textarea
                  required
                  rows={4}
                  value={collaborationForm.summary}
                  onChange={(e) => setCollaborationForm({ ...collaborationForm, summary: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Status *
                  </label>
                  <select
                    required
                    value={collaborationForm.status}
                    onChange={(e) => setCollaborationForm({ ...collaborationForm, status: e.target.value as Collaboration['status'] })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Link (optional)
                  </label>
                  <input
                    type="url"
                    value={collaborationForm.link}
                    onChange={(e) => setCollaborationForm({ ...collaborationForm, link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCollaborationId ? 'Update Collaboration' : 'Create Collaboration'}
                </button>
                {editingCollaborationId && (
                  <button
                    type="button"
                    onClick={resetCollaborationForm}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">All Collaborations</h2>
            <div className="space-y-4">
              {collaborations.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No collaborations yet.</p>
              ) : (
                collaborations.map((collaboration) => (
                  <div
                    key={collaboration.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(collaboration.status)}`}>
                          {collaboration.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">
                        {collaboration.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{collaboration.summary}</p>
                      {collaboration.link && (
                        <a
                          href={collaboration.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Collaboration →
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleCollaborationEdit(collaboration)}
                        className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCollaborationDelete(collaboration.id)}
                        className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

