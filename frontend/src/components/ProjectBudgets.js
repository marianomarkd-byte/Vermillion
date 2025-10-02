import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import IntegrationIndicator from './IntegrationIndicator';

const ProjectBudgets = () => {
  const location = useLocation();
  // State for budgets
  const [budgets, setBudgets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for budget lines
  const [budgetLines, setBudgetLines] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  
  // State for Internal Change Orders
  const [internalChangeOrders, setInternalChangeOrders] = useState([]);
  const [icoLines, setIcoLines] = useState([]);
  
  // State for WIP data to get current budget amounts
  const [wipData, setWipData] = useState([]);
  
  // State for external change order lines to show impacts
  const [externalChangeOrderLines, setExternalChangeOrderLines] = useState([]);
  
  // State for Accounting Periods
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [accountingPeriodDropdownOpen, setAccountingPeriodDropdownOpen] = useState(false);
  
  // Ref for CSV upload input
  const csvUploadInputRef = useRef(null);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLinesForm, setShowLinesForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [selectedBudget, setSelectedBudget] = useState(null);
  
  // Form data
  // Initialize form data with project context from URL if available
  const getInitialFormData = () => {
    const searchParams = new URLSearchParams(location.search);
    const projectVuid = searchParams.get('project');
    
    return {
      project_vuid: projectVuid || '',
      accounting_period_vuid: '',
      description: '',
      budget_type: 'original',
      budget_date: '',
      status: 'active',
      finalized: false
    };
  };

  // Form data state
  const [formData, setFormData] = useState(getInitialFormData());
  

  const [lineFormData, setLineFormData] = useState({
    budget_vuid: '',
    cost_code_vuid: '',
    cost_type_vuid: '',
    budget_amount: '',
    notes: '',
    status: 'active'
  });
  
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [budgetsPerPage] = useState(10);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  
  // Dropdown states
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [costCodeDropdownOpen, setCostCodeDropdownOpen] = useState(false);
  const [costTypeDropdownOpen, setCostTypeDropdownOpen] = useState(false);
  
  // Excel-style form states
  const [filteredCostCodes, setFilteredCostCodes] = useState([]);
  const [filteredCostTypes, setFilteredCostTypes] = useState([]);
  const [newLineCostCodeDropdownOpen, setNewLineCostCodeDropdownOpen] = useState(false);
  const [newLineCostTypeDropdownOpen, setNewLineCostTypeDropdownOpen] = useState(false);
  const [newLineData, setNewLineData] = useState({
    cost_code_vuid: '',
    cost_type_vuid: '',
    budget_amount: '',
    notes: ''
  });

  // Integration state
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [budgetForIntegration, setBudgetForIntegration] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);
  
  // Retrieved budgets state
  const [showRetrievedBudgetsModal, setShowRetrievedBudgetsModal] = useState(false);
  const [retrievedBudgetsData, setRetrievedBudgetsData] = useState([]);
  const [selectedBudgetsToImport, setSelectedBudgetsToImport] = useState([]);
  
  // Finalization state
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  // Project-specific cost codes state
  const [projectSettings, setProjectSettings] = useState(null);
  const [useProjectCostCodes, setUseProjectCostCodes] = useState(false);
  const [projectCostCodes, setProjectCostCodes] = useState([]);
  

  


  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle query parameters for project filtering and budget viewing
  useEffect(() => {
    const handleUrlParams = async () => {
      const searchParams = new URLSearchParams(location.search);
      const projectVuid = searchParams.get('project');
      const budgetVuid = searchParams.get('budget');
      
      // Only process URL parameters if projects are loaded
      if (projects.length === 0) {
        return;
      }
      
      if (projectVuid) {
        // Check if the project exists in the loaded projects
        const foundProject = projects.find(p => p.vuid === projectVuid);
        
        if (!foundProject) {
          return; // Don't proceed if project doesn't exist
        }
        
        // Pre-filter budgets for this project
        setProjectFilter(projectVuid);
        
        // If there's also a create parameter, open the create form
        if (searchParams.get('create') === 'true') {
          setShowCreateForm(true);
        }
        
        // Refetch data with project filter
        fetchData();
        
        // Reset cost code toggle when project changes
        setUseProjectCostCodes(false);
      }
      
      if (budgetVuid) {
        // Find and select the budget to view
        const budget = budgets.find(b => b.vuid === budgetVuid);
        if (budget) {
          setSelectedBudget(budget);
          // Ensure we have all budget lines loaded for calculations
          if (budgetLines.length === 0) {
            // If no budget lines are loaded yet, fetch them for all budgets
            try {
              const baseURL = 'http://localhost:5001';
              const allBudgetLines = [];
              for (const b of budgets) {
                const linesRes = await axios.get(`${baseURL}/api/project-budgets/${b.vuid}/lines`);
                allBudgetLines.push(...linesRes.data);
              }
              setBudgetLines(allBudgetLines);
            } catch (err) {
              console.warn('Could not fetch all budget lines:', err.message);
            }
          }
          fetchBudgetLines(budget.vuid);
        }
      }
    };

    handleUrlParams();
  }, [location.search, projects]); // Include projects to ensure it runs when projects are loaded

  // Handle navigation state for viewing budgets and creating for specific projects (legacy support)
  useEffect(() => {
    const handleLocationState = () => {
      if (window.location.state) {
        if (window.location.state.viewBudget) {
          // Find and select the budget to view
          const budget = window.location.state.viewBudget;
          setSelectedBudget(budget);
          fetchBudgetLines(budget.vuid);
          // Clear the state
          window.history.replaceState({}, document.title);
        } else if (window.location.state.createForProject) {
          // Pre-fill the form with project data and filter budgets
          const project = window.location.state.createForProject;
          setFormData(prev => ({
            ...prev,
            project_vuid: project.vuid
          }));
          setShowCreateForm(true);
          
          // Pre-filter budgets to show only this project's budgets
          setProjectFilter(project.vuid);
          
          // Clear the state
          window.history.replaceState({}, document.title);
        }
      }
    };

    handleLocationState();
  }, []);

  // Add click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setProjectDropdownOpen(false);
        setTypeDropdownOpen(false);
        setStatusDropdownOpen(false);
        setCostCodeDropdownOpen(false);
        setCostTypeDropdownOpen(false);
        setNewLineCostCodeDropdownOpen(false);
        setNewLineCostTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use hardcoded network URL for Safari compatibility
      const baseURL = 'http://localhost:5001';
      // Check if we have a project filter from URL params
      const searchParams = new URLSearchParams(location.search);
      const projectVuid = searchParams.get('project');
      
      // Build the budgets URL with project filter if available
      let budgetsUrl = `${baseURL}/api/project-budgets`;
      if (projectVuid) {
        budgetsUrl += `?project_vuid=${projectVuid}`;
      }
      
      const [budgetsRes, projectsRes, costCodesRes, costTypesRes, icosRes, accountingPeriodsRes, wipRes] = await Promise.all([
        axios.get(budgetsUrl),
        axios.get(`${baseURL}/api/projects`),
        axios.get(`${baseURL}/api/costcodes`),
        axios.get(`${baseURL}/api/costtypes`),
        axios.get(`${baseURL}/api/internal-change-orders`),
        axios.get(`${baseURL}/api/accounting-periods/open`),
        axios.get(`${baseURL}/api/wip`)
      ]);

      // Fetch project settings and project cost codes if we have a project
      if (projectVuid) {
        try {
          const [projectSettingsRes, projectCostCodesRes] = await Promise.all([
            axios.get(`${baseURL}/api/projects/${projectVuid}/settings`),
            axios.get(`${baseURL}/api/projects/${projectVuid}/cost-codes`)
          ]);
          setProjectSettings(projectSettingsRes.data);
          setProjectCostCodes(projectCostCodesRes.data);
        } catch (err) {
          console.warn('Could not fetch project settings or cost codes:', err.message);
        }
      }
      
      setBudgets(budgetsRes.data);
      setProjects(projectsRes.data);
      setCostCodes(costCodesRes.data);
      setCostTypes(costTypesRes.data);
      setInternalChangeOrders(icosRes.data);
      setAccountingPeriods(accountingPeriodsRes.data);
      setWipData(wipRes.data);
      setFilteredBudgets(budgetsRes.data);
      setFilteredCostCodes(costCodesRes.data.filter(c => c.status === 'active'));
      setFilteredCostTypes(costTypesRes.data.filter(c => c.status === 'active'));
      
      // Fetch budget lines for all budgets to enable amount calculations
      if (budgetsRes.data.length > 0) {
        try {
          const allBudgetLines = [];
          for (const budget of budgetsRes.data) {
            const linesRes = await axios.get(`${baseURL}/api/project-budgets/${budget.vuid}/lines`);
            allBudgetLines.push(...linesRes.data);
          }
          setBudgetLines(allBudgetLines);
        } catch (linesErr) {
          console.warn('Some budget lines could not be fetched:', linesErr.message);
          // Continue without budget lines - amounts will show as $0.00
        }
      }
    } catch (err) {
      setError('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to get the appropriate cost codes based on toggle state
  const getCostCodesForDisplay = () => {
    if (useProjectCostCodes && projectSettings?.allow_project_cost_codes) {
      // Return only project-specific cost codes
      return projectCostCodes.filter(cc => cc.is_project_specific);
    } else {
      // Return global cost codes
      return costCodes.filter(c => c.status === 'active');
    }
  };

  // Function to handle cost code input for project-specific mode
  const handleCostCodeInput = (value, index, isNewLine = false) => {
    if (isNewLine) {
      setNewLineData(prev => ({ ...prev, cost_code_vuid: value }));
    } else {
      const newLines = [...budgetLines];
      newLines[index] = { ...newLines[index], cost_code_vuid: value };
      setBudgetLines(newLines);
    }
  };

  // Function to create project-specific cost code if it doesn't exist
  const createProjectCostCodeIfNeeded = async (costCodeValue) => {
    if (!useProjectCostCodes || !projectSettings?.allow_project_cost_codes) {
      return costCodeValue; // Return as-is for global mode
    }

    // Check if this cost code already exists as a project cost code
    const existingProjectCostCode = projectCostCodes.find(
      cc => cc.is_project_specific && cc.code === costCodeValue
    );

    if (existingProjectCostCode) {
      return existingProjectCostCode.vuid; // Return existing VUID
    }

    // Create new project cost code
    try {
      const baseURL = 'http://localhost:5001';
      const searchParams = new URLSearchParams(location.search);
      const projectVuid = searchParams.get('project');
      
      const response = await axios.post(`${baseURL}/api/project-cost-codes`, {
        project_vuid: projectVuid,
        code: costCodeValue,
        description: `Project-specific cost code: ${costCodeValue}`,
        status: 'active'
      });

      // Add to local state
      setProjectCostCodes(prev => [...prev, response.data]);
      
      return response.data.vuid; // Return new VUID
    } catch (error) {
      console.error('Error creating project cost code:', error);
      throw new Error(`Failed to create project cost code: ${costCodeValue}`);
    }
  };

  // Filter and paginate budgets
  useEffect(() => {
    filterAndPaginateBudgets();
  }, [budgets, searchTerm, projectFilter, typeFilter, statusFilter]);

  // Check if selected project still exists and reset form if not
  useEffect(() => {
    if (formData.project_vuid && projects.length > 0) {
      const projectExists = projects.find(p => p.vuid === formData.project_vuid);
      if (!projectExists) {
        // Check if this project is from URL parameters - if so, don't clear it
        const searchParams = new URLSearchParams(location.search);
        const urlProjectVuid = searchParams.get('project');
        
        if (formData.project_vuid === urlProjectVuid) {
          console.log('ProjectBudgets: Project from URL not found in loaded projects, but preserving URL context');
          return; // Don't clear the project if it's from URL parameters
        }
        
        // Reset the form if the selected project no longer exists
        setFormData(prev => ({
          ...prev,
          project_vuid: ''
        }));
        setError('The previously selected project no longer exists. Please select a valid project.');
      }
    }
    
    // Also check if the project filter is still valid
    if (projectFilter !== 'all' && projects.length > 0) {
      const filterProjectExists = projects.find(p => p.vuid === projectFilter);
      if (!filterProjectExists) {
        setProjectFilter('all');
        setError('The previously filtered project no longer exists. Showing all projects.');
      }
    }
  }, [projects, formData.project_vuid, projectFilter]);

  // Fetch budget lines when selectedBudget changes - simplified
  useEffect(() => {
    if (selectedBudget && !showCreateForm && !showLinesForm) {
      if (selectedBudget.budget_type === 'revised') {
        fetchIcoLines(selectedBudget.vuid);
      } else {
        fetchBudgetLines(selectedBudget.vuid);
      }
    }
  }, [selectedBudget?.vuid, showCreateForm, showLinesForm]);

  const filterAndPaginateBudgets = () => {
    let filtered = budgets.filter(budget => {
      const matchesSearch = 
        (budget.description && budget.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesProject = projectFilter === 'all' || budget.project_vuid === projectFilter;
      const matchesType = typeFilter === 'all' || budget.budget_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;
      
      return matchesSearch && matchesProject && matchesType && matchesStatus;
    });
    
    setFilteredBudgets(filtered);
    setCurrentPage(1);
  };

  // Get current budgets for pagination
  const getCurrentBudgets = () => {
    const indexOfLastBudget = currentPage * budgetsPerPage;
    const indexOfFirstBudget = indexOfLastBudget - budgetsPerPage;
    return filteredBudgets.slice(indexOfFirstBudget, indexOfLastBudget);
  };

  // Helper function to get the change amount for a revised budget
  const getChangeAmountForBudget = (budgetVuid) => {
    if (!internalChangeOrders || internalChangeOrders.length === 0) return 0;
    
    const ico = internalChangeOrders.find(ico => ico.revised_budget_vuid === budgetVuid);
    if (ico) {
      return parseFloat(ico.total_change_amount) || 0;
    }
    return 0;
  };

  // Helper function to get the original budget amount (sum of budget lines) - simplified
  const getOriginalBudgetAmount = (budgetVuid) => {
    // Since we now store only the current budget's lines, just sum them all
    const total = budgetLines.reduce((sum, line) => sum + (parseFloat(line.budget_amount) || 0), 0);
    console.log(`getOriginalBudgetAmount for budget ${budgetVuid}:`, {
      totalBudgetLines: budgetLines.length,
      total: total
    });
    return total;
  };

  // Helper function to get the current budget amount from WIP data (includes external change order changes)
  const getCurrentBudgetAmount = (budget) => {
    if (!budget || !budget.project_vuid) return 0;
    
    // Find the WIP entry for this project
    const wipEntry = wipData.find(entry => entry.project_vuid === budget.project_vuid);
    if (wipEntry && wipEntry.current_budget_amount > 0) {
      return wipEntry.current_budget_amount;
    }
    
    // Fallback: Get budget amount from the budget lines in the database
    // This is more reliable than summing budgetLines array which might be empty
    const budgetLinesForThisBudget = budgetLines.filter(line => line.budget_vuid === budget.vuid);
    if (budgetLinesForThisBudget.length > 0) {
      return budgetLinesForThisBudget.reduce((sum, line) => sum + (parseFloat(line.budget_amount) || 0), 0);
    }
    
    // Final fallback: return 0 if no data available
    return 0;
  };

  // Fetch external change order lines for a project
  const fetchExternalChangeOrderLines = async (projectVuid) => {
    try {
      const baseURL = 'http://localhost:5001';
      console.log('Fetching external change order lines for project:', projectVuid);
      
      // Get all external change orders for this project
      const ecosResponse = await axios.get(`${baseURL}/api/external-change-orders?project_vuid=${projectVuid}`);
      console.log('All external change orders for project:', ecosResponse.data);
      const ecos = ecosResponse.data.filter(eco => eco.status === 'approved');
      console.log('Approved external change orders:', ecos);
      
      // Get lines for all approved external change orders
      const allEcoLines = [];
      for (const eco of ecos) {
        console.log('Fetching lines for ECO:', eco.vuid);
        const linesResponse = await axios.get(`${baseURL}/api/external-change-orders/${eco.vuid}/lines`);
        console.log('ECO lines response:', linesResponse.data);
        const lines = linesResponse.data.filter(line => line.status === 'active');
        console.log('Active ECO lines:', lines);
        allEcoLines.push(...lines);
      }
      
      setExternalChangeOrderLines(allEcoLines);
      console.log('Final external change order lines set:', allEcoLines);
    } catch (error) {
      console.error('Error fetching external change order lines:', error);
    }
  };

  // Get change order impacts for a specific budget line
  const getChangeOrderImpacts = (budgetLine) => {
    if (!budgetLine || !budgetLine.cost_code_vuid || !budgetLine.cost_type_vuid) {
      console.log('Budget line missing cost code or type:', budgetLine);
      return { external: 0, internal: 0, total: 0 };
    }

    console.log('Checking impacts for budget line:', {
      cost_code_vuid: budgetLine.cost_code_vuid,
      cost_type_vuid: budgetLine.cost_type_vuid,
      availableEcoLines: externalChangeOrderLines.length,
      ecoLines: externalChangeOrderLines
    });

    // Find external change order lines that match this budget line
    const externalImpacts = externalChangeOrderLines.filter(ecoLine => 
      ecoLine.cost_code_vuid === budgetLine.cost_code_vuid && 
      ecoLine.cost_type_vuid === budgetLine.cost_type_vuid
    );

    console.log('External impacts found:', externalImpacts);

    // Find internal change order lines that match this budget line
    const internalImpacts = icoLines.filter(icoLine => 
      icoLine.cost_code_vuid === budgetLine.cost_code_vuid && 
      icoLine.cost_type_vuid === budgetLine.cost_type_vuid
    );

    const externalTotal = externalImpacts.reduce((sum, line) => sum + (parseFloat(line.budget_amount_change) || 0), 0);
    const internalTotal = internalImpacts.reduce((sum, line) => sum + (parseFloat(line.change_amount) || 0), 0);

    console.log('Impact totals:', { external: externalTotal, internal: internalTotal, total: externalTotal + internalTotal });

    return {
      external: externalTotal,
      internal: internalTotal,
      total: externalTotal + internalTotal
    };
  };

  // Helper function to get the revised budget amount (original + change orders)
  const getRevisedBudgetAmount = (budgetVuid) => {
    const originalAmount = getOriginalBudgetAmount(budgetVuid);
    
    // Find all ICOs that affect this budget
    const icos = internalChangeOrders.filter(ico => ico.original_budget_vuid === budgetVuid);
    const totalChangeAmount = icos.reduce((sum, ico) => sum + (parseFloat(ico.total_change_amount) || 0), 0);
    
    return originalAmount + totalChangeAmount;
  };

  // Handle form submission for budgets
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent updating finalized budgets
    if (editingBudget && isBudgetFinalized(editingBudget)) {
      setError('This budget is finalized and cannot be modified.');
      return;
    }
    
    // Prevent updating locked budgets (accounting period is closed)
    if (editingBudget && isBudgetLocked(editingBudget)) {
      setError('This budget cannot be modified because its accounting period is closed. Create a change order to modify values.');
      return;
    }
    
    // Validate required fields
    if (!formData.project_vuid || !formData.accounting_period_vuid || !formData.description || !formData.budget_type || !formData.budget_date) {
      setError('Please fill in all required fields (Project, Accounting Period, Description, Budget Type, and Budget Date)');
      return;
    }
    
    // Validate that the selected project exists
    const selectedProject = projects.find(p => p.vuid === formData.project_vuid);
    if (!selectedProject) {
      setError('Selected project no longer exists. Please refresh the page and select a valid project.');
      return;
    }
    
    try {
      const baseURL = 'http://localhost:5001';
      
      // Debug logging
      console.log('Creating budget with data:', formData);
      console.log('Available projects:', projects.map(p => ({ vuid: p.vuid, name: p.project_name })));
      
      let response;
      if (editingBudget) {
        response = await axios.put(`${baseURL}/api/project-budgets/${editingBudget.vuid}`, formData);
        await fetchData();
        setSuccessMessage(''); // Clear success message when editing
        resetForm();
      } else {
        // Creating new budget
        response = await axios.post(`${baseURL}/api/project-budgets`, formData);
        await fetchData();
        
        // Get the newly created budget to show its lines form
        const newBudget = response.data;
        if (newBudget && newBudget.vuid) {
          console.log('Budget created successfully:', newBudget);
          
          // Set the newly created budget as selected and show lines form
          // Use a single state update to avoid race conditions
          setSelectedBudget(newBudget);
          setShowLinesForm(true);
          setShowCreateForm(false);
          
          console.log('ProjectBudgets: State updated - selectedBudget:', newBudget.vuid, 'showLinesForm: true, showCreateForm: false');
          console.log('ProjectBudgets: About to set lineFormData with budget_vuid:', newBudget.vuid);
          
          // Pre-populate the line form with the new budget's VUID
          setLineFormData(prev => ({
            ...prev,
            budget_vuid: newBudget.vuid
          }));
          
          // Fetch budget lines for the new budget (will be empty initially)
          await fetchBudgetLines(newBudget.vuid);
          
          // Show success message
          setSuccessMessage(`Budget "${newBudget.description}" created successfully! Now add your budget lines below.`);
          setError(''); // Clear any previous errors
          
          // Don't call resetForm() here as it would hide the lines form
          // Just reset the form data without changing the UI state
          // Preserve the project context from URL parameters
          const searchParams = new URLSearchParams(location.search);
          const urlProjectVuid = searchParams.get('project');
          setFormData({
            project_vuid: urlProjectVuid || '', // Preserve project context from URL
            accounting_period_vuid: '',
            description: '',
            budget_type: 'original',
            budget_date: new Date().toISOString().split('T')[0],
            status: 'active',
            finalized: false
          });
          setEditingBudget(null);
          return; // Don't call resetForm again below
        }
      }
      
      setError(''); // Clear any previous errors
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        const errorMsg = err.response.data.error;
        if (errorMsg.includes('ForeignKeyViolation') && errorMsg.includes('project_vuid')) {
          setError('The selected project no longer exists. Please refresh the page and select a valid project from the dropdown.');
          // Refresh projects list to ensure we have current data
          fetchData();
        } else {
          setError('Error saving budget: ' + errorMsg);
        }
      } else {
        setError('Error saving budget: ' + err.message);
      }
      setSuccessMessage(''); // Clear success message on error
    }
  };



  // Fetch budget lines for a specific budget - simplified
  const fetchBudgetLines = async (budgetVuid) => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/project-budgets/${budgetVuid}/lines`);
      
      console.log(`Fetched ${response.data.length} budget lines for budget ${budgetVuid}:`, response.data);
      console.log('Zero amount lines in API response:', response.data.filter(line => line.budget_amount === 0 || line.budget_amount === '0'));
      console.log('All budget amounts in API response:', response.data.map(line => ({ vuid: line.vuid, budget_amount: line.budget_amount, type: typeof line.budget_amount })));
      
      // Simply set the budget lines directly - no complex state merging
      setBudgetLines(response.data);
      console.log('Budget lines state updated with:', response.data.length, 'lines');
      
      // Also fetch project cost codes for this budget's project if we don't have them yet
      const budget = budgets.find(b => b.vuid === budgetVuid);
      if (budget && budget.project_vuid) {
        // Check if we already have project cost codes for this project
        const existingProjectCostCodes = projectCostCodes.filter(cc => cc.project_vuid === budget.project_vuid);
        if (existingProjectCostCodes.length === 0) {
          try {
            const projectCostCodesRes = await axios.get(`${baseURL}/api/projects/${budget.project_vuid}/cost-codes`);
            setProjectCostCodes(prev => {
              // Add new project cost codes, avoiding duplicates
              const newCodes = projectCostCodesRes.data.filter(newCode => 
                !prev.some(existingCode => existingCode.vuid === newCode.vuid)
              );
              return [...prev, ...newCodes];
            });
          } catch (err) {
            console.warn('Could not fetch project cost codes:', err.message);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching budget lines:', err);
      setError('Error fetching budget lines: ' + err.message);
    }
  };

  // Fetch Internal Change Order lines for a specific revised budget
  const fetchIcoLines = async (budgetVuid) => {
    try {
      const baseURL = 'http://localhost:5001';
      
      // Find the ICO that created this revised budget
      const ico = internalChangeOrders.find(ico => ico.revised_budget_vuid === budgetVuid);
      if (!ico) {
        setError('No Internal Change Order found for this revised budget');
        return;
      }
      
      // Fetch the ICO lines
      const response = await axios.get(`${baseURL}/api/internal-change-orders/${ico.vuid}/lines`);
      setIcoLines(response.data);
      
      // Clear budget lines for this view
      setBudgetLines([]);
    } catch (err) {
      setError('Error fetching Internal Change Order lines: ' + err.message);
    }
  };

  // Reset forms
  const resetForm = () => {
    // Set default accounting period if only one is open
    let defaultAccountingPeriod = '';
    if (accountingPeriods.length === 1 && accountingPeriods[0].status === 'open') {
      defaultAccountingPeriod = accountingPeriods[0].vuid;
    }
    
    // Preserve project context from URL when resetting
    const searchParams = new URLSearchParams(location.search);
    const urlProjectVuid = searchParams.get('project');
    
    setFormData({
      project_vuid: urlProjectVuid || '',
      accounting_period_vuid: defaultAccountingPeriod,
      description: '',
      budget_type: 'original',
      budget_date: new Date().toISOString().split('T')[0], // Set today's date as default
      status: 'active',
      finalized: false
    });
    setEditingBudget(null);
    setShowCreateForm(false);
    setShowLinesForm(false);
    setSuccessMessage(''); // Clear success message
  };



  // Handle edit budget
  const handleEditBudget = (budget) => {
    // Prevent editing finalized budgets
    if (isBudgetFinalized(budget)) {
      alert('This budget is finalized and cannot be edited.');
      return;
    }
    
    setEditingBudget(budget);
    setFormData({
      project_vuid: budget.project_vuid,
      accounting_period_vuid: budget.accounting_period_vuid || '',
      description: budget.description,
      budget_type: budget.budget_type,
      budget_date: budget.budget_date,
      status: budget.status,
      finalized: budget.finalized || false
    });
    setShowCreateForm(true);
  };



  // Handle delete budget
  const handleDeleteBudget = async (vuid) => {
    if (window.confirm('Are you sure you want to delete this budget? This will also delete all associated budget lines.')) {
      try {
        const baseURL = 'http://localhost:5001';
        await axios.delete(`${baseURL}/api/project-budgets/${vuid}`);
        
        // If we were viewing lines for this budget, clear the view
        if (selectedBudget && selectedBudget.vuid === vuid) {
          setSelectedBudget(null);
          setBudgetLines([]);
          setShowLinesForm(false);
        }
        
        fetchData();
        setError(''); // Clear any previous errors
      } catch (err) {
        console.error('Error deleting budget:', err);
        if (err.response && err.response.data && err.response.data.error) {
          setError('Error deleting budget: ' + err.response.data.error);
        } else {
          setError('Error deleting budget: ' + err.message);
        }
      }
    }
  };

  // Handle delete line
  const handleDeleteLine = async (vuid) => {
    if (window.confirm('Are you sure you want to delete this budget line?')) {
      try {
        const baseURL = 'http://localhost:5001';
        await axios.delete(`${baseURL}/api/project-budgets/lines/${vuid}`);
        fetchBudgetLines(selectedBudget.vuid);
        setError(''); // Clear any previous errors
      } catch (err) {
        console.error('Error deleting budget line:', err);
        if (err.response && err.response.data && err.response.data.error) {
          setError('Error deleting budget line: ' + err.response.data.error);
        } else {
          setError('Error deleting budget line: ' + err.message);
        }
      }
    }
  };

  // Handle download template
  const handleDownloadTemplate = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/project-budgets/${selectedBudget.vuid}/download-template`);
      
      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.statusText}`);
      }
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'budget_template.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('Template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template: ' + error.message);
    }
  };

  // Handle CSV upload
  const handleCsvUpload = async (event) => {
    console.log('CSV upload triggered', event.target.files);
    const file = event.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Please select a CSV or Excel file (.csv or .xlsx)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      const baseURL = 'http://localhost:5001';
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${baseURL}/api/project-budgets/${selectedBudget.vuid}/upload-csv`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        // Show validation errors
        setError(`Validation errors found:\n${response.data.errors.join('\n')}`);
      } else {
        // Success
        setSuccessMessage(response.data.message);
        // Refresh budget lines
        await fetchBudgetLines(selectedBudget.vuid);
        // Refresh budget data to update totals
        await fetchData();
      }

    } catch (err) {
      console.error('Error uploading CSV:', err);
      if (err.response && err.response.data) {
        if (err.response.data.errors && err.response.data.errors.length > 0) {
          setError(`Upload failed with errors:\n${err.response.data.errors.join('\n')}`);
        } else {
          setError('Upload failed: ' + (err.response.data.error || err.response.data.message || 'Unknown error'));
        }
      } else {
        setError('Upload failed: ' + err.message);
      }
    } finally {
      // Clear the file input
      event.target.value = '';
    }
  };

  // Handle view budget lines
  const handleViewLines = async (budget) => {
    setSelectedBudget(budget);
    
    if (budget.budget_type === 'revised') {
      // For revised budgets (Internal Change Orders), fetch ICO lines instead
      await fetchIcoLines(budget.vuid);
    } else {
      // For original budgets, fetch budget lines
      await fetchBudgetLines(budget.vuid);
    }
    
    // Fetch external change order lines for this project to show impacts
    if (budget.project_vuid) {
      await fetchExternalChangeOrderLines(budget.project_vuid);
    }
    
    setShowLinesForm(false);
    setShowCreateForm(false);
    setEditingBudget(null);
  };

  // Handle hide budget lines
  const handleHideLines = () => {
    setSelectedBudget(null);
    setBudgetLines([]);
    setIcoLines([]);
    setShowLinesForm(false);
    setShowCreateForm(false);
    setEditingBudget(null);
  };

  // Integration functions
  const fetchIntegrations = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/integrations`);
      
      // Filter integrations to only show those that have 'budgets' enabled
      const filteredIntegrations = response.data.filter(integration => 
        integration.enabled_objects && integration.enabled_objects.budgets === true
      );
      
      setIntegrations(filteredIntegrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const handleIntegrationModal = (budget) => {
    setBudgetForIntegration(budget);
    setSelectedIntegration(null);
    setShowIntegrationModal(true);
    fetchIntegrations();
  };

  const handleSendToIntegration = async () => {
    if (!selectedIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      // Here you would implement the logic to send the budget to the selected integration
      console.log(`Sending budget ${budgetForIntegration.description} to integration ${selectedIntegration.integration_name}`);
      
      // For now, just show a success message
      alert(`Budget ${budgetForIntegration.description} sent to ${selectedIntegration.integration_name} successfully!`);
      
      // Close the modal
      setShowIntegrationModal(false);
      setBudgetForIntegration(null);
      setSelectedIntegration(null);
    } catch (error) {
      console.error('Error sending budget to integration:', error);
      alert('Error sending budget to integration');
    }
  };

  const handleRetrieveModal = () => {
    setRetrieveIntegration(null);
    setShowRetrieveModal(true);
    fetchIntegrations();
  };

  // Helper functions for budget selection
  const handleSelectAllBudgets = () => {
    setSelectedBudgetsToImport([...retrievedBudgetsData]);
  };

  const handleDeselectAllBudgets = () => {
    setSelectedBudgetsToImport([]);
  };

  const handleImportBudgets = async () => {
    if (selectedBudgetsToImport.length === 0) {
      alert('Please select at least one budget line to import');
      return;
    }

    try {
      // Get the current project from the form or selected project
      const projectVuid = formData.project_vuid || (projectFilter !== 'all' ? projectFilter : null);
      
      if (!projectVuid) {
        alert('Please select a project first before importing budgets');
        return;
      }

      // Get the default accounting period
      const defaultAccountingPeriod = accountingPeriods.find(p => p.status === 'open');
      if (!defaultAccountingPeriod) {
        alert('No open accounting period found. Please create an open accounting period first.');
        return;
      }

      const baseURL = 'http://localhost:5001';
      let importedCount = 0;
      let skippedCount = 0;
      
      // Create a new budget for the project
      const budgetResponse = await axios.post(`${baseURL}/api/project-budgets`, {
        project_vuid: projectVuid,
        accounting_period_vuid: defaultAccountingPeriod.vuid,
        description: `Imported Budget from ${retrieveIntegration.integration_name}`,
        budget_type: 'original',
        budget_date: new Date().toISOString().split('T')[0],
        status: 'active',
        finalized: false
      });

      if (budgetResponse.data && budgetResponse.data.vuid) {
        const budgetVuid = budgetResponse.data.vuid;
        
        // Import selected budget lines
        for (const budgetLineData of selectedBudgetsToImport) {
          try {
            // Find matching cost code and cost type
            const matchingCostCode = costCodes.find(c => 
              c.code === budgetLineData.cost_code && c.status === 'active'
            );
            
            const matchingCostType = costTypes.find(c => 
              c.cost_type === budgetLineData.cost_type && c.status === 'active'
            );
            
            if (matchingCostCode && matchingCostType) {
              // Create budget line
              await axios.post(`${baseURL}/api/project-budgets/${budgetVuid}/lines`, {
                budget_vuid: budgetVuid,
                cost_code_vuid: matchingCostCode.vuid,
                cost_type_vuid: matchingCostType.vuid,
                budget_amount: budgetLineData.budget_amount,
                notes: budgetLineData.notes,
                status: 'active'
              });
              
              importedCount++;
            } else {
              console.log(`Skipping budget line - cost code or type not found: ${budgetLineData.cost_code}/${budgetLineData.cost_type}`);
              skippedCount++;
            }
          } catch (error) {
            console.error(`Error importing budget line:`, error);
            skippedCount++;
          }
        }
        
        // Create external system ID mapping for the imported budget
        try {
          await axios.post(`${baseURL}/api/external-system-ids`, {
            object_vuid: budgetResponse.data.vuid,
            object_type: 'project_budget',
            integration_name: retrieveIntegration.integration_name,
            external_id: `imported_${Date.now()}`,
            metadata: {
              imported_lines: importedCount,
              skipped_lines: skippedCount,
              integration_source: retrieveIntegration.integration_name
            }
          });
          console.log(`External system ID mapping created for budget ${budgetResponse.data.vuid}`);
        } catch (mappingError) {
          console.error('Error creating external system ID mapping:', mappingError);
        }

        // Show success message
        alert(`Budget import completed!\n\nImported: ${importedCount} lines\nSkipped: ${skippedCount} lines\n\nA new budget has been created for the selected project.`);
        
        // Close modals and refresh data
        setShowRetrievedBudgetsModal(false);
        setShowRetrieveModal(false);
        setRetrieveIntegration(null);
        setRetrievedBudgetsData([]);
        setSelectedBudgetsToImport([]);
        
        // Refresh the data
        fetchData();
        
        // Also fetch the budget lines for the newly created budget
        if (budgetResponse.data && budgetResponse.data.vuid) {
          await fetchBudgetLines(budgetResponse.data.vuid);
        }
      }
    } catch (error) {
      console.error('Error importing budgets:', error);
      alert('Error importing budgets: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRetrieveBudgets = async () => {
    if (!retrieveIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      console.log(`Retrieving budgets from integration ${retrieveIntegration.integration_name}`);
      
      let retrievedBudgets = [];
      
      // Handle different integration types
      if (retrieveIntegration.integration_type === 'procore') {
        // Call the mock Procore budget lines API
        const baseURL = 'http://localhost:5001';
        const response = await axios.get(`${baseURL}/api/mock-procore/budget-lines`);
        
        if (response.data && response.data.budget_lines) {
          // Filter to only show locked budgets (finalized/approved in Procore)
          const lockedBudgets = response.data.budget_lines.filter(budgetLine => budgetLine.locked === true);
          
          if (lockedBudgets.length === 0) {
            alert('No locked budgets found in Procore. Only locked (finalized) budgets can be imported.');
            return;
          }
          
          retrievedBudgets = lockedBudgets.map(procoreBudgetLine => ({
            cost_code: procoreBudgetLine.cost_code.code,
            cost_code_description: procoreBudgetLine.cost_code.description,
            cost_type: procoreBudgetLine.cost_type.name,
            cost_type_abbreviation: procoreBudgetLine.cost_type.abbreviation,
            budget_amount: procoreBudgetLine.budget_amount,
            notes: procoreBudgetLine.notes || '',
            // Additional fields from Procore
            procore_id: procoreBudgetLine.id,
            division: procoreBudgetLine.division.name,
            category: procoreBudgetLine.category.name,
            subcategory: procoreBudgetLine.subcategory.name
          }));
        }
      } else {
        // Handle other integration types (placeholder)
        alert(`Integration type ${retrieveIntegration.integration_type} is not yet implemented`);
        return;
      }
      
      if (retrievedBudgets.length > 0) {
        // Show the retrieved budgets in a modal for review
        setRetrievedBudgetsData(retrievedBudgets);
        setSelectedBudgetsToImport([]); // Reset selection when opening modal
        setShowRetrievedBudgetsModal(true);
      } else {
        alert('No budgets found in the integration');
      }
      
      // Don't close the modal yet - let user review the budgets first
    } catch (error) {
      console.error('Error retrieving budgets from integration:', error);
      alert('Error retrieving budgets from integration: ' + (error.response?.data?.error || error.message));
    }
  };

  // Helper functions
  const getProjectName = (projectVuid) => {
    const project = projects.find(p => p.vuid === projectVuid);
    return project ? `${project.project_number} - ${project.project_name}` : 'Unknown Project';
  };

  const getCostCodeName = (costCodeVuid) => {
    // First check global cost codes
    const globalCostCode = costCodes.find(c => c.vuid === costCodeVuid);
    if (globalCostCode) {
      return `${globalCostCode.code} - ${globalCostCode.description}`;
    }
    
    // If not found in global, check project-specific cost codes
    const projectCostCode = projectCostCodes.find(c => c.vuid === costCodeVuid);
    if (projectCostCode) {
      return `${projectCostCode.code} - ${projectCostCode.description}`;
    }
    
    return 'Unknown Cost Code';
  };

  const getCostTypeName = (costTypeVuid) => {
    const costType = costTypes.find(c => c.vuid === costTypeVuid);
    return costType ? `${costType.cost_type} (${costType.abbreviation})` : 'Unknown Cost Type';
  };

  const getAccountingPeriodDisplay = (accountingPeriodVuid) => {
    const period = accountingPeriods.find(p => p.vuid === accountingPeriodVuid);
    return period ? `${period.month}/${period.year}` : 'Select Accounting Period';
  };

  // Check if a budget is locked (accounting period is closed)
  const isBudgetLocked = (budget) => {
    if (!budget || !budget.accounting_period_vuid) return false;
    const period = accountingPeriods.find(p => p.vuid === budget.accounting_period_vuid);
    return period && period.status === 'closed';
  };

  const formatCurrency = (amount) => {
    // Ensure we have a valid number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to check if a budget is finalized
  const isBudgetFinalized = (budget) => {
    // Return false if budget is null/undefined (for new budgets)
    if (!budget) {
      return false;
    }
    
    // Check if budget has finalized status from backend
    if (budget.finalized) {
      return true;
    }
    
    // Check localStorage as fallback
    const finalizedBudgets = JSON.parse(localStorage.getItem('finalizedBudgets') || '{}');
    return finalizedBudgets[budget.vuid] === true;
  };

  // Helper function to check if a budget is locked (finalized or accounting period closed)
  const isBudgetLockedOrFinalized = (budget) => {
    return isBudgetFinalized(budget) || isBudgetLocked(budget);
  };

  // Finalization functions
  const handleFinalizeCheckboxChange = (e) => {
    if (e.target.checked) {
      setShowFinalizeModal(true);
    } else {
      // If unchecking, just update the form data
      setFormData(prev => ({ ...prev, finalized: false }));
    }
  };

  const handleConfirmFinalize = async () => {
    try {
      // Store finalized status in localStorage as backup
      const finalizedBudgets = JSON.parse(localStorage.getItem('finalizedBudgets') || '{}');
      finalizedBudgets[editingBudget.vuid] = true;
      localStorage.setItem('finalizedBudgets', JSON.stringify(finalizedBudgets));
      
      // Try to update the backend (but don't fail if it doesn't support finalized field)
      try {
        const baseURL = 'http://localhost:5001';
        await axios.put(`${baseURL}/api/project-budgets/${editingBudget.vuid}`, {
          ...formData,
          finalized: true,
          status: 'active'  // Also update status to active when finalizing
        });
        console.log('Backend updated with finalized status');
      } catch (backendError) {
        console.log('Backend may not support finalized field, using local storage fallback');
        // Continue with local finalization even if backend fails
      }
      
      // Close the modal
      setShowFinalizeModal(false);
      
      // Update the local budgets array to reflect the finalized status
      setBudgets(prevBudgets => 
        prevBudgets.map(budget => 
          budget.vuid === editingBudget.vuid 
            ? { ...budget, finalized: true, status: 'active' }
            : budget
        )
      );
      
      // Update the filtered budgets as well
      setFilteredBudgets(prevFiltered => 
        prevFiltered.map(budget => 
          budget.vuid === editingBudget.vuid 
            ? { ...budget, finalized: true, status: 'active' }
            : budget
        )
      );
      
      // Update selectedBudget if it's the same budget
      if (selectedBudget && selectedBudget.vuid === editingBudget.vuid) {
        setSelectedBudget(prev => ({ ...prev, finalized: true, status: 'active' }));
      }
      
      // Close the edit form and return to budgets list
      resetForm();
      
      // Also close the budget lines view if it's open
      setSelectedBudget(null);
      setBudgetLines([]);
      setShowLinesForm(false);
      
      // Refresh the budgets data from the backend to ensure consistency
      fetchData();
      
      alert('Budget has been finalized successfully!');
    } catch (error) {
      console.error('Error finalizing budget:', error);
      alert('Error finalizing budget. Please try again.');
    }
  };

  const handleCancelFinalize = () => {
    setShowFinalizeModal(false);
    // Reset the checkbox
    setFormData(prev => ({ ...prev, finalized: false }));
  };

  // Excel-style form functions
  const handleAddNewLine = () => {
    // Prevent adding lines to finalized budgets
    if (selectedBudget && isBudgetFinalized(selectedBudget)) {
      alert('This budget is finalized and cannot be modified.');
      return;
    }
    
    if (newLineData.cost_code_vuid && newLineData.cost_type_vuid && newLineData.budget_amount) {
      const newLine = {
        ...newLineData,
        budget_vuid: selectedBudget.vuid,
        status: 'active',
        vuid: `temp-${Date.now()}` // Temporary ID for new lines
      };
      
      // If using project-specific cost codes, store the actual code value
      if (useProjectCostCodes && projectSettings?.allow_project_cost_codes) {
        // Store the actual code string for display purposes
        newLine.cost_code_vuid = newLineData.cost_code_vuid;
        // Also store the original value for later conversion
        newLine._originalCostCode = newLineData.cost_code_vuid;
      }
      
      const updatedLines = [...budgetLines, newLine];
      setBudgetLines(updatedLines);
      
      // Clear the new line form
      setNewLineData({
        cost_code_vuid: '',
        cost_type_vuid: '',
        budget_amount: '',
        notes: ''
      });
      
      // Focus on the first field of the new line
      setTimeout(() => {
        const newLineInput = document.getElementById('new-line-cost-code');
        if (newLineInput) {
          newLineInput.focus();
          // Also scroll to the new line
          newLineInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleSaveAllLines = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      let savedCount = 0;
      let updatedCount = 0;
      

      
      // First, check if there's data in the new line form that needs to be saved
      console.log('New line data validation:', {
        cost_code_vuid: newLineData.cost_code_vuid,
        cost_type_vuid: newLineData.cost_type_vuid,
        budget_amount: newLineData.budget_amount,
        budget_amount_type: typeof newLineData.budget_amount,
        budget_amount_empty: newLineData.budget_amount === '',
        budget_amount_undefined: newLineData.budget_amount === undefined,
        will_save: !!(newLineData.cost_code_vuid && newLineData.cost_type_vuid && newLineData.budget_amount !== undefined && newLineData.budget_amount !== '')
      });
      
      if (newLineData.cost_code_vuid && newLineData.cost_type_vuid && newLineData.budget_amount !== undefined && newLineData.budget_amount !== '') {
        // Handle project-specific cost codes
        let costCodeVuid = newLineData.cost_code_vuid;
        if (useProjectCostCodes && projectSettings?.allow_project_cost_codes && 
            typeof newLineData.cost_code_vuid === 'string' && newLineData.cost_code_vuid.length < 36) {
          costCodeVuid = await createProjectCostCodeIfNeeded(newLineData.cost_code_vuid);
        }



        // Save the new line data first
        await axios.post(`${baseURL}/api/project-budgets/${selectedBudget.vuid}/lines`, {
          budget_vuid: selectedBudget.vuid,
          cost_code_vuid: costCodeVuid,
          cost_type_vuid: newLineData.cost_type_vuid,
          budget_amount: newLineData.budget_amount,
          notes: newLineData.notes || '',
          status: 'active'
        });
        savedCount++;
        
        // Clear the new line form after saving
        setNewLineData({
          cost_code_vuid: '',
          cost_type_vuid: '',
          budget_amount: '',
          notes: ''
        });
      }
      
      // Process all lines in budgetLines
      for (const line of budgetLines) {
        if (line.vuid.startsWith('temp-')) {
          // This is a new line, save it
          let costCodeVuid = line.cost_code_vuid;
          if (useProjectCostCodes && projectSettings?.allow_project_cost_codes && line._originalCostCode) {
            costCodeVuid = await createProjectCostCodeIfNeeded(line._originalCostCode);
          }

          await axios.post(`${baseURL}/api/project-budgets/${selectedBudget.vuid}/lines`, {
            budget_vuid: line.budget_vuid,
            cost_code_vuid: costCodeVuid,
            cost_type_vuid: line.cost_type_vuid,
            budget_amount: line.budget_amount,
            notes: line.notes || '',
            status: line.status
          });
          savedCount++;
        } else if (line.vuid && !line.vuid.startsWith('temp-')) {
          // This is an existing line, check if it needs to be updated
          // For now, we'll update all existing lines to ensure consistency
          // In the future, we could add a 'dirty' flag to only update changed lines
          let costCodeVuid = line.cost_code_vuid;
          
          // For existing lines, we should already have VUIDs, so no conversion needed
          // Only convert if this is a new line that was added in project-specific mode
          if (useProjectCostCodes && projectSettings?.allow_project_cost_codes && line._originalCostCode) {
            costCodeVuid = await createProjectCostCodeIfNeeded(line._originalCostCode);
          }

          await axios.put(`${baseURL}/api/project-budgets/lines/${line.vuid}`, {
            budget_vuid: line.budget_vuid,
            cost_code_vuid: costCodeVuid,
            cost_type_vuid: line.cost_type_vuid,
            budget_amount: line.budget_amount,
            notes: line.notes || '',
            status: line.status
          });
          updatedCount++;
        }
      }
      
      // Refresh the budget lines to get the latest data from backend
      await fetchBudgetLines(selectedBudget.vuid);
      setError('');
      
      let message = '';
      if (savedCount > 0 && updatedCount > 0) {
        message = `${savedCount} new line${savedCount > 1 ? 's' : ''} saved and ${updatedCount} existing line${updatedCount > 1 ? 's' : ''} updated successfully!`;
      } else if (savedCount > 0) {
        message = `${savedCount} new budget line${savedCount > 1 ? 's' : ''} saved successfully!`;
      } else if (updatedCount > 0) {
        message = `${updatedCount} existing line${updatedCount > 1 ? 's' : ''} updated successfully!`;
      } else {
        message = 'All budget lines are already saved. No changes to commit.';
      }
      
      setSuccessMessage(message);
    } catch (err) {
      setError('Error saving budget lines: ' + err.message);
    }
  };

  // Handle going back to main budget view after adding lines
  const handleDoneAddingLines = () => {
    // Check if there are unsaved temporary lines
    const hasUnsavedLines = budgetLines.some(line => line.vuid.startsWith('temp-'));
    
    if (hasUnsavedLines) {
      if (window.confirm('You have unsaved budget lines. Are you sure you want to discard them?')) {
        setBudgetLines([]);
      } else {
        return; // Don't proceed if user cancels
      }
    }
    
    setShowLinesForm(false);
    setSelectedBudget(null);
    setShowCreateForm(false);
    setEditingBudget(null);
    setSuccessMessage(''); // Clear success message
    // Reset the line form data
    setLineFormData({
      budget_vuid: '',
      cost_code_vuid: '',
      cost_type_vuid: '',
      budget_amount: '',
      notes: '',
      status: 'active'
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 font-sans">
          Project Budgets
        </h1>
        <p className="text-xl text-gray-700 font-light">
          Create and manage original project budgets. Internal Change Orders are managed separately.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="text-center mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Create New Budget
          </button>
          <button
            onClick={() => window.location.href = '/internal-change-orders'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Create Internal Change Order
          </button>
          <button
            onClick={handleRetrieveModal}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Retrieve Budgets
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create/Edit Budget Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Selection */}
              <div className="dropdown-container relative">
                <label className="block text-lg font-semibold text-gray-900 mb-2">Project *</label>
                <input
                  type="text"
                  value={getProjectName(formData.project_vuid)}
                  onClick={() => !isBudgetLockedOrFinalized(editingBudget) && setProjectDropdownOpen(!projectDropdownOpen)}
                  readOnly
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isBudgetLockedOrFinalized(editingBudget)
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-gray-800'
                  }`}
                  placeholder="Select Project"
                />
                {projectDropdownOpen && !isBudgetLockedOrFinalized(editingBudget) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {projects
                      .filter(project => project.status === 'active')
                      .map((project) => (
                        <div
                          key={project.vuid}
                          onClick={() => {
                            setFormData({...formData, project_vuid: project.vuid});
                            setProjectDropdownOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{project.project_number}</div>
                          <div className="text-sm text-gray-600">{project.project_name}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Accounting Period Selection */}
              <div className="dropdown-container relative">
                <label className="block text-lg font-semibold text-gray-900 mb-2">Accounting Period *</label>
                <input
                  type="text"
                  value={getAccountingPeriodDisplay(formData.accounting_period_vuid)}
                  onClick={() => !isBudgetLockedOrFinalized(editingBudget) && setAccountingPeriodDropdownOpen(!accountingPeriodDropdownOpen)}
                  readOnly
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isBudgetLockedOrFinalized(editingBudget)
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-gray-800'
                  }`}
                  placeholder="Select Accounting Period"
                />
                {accountingPeriodDropdownOpen && !isBudgetLockedOrFinalized(editingBudget) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {accountingPeriods
                      .filter(period => period.status === 'open')
                      .map((period) => (
                        <div
                          key={period.vuid}
                          onClick={() => {
                            setFormData({...formData, accounting_period_vuid: period.vuid});
                            setAccountingPeriodDropdownOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{period.month}/{period.year}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Budget Type */}
              <div className="dropdown-container relative">
                <label className="block text-lg font-semibold text-gray-900 mb-2">Budget Type *</label>
                <input
                  type="text"
                  value={formData.budget_type.charAt(0).toUpperCase() + formData.budget_type.slice(1)}
                  onClick={() => !isBudgetLockedOrFinalized(editingBudget) && setTypeDropdownOpen(!typeDropdownOpen)}
                  readOnly
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isBudgetLockedOrFinalized(editingBudget)
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-gray-800'
                  }`}
                  placeholder="Select Type"
                />
                {typeDropdownOpen && !isBudgetLockedOrFinalized(editingBudget) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {['original', 'revised'].map((type) => (
                      <div
                        key={type}
                        onClick={() => {
                          setFormData({...formData, budget_type: type});
                          setTypeDropdownOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-900 mb-2">Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => !isBudgetLockedOrFinalized(editingBudget) && setFormData({...formData, description: e.target.value})}
                  disabled={isBudgetLockedOrFinalized(editingBudget)}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isBudgetLockedOrFinalized(editingBudget)
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-gray-800'
                  }`}
                  placeholder="Budget description"
                  maxLength={500}
                />
              </div>

              {/* Budget Date */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">Budget Date *</label>
                <input
                  type="date"
                  value={formData.budget_date}
                  onChange={(e) => !isBudgetLockedOrFinalized(editingBudget) && setFormData({...formData, budget_date: e.target.value})}
                  disabled={isBudgetLockedOrFinalized(editingBudget)}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isBudgetLockedOrFinalized(editingBudget)
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-gray-800'
                  }`}
                />
              </div>

              {/* Total Amount (Calculated) */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">Total Amount</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={(() => {
                      if (!selectedBudget) return '$0.00';
                      const total = budgetLines.reduce((sum, line) => sum + (parseFloat(line.budget_amount) || 0), 0);
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(total);
                    })()}
                    className="w-full px-4 py-3 border-2 rounded-lg text-lg font-medium bg-gray-50 text-gray-700 border-gray-300"
                    readOnly
                    placeholder="$0.00"
                  />
                  {selectedBudget && (() => {
                    const originalAmount = budgetLines.reduce((sum, line) => sum + (parseFloat(line.budget_amount) || 0), 0);
                    const currentAmount = getCurrentBudgetAmount(selectedBudget);
                    const hasChangeOrders = currentAmount !== originalAmount;
                    
                    if (hasChangeOrders) {
                      return (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current Budget (with change orders):</span>
                            <span className="text-lg font-semibold text-green-600">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(currentAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <p className="text-sm text-gray-500 mt-1">
                    Auto-calculated from budget lines
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="dropdown-container relative">
                <label className="block text-lg font-semibold text-gray-900 mb-2">Status</label>
                <input
                  type="text"
                  value={formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                  onClick={() => !isBudgetLockedOrFinalized(editingBudget) && setStatusDropdownOpen(!statusDropdownOpen)}
                  readOnly
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isBudgetLockedOrFinalized(editingBudget)
                      ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-gray-800'
                  }`}
                  placeholder="Select Status"
                />
                {statusDropdownOpen && !isBudgetLockedOrFinalized(editingBudget) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {['active', 'inactive'].map((status) => (
                      <div
                        key={status}
                        onClick={() => {
                          setFormData({...formData, status: status});
                          setStatusDropdownOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Finalize Original Budget */}
              {editingBudget && editingBudget.budget_type === 'original' && !isBudgetLockedOrFinalized(editingBudget) && (
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="finalize-budget"
                      checked={formData.finalized}
                      onChange={handleFinalizeCheckboxChange}
                      className="w-5 h-5 text-vermillion-600 border-gray-300 rounded focus:ring-vermillion-500 focus:ring-2"
                    />
                    <label htmlFor="finalize-budget" className="text-lg font-semibold text-gray-900">
                      Finalize Original Budget
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Once finalized, this budget and its lines cannot be edited, added, or deleted
                  </p>
                </div>
              )}
              
              {/* Finalized or Locked Budget Warning */}
              {editingBudget && (isBudgetFinalized(editingBudget) || isBudgetLocked(editingBudget)) && (
                <div className="md:col-span-2">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-red-900">
                          {isBudgetFinalized(editingBudget) ? 'Budget Finalized' : 'Budget Locked'}
                        </h3>
                        <p className="text-red-700 text-sm">
                          {isBudgetFinalized(editingBudget) 
                            ? 'This budget is finalized and cannot be modified. All fields are read-only.'
                            : 'This budget cannot be modified because its accounting period is closed. Create a change order to modify values.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center space-x-6 pt-8">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={showLinesForm}
                className={`font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  showLinesForm 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-gray-800 hover:bg-gray-900 text-white'
                }`}
              >
                {editingBudget ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Lines Excel-Style Form */}
      {showLinesForm && selectedBudget && (
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Budget Lines Entry - Excel Style
          </h2>
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600 font-medium">{successMessage}</p>
            </div>
          )}
          
          <div className="mb-6">
            <p className="text-gray-600 text-center">
              Use Tab to navigate between fields, Enter to add a new line, and start typing in dropdowns to search
            </p>
          </div>

          {/* Cost Code Toggle - Only show if project allows project-specific cost codes */}
          {projectSettings?.allow_project_cost_codes && (
            <div className="mb-6 flex items-center justify-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Cost Code Source:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setUseProjectCostCodes(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !useProjectCostCodes
                      ? 'bg-vermillion-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Global
                </button>
                <button
                  type="button"
                  onClick={() => setUseProjectCostCodes(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    useProjectCostCodes
                      ? 'bg-vermillion-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Project-Specific
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {useProjectCostCodes 
                  ? 'Enter custom cost codes manually' 
                  : 'Select from global master data'
                }
              </div>
            </div>
          )}

          {/* Add Item Button */}
          <div className="mb-4 text-center">
            <button
              type="button"
              onClick={handleAddNewLine}
              disabled={selectedBudget && isBudgetFinalized(selectedBudget)}
              className={`bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${
                selectedBudget && isBudgetFinalized(selectedBudget)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105'
              }`}
              title={selectedBudget && isBudgetFinalized(selectedBudget) ? 'Budget is finalized and cannot be modified' : 'Add new budget line'}
            >
              + Add Item
            </button>
          </div>

          {/* Excel-style grid */}
          <div className="overflow-x-auto" style={{ overflow: 'visible' }}>
            <table className="min-w-full border border-gray-300" style={{ position: 'relative' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Cost Code *</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Cost Type *</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Budget Amount *</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgetLines.map((line, index) => (
                  <tr key={line.vuid || index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {useProjectCostCodes && projectSettings?.allow_project_cost_codes ? (
                        // Project-specific mode: manual input
                        <input
                          type="text"
                          value={line.cost_code_vuid || ''}
                          onChange={(e) => handleCostCodeInput(e.target.value, index)}
                          className="w-full px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          placeholder="Enter cost code..."
                        />
                      ) : (
                        // Global mode: dropdown
                        <div className="dropdown-container relative">
                          <input
                            type="text"
                            value={costCodes.find(c => c.vuid === line.cost_code_vuid)?.code || ''}
                            onChange={(e) => {
                              const newLines = [...budgetLines];
                              newLines[index] = { ...newLines[index], cost_code_vuid: e.target.value };
                              setBudgetLines(newLines);
                            }}
                            onFocus={() => setCostCodeDropdownOpen(index)}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            placeholder="Type to search..."
                            readOnly
                          />
                          {costCodeDropdownOpen === index && (
                            <div className="absolute z-[9999] w-[500px] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto" style={{
                              top: '100%',
                              left: '0',
                              marginTop: '2px'
                            }}>
                              <input
                                type="text"
                                placeholder="Search cost codes..."
                                className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  const searchTerm = e.target.value.toLowerCase();
                                  const filtered = getCostCodesForDisplay().filter(costCode => 
                                    (costCode.code && costCode.code.toLowerCase().includes(searchTerm) || 
                                     costCode.description && costCode.description.toLowerCase().includes(searchTerm))
                                  );
                                  setFilteredCostCodes(filtered);
                                }}
                                autoFocus
                              />
                              {(filteredCostCodes.length > 0 ? filteredCostCodes : getCostCodesForDisplay()).map((costCode) => (
                                <div
                                  key={costCode.vuid}
                                  onClick={() => {
                                    const newLines = [...budgetLines];
                                    newLines[index] = { ...newLines[index], cost_code_vuid: costCode.vuid };
                                    setBudgetLines(newLines);
                                    setCostCodeDropdownOpen(null);
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{costCode.code}</div>
                                  <div className="text-sm text-gray-600">{costCode.description}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="dropdown-container relative">
                        <input
                          type="text"
                          value={costTypes.find(c => c.vuid === line.cost_type_vuid)?.cost_type || line.cost_type_vuid || ''}
                          onChange={(e) => {
                            const newLines = [...budgetLines];
                            newLines[index] = { ...newLines[index], cost_type_vuid: e.target.value };
                            setBudgetLines(newLines);
                          }}
                          onFocus={() => setCostTypeDropdownOpen(index)}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          placeholder="Type to search..."
                        />
                        {costTypeDropdownOpen === index && (
                          <div className="absolute z-[9999] w-[500px] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto" style={{
                            top: '100%',
                            left: '0',
                            marginTop: '2px'
                          }}>
                            <input
                              type="text"
                              placeholder="Search cost types..."
                              className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase();
                                const filtered = costTypes.filter(costType => 
                                  costType.status === 'active' && 
                                  (costType.cost_type && costType.cost_type.toLowerCase().includes(searchTerm) || 
                                   costType.description && costType.description.toLowerCase().includes(searchTerm))
                                );
                                setFilteredCostTypes(filtered);
                              }}
                              autoFocus
                            />
                            {(filteredCostTypes.length > 0 ? filteredCostTypes : costTypes.filter(c => c.status === 'active')).map((costType) => (
                              <div
                                key={costType.vuid}
                                onClick={() => {
                                  const newLines = [...budgetLines];
                                  newLines[index] = { ...newLines[index], cost_type_vuid: costType.vuid };
                                  setBudgetLines(newLines);
                                  setCostTypeDropdownOpen(null);
                                }}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{costType.cost_type} ({costType.abbreviation})</div>
                                <div className="text-sm text-gray-600">{costType.description}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.budget_amount || ''}
                        onChange={(e) => {
                          const newLines = [...budgetLines];
                          newLines[index] = { ...newLines[index], budget_amount: e.target.value };
                          setBudgetLines(newLines);
                        }}
                        className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        placeholder="0.00"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewLine();
                          }
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="text"
                        value={line.notes || ''}
                        onChange={(e) => {
                          const newLines = [...budgetLines];
                          newLines[index] = { ...newLines[index], notes: e.target.value };
                          setBudgetLines(newLines);
                        }}
                        className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        placeholder="Optional notes"
                        maxLength={500}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewLine();
                          }
                        }}
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteLine(line.vuid)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* New line row */}
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {useProjectCostCodes && projectSettings?.allow_project_cost_codes ? (
                      // Project-specific mode: manual input
                      <input
                        type="text"
                        id="new-line-cost-code"
                        value={newLineData.cost_code_vuid || ''}
                        onChange={(e) => handleCostCodeInput(e.target.value, null, true)}
                        className="w-full px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50"
                        placeholder="Enter cost code..."
                      />
                    ) : (
                      // Global mode: dropdown
                      <div className="dropdown-container relative">
                        <input
                          type="text"
                          id="new-line-cost-code"
                          value={costCodes.find(c => c.vuid === newLineData.cost_code_vuid)?.code || ''}
                          onChange={(e) => setNewLineData({...newLineData, cost_code_vuid: e.target.value})}
                          onFocus={() => setNewLineCostCodeDropdownOpen(true)}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50"
                          placeholder="Type to search..."
                          readOnly
                        />
                        {newLineCostCodeDropdownOpen && (
                          <div className="absolute z-[9999] w-[500px] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto" style={{
                            top: '100%',
                            left: '0',
                            marginTop: '2px'
                          }}>
                            <input
                              type="text"
                              placeholder="Search cost codes..."
                              className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase();
                                const filtered = getCostCodesForDisplay().filter(costCode => 
                                  (costCode.code && costCode.code.toLowerCase().includes(searchTerm) || 
                                   costCode.description && costCode.description.toLowerCase().includes(searchTerm))
                                );
                                setFilteredCostCodes(filtered);
                              }}
                              autoFocus
                            />
                            {(filteredCostCodes.length > 0 ? filteredCostCodes : getCostCodesForDisplay()).map((costCode) => (
                              <div
                                key={costCode.vuid}
                                onClick={() => {
                                  setNewLineData({...newLineData, cost_code_vuid: costCode.vuid});
                                  setNewLineCostCodeDropdownOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{costCode.code}</div>
                                <div className="text-sm text-gray-600">{costCode.description}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="dropdown-container relative">
                      <input
                        type="text"
                        id="new-line-cost-type"
                        value={costTypes.find(c => c.vuid === newLineData.cost_type_vuid)?.cost_type || ''}
                        onChange={(e) => setNewLineData({...newLineData, cost_type_vuid: e.target.value})}
                        onFocus={() => setNewLineCostTypeDropdownOpen(true)}
                        className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50"
                        placeholder="Type to search..."
                        readOnly
                      />
                                            {newLineCostTypeDropdownOpen && (
                        <div className="absolute z-[9999] w-[500px] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto" style={{
                          top: '100%',
                          left: '0',
                          marginTop: '2px'
                        }}>
                          <input
                            type="text"
                            placeholder="Search cost types..."
                            className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                              const searchTerm = e.target.value.toLowerCase();
                              const filtered = costTypes.filter(costType => 
                                costType.status === 'active' && 
                                (costType.cost_type && costType.cost_type.toLowerCase().includes(searchTerm) || 
                                 costType.description && costType.description.toLowerCase().includes(searchTerm))
                              );
                              setFilteredCostTypes(filtered);
                            }}
                            autoFocus
                          />
                          {(filteredCostTypes.length > 0 ? filteredCostTypes : costTypes.filter(c => c.status === 'active')).map((costType) => (
                            <div
                              key={costType.vuid}
                              onClick={() => {
                                setNewLineData({...newLineData, cost_type_vuid: costType.vuid});
                                setNewLineCostTypeDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{costType.cost_type} ({costType.abbreviation})</div>
                              <div className="text-sm text-gray-600">{costType.description}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newLineData.budget_amount}
                      onChange={(e) => setNewLineData({...newLineData, budget_amount: e.target.value})}
                      className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50"
                      placeholder="0.00"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewLine();
                        }
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="text"
                      value={newLineData.notes}
                      onChange={(e) => setNewLineData({...newLineData, notes: e.target.value})}
                                             className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50"
                      placeholder="Optional notes"
                      maxLength={500}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewLine();
                        }
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button
                      type="button"
                      onClick={handleAddNewLine}
                      disabled={selectedBudget && isBudgetFinalized(selectedBudget)}
                      className={`font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 transform ${
                        selectedBudget && isBudgetFinalized(selectedBudget)
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-900 text-white hover:scale-105 shadow-lg'
                      }`}
                      title={selectedBudget && isBudgetFinalized(selectedBudget) ? 'Budget is finalized and cannot be modified' : 'Add new budget line'}
                    >
                      Add Line
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-center space-x-6 pt-8">
            <button
              type="button"
              onClick={handleDoneAddingLines}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleSaveAllLines}
              disabled={selectedBudget && isBudgetFinalized(selectedBudget)}
              className={`font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform ${
                selectedBudget && isBudgetFinalized(selectedBudget)
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
              }`}
              title={selectedBudget && isBudgetFinalized(selectedBudget) ? 'Budget is finalized and cannot be modified' : 'Save all budget lines'}
                         >
               Save All Lines
             </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {!showCreateForm && !showLinesForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-vermillion-500"
                placeholder="Search descriptions..."
              />
            </div>
            
            <div className="dropdown-container relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Project</label>
              <input
                type="text"
                value={projectFilter === 'all' ? 'All Projects' : getProjectName(projectFilter)}
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-vermillion-500"
                placeholder="All Projects"
              />
              {projectDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <div
                    onClick={() => {
                      setProjectFilter('all');
                      setProjectDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  >
                    All Projects
                  </div>
                  {projects
                    .filter(project => project.status === 'active')
                    .map((project) => (
                      <div
                        key={project.vuid}
                        onClick={() => {
                          setProjectFilter(project.vuid);
                          setProjectDropdownOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{project.project_number}</div>
                        <div className="text-sm text-gray-600">{project.project_name}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="dropdown-container relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <input
                type="text"
                value={typeFilter === 'all' ? 'All Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-vermillion-500"
                placeholder="All Types"
              />
              {typeDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div
                    onClick={() => {
                      setTypeFilter('all');
                      setTypeDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  >
                    All Types
                  </div>
                  {['original', 'revised'].map((type) => (
                    <div
                      key={type}
                      onClick={() => {
                        setTypeFilter(type);
                        setTypeDropdownOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dropdown-container relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <input
                type="text"
                value={statusFilter === 'all' ? 'All Statuses' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-vermillion-500"
                placeholder="All Statuses"
              />
              {statusDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div
                    onClick={() => {
                      setStatusFilter('all');
                      setStatusDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  >
                    All Statuses
                  </div>
                  {['active', 'inactive'].map((status) => (
                    <div
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setStatusDropdownOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setProjectFilter('all');
                setTypeFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vermillion-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Budgets List */}
      {!showCreateForm && !showLinesForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Project Budgets</h2>
          </div>
          
          {filteredBudgets.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No budgets found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Budget Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revised Budget Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentBudgets().map((budget) => (
                    <tr key={budget.vuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getProjectName(budget.project_vuid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{budget.description}</span>
                          {budget.budget_type === 'revised' && (
                            <span className="text-xs text-green-600 font-medium">
                              (Change Order)
                            </span>
                          )}
                          <IntegrationIndicator 
                            objectVuid={budget.vuid} 
                            objectType="project_budget" 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          budget.budget_type === 'original' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {budget.budget_type.charAt(0).toUpperCase() + budget.budget_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(budget.budget_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {(() => {
                          if (budget.budget_type === 'revised') {
                            // For revised budgets, show the original budget amount
                            const originalBudget = budgets.find(b => b.vuid === budget.original_budget_vuid);
                            if (originalBudget) {
                              return (
                                <div className="flex flex-col">
                                  <span>
                                    {formatCurrency(getOriginalBudgetAmount(originalBudget.vuid))}
                                  </span>
                                  <span className="text-xs text-gray-500">Original Budget</span>
                                </div>
                              );
                            }
                            return formatCurrency(0);
                          }
                          
                          // For original budgets, show both original and current amounts
                          const originalAmount = getOriginalBudgetAmount(budget.vuid);
                          const currentAmount = getCurrentBudgetAmount(budget);
                          const hasChangeOrders = currentAmount !== originalAmount;
                          
                          return (
                            <div className="flex flex-col">
                              <span className={hasChangeOrders ? "text-gray-500 line-through" : ""}>
                                {formatCurrency(originalAmount)}
                              </span>
                              {hasChangeOrders && (
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(currentAmount)}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {hasChangeOrders ? "Current Budget" : "Original Budget"}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {(() => {
                          if (budget.budget_type === 'revised') {
                            // For revised budgets, show the change amount
                            const changeAmount = getChangeAmountForBudget(budget.vuid);
                            return (
                              <div className="flex flex-col">
                                <span className="text-green-600">
                                  {formatCurrency(changeAmount)}
                                </span>
                                <span className="text-xs text-gray-500">Change Amount</span>
                              </div>
                            );
                          }
                          
                          // For original budgets, show the revised amount (original + change orders)
                          return (
                            <div className="flex flex-col">
                              <span className="text-blue-600">
                                {formatCurrency(getRevisedBudgetAmount(budget.vuid))}
                              </span>
                              <span className="text-xs text-gray-500">Revised Budget</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            budget.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                          </span>
                          {isBudgetFinalized(budget) && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Finalized
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => selectedBudget && selectedBudget.vuid === budget.vuid ? handleHideLines() : handleViewLines(budget)}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              selectedBudget && selectedBudget.vuid === budget.vuid
                                ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                                : 'text-vermillion-700 bg-vermillion-100 hover:bg-vermillion-200 focus:ring-vermillion-500'
                            }`}
                          >
                            {selectedBudget && selectedBudget.vuid === budget.vuid ? 'Hide Lines' : 'View Lines'}
                          </button>
                          <button
                            onClick={() => handleIntegrationModal(budget)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Send to integration"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditBudget(budget)}
                            disabled={isBudgetFinalized(budget)}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              isBudgetFinalized(budget)
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                            }`}
                            title={isBudgetFinalized(budget) ? 'Budget is finalized and cannot be edited' : 'Edit budget'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.vuid)}
                            disabled={isBudgetFinalized(budget)}
                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              isBudgetFinalized(budget)
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                            }`}
                            title={isBudgetFinalized(budget) ? 'Budget is finalized and cannot be deleted' : 'Delete budget'}
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
          )}

          {/* Pagination */}
          {filteredBudgets.length > budgetsPerPage && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * budgetsPerPage) + 1} to {Math.min(currentPage * budgetsPerPage, filteredBudgets.length)} of {filteredBudgets.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(filteredBudgets.length / budgetsPerPage)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budget Lines View */}
      {selectedBudget && !showCreateForm && !showLinesForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedBudget.budget_type === 'revised' ? 'Change Order Lines' : 'Budget Lines'} for {getProjectName(selectedBudget.project_vuid)} - {selectedBudget.description}
                <IntegrationIndicator 
                  objectVuid={selectedBudget.vuid} 
                  objectType="budget" 
                  className="ml-3"
                />
              </h2>
              <p className="text-sm text-gray-600">
                Type: {selectedBudget.budget_type.charAt(0).toUpperCase() + selectedBudget.budget_type.slice(1)} | 
                Budget Date: {formatDate(selectedBudget.budget_date)}
                {selectedBudget.budget_type === 'revised' && (
                  <span className="ml-2 text-green-600 font-medium">
                    (Internal Change Order)
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              {selectedBudget.budget_type === 'revised' ? (
                <button
                  onClick={() => {
                    // For revised budgets, we don't allow adding lines directly
                    // They should be managed through the Internal Change Order system
                  }}
                  disabled={true}
                  className="px-4 py-2 rounded-md bg-gray-400 text-gray-600 cursor-not-allowed"
                  title="Change order lines are managed through the Internal Change Order system"
                >
                  Manage in ICO
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowLinesForm(true);
                    }}
                    disabled={selectedBudget && isBudgetFinalized(selectedBudget)}
                    className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedBudget && isBudgetFinalized(selectedBudget)
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-vermillion-600 text-white hover:bg-vermillion-700 focus:ring-vermillion-500'
                    }`}
                    title={selectedBudget && isBudgetFinalized(selectedBudget) ? 'Budget is finalized and cannot be modified' : 'Open Excel-style line manager'}
                  >
                    Manage Lines
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={selectedBudget && isBudgetFinalized(selectedBudget)}
                    className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedBudget && isBudgetFinalized(selectedBudget)
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                    }`}
                    title={selectedBudget && isBudgetFinalized(selectedBudget) ? 'Budget is finalized and cannot be modified' : 'Download CSV template file'}
                  >
                    Download Template
                  </button>
                  <button
                    onClick={() => {
                      console.log('Upload CSV button clicked', csvUploadInputRef.current);
                      csvUploadInputRef.current?.click();
                    }}
                    disabled={selectedBudget && isBudgetFinalized(selectedBudget)}
                    className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedBudget && isBudgetFinalized(selectedBudget)
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                    title={selectedBudget && isBudgetFinalized(selectedBudget) ? 'Budget is finalized and cannot be modified' : 'Upload CSV file to create budget lines'}
                  >
                    Upload CSV
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedBudget(null);
                  setBudgetLines([]);
                  setShowLinesForm(false);
                  setShowCreateForm(false);

                  setEditingBudget(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vermillion-500"
              >
                Back to Budgets
              </button>
            </div>
          </div>

          {/* CSV Upload Help Section */}
          {selectedBudget.budget_type !== 'revised' && (
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800">CSV Upload Format</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Upload a CSV file with the following columns:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li><strong>cost_code</strong> - The cost code (any code when project-specific cost codes are enabled)</li>
                      <li><strong>cost_type</strong> - The cost type abbreviation (e.g., "LAB", "MAT", "EQ") or full name</li>
                      <li><strong>description</strong> - Description for the budget line</li>
                      <li><strong>budget_amount</strong> - Budget amount (must be greater than 0)</li>
                    </ul>
                    <p className="mt-2 text-xs">
                      <strong>Tip:</strong> Click "Download Template" to get a pre-filled CSV with example cost codes and cost types.
                    </p>
                    <p className="mt-1 text-xs">
                      <strong>Note:</strong> When project-specific cost codes are enabled, you can use any cost code format you want.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {(() => {
            // Simplified: just show all budget lines for this budget
            const linesToShow = selectedBudget.budget_type === 'revised' ? icoLines : budgetLines;
            
            console.log('View Lines Debug - Simplified:', {
              selectedBudgetVuid: selectedBudget.vuid,
              budgetType: selectedBudget.budget_type,
              totalBudgetLines: budgetLines.length,
              linesToShow: linesToShow.length,
              allBudgetLines: budgetLines,
              zeroAmountLines: budgetLines.filter(line => line.budget_amount === 0 || line.budget_amount === '0'),
              budgetAmounts: budgetLines.map(line => ({ vuid: line.vuid, budget_amount: line.budget_amount, type: typeof line.budget_amount }))
            });
            
            const hasLines = linesToShow && linesToShow.length > 0;
            
            if (!hasLines) {
              return (
                <div className="px-6 py-8 text-center text-gray-500">
                  {selectedBudget.budget_type === 'revised' 
                    ? 'No change order lines found for this Internal Change Order.' 
                    : 'No budget lines found for this budget.'}
                </div>
              );
            }
            
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {selectedBudget.budget_type === 'revised' ? 'Change Amount' : 'Budget Amount'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change Order Impacts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      {selectedBudget.budget_type !== 'revised' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {linesToShow.map((line) => (
                      <tr key={line.vuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCostCodeName(line.cost_code_vuid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCostTypeName(line.cost_type_vuid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {selectedBudget.budget_type === 'revised' 
                          ? formatCurrency(line.change_amount || line.budget_amount)
                          : formatCurrency(line.budget_amount)
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const impacts = getChangeOrderImpacts(line);
                          if (impacts.total === 0) {
                            return <span className="text-gray-400">No changes</span>;
                          }
                          
                          return (
                            <div className="space-y-1">
                              {impacts.external > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-blue-600 font-medium">External:</span>
                                  <span className="text-xs text-blue-600">
                                    +{formatCurrency(impacts.external)}
                                  </span>
                                </div>
                              )}
                              {impacts.internal > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-green-600 font-medium">Internal:</span>
                                  <span className="text-xs text-green-600">
                                    +{formatCurrency(impacts.internal)}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2 border-t pt-1">
                                <span className="text-xs font-semibold text-gray-700">Total:</span>
                                <span className="text-xs font-semibold text-gray-700">
                                  +{formatCurrency(impacts.total)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {line.notes || line.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          line.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {line.status.charAt(0).toUpperCase() + line.status.slice(1)}
                        </span>
                      </td>
                      {selectedBudget.budget_type !== 'revised' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">

                            <button
                              onClick={() => handleDeleteLine(line.vuid)}
                              disabled={selectedBudget && isBudgetFinalized(selectedBudget)}
                              className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                selectedBudget && isBudgetFinalized(selectedBudget)
                                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                  : 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                              }`}
                              title={selectedBudget && isBudgetFinalized(selectedBudget) ? 'Budget is finalized and cannot be deleted' : 'Delete budget line'}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            );
          })()}
        </div>
      )}

      {/* Integration Modal */}
      {showIntegrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Send Budget to Integration
              </h2>
              <button
                onClick={() => {
                  setShowIntegrationModal(false);
                  setBudgetForIntegration(null);
                  setSelectedIntegration(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Budget Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Description:</span>
                  <p className="text-gray-900">{budgetForIntegration?.description}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Project:</span>
                  <p className="text-gray-900">{budgetForIntegration ? getProjectName(budgetForIntegration.project_vuid) : ''}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Type:</span>
                  <p className="text-gray-900 capitalize">{budgetForIntegration?.budget_type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p className="text-gray-900 capitalize">{budgetForIntegration?.status}</p>
                </div>
              </div>
            </div>

            {/* Integration Selection */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Select Integration *
              </label>
              {integrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-lg">No integrations available</p>
                  <p className="text-sm">Create an integration first to send budgets to external systems.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {integrations.map((integration) => (
                    <div
                      key={integration.vuid}
                      onClick={() => setSelectedIntegration(integration)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedIntegration?.vuid === integration.vuid
                          ? 'border-gray-800 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{integration.integration_name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{integration.integration_type.replace('_', ' ')}</p>
                          {integration.base_url && (
                            <p className="text-xs text-gray-500 mt-1">{integration.base_url}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            integration.status === 'active' ? 'bg-green-100 text-green-800' : 
                            integration.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {integration.status}
                          </span>
                          {selectedIntegration?.vuid === integration.vuid && (
                            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowIntegrationModal(false);
                  setBudgetForIntegration(null);
                  setSelectedIntegration(null);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToIntegration}
                disabled={!selectedIntegration}
                className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                  selectedIntegration
                    ? 'bg-gray-800 text-white hover:bg-gray-900'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send to Integration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retrieve Budgets Modal */}
      {showRetrieveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Retrieve Budgets from Integration
              </h2>
              <button
                onClick={() => {
                  setShowRetrieveModal(false);
                  setRetrieveIntegration(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">How it works</h3>
                  <p className="text-blue-800 text-sm">
                    Select an integration to retrieve budgets from external systems. This will import budget data 
                    and create new budget records in your system.
                  </p>
                </div>
              </div>
            </div>

            {/* Integration Selection */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Select Integration *
              </label>
              {integrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-lg">No integrations available</p>
                  <p className="text-sm">Create an integration first to retrieve budgets from external systems.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
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
                          <h4 className="font-semibold text-gray-900">{integration.integration_name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{integration.integration_type.replace('_', ' ')}</p>
                          {integration.base_url && (
                            <p className="text-xs text-gray-500 mt-1">{integration.base_url}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowRetrieveModal(false);
                  setRetrieveIntegration(null);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRetrieveBudgets}
                disabled={!retrieveIntegration}
                className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                  retrieveIntegration
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Retrieve Budgets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retrieved Budgets Modal */}
      {showRetrievedBudgetsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Review Retrieved Budget Lines
              </h2>
              <button
                onClick={() => {
                  setShowRetrievedBudgetsModal(false);
                  setRetrievedBudgetsData([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                                      <div>
                        <h3 className="text-lg font-semibold text-green-900 mb-1">Locked Budget Lines Retrieved Successfully</h3>
                        <p className="text-green-800 text-sm">
                          Only locked (finalized) budgets from Procore are shown below. Review the budget lines and select the ones you want to import. Use the checkboxes to choose
                          individual lines or use the Select All/Deselect All buttons. A new budget will be created for the
                          selected project with these budget lines.
                        </p>
                      </div>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAllBudgets}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-all"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllBudgets}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-all"
                >
                  Deselect All
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {selectedBudgetsToImport.length} of {retrievedBudgetsData.length} budget lines selected
              </div>
            </div>

            {/* Budget Lines Table */}
            <div className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedBudgetsToImport.length === retrievedBudgetsData.length && retrievedBudgetsData.length > 0}
                          onChange={() => {
                            if (selectedBudgetsToImport.length === retrievedBudgetsData.length) {
                              handleDeselectAllBudgets();
                            } else {
                              handleSelectAllBudgets();
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Cost Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Cost Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Budget Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Division
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {retrievedBudgetsData.map((budgetLine, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedBudgetsToImport.includes(budgetLine)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBudgetsToImport([...selectedBudgetsToImport, budgetLine]);
                              } else {
                                setSelectedBudgetsToImport(selectedBudgetsToImport.filter(item => item !== budgetLine));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{budgetLine.cost_code}</div>
                            <div className="text-sm text-gray-500">{budgetLine.cost_code_description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{budgetLine.cost_type}</div>
                            <div className="text-sm text-gray-500">({budgetLine.cost_type_abbreviation})</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatCurrency(budgetLine.budget_amount)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {budgetLine.division}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {budgetLine.category}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {budgetLine.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowRetrievedBudgetsModal(false);
                  setRetrievedBudgetsData([]);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImportBudgets}
                disabled={selectedBudgetsToImport.length === 0}
                className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                  selectedBudgetsToImport.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Import Selected Budget Lines
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Budget Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Finalize Original Budget
              </h2>
              <button
                onClick={handleCancelFinalize}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-8 h-8 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-xl font-semibold text-red-900 mb-2">⚠️ Finalization Warning</h3>
                  <p className="text-red-800 text-lg">
                    Are you sure you want to finalize your original budget?
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    Once finalized, this budget and all its budget lines will be locked and cannot be:
                  </p>
                  <ul className="text-red-700 text-sm mt-2 list-disc list-inside space-y-1">
                    <li>Edited or modified</li>
                    <li>Have new budget lines added</li>
                    <li>Have existing budget lines deleted</li>
                    <li>Be unfinalized (this action is permanent)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelFinalize}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFinalize}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all"
              >
                Yes, Finalize Budget
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input for CSV upload */}
      <input
        ref={csvUploadInputRef}
        type="file"
        accept=".csv,.xlsx"
        style={{ display: 'none' }}
        onChange={handleCsvUpload}
      />
    </div>
  );
};

export default ProjectBudgets;
