import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const InternalChangeOrders = () => {
  const location = useLocation();
  const [internalChangeOrders, setInternalChangeOrders] = useState([]);
  const [filteredChangeOrders, setFilteredChangeOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Get project context from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const projectVuid = urlParams.get('project');
  const isCreateMode = urlParams.get('create') === 'true';
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChangeOrder, setEditingChangeOrder] = useState(null);
  const [formData, setFormData] = useState({
    project_vuid: '',
    original_budget_vuid: '',
    accounting_period_vuid: '',
    description: '',
    change_order_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  // Change order lines states
  const [showLinesForm, setShowLinesForm] = useState(false);
  const [selectedChangeOrder, setSelectedChangeOrder] = useState(null);
  const [changeOrderLines, setChangeOrderLines] = useState([]);
  const [newLine, setNewLine] = useState({
    cost_code_vuid: '',
    cost_type_vuid: '',
    change_amount: '',
    notes: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter change orders by project and auto-open create form if in create mode
  useEffect(() => {
    if (projectVuid) {
      const filtered = internalChangeOrders.filter(ico => ico.project_vuid === projectVuid);
      setFilteredChangeOrders(filtered);
      
      // Auto-open create form if in create mode
      if (isCreateMode && !showCreateForm) {
        handleShowCreateForm();
      }
    } else {
      setFilteredChangeOrders(internalChangeOrders);
    }
  }, [internalChangeOrders, projectVuid, isCreateMode, showCreateForm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, budgetsRes, costCodesRes, costTypesRes, changeOrdersRes, accountingPeriodsRes] = await Promise.all([
        axios.get(`${baseURL}/api/projects`),
        axios.get(`${baseURL}/api/project-budgets`),
        axios.get(`${baseURL}/api/cost-codes`),
        axios.get(`${baseURL}/api/cost-types`),
        axios.get(`${baseURL}/api/internal-change-orders`),
        axios.get(`${baseURL}/api/accounting-periods`)
      ]);

      setProjects(projectsRes.data);
      setBudgets(budgetsRes.data);
      setCostCodes(costCodesRes.data);
      setCostTypes(costTypesRes.data);
      setInternalChangeOrders(changeOrdersRes.data);
      setAccountingPeriods(accountingPeriodsRes.data);
    } catch (err) {
      setError('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setEditingChangeOrder(null);
    
    // Set default accounting period if only one is open
    let defaultAccountingPeriod = '';
    if (accountingPeriods.length === 1 && accountingPeriods[0].status === 'open') {
      defaultAccountingPeriod = accountingPeriods[0].vuid;
    }
    
    setFormData({
      project_vuid: projectVuid || '', // Pre-populate with project context if available
      original_budget_vuid: '',
      accounting_period_vuid: defaultAccountingPeriod,
      description: '',
      change_order_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleCancelEdit = () => {
    setShowCreateForm(false);
    setEditingChangeOrder(null);
    
    // Set default accounting period if only one is open
    let defaultAccountingPeriod = '';
    if (accountingPeriods.length === 1 && accountingPeriods[0].status === 'open') {
      defaultAccountingPeriod = accountingPeriods[0].vuid;
    }
    
    setFormData({
      project_vuid: '',
      original_budget_vuid: '',
      accounting_period_vuid: defaultAccountingPeriod,
      description: '',
      change_order_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.project_vuid || !formData.original_budget_vuid || !formData.accounting_period_vuid || !formData.description) {
      setError('Project, Original Budget, Accounting Period, and Description are required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setError('');
      const response = await axios.post(`${baseURL}/api/internal-change-orders`, formData);
      
      setSuccessMessage('Internal Change Order created successfully!');
      setShowCreateForm(false);
      
      // Set default accounting period if only one is open
      let defaultAccountingPeriod = '';
      if (accountingPeriods.length === 1 && accountingPeriods[0].status === 'open') {
        defaultAccountingPeriod = accountingPeriods[0].vuid;
      }
      
      setFormData({
        project_vuid: '',
        original_budget_vuid: '',
        accounting_period_vuid: defaultAccountingPeriod,
        description: '',
        change_order_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      // Refresh the data
      fetchData();
      
      // Auto-open the lines form for the new change order
      if (response.data.change_order) {
        setSelectedChangeOrder(response.data.change_order);
        setShowLinesForm(true);
        setChangeOrderLines([]);
      }
    } catch (err) {
      setError('Error creating internal change order: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (changeOrder) => {
    setEditingChangeOrder(changeOrder);
    setFormData({
      project_vuid: changeOrder.project_vuid,
      original_budget_vuid: changeOrder.original_budget_vuid,
      accounting_period_vuid: changeOrder.accounting_period_vuid || '',
      description: changeOrder.description,
      change_order_date: changeOrder.change_order_date,
      notes: changeOrder.notes || ''
    });
    setShowCreateForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setError('');
      await axios.put(`${baseURL}/api/internal-change-orders/${editingChangeOrder.vuid}`, formData);
      
      setSuccessMessage('Internal Change Order updated successfully!');
      setShowCreateForm(false);
      setEditingChangeOrder(null);
      // Set default accounting period if only one is open
      let defaultAccountingPeriod = '';
      if (accountingPeriods.length === 1 && accountingPeriods[0].status === 'open') {
        defaultAccountingPeriod = accountingPeriods[0].vuid;
      }
      
      setFormData({
        project_vuid: '',
        original_budget_vuid: '',
        accounting_period_vuid: defaultAccountingPeriod,
        description: '',
        change_order_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      fetchData();
    } catch (err) {
      setError('Error updating internal change order: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (changeOrder) => {
    if (!window.confirm('Are you sure you want to delete this Internal Change Order?')) return;

    try {
      await axios.delete(`${baseURL}/api/internal-change-orders/${changeOrder.vuid}`);
      setSuccessMessage('Internal Change Order deleted successfully!');
      fetchData();
    } catch (err) {
      setError('Error deleting internal change order: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleShowLines = async (changeOrder) => {
    setSelectedChangeOrder(changeOrder);
    setShowLinesForm(true);
    
    try {
      console.log('🔍 Fetching ICO lines for:', changeOrder.vuid);
      const response = await axios.get(`${baseURL}/api/internal-change-orders/${changeOrder.vuid}/lines`);
      console.log('📊 ICO lines response:', response.data);
      setChangeOrderLines(response.data);
    } catch (err) {
      console.error('❌ Error fetching ICO lines:', err);
      setError('Error fetching change order lines: ' + err.message);
    }
  };

  const closeLinesForm = () => {
    setShowLinesForm(false);
    setSelectedChangeOrder(null);
    setChangeOrderLines([]);
    setNewLine({
      cost_code_vuid: '',
      cost_type_vuid: '',
      change_amount: '',
      notes: ''
    });
  };

  const handleLineInputChange = (e) => {
    const { name, value } = e.target;
    setNewLine(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddLine = async () => {
    if (!newLine.cost_code_vuid || !newLine.cost_type_vuid || !newLine.change_amount) {
      setError('Cost Code, Cost Type, and Change Amount are required');
      return;
    }

    try {
      const response = await axios.post(
        `${baseURL}/api/internal-change-orders/${selectedChangeOrder.vuid}/lines`,
        newLine
      );
      
      setChangeOrderLines(prev => [...prev, response.data]);
      setNewLine({
        cost_code_vuid: '',
        cost_type_vuid: '',
        change_amount: '',
        notes: ''
      });
      setError('');
      
      // Refresh the change orders to get updated total
      fetchData();
    } catch (err) {
      setError('Error adding line: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteLine = async (lineVuid) => {
    if (!window.confirm('Are you sure you want to delete this line?')) return;

    try {
      await axios.delete(
        `${baseURL}/api/internal-change-orders/${selectedChangeOrder.vuid}/lines/${lineVuid}`
      );
      
      setChangeOrderLines(prev => prev.filter(line => line.vuid !== lineVuid));
      setSuccessMessage('Line deleted successfully!');
      
      // Refresh the change orders to get updated total
      fetchData();
    } catch (err) {
      setError('Error deleting line: ' + (err.response?.data?.error || err.message));
    }
  };

  const getProjectName = (projectVuid) => {
    const project = projects.find(p => p.vuid === projectVuid);
    return project ? project.project_name : 'Unknown Project';
  };

  const getBudgetDescription = (budgetVuid) => {
    const budget = budgets.find(b => b.vuid === budgetVuid);
    return budget ? budget.description : 'Unknown Budget';
  };

  const getCostCodeDisplay = (costCodeVuid) => {
    const costCode = costCodes.find(c => c.vuid === costCodeVuid);
    return costCode ? `${costCode.code} - ${costCode.description}` : 'Unknown';
  };

  const getCostTypeDisplay = (costTypeVuid) => {
    const costType = costTypes.find(t => t.vuid === costTypeVuid);
    return costType ? costType.abbreviation : 'Unknown';
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Internal Change Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Internal Change Orders</h1>
          <p className="mt-2 text-gray-600">
            Manage internal change orders that create revised budgets
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="text-center mb-8">
          <button
            onClick={handleShowCreateForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg text-base transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Create Internal Change Order
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingChangeOrder ? 'Edit Internal Change Order' : 'Create Internal Change Order'}
            </h2>
            
            <form onSubmit={editingChangeOrder ? handleUpdate : handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    name="project_vuid"
                    value={formData.project_vuid}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a Project</option>
                    {projects.map(project => (
                      <option key={project.vuid} value={project.vuid}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Accounting Period Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting Period *
                  </label>
                  <select
                    name="accounting_period_vuid"
                    value={formData.accounting_period_vuid}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Accounting Period</option>
                    {accountingPeriods
                      .filter(period => period.status === 'open')
                      .map(period => (
                        <option key={period.vuid} value={period.vuid}>
                          {period.month}/{period.year}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Original Budget Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Budget *
                  </label>
                  <select
                    name="original_budget_vuid"
                    value={formData.original_budget_vuid}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!formData.project_vuid}
                  >
                    <option value="">Select a Budget</option>
                    {budgets
                      .filter(budget => budget.project_vuid === formData.project_vuid)
                      .map(budget => (
                        <option key={budget.vuid} value={budget.vuid}>
                          {budget.description} - {formatCurrency(budget.budget_amount)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the reason for this internal change order..."
                    required
                  />
                </div>

                {/* Change Order Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Order Date
                  </label>
                  <input
                    type="date"
                    name="change_order_date"
                    value={formData.change_order_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="text-center pt-6">
                <div className="flex justify-center space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg text-base transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {editingChangeOrder ? 'Update Change Order' : 'Create Change Order'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg text-base transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Internal Change Orders List */}
        {!showCreateForm && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Internal Change Orders
              {projectVuid && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  - {getProjectName(projectVuid)}
                </span>
              )}
            </h2>
            
            {filteredChangeOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-500 text-xl mb-4">No internal change orders found.</p>
                <p className="text-gray-400 mb-6">Get started by creating your first internal change order.</p>
                <button
                  onClick={handleShowCreateForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
                >
                  Create First Internal Change Order
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChangeOrders.map((changeOrder) => (
                  <div
                    key={changeOrder.vuid}
                    className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{changeOrder.change_order_number}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(changeOrder.status)}`}>
                        {changeOrder.status}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">{changeOrder.description}</p>
                    
                    {/* Key Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Project:</span>
                        <span className="text-gray-900">{getProjectName(changeOrder.project_vuid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Original Budget:</span>
                        <span className="text-gray-900">{getBudgetDescription(changeOrder.original_budget_vuid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Date:</span>
                        <span className="text-gray-900">{new Date(changeOrder.change_order_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Total Change:</span>
                        <span className={`font-semibold ${
                          parseFloat(changeOrder.total_change_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(changeOrder.total_change_amount || 0)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowLines(changeOrder)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        Manage Lines
                      </button>
                      <button
                        onClick={() => handleEdit(changeOrder)}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(changeOrder)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Change Order Lines Form */}
        {showLinesForm && selectedChangeOrder && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Manage Lines - {selectedChangeOrder.change_order_number}
                </h2>
                <p className="text-gray-600 mt-2">
                  {selectedChangeOrder.description}
                </p>
              </div>
              <button
                onClick={closeLinesForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            {/* Add New Line Form */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Line</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost Code *</label>
                  <select
                    name="cost_code_vuid"
                    value={newLine.cost_code_vuid}
                    onChange={handleLineInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Cost Code</option>
                    {costCodes.map(costCode => (
                      <option key={costCode.vuid} value={costCode.vuid}>
                        {costCode.code} - {costCode.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost Type *</label>
                  <select
                    name="cost_type_vuid"
                    value={newLine.cost_type_vuid}
                    onChange={handleLineInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Cost Type</option>
                    {costTypes.map(costType => (
                      <option key={costType.vuid} value={costType.vuid}>
                        {costType.abbreviation} - {costType.cost_type}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Change Amount *</label>
                  <input
                    type="number"
                    name="change_amount"
                    value={newLine.change_amount}
                    onChange={handleLineInputChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Use negative for decreases</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={newLine.notes}
                    onChange={handleLineInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={handleAddLine}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  + Add Line
                </button>
              </div>
            </div>

            {/* Lines Table */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Order Lines</h3>
              {changeOrderLines.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No lines added yet. Add your first line above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Cost Code</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Cost Type</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Change Amount</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        console.log('🔍 Rendering ICO lines table with data:', changeOrderLines);
                        return changeOrderLines.map((line, index) => {
                          console.log('📋 Rendering line:', line);
                          return (
                            <tr key={line.vuid || index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                {getCostCodeDisplay(line.cost_code_vuid)}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                {getCostTypeDisplay(line.cost_type_vuid)}
                              </td>
                              <td className={`border border-gray-300 px-4 py-2 font-medium ${
                                parseFloat(line.change_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(line.change_amount || 0)}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                {line.notes || '-'}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <button
                                  onClick={() => handleDeleteLine(line.vuid)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalChangeOrders;
