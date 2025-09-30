import React, { useState, useEffect } from 'react';

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [formData, setFormData] = useState({
    integration_name: '',
    integration_type: '',
    client_id: '',
    client_secret: '',
    access_token: '',
    refresh_token: '',
    token_type: '',
    expires_at: '',
    scope: '',
    redirect_uri: '',
    webhook_url: '',
    api_key: '',
    base_url: '',
    status: 'active',
    custom_metadata: {},
    enabled_objects: {}
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [filteredIntegrations, setFilteredIntegrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [integrationsPerPage] = useState(10);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [formStatusDropdownOpen, setFormStatusDropdownOpen] = useState(false);
  const [formTypeDropdownOpen, setFormTypeDropdownOpen] = useState(false);
  const [availableObjects, setAvailableObjects] = useState({});

  useEffect(() => {
    fetchIntegrations();
    fetchAvailableObjects();
  }, []);

  // Add click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setStatusDropdownOpen(false);
        setTypeDropdownOpen(false);
        setFormStatusDropdownOpen(false);
        setFormTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    filterAndPaginateIntegrations();
  }, [integrations, searchTerm, statusFilter, typeFilter]);

  const filterAndPaginateIntegrations = () => {
    let filtered = integrations.filter(integration => {
      const matchesSearch = 
        integration.integration_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.integration_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (integration.base_url && integration.base_url.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || integration.status === statusFilter;
      const matchesType = typeFilter === 'all' || integration.integration_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
    
    setFilteredIntegrations(filtered);
    setCurrentPage(1);
  };

  const getCurrentIntegrations = () => {
    const indexOfLastIntegration = currentPage * integrationsPerPage;
    const indexOfFirstIntegration = indexOfLastIntegration - integrationsPerPage;
    return filteredIntegrations.slice(indexOfFirstIntegration, indexOfLastIntegration);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'search') {
      setSearchTerm(value);
    } else if (filterType === 'status') {
      setStatusFilter(value);
    } else if (filterType === 'type') {
      setTypeFilter(value);
    }
    setCurrentPage(1);
  };

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      } else {
        console.error('Failed to fetch integrations');
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableObjects = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/integrations/available-objects');
      if (response.ok) {
        const data = await response.json();
        setAvailableObjects(data);
      } else {
        console.error('Failed to fetch available objects');
      }
    } catch (error) {
      console.error('Error fetching available objects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.integration_name.trim()) newErrors.integration_name = 'Integration name is required';
    if (!formData.integration_type.trim()) newErrors.integration_type = 'Integration type is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingIntegration 
        ? `http://localhost:5001/api/integrations/${editingIntegration.vuid}`
        : 'http://localhost:5001/api/integrations';
      
      const method = editingIntegration ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (editingIntegration) {
          setIntegrations(integrations.map(integration => 
            integration.vuid === editingIntegration.vuid ? result : integration
          ));
        } else {
          setIntegrations([...integrations, result]);
        }
        
        handleCancelEdit();
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'An error occurred' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while saving the integration' });
    }
  };

  const handleEdit = (integration) => {
    setEditingIntegration(integration);
    setFormData({
      integration_name: integration.integration_name,
      integration_type: integration.integration_type,
      client_id: integration.client_id || '',
      client_secret: integration.client_secret || '',
      access_token: integration.access_token || '',
      refresh_token: integration.refresh_token || '',
      token_type: integration.token_type || '',
      expires_at: integration.expires_at || '',
      scope: integration.scope || '',
      redirect_uri: integration.redirect_uri || '',
      webhook_url: integration.webhook_url || '',
      api_key: integration.api_key || '',
      base_url: integration.base_url || '',
      status: integration.status,
      custom_metadata: integration.custom_metadata || {},
      enabled_objects: integration.enabled_objects || {}
    });
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingIntegration(null);
    setShowCreateForm(false);
    setFormData({
      integration_name: '',
      integration_type: '',
      client_id: '',
      client_secret: '',
      access_token: '',
      refresh_token: '',
      token_type: '',
      expires_at: '',
      scope: '',
      redirect_uri: '',
      webhook_url: '',
      api_key: '',
      base_url: '',
      status: 'active',
      custom_metadata: {},
      enabled_objects: {}
    });
    setErrors({});
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    if (editingIntegration) {
      handleCancelEdit();
    }
  };

  const handleDelete = async (vuid) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/integrations/${vuid}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIntegrations(integrations.filter(integration => integration.vuid !== vuid));
        } else {
          console.error('Failed to delete integration');
        }
      } catch (error) {
        console.error('Error deleting integration:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'oauth': return 'bg-blue-100 text-blue-800';
      case 'api_key': return 'bg-purple-100 text-purple-800';
      case 'webhook': return 'bg-orange-100 text-orange-800';
      case 'basic_auth': return 'bg-indigo-100 text-indigo-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-sans">
            Integrations
          </h1>
          <p className="text-xl text-gray-700 font-light">
            Manage third-party service integrations and OAuth tokens
          </p>
        </div>

        {/* Create Integration Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleShowCreateForm}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Create New Integration
          </button>
        </div>



        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by integration name, type, or base URL..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white text-left font-medium text-gray-900"
                >
                  {statusFilter === 'all' ? 'All Statuses' : 
                   statusFilter === 'active' ? 'Active' : 
                   statusFilter === 'inactive' ? 'Inactive' : 'Error'}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {statusDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'error', label: 'Error' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleFilterChange('status', option.value);
                          setStatusDropdownOpen(false);
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

            {/* Type Filter */}
            <div>
              <label htmlFor="typeFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                Type
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white text-left font-medium text-gray-900"
                >
                  {typeFilter === 'all' ? 'All Types' : 
                   typeFilter === 'oauth' ? 'OAuth' : 
                   typeFilter === 'api_key' ? 'API Key' : 
                   typeFilter === 'webhook' ? 'Webhook' : 
                   typeFilter === 'basic_auth' ? 'Basic Auth' : 'Custom'}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {typeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {[
                      { value: 'all', label: 'All Types' },
                      { value: 'oauth', label: 'OAuth' },
                      { value: 'api_key', label: 'API Key' },
                      { value: 'webhook', label: 'Webhook' },
                      { value: 'basic_auth', label: 'Basic Auth' },
                      { value: 'custom', label: 'Custom' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleFilterChange('type', option.value);
                          setTypeDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left font-medium hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          typeFilter === option.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Integrations List */}
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Integrations ({filteredIntegrations.length})
            </h2>
            <div className="text-lg text-gray-600">
              Showing {getCurrentIntegrations().length} of {filteredIntegrations.length}
            </div>
          </div>

          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'No integrations found' : 'No integrations yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first integration.'
                }
              </p>
              {!(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <button
                  onClick={() => setEditingIntegration(null)}
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Create Integration
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {getCurrentIntegrations().map((integration) => (
                  <div
                    key={integration.vuid}
                    className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {integration.integration_name[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{integration.integration_name}</h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(integration.integration_type)}`}>
                                {integration.integration_type === 'oauth' ? 'OAuth' : 
                                 integration.integration_type === 'api_key' ? 'API Key' : 
                                 integration.integration_type === 'webhook' ? 'Webhook' : 
                                 integration.integration_type === 'basic_auth' ? 'Basic Auth' : 'Custom'}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                                {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                          {integration.base_url && (
                            <p><span className="font-medium">Base URL:</span> {integration.base_url}</p>
                          )}
                          {integration.client_id && (
                            <p><span className="font-medium">Client ID:</span> {integration.client_id.slice(0, 20)}...</p>
                          )}
                          {integration.scope && (
                            <p><span className="font-medium">Scope:</span> {integration.scope}</p>
                          )}
                          {integration.last_sync && (
                            <p><span className="font-medium">Last Sync:</span> {new Date(integration.last_sync).toLocaleDateString()}</p>
                          )}
                        </div>
                        
                        <div className="mt-4 text-sm text-gray-500">
                          <span>Created: {new Date(integration.created_at).toLocaleDateString()}</span>
                          {integration.updated_at !== integration.created_at && (
                            <span className="ml-4">Updated: {new Date(integration.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-mono">VUID</p>
                          <p className="text-xs text-gray-600 font-mono">{integration.vuid.slice(0, 8)}...</p>
                        </div>
                        <button
                          onClick={() => handleEdit(integration)}
                          className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit integration"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(integration.vuid)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 transition-colors"
                          title="Delete integration"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            {/* Pagination */}
            {filteredIntegrations.length > integrationsPerPage && (
              <div className="mt-8">
                {/* Page Info */}
                <div className="text-center mb-4 text-sm text-gray-600">
                  Showing {((currentPage - 1) * integrationsPerPage) + 1} to {Math.min(currentPage * integrationsPerPage, filteredIntegrations.length)} of {filteredIntegrations.length} integrations
                </div>
                
                <div className="flex items-center justify-center">
                  <nav className="flex items-center space-x-2">
                    {/* Previous Page */}
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.ceil(filteredIntegrations.length / integrationsPerPage) }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === Math.ceil(filteredIntegrations.length / integrationsPerPage) || 
                                   (page >= currentPage - 2 && page <= currentPage + 2))
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-3 py-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => paginate(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                              currentPage === page
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    
                    {/* Next Page */}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === Math.ceil(filteredIntegrations.length / integrationsPerPage)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        currentPage === Math.ceil(filteredIntegrations.length / integrationsPerPage)
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingIntegration) && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mt-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingIntegration ? 'Edit Integration' : 'Create New Integration'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Integration Name */}
                <div>
                  <label htmlFor="integration_name" className="block text-lg font-semibold text-gray-900 mb-2">
                    Integration Name *
                  </label>
                  <input
                    type="text"
                    id="integration_name"
                    name="integration_name"
                    value={formData.integration_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.integration_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., QuickBooks Online"
                  />
                  {errors.integration_name && (
                    <p className="text-red-600 font-medium mt-2">{errors.integration_name}</p>
                  )}
                </div>

                {/* Integration Type */}
                <div>
                  <label htmlFor="integration_type" className="block text-lg font-semibold text-gray-900 mb-2">
                    Integration Type *
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setFormTypeDropdownOpen(!formTypeDropdownOpen)}
                      className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white ${
                        errors.integration_type ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {formData.integration_type || 'Select Integration Type'}
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {formTypeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          {[
                            { value: 'oauth', label: 'OAuth' },
                            { value: 'api_key', label: 'API Key' },
                            { value: 'webhook', label: 'Webhook' },
                            { value: 'basic_auth', label: 'Basic Auth' },
                            { value: 'custom', label: 'Custom' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, integration_type: option.value }));
                                setFormTypeDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.integration_type && (
                    <p className="text-red-600 font-medium mt-2">{errors.integration_type}</p>
                  )}
                </div>

                {/* Client ID */}
                <div>
                  <label htmlFor="client_id" className="block text-lg font-semibold text-gray-900 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    id="client_id"
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="OAuth client ID"
                  />
                </div>

                {/* Client Secret */}
                <div>
                  <label htmlFor="client_secret" className="block text-lg font-semibold text-gray-900 mb-2">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    id="client_secret"
                    name="client_secret"
                    value={formData.client_secret}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="OAuth client secret"
                  />
                </div>

                {/* Access Token */}
                <div>
                  <label htmlFor="access_token" className="block text-lg font-semibold text-gray-900 mb-2">
                    Access Token
                  </label>
                  <input
                    type="password"
                    id="access_token"
                    name="access_token"
                    value={formData.access_token}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="OAuth access token"
                  />
                </div>

                {/* Refresh Token */}
                <div>
                  <label htmlFor="refresh_token" className="block text-lg font-semibold text-gray-900 mb-2">
                    Refresh Token
                  </label>
                  <input
                    type="password"
                    id="refresh_token"
                    name="refresh_token"
                    value={formData.refresh_token}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="OAuth refresh token"
                  />
                </div>

                {/* Token Type */}
                <div>
                  <label htmlFor="token_type" className="block text-lg font-semibold text-gray-900 mb-2">
                    Token Type
                  </label>
                  <input
                    type="text"
                    id="token_type"
                    name="token_type"
                    value={formData.token_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., Bearer"
                  />
                </div>

                {/* Expires At */}
                <div>
                  <label htmlFor="expires_at" className="block text-lg font-semibold text-gray-900 mb-2">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    id="expires_at"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                  />
                </div>

                {/* Scope */}
                <div>
                  <label htmlFor="scope" className="block text-lg font-semibold text-gray-900 mb-2">
                    Scope
                  </label>
                  <input
                    type="text"
                    id="scope"
                    name="scope"
                    value={formData.scope}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="OAuth scopes"
                  />
                </div>

                {/* Redirect URI */}
                <div>
                  <label htmlFor="redirect_uri" className="block text-lg font-semibold text-gray-900 mb-2">
                    Redirect URI
                  </label>
                  <input
                    type="url"
                    id="redirect_uri"
                    name="redirect_uri"
                    value={formData.redirect_uri}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="OAuth redirect URI"
                  />
                </div>

                {/* Webhook URL */}
                <div>
                  <label htmlFor="webhook_url" className="block text-lg font-semibold text-gray-900 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    id="webhook_url"
                    name="webhook_url"
                    value={formData.webhook_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="Webhook endpoint URL"
                  />
                </div>

                {/* API Key */}
                <div>
                  <label htmlFor="api_key" className="block text-lg font-semibold text-gray-900 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="api_key"
                    name="api_key"
                    value={formData.api_key}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="API key for the service"
                  />
                </div>

                {/* Base URL */}
                <div>
                  <label htmlFor="base_url" className="block text-lg font-semibold text-gray-900 mb-2">
                    Base URL
                  </label>
                  <input
                    type="url"
                    id="base_url"
                    name="base_url"
                    value={formData.base_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="Base URL for the service"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-lg font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setFormStatusDropdownOpen(!formStatusDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white"
                    >
                      {formData.status === 'active' ? 'Active' : formData.status === 'inactive' ? 'Inactive' : 'Error'}
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {formStatusDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          {[
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                            { value: 'error', label: 'Error' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, status: option.value }));
                                setFormStatusDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Objects Tab */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Integration Objects</h3>
                <p className="text-gray-600 mb-6">
                  Select which objects should display this integration when using send or retrieve functions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(availableObjects).map(([key, obj]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`enabled_${key}`}
                          checked={formData.enabled_objects?.[key] || false}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              enabled_objects: {
                                ...prev.enabled_objects,
                                [key]: e.target.checked
                              }
                            }));
                          }}
                          className="mt-1 w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-gray-800 focus:ring-2"
                        />
                        <div className="flex-1">
                          <label htmlFor={`enabled_${key}`} className="block text-sm font-semibold text-gray-900 cursor-pointer">
                            {obj.name}
                          </label>
                          <p className="text-xs text-gray-600 mt-1">{obj.description}</p>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {obj.operations.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">{errors.submit}</p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-all"
                >
                  {editingIntegration ? 'Update Integration' : 'Create Integration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Integrations;
