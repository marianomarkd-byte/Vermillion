import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ExternalChangeOrders = () => {
  const { projectVuid, contractVuid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [externalChangeOrders, setExternalChangeOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingChangeOrder, setEditingChangeOrder] = useState(null);
  const [selectedChangeOrder, setSelectedChangeOrder] = useState(null);
  const [showLines, setShowLines] = useState(false);
  const [changeOrderLines, setChangeOrderLines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [projectBudgetLines, setProjectBudgetLines] = useState([]);
  
  // Ref for Excel grid focus
  const excelGridRef = useRef(null);
  
  // Get project VUID from URL params or search params for form initialization
  const searchParams = new URLSearchParams(location.search);
  const urlProjectVuid = searchParams.get('project');
  const effectiveProjectVuid = projectVuid || urlProjectVuid;
  
  // Form state
  const [formData, setFormData] = useState({
    project_vuid: effectiveProjectVuid || '',
    contract_vuid: contractVuid || '',
    accounting_period_vuid: '',
    change_order_number: '',
    description: '',
    change_order_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  });
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    project_vuid: '',
    contract_vuid: '',
    accounting_period_vuid: '',
    change_order_number: '',
    description: '',
    change_order_date: '',
    status: '',
    notes: ''
  });
  
  // Line item form state
  const [lineFormData, setLineFormData] = useState({
    cost_code_vuid: '',
    cost_type_vuid: '',
    contract_amount_change: '',
    budget_amount_change: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [projectVuid, contractVuid, location.search]);



  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get project VUID from URL params or search params
      const searchParams = new URLSearchParams(location.search);
      const urlProjectVuid = searchParams.get('project');
      const effectiveProjectVuid = projectVuid || urlProjectVuid;
      
      console.log('🔍 External Change Orders - Project Context Debug:');
      console.log('  projectVuid (from params):', projectVuid);
      console.log('  urlProjectVuid (from search):', urlProjectVuid);
      console.log('  effectiveProjectVuid:', effectiveProjectVuid);
      console.log('  contractVuid:', contractVuid);
      
      // Fetch external change orders for this project/contract
      let url = `${baseURL}/api/external-change-orders`;
      if (effectiveProjectVuid) {
        url += `?project_vuid=${effectiveProjectVuid}`;
      }
      if (contractVuid) {
        url += effectiveProjectVuid ? `&contract_vuid=${contractVuid}` : `?contract_vuid=${contractVuid}`;
      }
      
      console.log('  API URL:', url);
      
      const [ecoResponse, projectsResponse, contractsResponse, costCodesResponse, costTypesResponse, accountingPeriodsResponse] = await Promise.all([
        axios.get(url),
        axios.get(`${baseURL}/api/projects`),
        axios.get(`${baseURL}/api/project-contracts`),
        axios.get(`${baseURL}/api/costcodes`),
        axios.get(`${baseURL}/api/costtypes`),
        axios.get(`${baseURL}/api/accounting-periods`)
      ]);
      
      console.log('  API Response - Total change orders:', ecoResponse.data.length);
      console.log('  API Response - Change orders:', ecoResponse.data);
      
      setExternalChangeOrders(ecoResponse.data);
      setProjects(projectsResponse.data);
      setContracts(contractsResponse.data);
      setCostCodes(costCodesResponse.data);
      setCostTypes(costTypesResponse.data);
      setAccountingPeriods(accountingPeriodsResponse.data);
      
      // Fetch project budget lines if we have a project
      if (effectiveProjectVuid) {
        try {
          const budgetResponse = await axios.get(`${baseURL}/api/projects/${effectiveProjectVuid}/budget-lines`);
          setProjectBudgetLines(budgetResponse.data || []);
        } catch (err) {
          console.warn('Failed to fetch project budget lines:', err);
          setProjectBudgetLines([]);
        }
      } else {
        setProjectBudgetLines([]);
      }
      
    } catch (err) {
      setError('Error fetching data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChangeOrder = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${baseURL}/api/external-change-orders`, formData);
      setShowCreateForm(false);
      // Set default accounting period if only one is open
      let defaultAccountingPeriod = '';
      if (accountingPeriods.length === 1 && accountingPeriods[0].status === 'open') {
        defaultAccountingPeriod = accountingPeriods[0].vuid;
      }
      
      setFormData({
        project_vuid: projectVuid || '',
        contract_vuid: contractVuid || '',
        accounting_period_vuid: defaultAccountingPeriod,
        change_order_number: '',
        description: '',
        change_order_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: ''
      });
      setSuccessMessage('External change order created successfully!');
      
      // Automatically show the lines form for the newly created change order
      const newChangeOrder = response.data.change_order;
      setSelectedChangeOrder(newChangeOrder);
      setShowLines(true);
      await fetchChangeOrderLines(newChangeOrder.vuid);
      
      // Don't refresh the change orders list - stay on the lines form
      // The new change order will be added to the list when the lines form is closed
    } catch (err) {
      setError('Error creating external change order: ' + (err.response?.data?.error || err.message));
    }
  };



  const handleAddNewLine = () => {
    // Add the current line form data to the lines array
    if (!lineFormData.cost_code_vuid || !lineFormData.cost_type_vuid || !lineFormData.contract_amount_change) {
      setError('Cost Code, Cost Type, and Contract Amount Change are required');
      return;
    }
    
    const newLine = {
      vuid: `temp-${Date.now()}`,
      cost_code_vuid: lineFormData.cost_code_vuid,
      cost_type_vuid: lineFormData.cost_type_vuid,
      contract_amount_change: lineFormData.contract_amount_change,
      budget_amount_change: lineFormData.budget_amount_change || 0, // Default to 0 if not provided
      notes: lineFormData.notes || '',
      status: 'active'
    };
    
    setChangeOrderLines([...changeOrderLines, newLine]);
    
    // Reset the form
    setLineFormData({
      cost_code_vuid: '',
      cost_type_vuid: '',
      contract_amount_change: '',
      budget_amount_change: '',
      notes: ''
    });
    
    setSuccessMessage('Line added to grid. Click "Save All Lines" to commit changes.');
  };

  const handleClearNewLine = () => {
    setLineFormData({
      cost_code_vuid: '',
      cost_type_vuid: '',
      contract_amount_change: '',
      budget_amount_change: '',
      notes: ''
    });
    setError(''); // Clear any errors
    setSuccessMessage('New line form cleared.');
  };

  const handleLineUpdate = (lineVuid, field, value) => {
    setChangeOrderLines(prevLines => 
      prevLines.map(line => {
        if (line.vuid === lineVuid) {
          // If cost code is changing, clear the cost type
          if (field === 'cost_code_vuid') {
            return { ...line, [field]: value, cost_type_vuid: '' };
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  const handleSaveAllLines = async () => {
    console.log('handleSaveAllLines called');
    console.log('selectedChangeOrder:', selectedChangeOrder);
    console.log('selectedChangeOrder type:', typeof selectedChangeOrder);
    console.log('selectedChangeOrder.vuid:', selectedChangeOrder?.vuid);
    console.log('selectedChangeOrder keys:', selectedChangeOrder ? Object.keys(selectedChangeOrder) : 'null');
    
    if (!selectedChangeOrder) {
      console.error('No selectedChangeOrder');
      setError('Error: No change order selected. Please select a change order first.');
      return;
    }
    
    if (!selectedChangeOrder.vuid) {
      console.error('selectedChangeOrder.vuid is undefined');
      console.error('selectedChangeOrder object:', JSON.stringify(selectedChangeOrder, null, 2));
      setError('Error: Change order ID is missing. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Process all lines - save new ones and update existing ones
      for (const line of changeOrderLines) {
        if (line.vuid.startsWith('temp-')) {
          // This is a new line, create it
          const { vuid, ...lineData } = line;
          await axios.post(`${baseURL}/api/external-change-orders/${selectedChangeOrder.vuid}/lines`, lineData);
        } else {
          // This is an existing line, update it
          const { vuid, ...lineData } = line;
          await axios.put(`${baseURL}/api/external-change-orders/${selectedChangeOrder.vuid}/lines/${vuid}`, lineData);
        }
      }
      
      // Refresh the data
      await fetchChangeOrderLines(selectedChangeOrder.vuid);
      await fetchData();
      
      setSuccessMessage('All lines saved successfully!');
    } catch (err) {
      setError('Error saving lines: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleShowLines = async (changeOrder) => {
    console.log('handleShowLines called with:', changeOrder);
    console.log('changeOrder.vuid:', changeOrder.vuid);
    console.log('changeOrder keys:', Object.keys(changeOrder));
    setSelectedChangeOrder(changeOrder);
    setShowLines(true);
    console.log('selectedChangeOrder set to:', changeOrder);
    await fetchChangeOrderLines(changeOrder.vuid);
    
    // Focus on the Excel grid after it renders
    setTimeout(() => {
      if (excelGridRef.current) {
        excelGridRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        // Focus on the first cost code dropdown in the new line row
        const firstCostCodeSelect = excelGridRef.current.querySelector('select[value=""]');
        if (firstCostCodeSelect) {
          firstCostCodeSelect.focus();
        }
      }
    }, 100);
  };

  const fetchChangeOrderLines = async (changeOrderVuid) => {
    try {
      const response = await axios.get(`${baseURL}/api/external-change-orders/${changeOrderVuid}/lines`);
      setChangeOrderLines(response.data);
    } catch (err) {
      setError('Error fetching change order lines: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteLine = async (lineVuid) => {
    if (!selectedChangeOrder) return;
    
    if (!window.confirm('Are you sure you want to delete this line?')) return;
    
    // Check if this is a temporary line (not yet saved)
    if (lineVuid.startsWith('temp-')) {
      // Remove from local state only
      setChangeOrderLines(prevLines => prevLines.filter(line => line.vuid !== lineVuid));
      setSuccessMessage('Line removed from grid.');
      return;
    }
    
    // This is a saved line, delete from backend
    try {
      await axios.delete(`${baseURL}/api/external-change-orders/${selectedChangeOrder.vuid}/lines/${lineVuid}`);
      setSuccessMessage('Line item deleted successfully!');
      await fetchChangeOrderLines(selectedChangeOrder.vuid);
      // Refresh the change orders to get updated total
      await fetchData();
    } catch (err) {
      setError('Error deleting line item: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteChangeOrder = async (changeOrderVuid) => {
    if (!window.confirm('Are you sure you want to delete this external change order?')) return;
    
    try {
      await axios.delete(`${baseURL}/api/external-change-orders/${changeOrderVuid}`);
      setSuccessMessage('External change order deleted successfully!');
      fetchData();
    } catch (err) {
      setError('Error deleting external change order: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditChangeOrder = (changeOrder) => {
    setEditingChangeOrder(changeOrder);
    setEditFormData({
      project_vuid: changeOrder.project_vuid || '',
      contract_vuid: changeOrder.contract_vuid || '',
      accounting_period_vuid: changeOrder.accounting_period_vuid || '',
      change_order_number: changeOrder.change_order_number || '',
      description: changeOrder.description || '',
      change_order_date: changeOrder.change_order_date || '',
      status: changeOrder.status || '',
      notes: changeOrder.notes || ''
    });
    setShowEditForm(true);
  };

  const handleUpdateChangeOrder = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`${baseURL}/api/external-change-orders/${editingChangeOrder.vuid}`, editFormData);
      setShowEditForm(false);
      setEditingChangeOrder(null);
      setSuccessMessage('External change order updated successfully!');
      fetchData();
    } catch (err) {
      setError('Error updating external change order: ' + (err.response?.data?.error || err.message));
    }
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingChangeOrder(null);
    setEditFormData({
      project_vuid: '',
      contract_vuid: '',
      accounting_period_vuid: '',
      change_order_number: '',
      description: '',
      change_order_date: '',
      status: '',
      notes: ''
    });
  };

  const closeLinesForm = async () => {
    setShowLines(false);
    setSelectedChangeOrder(null);
    setChangeOrderLines([]);
    setLineFormData({
      cost_code_vuid: '',
      cost_type_vuid: '',
      contract_amount_change: '',
      budget_amount_change: '',
      notes: ''
    });
    
    // Refresh the change orders list when closing the lines form
    await fetchData();
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getProjectName = (projectVuid) => {
    const project = projects.find(p => p.vuid === projectVuid);
    return project ? project.project_name : 'Unknown Project';
  };

  const getContractName = (contractVuid) => {
    const contract = contracts.find(c => c.vuid === contractVuid);
    return contract ? contract.contract_name : 'Unknown Contract';
  };

  const getCostCodeDisplay = (costCodeVuid) => {
    const costCode = costCodes.find(cc => cc.vuid === costCodeVuid);
    return costCode ? `${costCode.code} - ${costCode.description}` : 'Unknown';
  };

  const getCostTypeDisplay = (costTypeVuid) => {
    const costType = costTypes.find(ct => ct.vuid === costTypeVuid);
    return costType ? costType.abbreviation : 'Unknown';
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
          <p className="mt-4 text-gray-600">Loading External Change Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">External Change Orders</h1>
          <p className="mt-2 text-gray-600">
            Manage change orders that modify project contract values
          </p>
          {effectiveProjectVuid && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-800 font-medium">
                    📋 Filtered by Project: <span className="font-bold">{getProjectName(effectiveProjectVuid)}</span>
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    Showing only change orders for this project
                  </p>
                </div>
                <button
                  onClick={() => navigate('/external-change-orders')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Show All Projects
                </button>
              </div>
            </div>
          )}
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

        {/* Create Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg text-base transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Create External Change Order
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create External Change Order</h2>
            
            <form onSubmit={handleCreateChangeOrder} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    value={formData.project_vuid}
                    onChange={(e) => setFormData({...formData, project_vuid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.vuid} value={project.vuid}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract *
                  </label>
                  <select
                    value={formData.contract_vuid}
                    onChange={(e) => setFormData({...formData, contract_vuid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!formData.project_vuid}
                  >
                    <option value="">Select Contract</option>
                    {contracts
                      .filter(contract => !formData.project_vuid || contract.project_vuid === formData.project_vuid)
                      .map((contract) => (
                        <option key={contract.vuid} value={contract.vuid}>
                          {contract.contract_name}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting Period *
                  </label>
                  <select
                    value={formData.accounting_period_vuid}
                    onChange={(e) => setFormData({...formData, accounting_period_vuid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Accounting Period</option>
                    {accountingPeriods
                      .filter(period => period.status === 'open')
                      .map((period) => (
                        <option key={period.vuid} value={period.vuid}>
                          {period.month}/{period.year}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Order Number *
                  </label>
                  <input
                    type="text"
                    value={formData.change_order_number}
                    onChange={(e) => setFormData({...formData, change_order_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., ECO-001"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Order Date *
                  </label>
                  <input
                    type="date"
                    value={formData.change_order_date}
                    onChange={(e) => setFormData({...formData, change_order_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Describe the change order..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="text-center pt-6">
                <div className="flex justify-center space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg text-base transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Create Change Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg text-base transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Lines Form */}
        {showLines && selectedChangeOrder && (
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
            
            {/* Excel-like Grid for Lines */}
            <div ref={excelGridRef} className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Change Order Lines</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAllLines}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Save All Lines
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewLine}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Add Line
                  </button>
                </div>
              </div>
              
              {/* Excel-like Grid */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Line #</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Cost Code *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Cost Type *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Contract Amount Change *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Budget Amount Change</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Notes</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Existing Lines */}
                    {changeOrderLines.map((line, index) => (
                      <tr key={line.vuid} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">{index + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                          <select
                            value={line.cost_code_vuid}
                            onChange={(e) => handleLineUpdate(line.vuid, 'cost_code_vuid', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Cost Code</option>
                            {costCodes
                              .filter(c => c.status === 'active')
                              .filter(costCode => (
                                projectBudgetLines.length === 0 ||
                                projectBudgetLines.some(budgetLine => budgetLine.cost_code_vuid === costCode.vuid)
                              ))
                              .map((costCode) => (
                                <option key={costCode.vuid} value={costCode.vuid}>
                                  {costCode.code} - {costCode.description}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                          <select
                            value={line.cost_type_vuid}
                            onChange={(e) => handleLineUpdate(line.vuid, 'cost_type_vuid', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Cost Type</option>
                            {costTypes
                              .filter(t => t.status === 'active')
                              .filter(costType => (
                                projectBudgetLines.length === 0 ||
                                projectBudgetLines.some(budgetLine => 
                                  budgetLine.cost_type_vuid === costType.vuid &&
                                  budgetLine.cost_code_vuid === line.cost_code_vuid
                                )
                              ))
                              .map((costType) => (
                                <option key={costType.vuid} value={costType.vuid}>
                                  {costType.abbreviation} - {costType.cost_type}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                          <input
                            type="number"
                            step="0.01"
                            value={line.contract_amount_change}
                            onChange={(e) => handleLineUpdate(line.vuid, 'contract_amount_change', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                          <input
                            type="number"
                            step="0.01"
                            value={line.budget_amount_change}
                            onChange={(e) => handleLineUpdate(line.vuid, 'budget_amount_change', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                          <input
                            type="text"
                            value={line.notes || ''}
                            onChange={(e) => handleLineUpdate(line.vuid, 'notes', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Notes..."
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          <button
                            onClick={() => handleDeleteLine(line.vuid)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {/* New Line Row */}
                    <tr className="bg-blue-50">
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 font-medium">
                        {changeOrderLines.length + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        <select
                          value={lineFormData.cost_code_vuid}
                          onChange={(e) => setLineFormData({...lineFormData, cost_code_vuid: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Cost Code</option>
                          {costCodes
                            .filter(c => c.status === 'active')
                            .filter(costCode => (
                              projectBudgetLines.length === 0 ||
                              projectBudgetLines.some(budgetLine => budgetLine.cost_code_vuid === costCode.vuid)
                            ))
                            .map((costCode) => (
                              <option key={costCode.vuid} value={costCode.vuid}>
                                {costCode.code} - {costCode.description}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        <select
                          value={lineFormData.cost_type_vuid}
                          onChange={(e) => setLineFormData({...lineFormData, cost_type_vuid: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Cost Type</option>
                          {costTypes
                            .filter(t => t.status === 'active')
                            .filter(costType => (
                              projectBudgetLines.length === 0 ||
                              projectBudgetLines.some(budgetLine => 
                                budgetLine.cost_type_vuid === costType.vuid &&
                                budgetLine.cost_code_vuid === lineFormData.cost_code_vuid
                              )
                            ))
                            .map((costType) => (
                              <option key={costType.vuid} value={costType.vuid}>
                                {costType.abbreviation} - {costType.cost_type}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        <input
                          type="number"
                          step="0.01"
                          value={lineFormData.contract_amount_change}
                          onChange={(e) => setLineFormData({...lineFormData, contract_amount_change: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        <input
                          type="number"
                          step="0.01"
                          value={lineFormData.budget_amount_change}
                          onChange={(e) => setLineFormData({...lineFormData, budget_amount_change: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.00 (optional)"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                        <input
                          type="text"
                          value={lineFormData.notes}
                          onChange={(e) => setLineFormData({...lineFormData, notes: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Notes..."
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={handleAddNewLine}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={handleClearNewLine}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            

          </div>
        )}

        {/* Edit Form Modal */}
        {showEditForm && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Edit External Change Order</h2>
            
            <form onSubmit={handleUpdateChangeOrder} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    value={editFormData.project_vuid}
                    onChange={(e) => setEditFormData({...editFormData, project_vuid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.vuid} value={project.vuid}>
                        {project.project_number} - {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contract
                  </label>
                  <select
                    value={editFormData.contract_vuid}
                    onChange={(e) => setEditFormData({...editFormData, contract_vuid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Contract</option>
                    {contracts
                      .filter(contract => contract.project_vuid === editFormData.project_vuid)
                      .map((contract) => (
                        <option key={contract.vuid} value={contract.vuid}>
                          {contract.contract_number} - {contract.contract_name}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting Period
                  </label>
                  <select
                    value={editFormData.accounting_period_vuid}
                    onChange={(e) => setEditFormData({...editFormData, accounting_period_vuid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Period</option>
                    {accountingPeriods.map((period) => (
                      <option key={period.vuid} value={period.vuid}>
                        {period.month}/{period.year} - {period.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Order Number *
                  </label>
                  <input
                    type="text"
                    value={editFormData.change_order_number}
                    onChange={(e) => setEditFormData({...editFormData, change_order_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Order Date *
                  </label>
                  <input
                    type="date"
                    value={editFormData.change_order_date}
                    onChange={(e) => setEditFormData({...editFormData, change_order_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeEditForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Update Change Order
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Orders Grid */}
        {!showCreateForm && !showEditForm && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              External Change Orders
              {effectiveProjectVuid && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  - {getProjectName(effectiveProjectVuid)}
                </span>
              )}
            </h2>
            
            {externalChangeOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-500 text-xl mb-4">No external change orders found.</p>
                <p className="text-gray-400 mb-6">Get started by creating your first external change order.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-lg"
                >
                  Create First External Change Order
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {externalChangeOrders.map((changeOrder) => (
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
                        <span className="font-medium text-gray-600">Contract:</span>
                        <span className="text-gray-900">{getContractName(changeOrder.contract_vuid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Date:</span>
                        <span className="text-gray-900">{formatDate(changeOrder.change_order_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Contract Change:</span>
                        <span className={`font-semibold ${
                          parseFloat(changeOrder.total_contract_change_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(changeOrder.total_contract_change_amount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Budget Change:</span>
                        <span className={`font-semibold ${
                          parseFloat(changeOrder.total_budget_change_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(changeOrder.total_budget_change_amount || 0)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditChangeOrder(changeOrder)}
                        className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          console.log('Button clicked, changeOrder:', changeOrder);
                          console.log('changeOrder.vuid:', changeOrder.vuid);
                          handleShowLines(changeOrder);
                        }}
                        className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                      >
                        Manage Lines
                      </button>
                      <button
                        onClick={() => handleDeleteChangeOrder(changeOrder.vuid)}
                        className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
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



        {/* Lines Form */}
        {showLines && selectedChangeOrder && (
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
            


          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalChangeOrders;
