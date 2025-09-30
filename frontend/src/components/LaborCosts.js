import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import IntegrationIndicator from './IntegrationIndicator';

const LaborCosts = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectVuid = searchParams.get('project');
  
  // Debug logging
  console.log('LaborCosts component mounted');
  console.log('Current location:', location);
  console.log('Search params:', location.search);
  console.log('Project VUID from URL:', projectVuid);
  const [laborCosts, setLaborCosts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [projectCostCodes, setProjectCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [projectBudgetLines, setProjectBudgetLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  
  const baseURL = 'http://localhost:5001';
  
  // Helper function to get all cost codes (global + project-specific)
  const getAllCostCodes = () => {
    return [...costCodes, ...projectCostCodes];
  };

  // Fetch project-specific cost codes for a specific project
  const fetchProjectCostCodes = async (projectVuid) => {
    if (!projectVuid) {
      setProjectCostCodes([]);
      return;
    }

    try {
      const response = await fetch(`${baseURL}/api/projects/${projectVuid}/cost-codes`);
      if (!response.ok) {
        throw new Error('Failed to fetch project cost codes');
      }
      const data = await response.json();
      // Filter to only project-specific cost codes
      const projectSpecificCostCodes = (data || []).filter(c => c.is_project_specific);
      setProjectCostCodes(projectSpecificCostCodes);
    } catch (error) {
      console.error('Error fetching project cost codes:', error);
      setProjectCostCodes([]);
    }
  };
  
  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLaborCost, setEditingLaborCost] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    project_vuid: '',
    cost_code_vuid: '',
    cost_type_vuid: '',
    accounting_period_vuid: '',
    payroll_date: '',
    amount: '',
    hours: '',
    rate: '',
    memo: '',
    status: 'active'
  });

  // Filter state
  const [filters, setFilters] = useState({
    project_vuid: '',
    accounting_period_vuid: '',
    employee_id: '',
    status: 'active'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Preview journal entry state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Integration state
  const [integrations, setIntegrations] = useState([]);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);
  const [retrievedLaborCosts, setRetrievedLaborCosts] = useState([]);
  const [showRetrievedLaborCostsModal, setShowRetrievedLaborCostsModal] = useState(false);
  const [selectedLaborCostsToImport, setSelectedLaborCostsToImport] = useState([]);

  // Fetch data functions
  const fetchIntegrations = async () => {
    try {
      const response = await fetch(`${baseURL}/api/integrations`);
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${baseURL}/api/employees`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchLaborCosts = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`${baseURL}/api/labor-costs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch labor costs');
      
      const data = await response.json();
      setLaborCosts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${baseURL}/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCostCodes = async () => {
    try {
      const response = await fetch(`${baseURL}/api/cost-codes`);
      if (!response.ok) throw new Error('Failed to fetch cost codes');
      const data = await response.json();
      setCostCodes(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCostTypes = async () => {
    try {
      const response = await fetch(`${baseURL}/api/cost-types`);
      if (!response.ok) throw new Error('Failed to fetch cost types');
      const data = await response.json();
      setCostTypes(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchAccountingPeriods = async () => {
    try {
      const response = await fetch(`${baseURL}/api/accounting-periods`);
      if (!response.ok) throw new Error('Failed to fetch accounting periods');
      const data = await response.json();
      setAccountingPeriods(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProjectBudgetLines = async (projectVuid) => {
    try {
      console.log('Fetching project budget lines for project:', projectVuid);
      const response = await fetch(`${baseURL}/api/projects/${projectVuid}/budget-lines`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Project budget lines API error:', response.status, errorText);
        throw new Error(`Failed to fetch project budget lines: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Project budget lines loaded:', data.length, 'lines');
      setProjectBudgetLines(data);
    } catch (err) {
      console.error('Error fetching project budget lines:', err);
      // Don't set the main error state for project budget lines - it's not critical
      // setError(`Project budget lines error: ${err.message}`);
      setProjectBudgetLines([]); // Set empty array as fallback
    }
  };

  // Get filtered cost codes and cost types from project budget
  const getFilteredCostCodes = () => {
    // If we have a project from URL and project-specific cost codes, show only those
    if (projectVuid && projectCostCodes.length > 0) {
      return getAllCostCodes().filter(code => code.is_project_specific || (code.status === 'active' && projectBudgetLines.some(line => line.cost_code_vuid === code.vuid)));
    }
    
    // If we have budget lines, filter by those
    if (projectBudgetLines.length > 0) {
      const budgetCostCodeVUIDs = new Set(projectBudgetLines.map(line => line.cost_code_vuid));
      return getAllCostCodes().filter(code => 
        budgetCostCodeVUIDs.has(code.vuid) && (code.status === 'active' || code.is_project_specific)
      );
    }
    
    // Default: show all active cost codes
    return getAllCostCodes().filter(code => code.status === 'active' || code.is_project_specific);
  };

  const getFilteredCostTypes = (selectedCostCodeVuid = null) => {
    if (!projectVuid || projectBudgetLines.length === 0) {
      return costTypes;
    }
    
    // If no cost code is selected, return all cost types from project budget
    if (!selectedCostCodeVuid) {
      const budgetCostTypeVUIDs = new Set(projectBudgetLines.map(line => line.cost_type_vuid));
      return costTypes.filter(type => budgetCostTypeVUIDs.has(type.vuid));
    }
    
    // Filter cost types that are paired with the selected cost code in budget lines
    const budgetCostTypeVUIDs = new Set(
      projectBudgetLines
        .filter(line => line.cost_code_vuid === selectedCostCodeVuid)
        .map(line => line.cost_type_vuid)
    );
    return costTypes.filter(type => budgetCostTypeVUIDs.has(type.vuid));
  };

  // Clear any existing errors when component mounts
  useEffect(() => {
    setError(null);
  }, []);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null); // Clear any previous errors
      try {
        console.log('Loading all data for Labor Costs...');
        await Promise.all([
          fetchLaborCosts(),
          fetchEmployees(),
          fetchProjects(),
          fetchCostCodes(),
          fetchCostTypes(),
          fetchAccountingPeriods(),
          fetchIntegrations()
        ]);
        console.log('All data loaded successfully');
      } catch (err) {
        console.error('Error loading data:', err);
        setError(`Data loading error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters]);

  // Fetch project budget lines when project changes
  useEffect(() => {
    if (projectVuid) {
      // Fetch project budget lines and project-specific cost codes
      fetchProjectBudgetLines(projectVuid);
      fetchProjectCostCodes(projectVuid);
    } else {
      setProjectBudgetLines([]);
      setProjectCostCodes([]);
    }
  }, [projectVuid]);


  // Auto-calculate amount when hours or rate change
  const calculateAmount = (hours, rate) => {
    const h = parseFloat(hours) || 0;
    const r = parseFloat(rate) || 0;
    return h * r;
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If project changes, fetch project-specific cost codes and clear cost selections
    if (name === 'project_vuid') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cost_code_vuid: '', // Clear cost code when project changes
        cost_type_vuid: '' // Clear cost type when project changes
      }));
      // Fetch project-specific cost codes for the new project
      if (value) {
        fetchProjectBudgetLines(value);
        fetchProjectCostCodes(value);
      } else {
        setProjectBudgetLines([]);
        setProjectCostCodes([]);
      }
    }
    // If cost code changes, clear the cost type selection since available cost types will change
    else if (name === 'cost_code_vuid') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cost_type_vuid: '' // Clear cost type when cost code changes
      }));
    } else if (name === 'hours' || name === 'rate') {
      // Auto-calculate amount when hours or rate changes
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: value
        };
        
        // Calculate amount if both hours and rate are provided
        if (name === 'hours') {
          const calculatedAmount = calculateAmount(value, prev.rate);
          if (calculatedAmount > 0) {
            newData.amount = calculatedAmount.toFixed(2);
          }
        } else if (name === 'rate') {
          const calculatedAmount = calculateAmount(prev.hours, value);
          if (calculatedAmount > 0) {
            newData.amount = calculatedAmount.toFixed(2);
          }
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      project_vuid: '',
      cost_code_vuid: '',
      cost_type_vuid: '',
      accounting_period_vuid: '',
      payroll_date: '',
      amount: '',
      hours: '',
      rate: '',
      memo: '',
      status: 'active'
    });
    setEditingLaborCost(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${baseURL}/api/labor-costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create labor cost');
      }

      await fetchLaborCosts();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (laborCost) => {
    // Check if the accounting period is closed
    if (laborCost.accounting_period && laborCost.accounting_period.status === 'closed') {
      alert('Cannot edit this labor cost because it is in a closed accounting period.');
      return;
    }
    
    setFormData({
      employee_id: laborCost.employee_id,
      project_vuid: laborCost.project_vuid,
      cost_code_vuid: laborCost.cost_code_vuid,
      cost_type_vuid: laborCost.cost_type_vuid,
      accounting_period_vuid: laborCost.accounting_period_vuid,
      payroll_date: laborCost.payroll_date,
      amount: laborCost.amount,
      hours: laborCost.hours || '',
      rate: laborCost.rate || '',
      memo: laborCost.memo || '',
      status: laborCost.status
    });
    setEditingLaborCost(laborCost);
    setShowCreateModal(true);
  };

  // Preview journal entry for a labor cost
  const handlePreviewJournalEntry = async (laborCost) => {
    try {
      setPreviewLoading(true);
      setPreviewData(null);
      
      const response = await fetch(`${baseURL}/api/labor-costs/${laborCost.vuid}/preview-journal-entry`);
      
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${baseURL}/api/labor-costs/${editingLaborCost.vuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update labor cost');
      }

      await fetchLaborCosts();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (vuid) => {
    // Find the labor cost to check if it's exported
    const laborCost = laborCosts.find(lc => lc.vuid === vuid);
    if (laborCost && laborCost.exported_to_accounting) {
      alert('Cannot delete this labor cost because it has been exported to the accounting system.');
      return;
    }
    
    // Check if the accounting period is closed
    if (laborCost && laborCost.accounting_period && laborCost.accounting_period.status === 'closed') {
      alert('Cannot delete this labor cost because it is in a closed accounting period.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this labor cost entry?')) {
      return;
    }

    try {
      const response = await fetch(`${baseURL}/api/labor-costs/${vuid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete labor cost');
      }

      await fetchLaborCosts();
    } catch (err) {
      setError(err.message);
    }
  };

  // Integration handlers
  const handleRetrieveFromIntegration = async () => {
    if (!retrieveIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      console.log(`Retrieving labor costs from integration ${retrieveIntegration.integration_name}`);
      console.log('Current projectVuid from URL:', projectVuid);
      console.log('Current URL:', window.location.href);
      console.log('URL search params:', location.search);
      console.log('All URL params:', Object.fromEntries(searchParams.entries()));
      
      let retrievedLaborCosts = [];
      
      // Handle different integration types
      if (retrieveIntegration.integration_type === 'adp') {
        // Call the mock ADP labor costs API
        const response = await fetch(`${baseURL}/api/mock-adp/labor-costs`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.labor_costs) {
            const mappedProjectVuid = projectVuid || '97094372-1078-4da5-b5c0-6f49503b9bb2';
            console.log('Mapping labor costs with project_vuid:', mappedProjectVuid);
            console.log('ProjectVuid from URL:', projectVuid);
            console.log('Using fallback project:', !projectVuid);
            
            if (!projectVuid) {
              console.warn('⚠️ No project context found in URL! Using fallback project.');
              alert('⚠️ Warning: No project context found. Labor costs will be imported to the default project. Please navigate to Labor Costs from a project details page.');
            }
            
            // Get first available cost code and cost type from project budget
            const firstCostCode = getFilteredCostCodes()[0];
            const firstCostType = getFilteredCostTypes()[0];
            
            retrievedLaborCosts = data.labor_costs.map(adpLaborCost => ({
              employee_id: adpLaborCost.employee_id,
              project_vuid: mappedProjectVuid, // Use project context or default
              cost_code_vuid: firstCostCode?.vuid || '', // Use first cost code from project budget
              cost_type_vuid: firstCostType?.vuid || '', // Use first cost type from project budget
              accounting_period_vuid: '90858fcd-e3a5-4b0c-8076-fa16f8e52e29', // Default to open period
              payroll_date: adpLaborCost.payroll_date,
              amount: adpLaborCost.amount,
              hours: adpLaborCost.hours,
              rate: adpLaborCost.rate,
              memo: adpLaborCost.memo,
              status: 'active',
              external_id: adpLaborCost.id,
              external_data: adpLaborCost
            }));
          }
        }
      } else {
        // Handle other integration types (placeholder)
        alert(`Integration type ${retrieveIntegration.integration_type} is not yet implemented`);
        return;
      }
      
      if (retrievedLaborCosts.length > 0) {
        setRetrievedLaborCosts(retrievedLaborCosts);
        setShowRetrievedLaborCostsModal(true);
        setShowRetrieveModal(false);
      } else {
        alert('No labor costs found in the integration');
      }
    } catch (error) {
      console.error('Error retrieving labor costs:', error);
      alert('Failed to retrieve labor costs from integration');
    }
  };

  const handleImportSelectedLaborCosts = async () => {
    if (selectedLaborCostsToImport.length === 0) {
      alert('Please select labor costs to import');
      return;
    }

    try {
      let importedCount = 0;
      let skippedCount = 0;

      for (const laborCostData of selectedLaborCostsToImport) {
        try {
          console.log('Importing labor cost with data:', laborCostData);
          const response = await fetch(`${baseURL}/api/labor-costs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(laborCostData)
          });

          if (response.ok) {
            const createdLaborCost = await response.json();
            importedCount++;
            
            // Create external system ID mapping
            try {
              await fetch(`${baseURL}/api/external-system-ids`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  object_vuid: createdLaborCost.vuid,
                  object_type: 'labor_cost',
                  integration_name: retrieveIntegration.integration_name,
                  external_id: laborCostData.external_id,
                  metadata: {
                    integration_source: retrieveIntegration.integration_name,
                    external_data: laborCostData.external_data
                  }
                })
              });
            } catch (mappingError) {
              console.error('Error creating external system ID mapping:', mappingError);
            }
          } else {
            skippedCount++;
            const errorText = await response.text();
            console.error('Failed to create labor cost:', errorText);
            console.error('Labor cost data that failed:', laborCostData);
          }
        } catch (error) {
          skippedCount++;
          console.error('Error creating labor cost:', error);
        }
      }

      alert(`Successfully imported ${importedCount} labor costs. ${skippedCount} were skipped.`);
      setShowRetrievedLaborCostsModal(false);
      setSelectedLaborCostsToImport([]);
      await fetchLaborCosts();
    } catch (error) {
      console.error('Error importing labor costs:', error);
      alert('Failed to import labor costs');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getEmployeeDisplay = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    if (employee) {
      return `${employee.employee_id} - ${employee.employee_name}`;
    }
    return employeeId;
  };

  // Filter labor costs by project if projectVuid is provided
  const getFilteredLaborCosts = () => {
    let filtered = laborCosts;
    
    // Filter by project if projectVuid is provided in URL
    if (projectVuid) {
      filtered = filtered.filter(item => item.project_vuid === projectVuid);
    }
    
    // Apply other filters (employee_id, status)
    if (filters.employee_id) {
      filtered = filtered.filter(item => 
        item.employee_id?.toLowerCase().includes(filters.employee_id.toLowerCase())
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    
    return filtered;
  };

  const filteredLaborCosts = getFilteredLaborCosts();

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLaborCosts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLaborCosts.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading labor costs...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
              <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Labor Costs</h1>
          <p className="mt-2 text-gray-600">Manage labor costs and payroll entries</p>
          {projectVuid ? (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Filtered by project:</span> {projects.find(p => p.vuid === projectVuid)?.project_name || 'Unknown Project'}
              </p>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">⚠️ No project context:</span> Showing all labor costs. Navigate from a project details page to filter by project.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setShowRetrieveModal(true)}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            📥 Retrieve from Integration
          </button>
          <button
            onClick={() => {
              resetForm();
              // Set project if we have one from URL context
              if (projectVuid && projects.length > 0) {
                const project = projects.find(p => p.vuid === projectVuid);
                if (project) {
                  setFormData(prev => ({
                    ...prev,
                    project_vuid: projectVuid
                  }));
                  // Also fetch project-specific cost codes and budget lines
                  fetchProjectBudgetLines(projectVuid);
                  fetchProjectCostCodes(projectVuid);
                }
              }
              setShowCreateModal(true);
            }}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Add Labor Cost
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              name="project_vuid"
              value={filters.project_vuid}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.vuid} value={project.vuid}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accounting Period</label>
            <select
              name="accounting_period_vuid"
              value={filters.accounting_period_vuid}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Periods</option>
              {accountingPeriods.map(period => (
                <option key={period.vuid} value={period.vuid}>
                  {period.month}/{period.year} ({period.status})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              name="employee_id"
              value={filters.employee_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All employees</option>
              {employees.map(employee => (
                <option key={employee.vuid} value={employee.employee_id}>
                  {employee.employee_id} - {employee.employee_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Labor Costs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payroll Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
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
              {currentItems.map((laborCost) => (
                <tr key={laborCost.vuid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {getEmployeeDisplay(laborCost.employee_id)}
                      <IntegrationIndicator 
                        objectVuid={laborCost.vuid} 
                        objectType="labor_cost" 
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {laborCost.project?.project_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {laborCost.cost_code?.code || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {laborCost.cost_type?.cost_type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(laborCost.payroll_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(laborCost.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {laborCost.hours || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {laborCost.rate ? formatCurrency(laborCost.rate) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      laborCost.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {laborCost.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(laborCost)}
                      disabled={laborCost.accounting_period && laborCost.accounting_period.status === 'closed'}
                      className={`${
                        laborCost.accounting_period && laborCost.accounting_period.status === 'closed'
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-blue-600 hover:text-blue-900'
                      } mr-3`}
                      title={
                        laborCost.accounting_period && laborCost.accounting_period.status === 'closed'
                          ? 'Cannot edit labor cost from closed accounting period'
                          : 'Edit labor cost'
                      }
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handlePreviewJournalEntry(laborCost)}
                      disabled={previewLoading}
                      className="text-purple-600 hover:text-purple-900 disabled:opacity-50 mr-3"
                      title="Preview Journal Entry"
                    >
                      {previewLoading ? '⏳' : '👁️'}
                    </button>
                    <button
                      onClick={() => handleDelete(laborCost.vuid)}
                      disabled={laborCost.exported_to_accounting || (laborCost.accounting_period && laborCost.accounting_period.status === 'closed')}
                      className={`${
                        laborCost.exported_to_accounting || (laborCost.accounting_period && laborCost.accounting_period.status === 'closed')
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-600 hover:text-red-900'
                      }`}
                      title={
                        laborCost.exported_to_accounting 
                          ? 'Cannot delete exported labor cost' 
                          : (laborCost.accounting_period && laborCost.accounting_period.status === 'closed')
                          ? 'Cannot delete labor cost from closed accounting period'
                          : 'Delete labor cost'
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastItem, filteredLaborCosts.length)}</span> of{' '}
                  <span className="font-medium">{filteredLaborCosts.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingLaborCost ? 'Edit Labor Cost' : 'Add Labor Cost'}
              </h3>
              
              <form onSubmit={editingLaborCost ? handleUpdate : handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee *
                    </label>
                    <select
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select an employee</option>
                      {employees
                        .filter(emp => emp.status === 'active')
                        .map(employee => (
                          <option key={employee.vuid} value={employee.employee_id}>
                            {employee.employee_id} - {employee.employee_name} {employee.trade ? `(${employee.trade})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project *
                    </label>
                    <select
                      name="project_vuid"
                      value={formData.project_vuid}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Project</option>
                      {projects.map(project => (
                        <option key={project.vuid} value={project.vuid}>
                          {project.project_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Code *
                    </label>
                    <select
                      name="cost_code_vuid"
                      value={formData.cost_code_vuid}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Cost Code</option>
                      {getFilteredCostCodes().map(code => (
                        <option key={code.vuid} value={code.vuid}>
                          {code.code} - {code.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Type *
                    </label>
                    <select
                      name="cost_type_vuid"
                      value={formData.cost_type_vuid}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Cost Type</option>
                      {getFilteredCostTypes(formData.cost_code_vuid).map(type => (
                        <option key={type.vuid} value={type.vuid}>
                          {type.cost_type} - {type.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accounting Period *
                    </label>
                    <select
                      name="accounting_period_vuid"
                      value={formData.accounting_period_vuid}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Accounting Period</option>
                      {accountingPeriods.map(period => (
                        <option key={period.vuid} value={period.vuid}>
                          {period.month}/{period.year} ({period.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payroll Date *
                    </label>
                    <input
                      type="date"
                      name="payroll_date"
                      value={formData.payroll_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="hours"
                      value={formData.hours}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Memo
                  </label>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-800"
                  >
                    {editingLaborCost ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Retrieve from Integration Modal */}
      {showRetrieveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Retrieve Labor Costs from Integration
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Select an integration to retrieve labor costs from external systems like ADP.
                </p>
                {projectVuid && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Project Context:</span> {projects.find(p => p.vuid === projectVuid)?.project_name || 'Unknown Project'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Labor costs will be imported for this project only.</p>
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
                  className="px-4 py-2 bg-black border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Retrieve Labor Costs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retrieved Labor Costs Modal */}
      {showRetrievedLaborCostsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Review Retrieved Labor Costs
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Review the labor costs retrieved from {retrieveIntegration?.integration_name}. 
                  Select the ones you want to import.
                </p>
                {projectVuid && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Project Context:</span> {projects.find(p => p.vuid === projectVuid)?.project_name || 'Unknown Project'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">All selected labor costs will be imported for this project.</p>
                    <p className="text-xs text-blue-600 mt-1">
                      <span className="font-medium">Cost Code & Type Filtering:</span> Only cost codes and cost types from the project budget are available for selection.
                    </p>
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
                          checked={selectedLaborCostsToImport.length === retrievedLaborCosts.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLaborCostsToImport([...retrievedLaborCosts]);
                            } else {
                              setSelectedLaborCostsToImport([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payroll Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Memo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {retrievedLaborCosts.map((laborCost, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLaborCostsToImport.includes(laborCost)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLaborCostsToImport([...selectedLaborCostsToImport, laborCost]);
                              } else {
                                setSelectedLaborCostsToImport(selectedLaborCostsToImport.filter(item => item !== laborCost));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getEmployeeDisplay(laborCost.employee_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <select
                            value={laborCost.cost_code_vuid || ''}
                            onChange={(e) => {
                              const updatedLaborCosts = [...retrievedLaborCosts];
                              updatedLaborCosts[index].cost_code_vuid = e.target.value;
                              updatedLaborCosts[index].cost_type_vuid = ''; // Clear cost type when cost code changes
                              setRetrievedLaborCosts(updatedLaborCosts);
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
                            value={laborCost.cost_type_vuid || ''}
                            onChange={(e) => {
                              const updatedLaborCosts = [...retrievedLaborCosts];
                              updatedLaborCosts[index].cost_type_vuid = e.target.value;
                              setRetrievedLaborCosts(updatedLaborCosts);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="">Select Cost Type</option>
                            {getFilteredCostTypes(laborCost.cost_code_vuid).map(type => (
                              <option key={type.vuid} value={type.vuid}>
                                {type.cost_type} - {type.description}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {laborCost.payroll_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(laborCost.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {laborCost.hours || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {laborCost.rate ? formatCurrency(laborCost.rate) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {laborCost.memo || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <p className="text-sm text-gray-600">
                  {selectedLaborCostsToImport.length} of {retrievedLaborCosts.length} labor costs selected
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRetrievedLaborCostsModal(false);
                      setSelectedLaborCostsToImport([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSelectedLaborCosts}
                    disabled={selectedLaborCostsToImport.length === 0}
                    className="px-4 py-2 bg-black border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Import Selected ({selectedLaborCostsToImport.length})
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
  );
};

export default LaborCosts;
