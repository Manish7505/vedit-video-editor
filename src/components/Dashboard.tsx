import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logger } from '../utils/logger';
import { 
  Plus, 
  FolderOpen, 
  Users, 
  Globe, 
  Search,
  Grid,
  List,
  Play,
  Edit,
  Share,
  Trash2
} from 'lucide-react';
// Clerk removed
import axios from 'axios';

interface Project {
  _id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  isPublic: boolean;
  lastModified: string;
  owner: {
    _id: string;
    username: string;
    avatar?: string;
  };
  collaborators: Array<{
    user: {
      _id: string;
      username: string;
      avatar?: string;
    };
    role: string;
  }>;
}

interface DashboardStats {
  totalProjects: number;
  publicProjects: number;
  collaborationProjects: number;
}

const Dashboard: React.FC = () => {
  const user: any = null;
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    publicProjects: 0,
    collaborationProjects: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'my' | 'shared' | 'public'>('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [projectsResponse, statsResponse] = await Promise.all([
        axios.get('/projects'),
        axios.get('/users/dashboard')
      ]);

      if (projectsResponse.data.success) {
        setProjects(projectsResponse.data.data.projects);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data.stats);
      }
    } catch (error) {
      logger.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filter) {
      case 'my':
        return project.owner._id === user?.id;
      case 'shared':
        return project.collaborators.some(collab => collab.user._id === user?.id);
      case 'public':
        return project.isPublic;
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const createNewProject = async () => {
    try {
      const response = await axios.post('/projects', {
        name: 'Untitled Project',
        description: 'A new video editing project'
      });

      if (response.data.success) {
        // Redirect to video editor with new project
        window.location.href = `/editor/${response.data.data.project._id}`;
      }
    } catch (error) {
      logger.error('Failed to create project:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.firstName || user?.username || 'User'}!</h1>
              <p className="text-gray-400 mt-1">Ready to create something amazing?</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createNewProject}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Projects</p>
                <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Public Projects</p>
                <p className="text-3xl font-bold text-white">{stats.publicProjects}</p>
              </div>
              <Globe className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Collaborations</p>
                <p className="text-3xl font-bold text-white">{stats.collaborationProjects}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Projects Section */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-zinc-800/50 border border-zinc-700 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Projects</option>
                <option value="my">My Projects</option>
                <option value="shared">Shared with Me</option>
                <option value="public">Public</option>
              </select>

              {/* View Mode */}
              <div className="flex bg-zinc-800/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Projects Grid/List */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first project to get started'}
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createNewProject}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Project</span>
                </motion.button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-600 transition-all cursor-pointer group ${
                    viewMode === 'list' ? 'flex items-center p-4' : 'p-4'
                  }`}
                  onClick={() => window.location.href = `/editor/${project._id}`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-video bg-zinc-700 rounded-lg mb-4 flex items-center justify-center">
                        {project.thumbnail ? (
                          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                        ) : (
                          <Play className="w-12 h-12 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-gray-400 text-sm mb-2 line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(project.lastModified)}</span>
                          {project.isPublic && <Globe className="w-4 h-4" />}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-12 bg-zinc-700 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        {project.thumbnail ? (
                          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Play className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-gray-400 text-sm mb-1 truncate">{project.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDate(project.lastModified)}</span>
                          <span>by {project.owner.username}</span>
                          {project.isPublic && <Globe className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                          <Share className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
