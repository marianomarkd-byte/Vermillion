import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CommitmentChangeOrders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [commitmentChangeOrders, setCommitmentChangeOrders] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [currentProjectBudgetLines, setCurrentProjectBudgetLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChangeOrder, setEditingChangeOrder] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [showLineItemForm, setShowLineItemForm] = useState(false);
  const [editingLineItem, setEditingLineItem] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    commitment_vuid: '',
    accounting_period_vuid: '',
    change_order_number: '',
    change_order_date: '',
    description: '',
    status: 'pending',
    notes: ''
  });

  // Line item form data
  const [lineItemData, setLineItemData] = useState({
    line_number: '',
    cost_code_vuid: '',
    cost_type_vuid: '',
    description: '',
    amount: '',
    quantity: '',
    unit_price: '',
    total_amount: ''
  });

  // Get URL parameters
  const searchParams = new URLSearchParams(location.search);
  const projectVuid = searchParams.get('project');
  const commitmentVuid = searchParams.get('commitment');
  const isCreateMode = searchParams.get('create') === 'true';
  
  // Track effective project VUID for filtering
  const [effectiveProjectVuid, setEffectiveProjectVuid] = useState(projectVuid);

  // Fetch project budget lines
  const fetchProjectBudgetLines = async (projectVuid) => {
    if (!projectVuid) {
      setCurrentProjectBudgetLines([]);
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      console.log('Fetching budget lines for project:', projectVuid);
      const response = await fetch(`${baseURL}/api/projects/${projectVuid}/budget-lines`);
      const data = await response.json();
      console.log('Fetched budget lines:', data.length, 'lines');
      setCurrentProjectBudgetLines(data);
    } catch (error) {
      console.error('Error fetching project budget lines:', error);
      setCurrentProjectBudgetLines([]);
    }
  };

  // Get cost codes and cost types that are budgeted for the selected project
  const getBudgetedCostCodes = (projectVuid) => {
    console.log('getBudgetedCostCodes called with projectVuid:', projectVuid);
    console.log('currentProjectBudgetLines length:', currentProjectBudgetLines.length);
    console.log('costCodes length:', costCodes.length);
    
    if (!projectVuid || currentProjectBudgetLines.length === 0) {
      console.log('Returning all cost codes - no project or budget lines');
      return costCodes;
    }
    
    const projectBudgetLines = currentProjectBudgetLines;
    const budgetedCostCodeVuids = [...new Set(projectBudgetLines.map(line => line.cost_code_vuid))];
    console.log('Budgeted cost code VUIDs:', budgetedCostCodeVuids);
    
    const filteredCostCodes = costCodes.filter(code => budgetedCostCodeVuids.includes(code.vuid));
    console.log('Filtered cost codes count:', filteredCostCodes.length);
    
    // If no budgeted cost codes found, return all cost codes as fallback
    if (filteredCostCodes.length === 0) {
      console.log('No budgeted cost codes found, returning all as fallback');
      return costCodes;
    }
    
    return filteredCostCodes;
  };

  const getBudgetedCostTypes = (projectVuid, selectedCostCodeVuid) => {
    console.log('getBudgetedCostTypes called with projectVuid:', projectVuid, 'selectedCostCodeVuid:', selectedCostCodeVuid);
    console.log('currentProjectBudgetLines length:', currentProjectBudgetLines.length);
    console.log('costTypes length:', costTypes.length);
    
    if (!projectVuid || currentProjectBudgetLines.length === 0) {
      console.log('Returning all cost types - no project or budget lines');
      return costTypes;
    }
    
    const projectBudgetLines = currentProjectBudgetLines;
    
    // If a cost code is selected, filter by that cost code
    let relevantBudgetLines = projectBudgetLines;
    if (selectedCostCodeVuid) {
      relevantBudgetLines = projectBudgetLines.filter(line => line.cost_code_vuid === selectedCostCodeVuid);
      console.log('Filtering by cost code, relevant budget lines:', relevantBudgetLines.length);
    }
    
    const budgetedCostTypeVuids = [...new Set(relevantBudgetLines.map(line => line.cost_type_vuid))];
    console.log('Budgeted cost type VUIDs:', budgetedCostTypeVuids);
    
    const filteredCostTypes = costTypes.filter(type => budgetedCostTypeVuids.includes(type.vuid));
    console.log('Filtered cost types count:', filteredCostTypes.length);
    
    // If no budgeted cost types found, return all cost types as fallback
    if (filteredCostTypes.length === 0) {
      console.log('No budgeted cost types found, returning all as fallback');
      return costTypes;
    }
    
    return filteredCostTypes;
  };

  useEffect(() => {
    if (projectVuid || commitmentVuid) {
      fetchData();
      if (isCreateMode) {
        setShowCreateForm(true);
      }
    }
  }, [projectVuid, commitmentVuid, isCreateMode]);

  const fetchData = async () => {
    if (!projectVuid && !commitmentVuid) return;
    
    const baseURL = 'http://localhost:5001';
    
    try {
      setLoading(true);
      
      // First, get commitments to determine the project
      const commitmentsResponse = await axios.get(`${baseURL}/api/project-commitments`);
      let calculatedEffectiveProjectVuid = projectVuid;
      
      if (commitmentVuid && !projectVuid) {
        // Find the project for this commitment
        const commitment = commitmentsResponse.data.find(c => c.vuid === commitmentVuid);
        if (commitment) {
          calculatedEffectiveProjectVuid = commitment.project_vuid;
        }
      }
      
      // Update the effective project VUID state
      console.log('Setting effective project VUID to:', calculatedEffectiveProjectVuid);
      setEffectiveProjectVuid(calculatedEffectiveProjectVuid);
      
      // Build the API URL based on available parameters
      let changeOrdersUrl = `${baseURL}/api/commitment-change-orders`;
      if (calculatedEffectiveProjectVuid) {
        changeOrdersUrl += `?project_vuid=${calculatedEffectiveProjectVuid}`;
      } else if (commitmentVuid) {
        changeOrdersUrl += `?commitment_vuid=${commitmentVuid}`;
      }
      
      const [changeOrdersResponse, accountingPeriodsResponse, costCodesResponse, costTypesResponse] = await Promise.allSettled([
        axios.get(changeOrdersUrl),
        axios.get(`${baseURL}/api/accounting-periods`),
        axios.get(`${baseURL}/api/cost-codes`),
        axios.get(`${baseURL}/api/cost-types`)
      ]);

      if (changeOrdersResponse.status === 'fulfilled') {
        setCommitmentChangeOrders(changeOrdersResponse.value.data);
      }
      
      // Filter commitments by the effective project
      if (calculatedEffectiveProjectVuid) {
        setCommitments(commitmentsResponse.data.filter(c => c.project_vuid === calculatedEffectiveProjectVuid));
      }

      if (accountingPeriodsResponse.status === 'fulfilled') {
        setAccountingPeriods(accountingPeriodsResponse.value.data);
        // Default to the first open period
        const openPeriod = accountingPeriodsResponse.value.data.find(p => p.status === 'open');
        if (openPeriod && !formData.accounting_period_vuid) {
          setFormData(prev => ({ ...prev, accounting_period_vuid: openPeriod.vuid }));
        }
        
        // Pre-populate commitment_vuid if coming from a specific commitment
        if (commitmentVuid && !formData.commitment_vuid) {
          setFormData(prev => ({ ...prev, commitment_vuid: commitmentVuid }));
        }
      }

      if (costCodesResponse.status === 'fulfilled') {
        setCostCodes(costCodesResponse.value.data);
      }

      if (costTypesResponse.status === 'fulfilled') {
        setCostTypes(costTypesResponse.value.data);
      }

      // Fetch budget lines for the effective project
      if (calculatedEffectiveProjectVuid) {
        await fetchProjectBudgetLines(calculatedEffectiveProjectVuid);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
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
  };

  const handleLineItemInputChange = (e) => {
    const { name, value } = e.target;
    
    // If cost code changes, reset cost type
    if (name === 'cost_code_vuid') {
      setLineItemData(prev => ({
        ...prev,
        [name]: value,
        cost_type_vuid: '' // Reset cost type when cost code changes
      }));
    } else {
      setLineItemData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Line item amount/quantity/unit price handlers (matching Commitments component behavior)
  const handleLineItemAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setLineItemData(prev => ({
      ...prev,
      amount: e.target.value,
      quantity: amount > 0 ? '1' : '',
      unit_price: amount > 0 ? amount.toString() : '',
      total_amount: amount > 0 ? amount.toFixed(2) : ''
    }));
  };

  const handleLineItemQuantityChange = (e) => {
    const quantity = parseFloat(e.target.value) || 0;
    const unitPrice = parseFloat(lineItemData.unit_price) || 0;
    const amount = quantity * unitPrice;
    
    setLineItemData(prev => ({
      ...prev,
      quantity: e.target.value,
      amount: amount > 0 ? amount.toString() : '',
      total_amount: amount > 0 ? amount.toFixed(2) : ''
    }));
  };

  const handleLineItemUnitPriceChange = (e) => {
    const unitPrice = parseFloat(e.target.value) || 0;
    const quantity = parseFloat(lineItemData.quantity) || 0;
    const amount = quantity * unitPrice;
    
    setLineItemData(prev => ({
      ...prev,
      unit_price: e.target.value,
      amount: amount > 0 ? amount.toString() : '',
      total_amount: amount > 0 ? amount.toFixed(2) : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.commitment_vuid || !formData.change_order_number || !formData.change_order_date || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      
      console.log('Sending form data:', formData);
      console.log('Sending line items:', lineItems);
      
      const changeOrderData = {
        ...formData,
        line_items: lineItems
      };
      
      if (editingChangeOrder) {
        // Update existing change order
        await axios.put(`${baseURL}/api/commitment-change-orders/${editingChangeOrder.vuid}`, changeOrderData);
        alert('Commitment change order updated successfully!');
      } else {
        // Create new change order
        const response = await axios.post(`${baseURL}/api/commitment-change-orders`, changeOrderData);
        console.log('Response:', response.data);
        alert('Commitment change order created successfully!');
      }
      
      // Reset form and refresh data
      setFormData({
        commitment_vuid: '',
        accounting_period_vuid: formData.accounting_period_vuid, // Keep accounting period
        change_order_number: '',
        change_order_date: '',
        description: '',
        status: 'pending',
        notes: ''
      });
      setLineItems([]);
      setShowCreateForm(false);
      setEditingChangeOrder(null);
      fetchData();
    } catch (err) {
      console.error('Error saving commitment change order:', err);
      alert('Error saving commitment change order');
    }
  };

  const handleEdit = (changeOrder) => {
    setEditingChangeOrder(changeOrder);
    setFormData({
      commitment_vuid: changeOrder.commitment_vuid,
      accounting_period_vuid: changeOrder.accounting_period_vuid,
      change_order_number: changeOrder.change_order_number,
      change_order_date: changeOrder.change_order_date,
      description: changeOrder.description,
      status: changeOrder.status,
      notes: changeOrder.notes || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (changeOrder) => {
    if (!window.confirm('Are you sure you want to delete this commitment change order?')) {
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      await axios.delete(`${baseURL}/api/commitment-change-orders/${changeOrder.vuid}`);
      alert('Commitment change order deleted successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting commitment change order:', err);
      alert('Error deleting commitment change order');
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingChangeOrder(null);
    setFormData({
      commitment_vuid: '',
      accounting_period_vuid: formData.accounting_period_vuid,
      change_order_number: '',
      change_order_date: '',
      description: '',
      status: 'pending',
      notes: ''
    });
  };

  const handleAddLineItem = () => {
    setShowLineItemForm(true);
    setEditingLineItem(null);
    setLineItemData({
      line_number: (lineItems.length + 1).toString().padStart(4, '0'),
      cost_code_vuid: '',
      cost_type_vuid: '',
      description: '',
      amount: '',
      quantity: '',
      unit_price: '',
      total_amount: ''
    });
  };

  const handleEditLineItem = (lineItem) => {
    setEditingLineItem(lineItem);
    setShowLineItemForm(true);
    setLineItemData({
      line_number: lineItem.line_number || '',
      cost_code_vuid: lineItem.cost_code_vuid || '',
      cost_type_vuid: lineItem.cost_type_vuid || '',
      description: lineItem.description || '',
      quantity: lineItem.quantity || '',
      unit_price: lineItem.unit_price || '',
      total_amount: lineItem.total_amount || ''
    });
  };

  const handleDeleteLineItem = (index) => {
    if (window.confirm('Are you sure you want to delete this line item?')) {
      const newLineItems = lineItems.filter((_, i) => i !== index);
      setLineItems(newLineItems);
    }
  };

  const handleLineItemSubmit = (e) => {
    e.preventDefault();
    
    if (!lineItemData.cost_code_vuid || !lineItemData.cost_type_vuid || !lineItemData.description || (!lineItemData.amount && (!lineItemData.quantity || !lineItemData.unit_price))) {
      alert('Please fill in description, cost code, cost type, and either amount OR both quantity and unit price for the line item');
      return;
    }

    // If amount is provided, use it; otherwise calculate from quantity * unit price
    let finalAmount, finalQuantity, finalUnitPrice;
    
    if (lineItemData.amount && parseFloat(lineItemData.amount) > 0) {
      finalAmount = parseFloat(lineItemData.amount);
      finalQuantity = 1;
      finalUnitPrice = finalAmount;
    } else {
      finalQuantity = parseFloat(lineItemData.quantity);
      finalUnitPrice = parseFloat(lineItemData.unit_price);
      finalAmount = finalQuantity * finalUnitPrice;
    }

    const processedLineItem = {
      ...lineItemData,
      quantity: finalQuantity,
      unit_price: finalUnitPrice,
      total_amount: finalAmount
    };

    if (editingLineItem) {
      // Update existing line item
      const updatedLineItems = lineItems.map((item, index) => 
        index === editingLineItem.index ? processedLineItem : item
      );
      setLineItems(updatedLineItems);
    } else {
      // Add new line item
      setLineItems([...lineItems, processedLineItem]);
    }

    setShowLineItemForm(false);
    setEditingLineItem(null);
    setLineItemData({
      line_number: '',
      cost_code_vuid: '',
      cost_type_vuid: '',
      description: '',
      amount: '',
      quantity: '',
      unit_price: '',
      total_amount: ''
    });
  };

  const handleLineItemCancel = () => {
    setShowLineItemForm(false);
    setEditingLineItem(null);
    setLineItemData({
      line_number: '',
      cost_code_vuid: '',
      cost_type_vuid: '',
      description: '',
      amount: '',
      quantity: '',
      unit_price: '',
      total_amount: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vermillion-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading commitment change orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Commitment Change Orders
              </h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                + Add Change Order
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {editingChangeOrder ? 'Edit Commitment Change Order' : 'Create Commitment Change Order'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment *
                  </label>
                  <select
                    name="commitment_vuid"
                    value={formData.commitment_vuid}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a commitment</option>
                    {commitments.map(commitment => (
                      <option key={commitment.vuid} value={commitment.vuid}>
                        {commitment.commitment_number} - {commitment.commitment_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting Period *
                  </label>
                  <select
                    name="accounting_period_vuid"
                    value={formData.accounting_period_vuid}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select accounting period</option>
                    {accountingPeriods.map(period => (
                      <option key={period.vuid} value={period.vuid}>
                        {period.month}/{period.year} {period.status === 'closed' ? '(Closed)' : ''}
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
                    name="change_order_number"
                    value={formData.change_order_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Order Date *
                  </label>
                  <input
                    type="date"
                    name="change_order_date"
                    value={formData.change_order_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Total Amount Calculation
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>The total amount will be automatically calculated based on the line items added to this change order.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Line Items Section */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors"
                  >
                    Add Line Item
                  </button>
                </div>
                
                {/* Existing Lines */}
                {lineItems.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Existing Lines</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-9 gap-4 text-sm font-medium text-gray-700 mb-2">
                        <div>Line #</div>
                        <div>Cost Code</div>
                        <div>Cost Type</div>
                        <div>Description</div>
                        <div>Quantity</div>
                        <div>Unit Price</div>
                        <div>Amount</div>
                        <div>Total Amount</div>
                        <div>Actions</div>
                      </div>
                      {lineItems.map((lineItem, index) => (
                        <div key={index} className="grid grid-cols-9 gap-4 py-2 border-t border-gray-200">
                          <div className="text-sm text-gray-900">{lineItem.line_number}</div>
                          <div className="text-sm text-gray-900">
                            {costCodes.find(c => c.vuid === lineItem.cost_code_vuid)?.code || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-900">
                            {costTypes.find(c => c.vuid === lineItem.cost_type_vuid)?.cost_type || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-900">{lineItem.description}</div>
                          <div className="text-sm text-gray-900">{lineItem.quantity}</div>
                          <div className="text-sm text-gray-900">{formatCurrency(lineItem.unit_price)}</div>
                          <div className="text-sm text-gray-900">{formatCurrency(lineItem.amount || lineItem.total_amount)}</div>
                          <div className="text-sm text-gray-900">{formatCurrency(lineItem.total_amount)}</div>
                          <div className="text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditLineItem({...lineItem, index})}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLineItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Line Item Form */}
                {showLineItemForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Add New Line Item</h4>
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Line Number
                        </label>
                        <input
                          type="text"
                          name="line_number"
                          value={lineItemData.line_number}
                          onChange={handleLineItemInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost Code
                        </label>
                        <select
                          name="cost_code_vuid"
                          value={lineItemData.cost_code_vuid}
                          onChange={handleLineItemInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select cost code...</option>
                          {getBudgetedCostCodes(effectiveProjectVuid).map(costCode => (
                            <option key={costCode.vuid} value={costCode.vuid}>
                              {costCode.code} - {costCode.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost Type
                        </label>
                        <select
                          name="cost_type_vuid"
                          value={lineItemData.cost_type_vuid}
                          onChange={handleLineItemInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select cost type...</option>
                          {getBudgetedCostTypes(effectiveProjectVuid, lineItemData.cost_code_vuid).map(costType => (
                            <option key={costType.vuid} value={costType.vuid}>
                              {costType.cost_type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <input
                          type="text"
                          name="description"
                          value={lineItemData.description}
                          onChange={handleLineItemInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Line description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="quantity"
                          value={lineItemData.quantity}
                          onChange={handleLineItemQuantityChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="unit_price"
                          value={lineItemData.unit_price}
                          onChange={handleLineItemUnitPriceChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="amount"
                          value={lineItemData.amount}
                          onChange={handleLineItemAmountChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    {/* Total Amount Display - Separate from input grid */}
                    <div className="mt-4 flex justify-end">
                      <div className="bg-gray-100 px-4 py-2 rounded-md">
                        <span className="text-sm font-medium text-gray-700">Total Amount: </span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(lineItemData.total_amount || 0)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        type="button"
                        onClick={handleLineItemSubmit}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Save Line Item
                      </button>
                      <button
                        type="button"
                        onClick={handleLineItemCancel}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Total Amount Display */}
                {lineItems.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <div className="bg-gray-50 px-4 py-2 rounded-md">
                      <span className="text-sm font-medium text-gray-700">Total Amount: </span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(lineItems.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-all"
                >
                  {editingChangeOrder ? 'Update Change Order' : 'Create Change Order'}
                </button>
              </div>
            </form>
          </div>
        )}


        {/* Change Orders List */}
        {commitmentChangeOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">No commitment change orders found</p>
            <p className="text-sm">Create the first commitment change order for this project</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commitment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commitmentChangeOrders.map((changeOrder) => (
                    <tr key={changeOrder.vuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {changeOrder.change_order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commitments.find(c => c.vuid === changeOrder.commitment_vuid)?.commitment_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {changeOrder.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(changeOrder.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(changeOrder.change_order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(changeOrder.status)}`}>
                          {changeOrder.status.charAt(0).toUpperCase() + changeOrder.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(changeOrder)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(changeOrder)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommitmentChangeOrders;

