import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import IntegrationIndicator from './IntegrationIndicator';

const ProjectExpenses = () => {
  const location = useLocation();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Preview journal entry state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    expense_number: '',
    project_vuid: '',
    cost_code_vuid: '',
    cost_type_vuid: '',
    vendor_vuid: '',
    employee_vuid: '',
    amount: '',
    description: '',
    memo: '',
    expense_date: new Date().toISOString().split('T')[0],
    accounting_period_vuid: '',
    attachment_path: '',
    status: 'pending'
  });
  
  // Reference data
  const [projects, setProjects] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [budgetLines, setBudgetLines] = useState([]);
  
  // Integration state
  const [integrations, setIntegrations] = useState([]);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);
  const [retrievedExpenses, setRetrievedExpenses] = useState([]);
  const [showRetrievedExpensesModal, setShowRetrievedExpensesModal] = useState(false);
  const [selectedExpensesToImport, setSelectedExpensesToImport] = useState([]);

  // Get project from URL params
  const urlParams = new URLSearchParams(location.search);
  const projectVuid = urlParams.get('project');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (projectVuid) {
      setFormData(prev => ({ ...prev, project_vuid: projectVuid }));
      loadBudgetLines(projectVuid);
    }
  }, [projectVuid]);

  const fetchIntegrations = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/integrations`);
      setIntegrations(response.data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const baseURL = 'http://localhost:5001';
      
      // Load all reference data
      const [expensesRes, projectsRes, costCodesRes, costTypesRes, vendorsRes, employeesRes, periodsRes] = await Promise.all([
        axios.get(`${baseURL}/api/project-expenses${projectVuid ? `?project_vuid=${projectVuid}` : ''}`),
        axios.get(`${baseURL}/api/projects`),
        axios.get(`${baseURL}/api/cost-codes`),
        axios.get(`${baseURL}/api/cost-types`),
        axios.get(`${baseURL}/api/vendors`),
        axios.get(`${baseURL}/api/employees`),
        axios.get(`${baseURL}/api/accounting-periods`)
      ]);
      
      setExpenses(expensesRes.data);
      setProjects(projectsRes.data);
      setCostCodes(costCodesRes.data);
      setCostTypes(costTypesRes.data);
      setVendors(vendorsRes.data);
      setEmployees(employeesRes.data);
      setAccountingPeriods(periodsRes.data);
      
      // Set default accounting period
      const openPeriod = periodsRes.data.find(p => p.status === 'open');
      if (openPeriod) {
        setFormData(prev => ({ ...prev, accounting_period_vuid: openPeriod.vuid }));
      }
      
      setError(null);
      
      // Load integrations separately
      await fetchIntegrations();
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetLines = async (projectVuid) => {
    if (!projectVuid) return;
    
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/projects/${projectVuid}/budget-lines`);
      setBudgetLines(response.data);
    } catch (err) {
      console.error('Error loading budget lines:', err);
      setBudgetLines([]);
    }
  };

  const getFilteredCostCodes = () => {
    const effectiveProjectVuid = projectVuid || formData.project_vuid;
    if (!effectiveProjectVuid || budgetLines.length === 0) {
      return costCodes;
    }
    
    const budgetCostCodeVuids = [...new Set(budgetLines.map(line => line.cost_code_vuid))];
    return costCodes.filter(code => budgetCostCodeVuids.includes(code.vuid));
  };

  const getFilteredCostTypes = (selectedCostCodeVuid = null) => {
    const effectiveProjectVuid = projectVuid || formData.project_vuid;
    if (!effectiveProjectVuid || budgetLines.length === 0) {
      return costTypes;
    }
    
    // If no cost code is selected, return all cost types from project budget
    if (!selectedCostCodeVuid) {
      const budgetCostTypeVuids = [...new Set(budgetLines.map(line => line.cost_type_vuid))];
      return costTypes.filter(type => budgetCostTypeVuids.includes(type.vuid));
    }
    
    // Filter cost types that are paired with the selected cost code in budget lines
    const budgetCostTypeVuids = [...new Set(
      budgetLines
        .filter(line => line.cost_code_vuid === selectedCostCodeVuid)
        .map(line => line.cost_type_vuid)
    )];
    return costTypes.filter(type => budgetCostTypeVuids.includes(type.vuid));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If cost code changes, clear the cost type selection since available cost types will change
    if (name === 'cost_code_vuid') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cost_type_vuid: '' // Clear cost type when cost code changes
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Load budget lines when project changes
    if (name === 'project_vuid') {
      loadBudgetLines(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const baseURL = 'http://localhost:5001';
      
      if (editingExpense) {
        // Update existing expense
        await axios.put(`${baseURL}/api/project-expenses/${editingExpense.vuid}`, formData);
      } else {
        // Create new expense
        await axios.post(`${baseURL}/api/project-expenses`, formData);
      }
      
      // Reset form and reload data
      setFormData({
        expense_number: '',
        project_vuid: projectVuid || '',
        cost_code_vuid: '',
        cost_type_vuid: '',
        vendor_vuid: '',
        employee_vuid: '',
        amount: '',
        description: '',
        memo: '',
        expense_date: new Date().toISOString().split('T')[0],
        accounting_period_vuid: formData.accounting_period_vuid,
        attachment_path: '',
        status: 'pending'
      });
      setShowCreateForm(false);
      setEditingExpense(null);
      loadData();
      
    } catch (err) {
      console.error('Error saving expense:', err);
      alert(`Failed to save expense: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_number: expense.expense_number,
      project_vuid: expense.project_vuid,
      cost_code_vuid: expense.cost_code_vuid,
      cost_type_vuid: expense.cost_type_vuid,
      vendor_vuid: expense.vendor_vuid,
      employee_vuid: expense.employee_vuid,
      amount: expense.amount,
      description: expense.description,
      memo: expense.memo,
      expense_date: expense.expense_date,
      accounting_period_vuid: expense.accounting_period_vuid,
      attachment_path: expense.attachment_path,
      status: expense.status
    });
    
    // Load budget lines for the expense's project to enable filtering
    if (expense.project_vuid) {
      loadBudgetLines(expense.project_vuid);
    }
    
    setShowCreateForm(true);
  };

  // Preview journal entry for an expense
  const handlePreviewJournalEntry = async (expense) => {
    try {
      setPreviewLoading(true);
      setPreviewData(null);
      
      const baseURL = 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/project-expenses/${expense.vuid}/preview-journal-entry`);
      
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setShowPreviewModal(true);
      } else {
        const errorData = await response.text();
        alert(`Error previewing journal entry: ${errorData}`);
      }
    } catch (error) {
      console.error('Error previewing journal entry:', error);
      alert(`Error previewing journal entry: ${error.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      await axios.delete(`${baseURL}/api/project-expenses/${expense.vuid}`);
      loadData();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert(`Failed to delete expense: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleStatusChange = async (expense, newStatus) => {
    try {
      const baseURL = 'http://localhost:5001';
      await axios.put(`${baseURL}/api/project-expenses/${expense.vuid}`, {
        ...expense,
        status: newStatus
      });
      loadData();
    } catch (err) {
      console.error('Error updating expense status:', err);
      alert(`Failed to update expense status: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedExpenses.length === 0) {
      alert('Please select expenses to update');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${newStatus} ${selectedExpenses.length} expense(s)?`)) {
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      const promises = selectedExpenses.map(expense => 
        axios.put(`${baseURL}/api/project-expenses/${expense.vuid}`, {
          ...expense,
          status: newStatus
        })
      );
      
      await Promise.all(promises);
      setSelectedExpenses([]);
      setSelectAll(false);
      loadData();
    } catch (err) {
      console.error('Error updating expense statuses:', err);
      alert(`Failed to update expense statuses: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleSelectExpense = (expense, checked) => {
    if (checked) {
      setSelectedExpenses([...selectedExpenses, expense]);
    } else {
      setSelectedExpenses(selectedExpenses.filter(e => e.vuid !== expense.vuid));
    }
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedExpenses([...currentData]);
    } else {
      setSelectedExpenses([]);
    }
  };

  // Integration handlers
  const handleRetrieveFromIntegration = async () => {
    if (!retrieveIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      console.log(`Retrieving project expenses from integration ${retrieveIntegration.integration_name}`);
      console.log('Current projectVuid from URL:', projectVuid);
      
      let retrievedExpenses = [];
      
      // Handle different integration types
      if (retrieveIntegration.integration_type === 'sap_concur') {
        // Call the mock SAP Concur project expenses API
        const baseURL = 'http://localhost:5001';
        const response = await axios.get(`${baseURL}/api/mock-sap-concur/project-expenses`);
        
        if (response.data && response.data.expenses) {
          const mappedProjectVuid = projectVuid || '97094372-1078-4da5-b5c0-6f49503b9bb2';
          console.log('Mapping expenses with project_vuid:', mappedProjectVuid);
          
          if (!projectVuid) {
            console.warn('⚠️ No project context found in URL! Using fallback project.');
            alert('⚠️ Warning: No project context found. Expenses will be imported to the default project. Please navigate to Project Expenses from a project details page.');
          }
          
          // Get first available cost code and cost type from project budget
          const firstBudgetLine = budgetLines.find(line => line.project_vuid === mappedProjectVuid);
          const defaultCostCodeVuid = firstBudgetLine?.cost_code_vuid || '';
          const defaultCostTypeVuid = firstBudgetLine?.cost_type_vuid || '';
          
          retrievedExpenses = response.data.expenses.map(concurExpense => ({
            expense_number: concurExpense.expense_number,
            project_vuid: mappedProjectVuid,
            cost_code_vuid: defaultCostCodeVuid, // Use first cost code from project budget
            cost_type_vuid: defaultCostTypeVuid, // Use first cost type from project budget
            employee_vuid: null, // Will be set based on employee_id lookup
            vendor_vuid: null,
            amount: concurExpense.amount,
            description: concurExpense.description,
            memo: `Imported from SAP Concur - ${concurExpense.expense_type}`,
            expense_date: concurExpense.expense_date,
            accounting_period_vuid: '90858fcd-e3a5-4b0c-8076-fa16f8e52e29', // Default to open period
            attachment_path: concurExpense.receipt_path,
            status: concurExpense.status === 'approved' ? 'approved' : 'pending',
            external_id: concurExpense.id,
            external_data: concurExpense
          }));
        }
      } else {
        // Handle other integration types (placeholder)
        alert(`Integration type ${retrieveIntegration.integration_type} is not yet implemented`);
        return;
      }
      
      if (retrievedExpenses.length > 0) {
        setRetrievedExpenses(retrievedExpenses);
        setShowRetrievedExpensesModal(true);
        setShowRetrieveModal(false);
      } else {
        alert('No project expenses found in the integration');
      }
    } catch (error) {
      console.error('Error retrieving project expenses:', error);
      alert('Failed to retrieve project expenses from integration');
    }
  };

  const handleImportSelectedExpenses = async () => {
    if (selectedExpensesToImport.length === 0) {
      alert('Please select expenses to import');
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      let importedCount = 0;
      let skippedCount = 0;

      for (const expenseData of selectedExpensesToImport) {
        try {
          console.log('Importing expense with data:', expenseData);
          const response = await axios.post(`${baseURL}/api/project-expenses`, expenseData);

          if (response.status === 201) {
            const createdExpense = response.data;
            importedCount++;
            
            // Create external system ID mapping
            try {
              await axios.post(`${baseURL}/api/external-system-ids`, {
                object_vuid: createdExpense.vuid,
                object_type: 'project_expense',
                integration_name: retrieveIntegration.integration_name,
                external_id: expenseData.external_id,
                metadata: {
                  integration_source: retrieveIntegration.integration_name,
                  external_data: expenseData.external_data
                }
              });
            } catch (mappingError) {
              console.error('Error creating external system ID mapping:', mappingError);
            }
          } else {
            skippedCount++;
            console.error('Failed to create expense:', response.data);
          }
        } catch (error) {
          skippedCount++;
          console.error('Error creating expense:', error);
        }
      }

      alert(`Successfully imported ${importedCount} project expenses. ${skippedCount} were skipped.`);
      setShowRetrievedExpensesModal(false);
      setSelectedExpensesToImport([]);
      loadData();
    } catch (error) {
      console.error('Error importing project expenses:', error);
      alert('Failed to import project expenses');
    }
  };

  const getFilteredData = () => {
    let filtered = expenses;
    
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.expense_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.project?.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(expense => expense.status === statusFilter);
    }
    
    return filtered;
  };

  const getCurrentData = () => {
    const filtered = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vermillion-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Project Expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Project Expenses</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const currentData = getCurrentData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 font-sans">
            Project Expenses
          </h1>
          <p className="text-lg text-gray-700 font-light">
            Manage miscellaneous project expenses and costs
            {projectVuid && (
              <span className="block mt-2 text-vermillion-600 font-medium">
                Filtered for: {projects.find(p => p.vuid === projectVuid)?.project_name || 'Selected Project'}
              </span>
            )}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-blue-600 mb-1">
              {formatCurrency(filteredData.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0))}
            </div>
            <div className="text-blue-800 font-medium text-xs leading-tight">Total Expenses</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-green-600 mb-1">
              {filteredData.filter(e => e.status === 'approved').length}
            </div>
            <div className="text-green-800 font-medium text-xs leading-tight">Approved</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-yellow-600 mb-1">
              {filteredData.filter(e => e.status === 'pending').length}
            </div>
            <div className="text-yellow-800 font-medium text-xs leading-tight">Pending</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-indigo-600 mb-1">
              {filteredData.length}
            </div>
            <div className="text-indigo-800 font-medium text-xs leading-tight">Total Records</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search expenses..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowRetrieveModal(true)}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors mr-2"
              >
                📥 Retrieve from Integration
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Add New Expense
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-2xl p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingExpense ? 'Edit Expense' : 'Create New Expense'}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Expense Number *
                </label>
                <input
                  type="text"
                  name="expense_number"
                  value={formData.expense_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Project *
                </label>
                <select
                  name="project_vuid"
                  value={formData.project_vuid}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Cost Code *
                </label>
                <select
                  name="cost_code_vuid"
                  value={formData.cost_code_vuid}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Cost Code</option>
                  {getFilteredCostCodes().map((code) => (
                    <option key={code.vuid} value={code.vuid}>
                      {code.code} - {code.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Cost Type *
                </label>
                <select
                  name="cost_type_vuid"
                  value={formData.cost_type_vuid}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Cost Type</option>
                  {getFilteredCostTypes(formData.cost_code_vuid).map((type) => (
                    <option key={type.vuid} value={type.vuid}>
                      {type.cost_type} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Vendor
                </label>
                <select
                  name="vendor_vuid"
                  value={formData.vendor_vuid}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.vuid} value={vendor.vuid}>
                      {vendor.vendor_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Employee
                </label>
                <select
                  name="employee_vuid"
                  value={formData.employee_vuid}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.vuid} value={employee.vuid}>
                      {employee.employee_id} - {employee.employee_name} ({employee.trade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Expense Date *
                </label>
                <input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Accounting Period *
                </label>
                <select
                  name="accounting_period_vuid"
                  value={formData.accounting_period_vuid}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Period</option>
                  {accountingPeriods.map((period) => (
                    <option key={period.vuid} value={period.vuid}>
                      {period.month}/{period.year} {period.status === 'open' ? '(Open)' : '(Closed)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Memo
                </label>
                <textarea
                  name="memo"
                  value={formData.memo}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Attachment Path
                </label>
                <input
                  type="text"
                  name="attachment_path"
                  value={formData.attachment_path}
                  onChange={handleInputChange}
                  placeholder="Path to PDF attachment"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingExpense(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                >
                  {editingExpense ? 'Update Expense' : 'Create Expense'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Actions */}
        {currentData && currentData.length > 0 && (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selectedExpenses.length} of {currentData.length} selected
                </span>
                {selectedExpenses.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkStatusChange('approved')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Approve Selected
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('rejected')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Reject Selected
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('pending')}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                    >
                      Mark as Pending
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedExpenses([]);
                  setSelectAll(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        {currentData && currentData.length > 0 ? (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Expense Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Cost Code/Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Vendor/Employee
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((expense) => (
                    <tr key={expense.vuid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.some(e => e.vuid === expense.vuid)}
                          onChange={(e) => handleSelectExpense(expense, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{expense.expense_number}</div>
                            <div className="text-sm text-gray-500">{formatDate(expense.expense_date)}</div>
                          </div>
                          <IntegrationIndicator 
                            objectVuid={expense.vuid} 
                            objectType="project_expense" 
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{expense.project?.project_number}</div>
                        <div className="text-sm text-gray-500">{expense.project?.project_name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{expense.cost_code?.code}</div>
                        <div className="text-sm text-gray-500">{expense.cost_type?.cost_type}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {expense.vendor && (
                          <div className="text-sm font-semibold text-gray-900">{expense.vendor.vendor_name}</div>
                        )}
                        {expense.employee && (
                          <div className="text-sm font-semibold text-gray-900">{expense.employee.employee_name}</div>
                        )}
                        {!expense.vendor && !expense.employee && (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{expense.description}</div>
                        {expense.memo && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">{expense.memo}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-vermillion-600 hover:text-vermillion-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePreviewJournalEntry(expense)}
                            disabled={previewLoading}
                            className="text-purple-600 hover:text-purple-900 disabled:opacity-50 font-medium"
                            title="Preview Journal Entry"
                          >
                            {previewLoading ? '⏳' : '👁️'}
                          </button>
                          {expense.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(expense, 'approved')}
                                className="text-green-600 hover:text-green-900 font-medium"
                                title="Approve expense"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(expense, 'rejected')}
                                className="text-red-600 hover:text-red-900 font-medium"
                                title="Reject expense"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {expense.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(expense, 'pending')}
                              className="text-yellow-600 hover:text-yellow-900 font-medium"
                              title="Mark as pending"
                            >
                              Pending
                            </button>
                          )}
                          {expense.status === 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(expense, 'pending')}
                              className="text-yellow-600 hover:text-yellow-900 font-medium"
                              title="Mark as pending"
                            >
                              Pending
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(expense)}
                            className="text-red-600 hover:text-red-900 font-medium"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || 
                                       (page >= currentPage - 2 && page <= currentPage + 2))
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-3 py-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                              currentPage === page
                                ? 'bg-vermillion-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200 text-center">
            <div className="text-gray-500 text-lg mb-4">No project expenses found</div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-vermillion-600 hover:bg-vermillion-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Create First Expense
            </button>
          </div>
        )}

        {/* Retrieve from Integration Modal */}
        {showRetrieveModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Retrieve Project Expenses from Integration
                </h3>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Select an integration to retrieve project expenses from external systems like SAP Concur.
                  </p>
                  {projectVuid && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Project Context:</span> {projects.find(p => p.vuid === projectVuid)?.project_name || 'Unknown Project'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Expenses will be imported for this project only.</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4">
                    {integrations.map((integration) => (
                      <div
                        key={integration.vuid}
                        onClick={() => setRetrieveIntegration(integration)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          retrieveIntegration?.vuid === integration.vuid
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{integration.integration_name}</h4>
                            <p className="text-sm text-gray-600">{integration.integration_type}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              integration.status === 'active' ? 'bg-green-100 text-green-800' : 
                              integration.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {integration.status}
                            </span>
                            {retrieveIntegration?.vuid === integration.vuid && (
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRetrieveModal(false);
                      setRetrieveIntegration(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRetrieveFromIntegration}
                    disabled={!retrieveIntegration}
                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Retrieve Expenses
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retrieved Expenses Modal */}
        {showRetrievedExpensesModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Review Retrieved Project Expenses
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Review the project expenses retrieved from {retrieveIntegration?.integration_name}. 
                    Select the ones you want to import.
                  </p>
                  {projectVuid && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Project Context:</span> {projects.find(p => p.vuid === projectVuid)?.project_name || 'Unknown Project'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">All selected expenses will be imported for this project.</p>
                      <p className="text-xs text-blue-600 mt-1">Cost codes and cost types are filtered to only show options from this project's budget.</p>
                    </div>
                  )}
                </div>
                
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedExpensesToImport.length === retrievedExpenses.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExpensesToImport([...retrievedExpenses]);
                              } else {
                                setSelectedExpensesToImport([]);
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expense Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expense Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {retrievedExpenses.map((expense, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedExpensesToImport.includes(expense)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExpensesToImport([...selectedExpensesToImport, expense]);
                                } else {
                                  setSelectedExpensesToImport(selectedExpensesToImport.filter(item => item !== expense));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {expense.expense_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {expense.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              value={expense.cost_code_vuid || ''}
                              onChange={(e) => {
                                const updatedExpenses = [...retrievedExpenses];
                                updatedExpenses[index].cost_code_vuid = e.target.value;
                                updatedExpenses[index].cost_type_vuid = ''; // Clear cost type when cost code changes
                                setRetrievedExpenses(updatedExpenses);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            >
                              <option value="">Select Cost Code</option>
                              {getFilteredCostCodes().map(code => (
                                <option key={code.vuid} value={code.vuid}>
                                  {code.code} - {code.description}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              value={expense.cost_type_vuid || ''}
                              onChange={(e) => {
                                const updatedExpenses = [...retrievedExpenses];
                                updatedExpenses[index].cost_type_vuid = e.target.value;
                                setRetrievedExpenses(updatedExpenses);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            >
                              <option value="">Select Cost Type</option>
                              {getFilteredCostTypes(expense.cost_code_vuid).map(type => (
                                <option key={type.vuid} value={type.vuid}>
                                  {type.cost_type} - {type.description}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.expense_date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                              expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {expense.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-between items-center pt-4">
                  <p className="text-sm text-gray-600">
                    {selectedExpensesToImport.length} of {retrievedExpenses.length} expenses selected
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowRetrievedExpensesModal(false);
                        setSelectedExpensesToImport([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImportSelectedExpenses}
                      disabled={selectedExpensesToImport.length === 0}
                      className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Import Selected ({selectedExpensesToImport.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Preview Journal Entry Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Preview Journal Entry
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {previewData ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Journal Entry Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Journal Number:</span> {previewData.journal_number}
                    </div>
                    <div>
                      <span className="font-medium">Description:</span> {previewData.description}
                    </div>
                    <div>
                      <span className="font-medium">Total Amount:</span> ${previewData.total_amount?.toFixed(2) || '0.00'}
                    </div>
                    <div>
                      <span className="font-medium">Balance Status:</span> 
                      <span className={`ml-2 ${previewData.is_balanced ? 'text-green-600' : 'text-red-600'}`}>
                        {previewData.is_balanced ? '✅ Balanced' : '❌ Unbalanced'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Line Items</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Debit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.line_items?.map((line, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {line.account_name || line.gl_account_vuid}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {line.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {line.debit_amount > 0 ? `$${line.debit_amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {line.credit_amount > 0 ? `$${line.credit_amount.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="2" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                            Totals:
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${previewData.total_debits?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${previewData.total_credits?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">No preview data available</div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProjectExpenses;
