import React, { useState, useEffect } from 'react';

const CostTypes = () => {
  const [costTypes, setCostTypes] = useState([]);
  const [formData, setFormData] = useState({
    cost_type: '',
    abbreviation: '',
    description: '',
    expense_account: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [filteredCostTypes, setFilteredCostTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [costTypesPerPage] = useState(10);
  const [editingCostType, setEditingCostType] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [formStatusDropdownOpen, setFormStatusDropdownOpen] = useState(false);
  const [expenseAccountDropdownOpen, setExpenseAccountDropdownOpen] = useState(false);
  const [expenseAccounts, setExpenseAccounts] = useState([]);

  useEffect(() => {
    fetchCostTypes();
    fetchExpenseAccounts();
  }, []);

  // Add click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setStatusDropdownOpen(false);
        setFormStatusDropdownOpen(false);
        setExpenseAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    filterAndPaginateCostTypes();
  }, [costTypes, searchTerm, statusFilter]);

  const filterAndPaginateCostTypes = () => {
    let filtered = costTypes.filter(costType => {
      const matchesSearch = 
        (costType.cost_type && costType.cost_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (costType.description && costType.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (costType.expense_account && costType.expense_account.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || costType.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredCostTypes(filtered);
    setCurrentPage(1);
  };

  const getCurrentCostTypes = () => {
    const indexOfLastCostType = currentPage * costTypesPerPage;
    const indexOfFirstCostType = indexOfLastCostType - costTypesPerPage;
    return filteredCostTypes.slice(indexOfFirstCostType, indexOfLastCostType);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'search') {
      setSearchTerm(value);
    } else if (filterType === 'status') {
      setStatusFilter(value);
    }
    setCurrentPage(1);
  };

  const fetchCostTypes = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/costtypes');
      if (response.ok) {
        const data = await response.json();
        setCostTypes(data);
      } else {
        console.error('Failed to fetch cost types');
      }
    } catch (error) {
      console.error('Error fetching cost types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseAccounts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/chartofaccounts');
      if (response.ok) {
        const data = await response.json();
        // Filter only expense accounts
        const expenseAccountsData = data.filter(account => 
          account.account_type === 'Expense' && account.status === 'active'
        );
        setExpenseAccounts(expenseAccountsData);
      } else {
        console.error('Failed to fetch expense accounts');
      }
    } catch (error) {
      console.error('Error fetching expense accounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.cost_type.trim()) newErrors.cost_type = 'Cost type is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.expense_account.trim()) newErrors.expense_account = 'Expense account is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingCostType 
        ? `http://localhost:5001/api/costtypes/${editingCostType.vuid}`
        : 'http://localhost:5001/api/costtypes';
      
      const method = editingCostType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (editingCostType) {
          setCostTypes(costTypes.map(ct => 
            ct.vuid === editingCostType.vuid ? result : ct
          ));
        } else {
          setCostTypes([...costTypes, result]);
        }
        
        setFormData({
          cost_type: '',
          abbreviation: '',
          description: '',
          expense_account: '',
          status: 'active'
        });
        setEditingCostType(null);
        setShowCreateForm(false);
        setErrors({});
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'An error occurred' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while saving the cost type' });
    }
  };

  const handleEdit = (costType) => {
    setEditingCostType(costType);
    setFormData({
      cost_type: costType.cost_type,
      abbreviation: costType.abbreviation,
      description: costType.description,
      expense_account: costType.expense_account,
      status: costType.status
    });
  };

  const handleCancelEdit = () => {
    setEditingCostType(null);
    setShowCreateForm(false);
    setFormData({
      cost_type: '',
      abbreviation: '',
      description: '',
      expense_account: '',
      status: 'active'
    });
    setErrors({});
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setEditingCostType(null);
    setFormData({
      cost_type: '',
      abbreviation: '',
      description: '',
      expense_account: '',
      status: 'active'
    });
    setErrors({});
  };

  const handleDelete = async (vuid) => {
    if (!window.confirm('Are you sure you want to delete this cost type?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/costtypes/${vuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCostTypes(costTypes.filter(ct => ct.vuid !== vuid));
      } else {
        alert('Failed to delete cost type');
      }
    } catch (error) {
      alert('An error occurred while deleting the cost type');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate abbreviation when cost_type changes
    if (name === 'cost_type' && value.trim()) {
      setFormData(prev => ({
        ...prev,
        abbreviation: value[0].toUpperCase()
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading cost types...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-sans">
            Cost Types
          </h1>
          <p className="text-xl text-gray-700 font-light">
            Manage construction cost type categories and expense accounts
          </p>
        </div>

        {/* Create Cost Type Button */}
        <div className="text-center mb-8">
          <button
            onClick={showCreateForm ? handleCancelEdit : handleShowCreateForm}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {showCreateForm ? 'Cancel' : '+ Create New Cost Type'}
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingCostType) && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingCostType ? 'Edit Cost Type' : 'Create New Cost Type'}
            </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-medium">{errors.submit}</p>
              </div>
            )}
            
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cost_type" className="block text-lg font-semibold text-gray-900 mb-2">
                  Cost Type *
                </label>
                <input
                  type="text"
                  id="cost_type"
                  name="cost_type"
                  value={formData.cost_type}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                    errors.cost_type ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Labor, Materials, Equipment"
                />
                {errors.cost_type && (
                  <p className="text-red-600 font-medium mt-2">{errors.cost_type}</p>
                )}
              </div>

              <div>
                <label htmlFor="abbreviation" className="block text-lg font-semibold text-gray-900 mb-2">
                  Abbreviation
                </label>
                <input
                  type="text"
                  id="abbreviation"
                  name="abbreviation"
                  value={formData.abbreviation}
                  onChange={handleInputChange}
                  maxLength={10}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                  placeholder="Auto-generated from cost type"
                />
                <p className="text-sm text-gray-500 mt-2">
                  First letter of cost type (auto-generated if left empty)
                </p>
              </div>

            <div>
              <label htmlFor="expense_account" className="block text-lg font-semibold text-gray-900 mb-2">
                Expense Account *
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setExpenseAccountDropdownOpen(!expenseAccountDropdownOpen)}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white ${
                    errors.expense_account ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {formData.expense_account || 'Select Expense Account'}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expenseAccountDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="py-1">
                      {expenseAccounts.map((account) => (
                        <button
                          key={account.vuid}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              expense_account: `${account.account_number} - ${account.account_name}` 
                            }));
                            setExpenseAccountDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-semibold">{account.account_number} - {account.account_name}</div>
                          <div className="text-sm text-gray-600">{account.account_category}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {errors.expense_account && (
                <p className="text-red-600 font-medium mt-2">{errors.expense_account}</p>
              )}
            </div>

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
                  {formData.status === 'active' ? 'Active' : 'Inactive'}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {formStatusDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, status: 'active' }));
                          setFormStatusDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, status: 'inactive' }));
                          setFormStatusDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        Inactive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter detailed description of the cost type"
              />
              {errors.description && (
                <p className="text-red-600 font-medium mt-2">{errors.description}</p>
              )}
            </div>

            </div>

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
                {editingCostType ? 'Update Cost Type' : 'Create Cost Type'}
              </button>
            </div>
          </form>
        </div>
        )}

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
                placeholder="Search by cost type, description, or account..."
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
                   statusFilter === 'active' ? 'Active' : 'Inactive'}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {statusDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' }
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

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Cost Types List */}
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Cost Types ({filteredCostTypes.length})
            </h2>
            <div className="text-lg text-gray-600">
              Showing {getCurrentCostTypes().length} of {filteredCostTypes.length}
            </div>
          </div>

          {filteredCostTypes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {searchTerm || statusFilter !== 'all' ? 'No cost types found' : 'No cost types yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first cost type.'
                }
              </p>
              {!(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => setEditingCostType(null)}
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Create Cost Type
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {getCurrentCostTypes().map((costType) => (
                  <div
                    key={costType.vuid}
                    className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {costType.abbreviation || costType.cost_type[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">{costType.cost_type}</h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-lg text-gray-600 font-medium">{costType.expense_account}</p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                costType.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {costType.status.charAt(0).toUpperCase() + costType.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-base text-gray-700">{costType.description}</p>
                        </div>
                        
                        <div className="mt-4 text-sm text-gray-500">
                          <span>Created: {new Date(costType.created_at).toLocaleDateString()}</span>
                          {costType.updated_at !== costType.created_at && (
                            <span className="ml-4">Updated: {new Date(costType.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-mono">VUID</p>
                          <p className="text-xs text-gray-600 font-mono">{costType.vuid.slice(0, 8)}...</p>
                        </div>
                        <button
                          onClick={() => handleEdit(costType)}
                          className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit cost type"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(costType.vuid)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete cost type"
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
              {filteredCostTypes.length > costTypesPerPage && (
                <div className="mt-8">
                  {/* Page Info */}
                  <div className="text-center mb-4 text-sm text-gray-600">
                    Showing {((currentPage - 1) * costTypesPerPage) + 1} to {Math.min(currentPage * costTypesPerPage, filteredCostTypes.length)} of {filteredCostTypes.length} cost types
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
                      {Array.from({ length: Math.ceil(filteredCostTypes.length / costTypesPerPage) }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === Math.ceil(filteredCostTypes.length / costTypesPerPage) || 
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
                        disabled={currentPage === Math.ceil(filteredCostTypes.length / costTypesPerPage)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === Math.ceil(filteredCostTypes.length / costTypesPerPage)
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
      </div>
    </div>
  );
};

export default CostTypes;
