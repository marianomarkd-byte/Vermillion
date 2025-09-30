import React, { useState, useEffect } from 'react';

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    account_type: '',
    account_category: '',
    account_subcategory: '',
    description: '',
    normal_balance: 'Debit',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [accountsPerPage] = useState(20);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Dropdown states
  const [accountTypeDropdownOpen, setAccountTypeDropdownOpen] = useState(false);
  const [normalBalanceDropdownOpen, setNormalBalanceDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [filterAccountTypeDropdownOpen, setFilterAccountTypeDropdownOpen] = useState(false);

  // Account type options
  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
  const normalBalances = ['Debit', 'Credit'];
  const statuses = ['active', 'inactive'];

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAndPaginateAccounts();
  }, [accounts, searchTerm, accountTypeFilter]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setAccountTypeDropdownOpen(false);
        setNormalBalanceDropdownOpen(false);
        setStatusDropdownOpen(false);
        setFilterAccountTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/chartofaccounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        console.error('Failed to fetch accounts');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndPaginateAccounts = () => {
    let filtered = accounts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply account type filter
    if (accountTypeFilter !== 'all') {
      filtered = filtered.filter(account => account.account_type === accountTypeFilter);
    }

    setFilteredAccounts(filtered);
    setCurrentPage(1);
  };

  const getCurrentAccounts = () => {
    const indexOfLastAccount = currentPage * accountsPerPage;
    const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
    return filteredAccounts.slice(indexOfFirstAccount, indexOfLastAccount);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'accountType') {
      setAccountTypeFilter(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const newErrors = {};
    if (!formData.account_number.trim()) {
      newErrors.account_number = 'Account number is required';
    }
    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required';
    }
    if (!formData.account_type) {
      newErrors.account_type = 'Account type is required';
    }
    if (!formData.normal_balance) {
      newErrors.normal_balance = 'Normal balance is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingAccount 
        ? `http://localhost:5001/api/chartofaccounts/${editingAccount.vuid}`
        : 'http://localhost:5001/api/chartofaccounts';
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        if (editingAccount) {
          const updatedAccount = await response.json();
          setAccounts(accounts.map(acc => 
            acc.vuid === editingAccount.vuid ? updatedAccount : acc
          ));
        } else {
          const newAccount = await response.json();
          setAccounts([...accounts, newAccount]);
        }
        
        handleCancelEdit();
        setErrors({});
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'An error occurred' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while saving the account' });
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowCreateForm(false);
    setFormData({
      account_number: account.account_number,
      account_name: account.account_name,
      account_type: account.account_type,
      account_category: account.account_category || '',
      account_subcategory: account.account_subcategory || '',
      description: account.description || '',
      normal_balance: account.normal_balance,
      status: account.status
    });
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setShowCreateForm(false);
    setFormData({
      account_number: '',
      account_name: '',
      account_type: '',
      account_category: '',
      account_subcategory: '',
      description: '',
      normal_balance: 'Debit',
      status: 'active'
    });
    setErrors({});
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setEditingAccount(null);
    setFormData({
      account_number: '',
      account_name: '',
      account_type: '',
      account_category: '',
      account_subcategory: '',
      description: '',
      normal_balance: 'Debit',
      status: 'active'
    });
    setErrors({});
  };

  const handleDelete = async (vuid) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/chartofaccounts/${vuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAccounts(accounts.filter(a => a.vuid !== vuid));
      } else {
        alert('Failed to delete account');
      }
    } catch (error) {
      alert('An error occurred while deleting the account');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
        <div className="text-2xl font-semibold text-gray-700">Loading chart of accounts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-sans">
            Chart of Accounts
          </h1>
          <p className="text-xl text-gray-700 font-light">
            Manage construction company financial accounts and categories
          </p>
        </div>

        {/* Create Account Button */}
        <div className="text-center mb-8">
          <button
            onClick={showCreateForm ? handleCancelEdit : handleShowCreateForm}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {showCreateForm ? 'Cancel' : '+ Create New Account'}
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingAccount) && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingAccount ? 'Edit Account' : 'Create New Account'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">{errors.submit}</p>
                </div>
              )}
              
              {/* Account Number and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="account_number" className="block text-lg font-semibold text-gray-900 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    id="account_number"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.account_number ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 1000, 1010"
                  />
                  {errors.account_number && (
                    <p className="text-red-600 font-medium mt-2">{errors.account_number}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="account_name" className="block text-lg font-semibold text-gray-900 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    id="account_name"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.account_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Cash, Accounts Receivable"
                  />
                  {errors.account_name && (
                    <p className="text-red-600 font-medium mt-2">{errors.account_name}</p>
                  )}
                </div>
              </div>

              {/* Account Type and Normal Balance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="account_type" className="block text-lg font-semibold text-gray-900 mb-2">
                    Account Type *
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setAccountTypeDropdownOpen(!accountTypeDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white"
                    >
                      {formData.account_type || 'Select Type'}
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {accountTypeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          {accountTypes.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, account_type: type }));
                                setAccountTypeDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.account_type && (
                    <p className="text-red-600 font-medium mt-2">{errors.account_type}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="normal_balance" className="block text-lg font-semibold text-gray-900 mb-2">
                    Normal Balance *
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setNormalBalanceDropdownOpen(!normalBalanceDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white"
                    >
                      {formData.normal_balance || 'Select Balance'}
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {normalBalanceDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          {normalBalances.map((balance) => (
                            <button
                              key={balance}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, normal_balance: balance }));
                                setNormalBalanceDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                              {balance}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.normal_balance && (
                    <p className="text-red-600 font-medium mt-2">{errors.normal_balance}</p>
                  )}
                </div>
              </div>

              {/* Account Category and Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="account_category" className="block text-lg font-semibold text-gray-900 mb-2">
                    Account Category
                  </label>
                  <input
                    type="text"
                    id="account_category"
                    name="account_category"
                    value={formData.account_category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., Current Assets, Fixed Assets"
                  />
                </div>

                <div>
                  <label htmlFor="account_subcategory" className="block text-lg font-semibold text-gray-900 mb-2">
                    Account Subcategory
                  </label>
                  <input
                    type="text"
                    id="account_subcategory"
                    name="account_subcategory"
                    value={formData.account_subcategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., Cash and Cash Equivalents"
                  />
                </div>
              </div>

              {/* Description and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="Detailed description of the account"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-lg font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white"
                    >
                      {formData.status === 'active' ? 'Active' : 'Inactive'}
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {statusDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          {statuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, status }));
                                setStatusDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                              {status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  className="bg-vermillion-600 hover:bg-vermillion-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                Search Accounts
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by account number, name, or description..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="accountTypeFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Account Type
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setFilterAccountTypeDropdownOpen(!filterAccountTypeDropdownOpen)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white"
                >
                  {accountTypeFilter === 'all' ? 'All Account Types' : accountTypeFilter}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {filterAccountTypeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleFilterChange('accountType', 'all');
                          setFilterAccountTypeDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        All Account Types
                      </button>
                      {accountTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            handleFilterChange('accountType', type);
                            setFilterAccountTypeDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Chart of Accounts ({filteredAccounts.length} accounts)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Normal Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentAccounts().map((account) => (
                  <tr key={account.vuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {account.account_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.account_name}
                        </div>
                        {account.description && (
                          <div className="text-sm text-gray-500">
                            {account.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.account_type === 'Asset' ? 'bg-blue-100 text-blue-800' :
                        account.account_type === 'Liability' ? 'bg-red-100 text-red-800' :
                        account.account_type === 'Equity' ? 'bg-green-100 text-green-800' :
                        account.account_type === 'Revenue' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {account.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.account_category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.normal_balance === 'Debit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {account.normal_balance}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-vermillion-600 hover:text-vermillion-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.vuid)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredAccounts.length > accountsPerPage && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.ceil(filteredAccounts.length / accountsPerPage) }, (_, i) => i + 1).map((number) => (
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
                disabled={currentPage === Math.ceil(filteredAccounts.length / accountsPerPage)}
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

export default ChartOfAccounts;
