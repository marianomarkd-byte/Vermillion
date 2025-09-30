import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CostCodes = () => {
  const [costCodes, setCostCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCostCode, setEditingCostCode] = useState(null);
  const [errors, setErrors] = useState({});
  const [filteredCostCodes, setFilteredCostCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [costCodesPerPage] = useState(20);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [divisionDropdownOpen, setDivisionDropdownOpen] = useState(false);
  const [formStatusDropdownOpen, setFormStatusDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    division: '',
    status: 'active'
  });

  useEffect(() => {
    fetchCostCodes();
  }, []);

  // Add click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setStatusDropdownOpen(false);
        setDivisionDropdownOpen(false);
        setFormStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and paginate cost codes whenever cost codes or filters change
  useEffect(() => {
    filterAndPaginateCostCodes();
  }, [costCodes, searchTerm, statusFilter, divisionFilter, currentPage]);

  const filterAndPaginateCostCodes = () => {
    let filtered = costCodes;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(costCode =>
        (costCode.code && costCode.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (costCode.description && costCode.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (costCode.division && costCode.division.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(costCode => costCode.status === statusFilter);
    }

    // Apply division filter
    if (divisionFilter !== 'all') {
      filtered = filtered.filter(costCode => costCode.division === divisionFilter);
    }

    setFilteredCostCodes(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const baseURL = 'http://localhost:5001';
      if (editingCostCode) {
        await axios.put(`${baseURL}/api/costcodes/${editingCostCode.vuid}`, formData);
      } else {
        await axios.post(`${baseURL}/api/costcodes`, formData);
      }
      fetchCostCodes();
      setShowForm(false);
      setEditingCostCode(null);
      setFormData({
        code: '',
        description: '',
        division: '',
        status: 'active'
      });
    } catch (error) {
      console.error('Error saving cost code:', error);
      setErrors(error.response?.data || { error: 'An error occurred' });
    }
  };

  const handleEdit = (costCode) => {
    setEditingCostCode(costCode);
    setFormData({
      code: costCode.code,
      description: costCode.description,
      division: costCode.division,
      status: costCode.status
    });
    setShowForm(true);
  };

  const handleDelete = async (costCode) => {
    if (window.confirm(`Are you sure you want to delete the cost code "${costCode.code}"?`)) {
      try {
        const baseURL = 'http://localhost:5001';
        await axios.delete(`${baseURL}/api/costcodes/${costCode.vuid}`);
        fetchCostCodes();
      } catch (error) {
        console.error('Error deleting cost code:', error);
        alert('Error deleting cost code');
      }
    }
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'search':
        setSearchTerm(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'division':
        setDivisionFilter(value);
        break;
      default:
        break;
    }
    setCurrentPage(1);
  };

  const getUniqueDivisions = () => {
    const divisions = [...new Set(costCodes.map(code => code.division))];
    return divisions.sort();
  };

  const getCurrentCostCodes = () => {
    const startIndex = (currentPage - 1) * costCodesPerPage;
    const endIndex = startIndex + costCodesPerPage;
    return filteredCostCodes.slice(startIndex, endIndex);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const fetchCostCodes = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/costcodes`);
      setCostCodes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cost codes:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading cost codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cost Codes</h1>
          <p className="text-xl text-gray-600">Manage construction cost codes and classifications</p>
        </div>

        {/* Add Cost Code Button */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => {
              setEditingCostCode(null);
              setFormData({
                code: '',
                description: '',
                division: '',
                status: 'active'
              });
              setShowForm(true);
            }}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Add Cost Code
          </button>
        </div>

        {/* Create/Edit Cost Code Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingCostCode ? 'Edit Cost Code' : 'Add New Cost Code'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">{errors.error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="code" className="block text-lg font-semibold text-gray-900 mb-2">
                    Code *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., 00 01 01"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="division" className="block text-lg font-semibold text-gray-900 mb-2">
                    Division *
                  </label>
                  <input
                    type="text"
                    id="division"
                    name="division"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., 00"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all resize-none"
                    placeholder="Enter cost code description"
                    required
                  />
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
                              setFormData({ ...formData, status: 'active' });
                              setFormStatusDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Active
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, status: 'inactive' });
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
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  type="submit"
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {editingCostCode ? 'Update Cost Code' : 'Create Cost Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCostCode(null);
                    setErrors({});
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search cost codes..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
              >
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
                <svg className="inline ml-2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {statusDropdownOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-300">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleFilterChange('status', 'all');
                        setStatusDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('status', 'active');
                        setStatusDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        handleFilterChange('status', 'inactive');
                        setStatusDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Division Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setDivisionDropdownOpen(!divisionDropdownOpen)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
              >
                Division: {divisionFilter === 'all' ? 'All' : divisionFilter}
                <svg className="inline ml-2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {divisionDropdownOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-300 max-h-96 overflow-y-auto">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleFilterChange('division', 'all');
                        setDivisionDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      All
                    </button>
                    {getUniqueDivisions().map(division => (
                      <button
                        key={division}
                        onClick={() => {
                          handleFilterChange('division', division);
                          setDivisionDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        {division}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cost Codes Tiles */}
        {filteredCostCodes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cost codes found</h3>
            <p className="text-gray-600">Get started by creating your first cost code.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getCurrentCostCodes().map((costCode) => (
                <div key={costCode.vuid} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {costCode.division}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{costCode.code}</h3>
                      <p className="text-lg text-gray-600 font-medium">{costCode.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          costCode.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {costCode.status.charAt(0).toUpperCase() + costCode.status.slice(1)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                          Div {costCode.division}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Code:</span> {costCode.code}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Division:</span> {costCode.division}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Description:</span> {costCode.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-mono">VUID</p>
                      <p className="text-xs text-gray-600 font-mono">{costCode.vuid.slice(0, 8)}...</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEdit(costCode)}
                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit cost code"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(costCode)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete cost code"
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
          </>
        )}

        {/* Pagination */}
        {filteredCostCodes.length > costCodesPerPage && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.ceil(filteredCostCodes.length / costCodesPerPage) }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === number
                      ? 'bg-vermillion-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {number}
                </button>
              ))}
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === Math.ceil(filteredCostCodes.length / costCodesPerPage)}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostCodes;