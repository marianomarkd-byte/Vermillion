import React, { useState, useEffect } from 'react';

const AccountingPeriods = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [formData, setFormData] = useState({
    month: '',
    year: '',
    status: 'open',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/accounting-periods');
      if (response.ok) {
        const data = await response.json();
        setPeriods(data);
      } else {
        setError('Failed to fetch accounting periods');
      }
    } catch (error) {
      setError('Error fetching accounting periods');
    } finally {
      setLoading(false);
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
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.month) {
      newErrors.month = 'Month is required';
    } else if (formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Month must be between 1 and 12';
    }
    
    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else if (formData.year < 2000 || formData.year > 2100) {
      newErrors.year = 'Year must be between 2000 and 2100';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const url = editingPeriod 
        ? `http://localhost:5001/api/accounting-periods/${editingPeriod.vuid}`
        : 'http://localhost:5001/api/accounting-periods';
      
      const method = editingPeriod ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const responseData = await response.json();
        await fetchData();
        
        // Check if this was a period being closed
        if (editingPeriod && responseData.was_closed) {
          // Automatically open the create form for a new period
          setShowForm(true);
          setEditingPeriod(null);
          setFormData({
            month: '',
            year: '',
            status: 'open',
            description: ''
          });
          setErrors({});
          // Scroll to top to show the create form
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Normal behavior for create or other updates
          handleCancelEdit();
          setShowForm(false);
        }
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'An error occurred while saving the accounting period' });
      }
    } catch (error) {
      console.error('Error creating/updating accounting period:', error);
      setErrors({ submit: 'Network error occurred while saving the accounting period' });
    }
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    setFormData({
      month: period.month,
      year: period.year,
      status: period.status,
      description: period.description || ''
    });
    setShowForm(true);
    setErrors({});
    // Scroll to top to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPeriod(null);
    setFormData({
      month: '',
      year: '',
      status: 'open',
      description: ''
    });
    setShowForm(false);
    setErrors({});
  };

  const handleDelete = async (vuid) => {
    if (!window.confirm('Are you sure you want to delete this accounting period?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/accounting-periods/${vuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPeriods(periods.filter(period => period.vuid !== vuid));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete accounting period');
      }
    } catch (error) {
      alert('An error occurred while deleting the accounting period');
    }
  };

  const filterAndPaginatePeriods = () => {
    let filtered = periods.filter(period => {
      const matchesSearch = searchTerm === '' || 
        monthNames[period.month - 1].toLowerCase().includes(searchTerm.toLowerCase()) ||
        period.year.toString().includes(searchTerm) ||
        period.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || period.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort by year (desc) then month (desc)
    filtered.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });

    return filtered;
  };

  const getCurrentPeriods = () => {
    const filtered = filterAndPaginatePeriods();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filterAndPaginatePeriods().length / itemsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-amber-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-sans">
            Accounting Periods
          </h1>
          <p className="text-xl text-gray-700 font-light">
            Manage monthly accounting periods and their status
          </p>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  // Scroll to top when opening the create form
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {showForm ? 'Cancel' : '+ Create New Period'}
            </button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingPeriod ? 'Edit Accounting Period' : 'Create New Accounting Period'}
            </h2>
            
            {/* Validation Rule Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-blue-800 font-medium">Important Rule</p>
                  <p className="text-blue-700 text-sm mt-1">
                    At least one accounting period must remain open at all times. When you close a period, 
                    the system will automatically prompt you to create a new open period.
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">{errors.submit}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="month" className="block text-lg font-semibold text-gray-900 mb-2">
                    Month *
                  </label>
                  <select
                    id="month"
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.month ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Month</option>
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                  {errors.month && (
                    <p className="mt-2 text-red-600 font-medium">{errors.month}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="year" className="block text-lg font-semibold text-gray-900 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="2000"
                    max="2100"
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.year ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 2024"
                  />
                  {errors.year && (
                    <p className="mt-2 text-red-600 font-medium">{errors.year}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block text-lg font-semibold text-gray-900 mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.status ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                  {errors.status && (
                    <p className="mt-2 text-red-600 font-medium">{errors.status}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="flex justify-center space-x-4 pt-6">
                <button
                  type="submit"
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {editingPeriod ? 'Update Period' : 'Create Period'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{periods.length}</div>
              <div className="text-sm text-gray-600">Total Periods</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {periods.filter(p => p.status === 'open').length}
              </div>
              <div className="text-sm text-gray-600">Open Periods</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {periods.filter(p => p.status === 'closed').length}
              </div>
              <div className="text-sm text-gray-600">Closed Periods</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by month, year, or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Accounting Periods List */}
        {periods.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No accounting periods yet</h3>
            <p className="text-gray-600 mb-6 text-lg">Get started by creating your first accounting period.</p>
            <button
              onClick={() => {
                setShowForm(true);
                // Scroll to top when opening the create form
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Create Period
            </button>
          </div>
        ) : filterAndPaginatePeriods().length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No periods found</h3>
            <p className="text-gray-600 mb-6 text-lg">Try adjusting your search criteria or filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {getCurrentPeriods().map((period) => (
              <div
                key={period.vuid}
                className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {period.month.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {monthNames[period.month - 1]} {period.year}
                        </h3>
                        {period.description && (
                          <p className="text-base text-gray-700 mt-2 line-clamp-2">
                            {period.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            period.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {period.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                          </span>
                          {period.status === 'open' && (
                            <span className="text-xs text-green-600 font-medium">
                              (Active Period)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      <span>Created: {formatDate(period.created_at)}</span>
                      {period.updated_at !== period.created_at && (
                        <span className="ml-4">Updated: {formatDate(period.updated_at)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-mono">VUID</p>
                      <p className="text-xs text-gray-600 font-mono">{period.vuid.slice(0, 8)}...</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(period);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(period.vuid);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-lg ${
                    currentPage === page
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {periods.length > 0 && (
          <div className="text-center mt-8 text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filterAndPaginatePeriods().length)} of {filterAndPaginatePeriods().length} accounting periods
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingPeriods;
