import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectDetails = () => {
  const { projectVuid } = useParams();
  const navigate = useNavigate();
  
  
  const [project, setProject] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [projectBudgets, setProjectBudgets] = useState([]);
  const [projectContracts, setProjectContracts] = useState([]);
  const [projectBillings, setProjectBillings] = useState([]);
  const [apInvoices, setApInvoices] = useState([]);
  const [laborCosts, setLaborCosts] = useState([]);
  const [projectExpenses, setProjectExpenses] = useState([]);
  const [internalChangeOrders, setInternalChangeOrders] = useState([]);
  const [externalChangeOrders, setExternalChangeOrders] = useState([]);
  const [commitmentChangeOrders, setCommitmentChangeOrders] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [selectedAccountingPeriod, setSelectedAccountingPeriod] = useState('');
  const [wipData, setWipData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changeOrdersLoading, setChangeOrdersLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Integration state
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);
  


  useEffect(() => {
    if (projectVuid) {
      fetchProjectData();
      // Lazy load change orders after main data is loaded
      setTimeout(() => fetchChangeOrders(), 100);
    } else {
      setError('No project ID provided');
      setLoading(false);
    }
  }, [projectVuid]);

  // Refetch WIP data when accounting period changes
  useEffect(() => {
    if (projectVuid && !loading) {
      fetchWipData();
    }
  }, [selectedAccountingPeriod, projectVuid, loading]);

  const fetchWipData = async () => {
    if (!projectVuid) return;
    
    console.log('Fetching WIP data for accounting period:', selectedAccountingPeriod || 'All Periods');
    
    const baseURL = 'http://localhost:5001';
    
    try {
      let wipUrl = `${baseURL}/api/wip`;
      if (selectedAccountingPeriod) {
        wipUrl += `?accounting_period_vuid=${selectedAccountingPeriod}`;
      }
      
      const wipResponse = await axios.get(wipUrl);
      const projectWipData = wipResponse.data.filter(item => item.project_vuid === projectVuid);
      console.log('WIP data fetched:', projectWipData);
      setWipData(projectWipData);
      } catch (err) {
      console.log('Error fetching WIP data:', err.message);
      setWipData([]);
    }
  };

  const fetchProjectData = async () => {
    if (!projectVuid) return;
    
    const baseURL = 'http://localhost:5001';
    
    try {
      setLoading(true);
      
      // Fetch critical data in parallel for faster loading
      const [
        projectResponse,
        accountingPeriodsResponse,
        commitmentsResponse,
        budgetsResponse,
        contractsResponse,
        billingsResponse,
        apInvoicesResponse,
        laborCostsResponse,
        projectExpensesResponse
      ] = await Promise.allSettled([
        axios.get(`${baseURL}/api/projects/${projectVuid}`),
        axios.get(`${baseURL}/api/accounting-periods`),
        axios.get(`${baseURL}/api/project-commitments`),
        axios.get(`${baseURL}/api/project-budgets`),
        axios.get(`${baseURL}/api/project-contracts`),
        axios.get(`${baseURL}/api/project-billings`),
        axios.get(`${baseURL}/api/ap-invoices?project_vuid=${projectVuid}`),
        axios.get(`${baseURL}/api/labor-costs`),
        axios.get(`${baseURL}/api/project-expenses`)
      ]);

      // Set project data (critical - must succeed)
      if (projectResponse.status === 'fulfilled') {
        setProject(projectResponse.value.data);
      } else {
        throw new Error('Failed to load project data');
      }

      // Set accounting periods and default selection
      if (accountingPeriodsResponse.status === 'fulfilled') {
        const periods = accountingPeriodsResponse.value.data;
        setAccountingPeriods(periods);
        const openPeriod = periods.find(p => p.status === 'open');
        setSelectedAccountingPeriod(openPeriod ? openPeriod.vuid : '');
      }

      // Set filtered data for project-specific items
      if (commitmentsResponse.status === 'fulfilled') {
        setCommitments(commitmentsResponse.value.data.filter(c => c.project_vuid === projectVuid));
      }
      
      if (budgetsResponse.status === 'fulfilled') {
        setProjectBudgets(budgetsResponse.value.data.filter(b => b.project_vuid === projectVuid));
      }
      
      if (contractsResponse.status === 'fulfilled') {
        setProjectContracts(contractsResponse.value.data.filter(c => c.project_vuid === projectVuid));
      }
      
      if (billingsResponse.status === 'fulfilled') {
        setProjectBillings(billingsResponse.value.data.filter(b => b.project_vuid === projectVuid));
      }
      
      if (apInvoicesResponse.status === 'fulfilled') {
        setApInvoices(apInvoicesResponse.value.data);
      }
      
      if (laborCostsResponse.status === 'fulfilled') {
        setLaborCosts(laborCostsResponse.value.data.filter(laborCost => laborCost.project_vuid === projectVuid));
      }
      
      if (projectExpensesResponse.status === 'fulfilled') {
        setProjectExpenses(projectExpensesResponse.value.data.filter(expense => expense.project_vuid === projectVuid));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  // Separate function for lazy loading change orders (less critical data)
  const fetchChangeOrders = async () => {
    if (!projectVuid) return;
    
    const baseURL = 'http://localhost:5001';
    
    try {
      setChangeOrdersLoading(true);
      const [internalChangeOrdersResponse, externalChangeOrdersResponse, commitmentChangeOrdersResponse] = await Promise.allSettled([
        axios.get(`${baseURL}/api/internal-change-orders`),
        axios.get(`${baseURL}/api/external-change-orders`),
        axios.get(`${baseURL}/api/commitment-change-orders?project_vuid=${projectVuid}`)
      ]);

      if (internalChangeOrdersResponse.status === 'fulfilled') {
        setInternalChangeOrders(internalChangeOrdersResponse.value.data.filter(ico => ico.project_vuid === projectVuid));
      }
      
      if (externalChangeOrdersResponse.status === 'fulfilled') {
        setExternalChangeOrders(externalChangeOrdersResponse.value.data.filter(eco => eco.project_vuid === projectVuid));
      }

      if (commitmentChangeOrdersResponse.status === 'fulfilled') {
        setCommitmentChangeOrders(commitmentChangeOrdersResponse.value.data);
      }
    } catch (err) {
      console.log('Error fetching change orders:', err.message);
    } finally {
      setChangeOrdersLoading(false);
    }
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

  // Calculate total budget amount (original budgets + internal change orders)
  const calculateTotalBudgetAmount = () => {
    let total = 0;
    
    // Add original budget amounts
    projectBudgets.forEach(budget => {
      const amount = parseFloat(budget.budget_amount || 0);
      if (!isNaN(amount)) {
        total += amount;
      }
    });
    
    // Add internal change order amounts
    internalChangeOrders.forEach(ico => {
      const amount = parseFloat(ico.total_change_amount || 0);
      if (!isNaN(amount)) {
        total += amount;
      }
    });
    
    return total;
  };

  // Calculate total contract amount (contracts + external change orders)
  const calculateTotalContractAmount = () => {
    let total = 0;
    
    // Add contract amounts
    projectContracts.forEach(contract => {
      const amount = parseFloat(contract.contract_amount || 0);
      if (!isNaN(amount)) {
        total += amount;
      }
    });
    
    // Add external change order amounts
    externalChangeOrders.forEach(eco => {
      const amount = parseFloat(eco.total_change_amount || 0);
      if (!isNaN(amount)) {
        total += amount;
      }
    });
    
    return total;
  };

  const handleEditProject = () => {
    navigate('/projects', { state: { editProject: project } });
  };

  const handleViewCommitment = (commitment) => {
    navigate(`/commitments?project=${projectVuid}&commitment=${commitment.vuid}`);
  };

  const handleViewBudget = (budget) => {
    navigate(`/project-budgets?project=${projectVuid}&budget=${budget.vuid}`);
  };

  const handleViewContract = (contract) => {
    navigate(`/project-contracts?project=${projectVuid}&contract=${contract.vuid}`);
  };

  const handleViewBilling = (billing) => {
    navigate(`/project-billing?project=${projectVuid}&billing=${billing.vuid}`);
  };

  const handleViewInvoice = (invoice) => {
    navigate(`/ap-invoices?project=${project.vuid}&invoice=${invoice.vuid}`);
  };

  const handleViewLaborCosts = () => {
    navigate(`/labor-costs?project=${projectVuid}`);
  };

  const handleViewProjectExpenses = () => {
    navigate(`/project-expenses?project=${projectVuid}`);
  };

  // Filter costs by selected accounting period
  const getFilteredCosts = (costs, periodVuid) => {
    if (!periodVuid) return costs;
    return costs.filter(cost => cost.accounting_period_vuid === periodVuid);
  };

  // Get accounting period display name
  const getAccountingPeriodDisplay = (periodVuid) => {
    const period = accountingPeriods.find(p => p.vuid === periodVuid);
    return period ? `${period.month}/${period.year}` : 'All Periods';
  };

  // Get WIP-based metrics for the selected accounting period
  const getWipMetrics = () => {
    if (!wipData || wipData.length === 0) {
      return {
        wipEntry: null,
        totalContractAmount: 0,
        currentBudgetAmount: 0,
        costsToDate: 0,
        projectBillings: 0,
        revenueRecognized: 0,
        apInvoices: { count: 0, total: 0 },
        laborCosts: { count: 0, total: 0 },
        projectExpenses: { count: 0, total: 0 }
      };
    }

    // Get the first (and should be only) WIP entry for this project
    const wipEntry = wipData[0];
    
    // Fallback to individual cost calculations if WIP data is not available
    const filteredAPInvoices = getFilteredCosts(apInvoices, selectedAccountingPeriod);
    const filteredLaborCosts = getFilteredCosts(laborCosts, selectedAccountingPeriod);
    const filteredProjectExpenses = getFilteredCosts(projectExpenses, selectedAccountingPeriod);
    
    const apInvoicesTotal = filteredAPInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.subtotal) || 0), 0);
    const laborCostsTotal = filteredLaborCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const projectExpensesTotal = filteredProjectExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    
    return {
      wipEntry: wipEntry,
      totalContractAmount: wipEntry?.total_contract_amount || 0,
      currentBudgetAmount: wipEntry?.current_budget_amount || 0,
      costsToDate: wipEntry?.costs_to_date || 0,
      projectBillings: wipEntry?.project_billings || 0,
      revenueRecognized: wipEntry?.revenue_recognized || 0,  // Use the value directly from WIP API, don't recalculate
      apInvoices: { count: filteredAPInvoices.length, total: apInvoicesTotal },
      laborCosts: { count: filteredLaborCosts.length, total: laborCostsTotal },
      projectExpenses: { count: filteredProjectExpenses.length, total: projectExpensesTotal }
    };
  };

  // Get filtered cost counts and totals (fallback for individual costs)
  const getCostMetrics = () => {
    const filteredAPInvoices = getFilteredCosts(apInvoices, selectedAccountingPeriod);
    const filteredLaborCosts = getFilteredCosts(laborCosts, selectedAccountingPeriod);
    const filteredProjectExpenses = getFilteredCosts(projectExpenses, selectedAccountingPeriod);
    
    const apInvoicesTotal = filteredAPInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.subtotal) || 0), 0);
    const laborCostsTotal = filteredLaborCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
    const projectExpensesTotal = filteredProjectExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
    
    return {
      apInvoices: { count: filteredAPInvoices.length, total: apInvoicesTotal },
      laborCosts: { count: filteredLaborCosts.length, total: laborCostsTotal },
      projectExpenses: { count: filteredProjectExpenses.length, total: projectExpensesTotal }
    };
  };

  const handleViewLaborCost = (laborCost) => {
    navigate(`/labor-costs?project=${projectVuid}&laborCost=${laborCost.vuid}`);
  };

  const handleViewProjectExpense = (expense) => {
    navigate(`/project-expenses?project=${projectVuid}&expense=${expense.vuid}`);
  };

  const handleCreateCommitmentChangeOrder = () => {
    if (commitmentChangeOrders.length === 0) {
      // No commitment change orders exist, go to create form
      navigate(`/commitment-change-orders?project=${projectVuid}&create=true`);
    } else {
      // Commitment change orders exist, go to the list page
      navigate(`/commitment-change-orders?project=${projectVuid}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Integration functions
  const fetchIntegrations = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/integrations`);
      
      // Filter integrations to only show those that have 'projects' enabled
      const filteredIntegrations = response.data.filter(integration => 
        integration.enabled_objects && integration.enabled_objects.projects === true
      );
      
      setIntegrations(filteredIntegrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const handleSendToIntegration = (commitment) => {
    setSelectedCommitment(commitment);
    setSelectedIntegration(null);
    setShowIntegrationModal(true);
    fetchIntegrations();
  };

  const handleSendCommitmentToIntegration = async () => {
    if (!selectedIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      // Here you would implement the logic to send the commitment to the selected integration
      console.log(`Sending commitment ${selectedCommitment.commitment_number} to integration ${selectedIntegration.integration_name}`);
      
      // For now, just show a success message
      alert(`Commitment ${selectedCommitment.commitment_number} sent to ${selectedIntegration.integration_name} successfully!`);
      
      // Close the modal
      setShowIntegrationModal(false);
      setSelectedCommitment(null);
      setSelectedIntegration(null);
    } catch (error) {
      console.error('Error sending commitment to integration:', error);
      alert('Error sending commitment to integration');
    }
  };

  const handleRetrieveModal = () => {
    setRetrieveIntegration(null);
    setShowRetrieveModal(true);
    fetchIntegrations();
  };

  const handleRetrieveCommitments = async () => {
    if (!retrieveIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      // Here you would implement the logic to retrieve commitments from the selected integration
      console.log(`Retrieving commitments from integration ${retrieveIntegration.integration_name}`);
      
      // For now, just show a success message
      alert(`Commitments retrieved from ${retrieveIntegration.integration_name} successfully!`);
      
      // Close the modal
      setShowRetrieveModal(false);
      setRetrieveIntegration(null);
    } catch (error) {
      console.error('Error retrieving commitments from integration:', error);
      alert('Error retrieving commitments from integration');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vermillion-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested project could not be found.'}</p>
          
          <button
            onClick={() => navigate('/projects')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Projects
          </button>
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
                {project.project_name}
              </h1>
              <p className="text-xl text-gray-600">
                Project Number: {project.project_number}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate(`/projects/${project.vuid}/settings`)}
                className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Settings
              </button>
              <button
                onClick={handleEditProject}
                className="bg-black hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Edit Project
              </button>
              <button
                onClick={() => navigate('/projects')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>

        {/* WIP Report Summary Tiles */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Summary</h2>
            
            {/* Accounting Period Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Accounting Period:</label>
              <select
                value={selectedAccountingPeriod}
                onChange={(e) => setSelectedAccountingPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Periods</option>
                {accountingPeriods
                  .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                  })
                  .map(period => (
                    <option key={period.vuid} value={period.vuid}>
                      {period.month}/{period.year} {period.status === 'closed' ? '(Closed)' : ''}
                    </option>
                  ))}
              </select>
            </div>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
            {/* Total Contract */}
            <div className="bg-blue-50 rounded-lg p-8 text-center min-w-0 overflow-hidden">
              <div className="text-3xl font-bold text-blue-600 mb-3">
                {formatCurrency(getWipMetrics().wipEntry?.total_contract_amount || 0)}
              </div>
              <div className="text-blue-800 font-medium text-base leading-tight break-words">Total Contract</div>
              <div className="text-blue-500 text-xs mt-1">Original + Change Orders</div>
            </div>

            {/* Current Budget */}
            <div className="bg-blue-50 rounded-lg p-8 text-center min-w-0 overflow-hidden">
              <div className="text-3xl font-bold text-blue-600 mb-3">
                {formatCurrency(getWipMetrics().wipEntry?.current_budget_amount || 0)}
              </div>
              <div className="text-blue-800 font-medium text-base leading-tight break-words">Current Budget</div>
              <div className="text-blue-500 text-xs mt-1">Original + Internal Changes</div>
            </div>

            {/* Costs to Date */}
            <div 
              className="bg-blue-50 rounded-lg p-8 text-center min-w-0 overflow-hidden cursor-pointer hover:bg-blue-100 transition-colors duration-200"
              onClick={() => navigate(`/ap-invoices?project=${projectVuid}`)}
              title="Click to view AP Invoices"
            >
              <div className="text-3xl font-bold text-blue-600 mb-3">
                {formatCurrency(getWipMetrics().wipEntry?.costs_to_date || 0)}
            </div>
              <div className="text-blue-800 font-medium text-base leading-tight break-words">Costs to Date</div>
              <div className="text-blue-500 text-xs mt-1">{getAccountingPeriodDisplay(selectedAccountingPeriod)}</div>
            </div>

            {/* Billed to Date */}
            <div 
              className="bg-blue-50 rounded-lg p-8 text-center min-w-0 overflow-hidden cursor-pointer hover:bg-blue-100 transition-colors duration-200"
              onClick={() => navigate(`/project-billing?project=${projectVuid}`)}
              title="Click to view Project Billings"
            >
              <div className="text-3xl font-bold text-blue-600 mb-3">
                {formatCurrency(getWipMetrics().wipEntry?.project_billings || 0)}
            </div>
              <div className="text-blue-800 font-medium text-base leading-tight break-words">Billed to Date</div>
              <div className="text-blue-500 text-xs mt-1">{getAccountingPeriodDisplay(selectedAccountingPeriod)}</div>
            </div>

            {/* % Complete */}
            <div className="bg-blue-50 rounded-lg p-8 text-center min-w-0 overflow-hidden">
              <div className="text-3xl font-bold text-blue-600 mb-3">
                {getWipMetrics().wipEntry?.percent_complete ? `${getWipMetrics().wipEntry.percent_complete.toFixed(1)}%` : '0%'}
            </div>
              <div className="text-blue-800 font-medium text-base leading-tight break-words">% Complete</div>
              <div className="text-blue-500 text-xs mt-1">Project Progress</div>
            </div>

            {/* Earned Revenue */}
            <div className="bg-blue-50 rounded-lg p-8 text-center min-w-0 overflow-hidden">
              <div className="text-3xl font-bold text-blue-600 mb-3">
                {formatCurrency(getWipMetrics().revenueRecognized || 0)}
              </div>
              <div className="text-blue-800 font-medium text-base leading-tight break-words">Earned Revenue</div>
              <div className="text-blue-500 text-xs mt-1">% Complete × Total Contract</div>
            </div>

            {/* Profit */}
            <div className="bg-blue-50 rounded-lg p-8 text-center min-w-0 overflow-hidden">
              <div className={`text-3xl font-bold mb-3 ${(() => {
                const wip = getWipMetrics();
                const profit = (wip.wipEntry?.total_contract_amount || 0) - (wip.wipEntry?.current_budget_amount || 0);
                return profit > 0 ? 'text-blue-600' : profit < 0 ? 'text-red-600' : 'text-gray-600';
              })()}`}>
                {(() => {
                  const wip = getWipMetrics();
                  const profit = (wip.wipEntry?.total_contract_amount || 0) - (wip.wipEntry?.current_budget_amount || 0);
                  return formatCurrency(profit);
                })()}
              </div>
              <div className="text-blue-800 font-medium text-base leading-tight break-words">Profit</div>
              <div className="text-blue-500 text-xs mt-1">Contract - Budget</div>
            </div>

            {/* Over/Under Billing */}
            <div className="bg-blue-50 rounded-lg p-8 text-center min-w-0 overflow-hidden">
              <div className={`text-3xl font-bold mb-3 ${(() => {
                const wip = getWipMetrics();
                const billedAmount = wip.projectBillings || 0;
                const earnedRevenue = wip.revenueRecognized || 0;
                const overUnder = billedAmount - earnedRevenue;
                return overUnder > 0 ? 'text-green-600' : overUnder < 0 ? 'text-red-600' : 'text-blue-600';
              })()}`}>
                {(() => {
                  const wip = getWipMetrics();
                  const billedAmount = wip.projectBillings || 0;
                  const earnedRevenue = wip.revenueRecognized || 0;
                  const overUnder = billedAmount - earnedRevenue;
                  return formatCurrency(overUnder);
                })()}
              </div>
              <div className="text-blue-800 font-medium text-base leading-tight break-words">Over/Under Billing</div>
              <div className="text-blue-500 text-xs mt-1">{getAccountingPeriodDisplay(selectedAccountingPeriod)}</div>
            </div>
          </div>
        </div>

        {/* Project Overview Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Status</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Start Date</h3>
                              <p className="text-lg font-semibold text-gray-900">{formatDate(project.start_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">End Date</h3>
                              <p className="text-lg font-semibold text-gray-900">{formatDate(project.end_date)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Created</h3>
              <p className="text-lg font-semibold text-gray-900">{formatDate(project.created_at)}</p>
            </div>
          </div>
          
          {project.description && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Description</h3>
              <p className="text-gray-900">{project.description}</p>
            </div>
          )}
          
          {/* Labor Cost Method Setting */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Labor Cost Method</h3>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                project.labor_cost_method === 'default' 
                  ? 'bg-gray-100 text-gray-800' 
                  : project.labor_cost_method === 'actuals'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {project.labor_cost_method === 'default' 
                  ? 'Default (Use GL Setting)' 
                  : project.labor_cost_method === 'actuals'
                  ? 'Actuals (Use Labor Cost Amount)'
                  : 'Charge Rate (Employee Rate × Hours)'
                }
              </span>
              <button
                onClick={() => {/* TODO: Add edit functionality */}}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Commitments Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Commitments</h2>
            <div className="flex space-x-4">
            <button
              onClick={() => navigate(`/commitments?project=${project.vuid}&create=true`)}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              + Add Commitment
            </button>
              <button
                onClick={handleCreateCommitmentChangeOrder}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                + Create Change Order
            </button>
            </div>
          </div>
          
          {commitments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No commitments found</p>
              <p className="text-sm">Create the first commitment for this project</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commitments.map((commitment) => (
                    <tr key={commitment.vuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewCommitment(commitment)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commitment.vendor?.vendor_name || 'Vendor'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commitment.commitment_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commitment.commitment_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(commitment.original_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(commitment.commitment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commitment.status)}`}>
                          {commitment.status.charAt(0).toUpperCase() + commitment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendToIntegration(commitment);
                          }}
                          className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg transition-colors shadow-sm"
                          title="Send to integration"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                          {commitment.change_orders && commitment.change_orders.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/commitment-change-orders?commitment=${commitment.vuid}`);
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors shadow-sm"
                              title={`View ${commitment.change_orders.length} Commitment Change Order${commitment.change_orders.length === 1 ? '' : 's'}`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Project Budgets Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Project Budgets</h2>
            <div className="flex space-x-4">
            <button
              onClick={() => navigate(`/project-budgets?project=${project.vuid}&create=true`)}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              + Add Budget
            </button>
              <button
                onClick={() => navigate(`/projects/${project.vuid}/buyout-forecasting`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Buyout & Forecasting
              </button>
              <button
                onClick={() => navigate(`/internal-change-orders?project=${project.vuid}&create=true`)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                + Create Internal Change Order
            </button>
            </div>
          </div>
          
          {projectBudgets.length === 0 ? (
            <p className="text-gray-500">No project budgets found for this project.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectBudgets.map(budget => (
                    <tr key={budget.vuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewBudget(budget)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {budget.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          budget.budget_type === 'original' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {budget.budget_type.charAt(0).toUpperCase() + budget.budget_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {budget.budget_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(budget.total_amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          budget.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {budget.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          {internalChangeOrders.some(ico => ico.budget_vuid === budget.vuid) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/internal-change-orders?project=${project.vuid}&budget=${budget.vuid}`);
                              }}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                              title="View Internal Change Orders"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Purple Change Orders Button */}
          {internalChangeOrders.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => navigate(`/internal-change-orders?project=${project.vuid}`)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                title="View Internal Change Orders"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Change Orders
              </button>
            </div>
          )}
        </div>

        {/* Project Contracts Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Contracts</h2>
            <div className="flex space-x-4">
            <button
              onClick={() => navigate(`/project-contracts?project=${project.vuid}&create=true`)}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              + Add Contract
            </button>
              <button
                onClick={() => navigate(`/external-change-orders?project=${project.vuid}&create=true`)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                + Create External Change Order
            </button>
            </div>
          </div>
          
          {projectContracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No contracts found</p>
              <p className="text-sm">Create the first contract for this project</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectContracts.map((contract) => (
                    <tr key={contract.vuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewContract(contract)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {contract.contract_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.customer?.customer_name || contract.customer_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(contract.total_amount || contract.contract_amount || contract.amount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(contract.contract_date) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.contract_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          {externalChangeOrders.some(eco => eco.contract_vuid === contract.vuid) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/external-change-orders?project=${project.vuid}&contract=${contract.vuid}`);
                              }}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                              title="View External Change Orders"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Purple Change Orders Button */}
          {externalChangeOrders.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => navigate(`/external-change-orders?project=${project.vuid}`)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                title="View External Change Orders"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Change Orders
              </button>
            </div>
          )}
        </div>

        {/* Project Billings Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Billings</h2>
            <button
              onClick={() => navigate(`/project-billing?project=${project.vuid}&create=true`)}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              + Add Billing
            </button>
          </div>
          
          {projectBillings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No project billings found</p>
              <p className="text-sm">Create the first billing for this project</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectBillings.map((billing) => (
                    <tr key={billing.vuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewBilling(billing)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {billing.billing_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {billing.contract?.contract_number || 'No contract'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {billing.customer?.customer_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(billing.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(billing.billing_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(billing.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(billing.status)}`}>
                          {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AP Invoices Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">AP Invoices</h2>
            <button
              onClick={() => navigate(`/ap-invoices?project=${project.vuid}&create=true`)}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              + Add Invoice
            </button>
          </div>
          
          {getFilteredCosts(apInvoices, selectedAccountingPeriod).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No AP invoices found</p>
              <p className="text-sm">Create the first AP invoice for this project</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accounting Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredCosts(apInvoices, selectedAccountingPeriod).map((invoice) => (
                    <tr key={invoice.vuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewInvoice(invoice)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.vendor?.vendor_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAccountingPeriodDisplay(invoice.accounting_period_vuid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Labor Costs Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Labor Costs</h2>
            <button
              onClick={handleViewLaborCosts}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              + Add Labor Cost
            </button>
          </div>
          
          {getFilteredCosts(laborCosts, selectedAccountingPeriod).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <p className="text-lg">No labor costs found</p>
              <p className="text-sm">Create the first labor cost entry for this project</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accounting Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payroll Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredCosts(laborCosts, selectedAccountingPeriod).map((laborCost) => (
                    <tr key={laborCost.vuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewLaborCost(laborCost)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {laborCost.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {laborCost.cost_code?.code || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {laborCost.cost_type?.cost_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(laborCost.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAccountingPeriodDisplay(laborCost.accounting_period_vuid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(laborCost.payroll_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(laborCost.status)}`}>
                          {laborCost.status.charAt(0).toUpperCase() + laborCost.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Project Expenses Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Expenses</h2>
            <button
              onClick={handleViewProjectExpenses}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              + Add Expense
            </button>
          </div>
          
          {getFilteredCosts(projectExpenses, selectedAccountingPeriod).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <p className="text-lg">No project expenses found</p>
              <p className="text-sm">Create the first expense entry for this project</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Code/Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor/Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accounting Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredCosts(projectExpenses, selectedAccountingPeriod).map((expense) => (
                    <tr key={expense.vuid} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewProjectExpense(expense)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {expense.expense_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{expense.cost_code?.code || 'N/A'}</div>
                        <div className="text-gray-500">{expense.cost_type?.cost_type || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.vendor && (
                          <div>{expense.vendor.vendor_name}</div>
                        )}
                        {expense.employee && (
                          <div>{expense.employee.employee_name}</div>
                        )}
                        {!expense.vendor && !expense.employee && (
                          <div className="text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAccountingPeriodDisplay(expense.accounting_period_vuid)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Integration Modal */}
        {showIntegrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Send Commitment to Integration
                </h2>
                <button
                  onClick={() => {
                    setShowIntegrationModal(false);
                    setSelectedCommitment(null);
                    setSelectedIntegration(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Commitment Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Commitment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Number:</span>
                    <p className="text-gray-900">{selectedCommitment?.commitment_number}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Vendor:</span>
                    <p className="text-gray-900">{selectedCommitment?.vendor?.vendor_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Amount:</span>
                    <p className="text-gray-900">{formatCurrency(selectedCommitment?.original_amount)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <p className="text-gray-900 capitalize">{selectedCommitment?.status}</p>
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
                    <p className="text-sm">Create an integration first to send commitments to external systems.</p>
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
                    setSelectedCommitment(null);
                    setSelectedIntegration(null);
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCommitmentToIntegration}
                  disabled={!selectedIntegration}
                  className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                    selectedIntegration
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Send to Integration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Retrieve Commitments Modal */}
        {showRetrieveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Retrieve Commitments from Integration
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
                      Select an integration to retrieve commitments from external systems. This will import commitment data 
                      and create new commitment records in your system.
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
                    <p className="text-sm">Create an integration first to retrieve commitments from external systems.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {integrations.map((integration) => (
                      <div
                        key={integration.vuid}
                        onClick={() => setRetrieveIntegration(integration)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          retrieveIntegration?.vuid === integration.vuid
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
                            {retrieveIntegration?.vuid === integration.vuid && (
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
                    setShowRetrieveModal(false);
                    setRetrieveIntegration(null);
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetrieveCommitments}
                  disabled={!retrieveIntegration}
                  className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                    retrieveIntegration
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Retrieve Commitments
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
