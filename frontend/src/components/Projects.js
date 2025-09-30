import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import IntegrationIndicator from './IntegrationIndicator';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [statusFilterDropdownOpen, setStatusFilterDropdownOpen] = useState(false);
  const [dateFilterDropdownOpen, setDateFilterDropdownOpen] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);
  const [retrievedProjectsData, setRetrievedProjectsData] = useState([]);
  const [showRetrievedProjectsModal, setShowRetrievedProjectsModal] = useState(false);
  const [selectedProjectsToImport, setSelectedProjectsToImport] = useState([]);
  const [formData, setFormData] = useState({
    project_number: '',
    project_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active',
    // Project Settings
    allow_project_cost_codes: false,
    allocate_contract_lines_to_cost_codes: false,
    labor_cost_method: 'default'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(10);

  // Add click outside handler for status dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown && !event.target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown]);

  // Add click outside handler for filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-dropdown-container')) {
        setStatusFilterDropdownOpen(false);
        setDateFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle navigation state for editing projects
  useEffect(() => {
    const handleLocationState = () => {
      if (window.location.state && window.location.state.editProject) {
        handleEdit(window.location.state.editProject);
        // Clear the state
        window.history.replaceState({}, document.title);
      }
    };

    handleLocationState();
  }, []);

  // Filter and paginate projects whenever projects or filters change
  useEffect(() => {
    filterAndPaginateProjects();
  }, [projects, searchTerm, statusFilter, dateFilter, currentPage]);

  const filterAndPaginateProjects = () => {
    // Ensure projects is always an array
    if (!Array.isArray(projects)) {
      setFilteredProjects([]);
      return;
    }

    let filtered = projects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.project_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

      filtered = filtered.filter(project => {
        const createdDate = new Date(project.created_at);
        if (dateFilter === 'recent') {
          return createdDate >= thirtyDaysAgo;
        } else if (dateFilter === 'older') {
          return createdDate < ninetyDaysAgo;
        }
        return true;
      });
    }

    setFilteredProjects(filtered);
  };

  const getCurrentProjects = () => {
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'search') {
      setSearchTerm(value);
    } else if (filterType === 'status') {
      setStatusFilter(value);
    } else if (filterType === 'date') {
      setDateFilter(value);
    }
    setCurrentPage(1);
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.project_number) newErrors.project_number = 'Project number is required';
    if (!formData.project_name) newErrors.project_name = 'Project name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editingProject) {
        // Update existing project
        await axios.put(`http://localhost:5001/api/projects/${editingProject.vuid}`, formData);
        
        // Update project settings
        const settingsData = {
          allow_project_cost_codes: formData.allow_project_cost_codes,
          allocate_contract_lines_to_cost_codes: formData.allocate_contract_lines_to_cost_codes,
          labor_cost_method: formData.labor_cost_method
        };
        
        try {
          await axios.put(`http://localhost:5001/api/projects/${editingProject.vuid}/settings`, settingsData);
          console.log('Project settings updated successfully');
        } catch (settingsError) {
          console.error('Error updating project settings:', settingsError);
          // Don't fail the entire operation if settings fail
        }
        
        setSuccessMessage('Project updated successfully!');
      } else {
        // Create new project
        const response = await axios.post('http://localhost:5001/api/projects', formData);
        const newProject = response.data;
        
        // Save project settings if this is a new project
        if (newProject && newProject.vuid) {
          const settingsData = {
            allow_project_cost_codes: formData.allow_project_cost_codes,
            allocate_contract_lines_to_cost_codes: formData.allocate_contract_lines_to_cost_codes,
            labor_cost_method: formData.labor_cost_method
          };
          
          try {
            await axios.put(`http://localhost:5001/api/projects/${newProject.vuid}/settings`, settingsData);
            console.log('Project settings saved successfully');
          } catch (settingsError) {
            console.error('Error saving project settings:', settingsError);
            // Don't fail the entire operation if settings fail
          }
        }
        
        setSuccessMessage('Project created successfully!');
      }
      
      // Reset form and refresh data
      setFormData({
        project_number: '',
        project_name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'active',
        // Project Settings
        allow_project_cost_codes: false,
        allocate_contract_lines_to_cost_codes: false,
        labor_cost_method: 'default'
      });
      setEditingProject(null);
      setShowForm(false);
      setErrors({});
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      setErrors({ submit: 'Error saving project. Please try again.' });
    }
  };

  const handleEdit = async (project) => {
    setEditingProject(project);
    setFormData({
      project_number: project.project_number || '',
      project_name: project.project_name || '',
      description: project.description || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status || 'active',
      // Project Settings - will be loaded from API
      allow_project_cost_codes: false,
      allocate_contract_lines_to_cost_codes: false,
      labor_cost_method: 'default'
    });
    setShowForm(true);
    setErrors({});

    // Load project settings
    try {
      const response = await axios.get(`http://localhost:5001/api/projects/${project.vuid}/settings`);
      const settings = response.data;
      setFormData(prev => ({
        ...prev,
        allow_project_cost_codes: settings.allow_project_cost_codes || false,
        allocate_contract_lines_to_cost_codes: settings.allocate_contract_lines_to_cost_codes || false,
        labor_cost_method: settings.labor_cost_method || 'default'
      }));
    } catch (error) {
      console.error('Error loading project settings:', error);
      // Keep default values if settings can't be loaded
    }
  };

  const handleDelete = async (projectVuid) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axios.delete(`http://localhost:5001/api/projects/${projectVuid}`);
        setSuccessMessage('Project deleted successfully!');
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        setErrors({ submit: 'Error deleting project. Please try again.' });
      }
    }
  };

  const handleIntegrationModal = (project) => {
    setSelectedProject(project);
    setShowIntegrationModal(true);
  };

  const fetchProjectsFromIntegration = async (integration) => {
    try {
      if (integration === 'procore') {
        const response = await axios.get('http://localhost:5001/api/mock-procore/projects');
        const projects = response.data.projects || response.data;
        setRetrievedProjectsData(projects);
      }
    } catch (error) {
      console.error('Error fetching projects from integration:', error);
      setRetrievedProjectsData([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const [successMessage, setSuccessMessage] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Projects</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowRetrieveModal(true);
                }}
                className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                📥 Retrieve Projects
              </button>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingProject(null);
                  setFormData({
                    project_number: '',
                    project_name: '',
                    description: '',
                    start_date: '',
                    end_date: '',
                    status: 'active',
                    // Project Settings
                    allow_project_cost_codes: false,
                    allocate_contract_lines_to_cost_codes: false,
                    labor_cost_method: 'default'
                  });
                  setErrors({});
                  // Scroll to top when opening the create form
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                + Create Project
              </button>
            </div>
          </div>
          
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-2xl p-6 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Projects
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Project number or name..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Status
                </label>
                <div className="relative filter-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setStatusFilterDropdownOpen(!statusFilterDropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white text-left font-medium text-gray-900"
                  >
                    {statusFilter === 'all' ? 'All Projects' : 
                     statusFilter === 'active' ? 'Active Projects' : 
                     statusFilter === 'completed' ? 'Completed Projects' : 
                     statusFilter === 'on-hold' ? 'On Hold Projects' : 
                     statusFilter === 'cancelled' ? 'Cancelled Projects' : 'All Projects'}
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {statusFilterDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {[
                        { value: 'all', label: 'All Projects' },
                        { value: 'active', label: 'Active Projects' },
                        { value: 'completed', label: 'Completed Projects' },
                        { value: 'on-hold', label: 'On Hold Projects' },
                        { value: 'cancelled', label: 'Cancelled Projects' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            handleFilterChange('status', option.value);
                            setStatusFilterDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left font-medium hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            statusFilter === option.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label htmlFor="dateFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Date Created
                </label>
                <div className="relative filter-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setDateFilterDropdownOpen(!dateFilterDropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white text-left font-medium text-gray-900"
                  >
                    {dateFilter === 'all' ? 'All Time' : 
                     dateFilter === 'recent' ? 'Last 30 Days' : 
                     dateFilter === 'older' ? 'Older than 90 Days' : 'All Time'}
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dateFilterDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {[
                        { value: 'all', label: 'All Time' },
                        { value: 'recent', label: 'Last 30 Days' },
                        { value: 'older', label: 'Older than 90 Days' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            handleFilterChange('date', option.value);
                            setDateFilterDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left font-medium hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            dateFilter === option.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{Array.isArray(filteredProjects) ? filteredProjects.length : 0}</span> of {Array.isArray(projects) ? projects.length : 0} projects
                </div>
              </div>
            </div>
          </div>

          {/* Projects List */}
          <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Projects ({Array.isArray(filteredProjects) ? filteredProjects.length : 0})
              </h2>
            </div>
            
            {!Array.isArray(projects) || projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No projects yet</h3>
                <p className="text-gray-600 mb-6 text-lg">Get started by creating your first project.</p>
                <button
                  onClick={() => {
                    setShowForm(true);
                    // Scroll to top when opening the create form
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Create Project
                </button>
              </div>
            ) : !Array.isArray(filteredProjects) || filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No projects found</h3>
                <p className="text-gray-600 mb-6 text-lg">Try adjusting your search criteria or filters.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                    setCurrentPage(1);
                  }}
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Committed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCurrentProjects().map((project) => (
                      <tr 
                        key={project.vuid} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.vuid}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {project.project_number.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{project.project_name}</div>
                              <div className="text-sm text-gray-500">{project.project_number}</div>
                              {project.description && (
                                <div className="text-xs text-gray-600 truncate max-w-xs" title={project.description}>
                                  {project.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              project.status === 'active' ? 'bg-green-100 text-green-800' :
                              project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Active'}
                            </span>
                            <IntegrationIndicator 
                              objectVuid={project.vuid} 
                              objectType="project" 
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(project.start_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(project.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${(project.total_contract_value || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${(project.total_committed || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${project.vuid}`);
                              }}
                              className="text-vermillion-600 hover:text-vermillion-700 p-1 hover:bg-vermillion-50 rounded transition-colors"
                              title="View project details"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIntegrationModal(project);
                              }}
                              className="text-green-500 hover:text-green-700 p-1 hover:bg-green-50 rounded transition-colors"
                              title="Send to integration"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(project);
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                              title="Edit project"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(project.vuid);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                              title="Delete project"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {Array.isArray(filteredProjects) && filteredProjects.length > projectsPerPage && (
              <div className="mt-8">
                {/* Page Info */}
                <div className="text-center mb-4 text-sm text-gray-600">
                  Showing {((currentPage - 1) * projectsPerPage) + 1} to {Math.min(currentPage * projectsPerPage, Array.isArray(filteredProjects) ? filteredProjects.length : 0)} of {Array.isArray(filteredProjects) ? filteredProjects.length : 0} projects
                </div>
                
                <div className="flex items-center justify-center">
                  <nav className="flex items-center space-x-2">
                    {/* Previous Page */}
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.ceil((Array.isArray(filteredProjects) ? filteredProjects.length : 0) / projectsPerPage) }, (_, i) => i + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === number
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {number}
                      </button>
                    ))}

                    {/* Next Page */}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === Math.ceil((Array.isArray(filteredProjects) ? filteredProjects.length : 0) / projectsPerPage)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === Math.ceil((Array.isArray(filteredProjects) ? filteredProjects.length : 0) / projectsPerPage)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Project Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="project_number" className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Number *
                    </label>
                    <input
                      type="text"
                      id="project_number"
                      value={formData.project_number}
                      onChange={(e) => setFormData({...formData, project_number: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 ${
                        errors.project_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter project number"
                    />
                    {errors.project_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.project_number}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="project_name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      id="project_name"
                      value={formData.project_name}
                      onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 ${
                        errors.project_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter project name"
                    />
                    {errors.project_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.project_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                    placeholder="Enter project description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Project Settings Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allow_project_cost_codes"
                        checked={formData.allow_project_cost_codes}
                        onChange={(e) => setFormData({...formData, allow_project_cost_codes: e.target.checked})}
                        className="h-4 w-4 text-gray-800 focus:ring-gray-800 border-gray-300 rounded"
                      />
                      <label htmlFor="allow_project_cost_codes" className="ml-2 block text-sm text-gray-700">
                        Allow Project Cost Codes
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">Enable custom cost codes specific to this project</p>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allocate_contract_lines_to_cost_codes"
                        checked={formData.allocate_contract_lines_to_cost_codes}
                        onChange={(e) => setFormData({...formData, allocate_contract_lines_to_cost_codes: e.target.checked})}
                        className="h-4 w-4 text-gray-800 focus:ring-gray-800 border-gray-300 rounded"
                      />
                      <label htmlFor="allocate_contract_lines_to_cost_codes" className="ml-2 block text-sm text-gray-700">
                        Allocate Contract Lines to Cost Codes
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">Automatically allocate contract line items to cost codes when creating billings</p>

                    <div>
                      <label htmlFor="labor_cost_method" className="block text-sm font-semibold text-gray-700 mb-2">
                        Labor Cost Method
                      </label>
                      <select
                        id="labor_cost_method"
                        value={formData.labor_cost_method}
                        onChange={(e) => setFormData({...formData, labor_cost_method: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                      >
                        <option value="default">Default</option>
                        <option value="hourly">Hourly</option>
                        <option value="salary">Salary</option>
                        <option value="contract">Contract</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Method for calculating labor costs for this project</p>
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{errors.submit}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Retrieve Projects Modal */}
        {showRetrieveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Retrieve Projects from Integration</h2>
                <button
                  onClick={() => setShowRetrieveModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Retrieve projects from Procore construction management system.
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={async () => {
                      setRetrieveIntegration('procore');
                      setShowRetrieveModal(false);
                      await fetchProjectsFromIntegration('procore');
                      setShowRetrievedProjectsModal(true);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 font-bold">P</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Procore</h3>
                        <p className="text-sm text-gray-500">Retrieve projects from Procore construction management</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retrieved Projects Modal */}
        {showRetrievedProjectsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Retrieved Projects from {retrieveIntegration?.charAt(0).toUpperCase() + retrieveIntegration?.slice(1)}
                </h2>
                <button
                  onClick={() => {
                    setShowRetrievedProjectsModal(false);
                    setRetrieveIntegration(null);
                    setRetrievedProjectsData([]);
                    setSelectedProjectsToImport([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Select the projects you want to import into Vermillion.
                </p>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedProjectsToImport.length === retrievedProjectsData.length && retrievedProjectsData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjectsToImport(retrievedProjectsData.map(p => p.id));
                          } else {
                            setSelectedProjectsToImport([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium text-gray-700">Select All</span>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {retrievedProjectsData.map((project) => (
                      <div key={project.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedProjectsToImport.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjectsToImport(prev => [...prev, project.id]);
                              } else {
                                setSelectedProjectsToImport(prev => prev.filter(id => id !== project.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{project.name || project.project_name}</h3>
                            <p className="text-sm text-gray-500">{project.description || project.number || 'No description'}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-400">Status: {project.status}</span>
                              <span className="text-xs text-gray-400">Start: {project.start_date}</span>
                              <span className="text-xs text-gray-400">End: {project.end_date}</span>
                              {project.project_manager && (
                                <span className="text-xs text-gray-400">PM: {project.project_manager}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowRetrievedProjectsModal(false);
                      setRetrieveIntegration(null);
                      setRetrievedProjectsData([]);
                      setSelectedProjectsToImport([]);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      // Import selected projects
                      try {
                        const projectsToImport = retrievedProjectsData.filter(project => 
                          selectedProjectsToImport.includes(project.id)
                        );
                        
                        for (const project of projectsToImport) {
                          const projectData = {
                            project_number: project.number || `IMPORT-${project.id}`,
                            project_name: project.name,
                            description: project.description || `Imported from ${retrieveIntegration}`,
                            start_date: project.start_date,
                            end_date: project.end_date,
                            status: project.status?.toLowerCase() === 'active' ? 'active' : 'inactive'
                          };
                          
                          await axios.post('http://localhost:5001/api/projects', projectData);
                        }
                        
                        setShowRetrievedProjectsModal(false);
                        setRetrieveIntegration(null);
                        setRetrievedProjectsData([]);
                        setSelectedProjectsToImport([]);
                        setSuccessMessage(`${selectedProjectsToImport.length} projects imported successfully!`);
                        
                        // Refresh the projects list
                        fetchProjects();
                      } catch (error) {
                        console.error('Error importing projects:', error);
                        setSuccessMessage('Error importing projects. Please try again.');
                      }
                    }}
                    disabled={selectedProjectsToImport.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Import {selectedProjectsToImport.length} Projects
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
