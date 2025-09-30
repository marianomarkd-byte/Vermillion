import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Add debugging for axios
console.log('Axios version:', axios.VERSION);
console.log('Axios defaults:', axios.defaults);

const WIP = () => {
  const navigate = useNavigate();
  const [wipData, setWipData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [projects, setProjects] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [csvExportLoading, setCsvExportLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [eacEnabled, setEacEnabled] = useState(false);
  const [wipSettings, setWipSettings] = useState(null);
  const [showPendingCOModal, setShowPendingCOModal] = useState(false);
  const [selectedProjectForPCO, setSelectedProjectForPCO] = useState(null);
  const [selectedPeriodForPCO, setSelectedPeriodForPCO] = useState(null);
  const [pendingChangeOrders, setPendingChangeOrders] = useState([]);
  const [pcoLoading, setPcoLoading] = useState(false);

  useEffect(() => {
    console.log('WIP component mounted, calling fetchInitialData...');
    fetchInitialData();
    fetchWipSettings();
  }, []);

  // Refetch WIP data when selected period changes
  useEffect(() => {
    if (selectedPeriod) {
      console.log('Selected period changed, refetching WIP data...');
      fetchWipData(selectedPeriod);
    }
  }, [selectedPeriod]);

  const fetchWipSettings = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/wip-settings`);
      setWipSettings(response.data);
      
      // Check if EAC reporting is enabled
      const eacSetting = response.data.find(setting => setting.setting_name === 'use_eac_reporting');
      setEacEnabled(eacSetting && eacSetting.setting_value === 'true');
      
      console.log('WIP Settings loaded:', response.data);
      console.log('EAC Enabled:', eacSetting && eacSetting.setting_value === 'true');
    } catch (err) {
      console.error('Error fetching WIP settings:', err);
    }
  };

  const fetchPendingChangeOrders = async (projectVuid, periodVuid) => {
    try {
      setPcoLoading(true);
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/projects/${projectVuid}/pending-change-orders`, {
        params: {
          accounting_period_vuid: periodVuid
        }
      });
      // Filter to only show PCOs included in forecast
      const pcos = response.data.data || response.data || [];
      const includedPCOs = pcos.filter(pco => pco.is_included_in_forecast);
      setPendingChangeOrders(includedPCOs);
    } catch (err) {
      console.error('Error fetching pending change orders:', err);
      alert('Failed to load pending change orders: ' + (err.response?.data?.error || err.message));
    } finally {
      setPcoLoading(false);
    }
  };

  const handlePendingCOClick = (e, projectVuid, periodVuid) => {
    e.stopPropagation(); // Prevent row click
    setSelectedProjectForPCO(projectVuid);
    setSelectedPeriodForPCO(periodVuid);
    setShowPendingCOModal(true);
    fetchPendingChangeOrders(projectVuid, periodVuid);
  };

  const handleRemovePendingCO = async (pcoVuid) => {
    if (!window.confirm('Are you sure you want to remove this pending change order from the forecast?')) {
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      await axios.put(`${baseURL}/api/projects/${selectedProjectForPCO}/pending-change-orders/${pcoVuid}`, {
        is_included_in_forecast: false
      });
      
      // Refresh pending change orders list
      fetchPendingChangeOrders(selectedProjectForPCO, selectedPeriodForPCO);
      
      // Refresh WIP data to update totals
      fetchWipData(selectedPeriod);
      
      alert('Pending change order removed from forecast successfully');
    } catch (err) {
      console.error('Error removing pending change order:', err);
      alert('Failed to remove pending change order from forecast: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const baseURL = 'http://localhost:5001';
      
      console.log('Fetching projects...');
      // Fetch projects for filtering
      const projectsResponse = await axios.get(`${baseURL}/api/projects`);
      console.log('Projects response:', projectsResponse.data);
      setProjects(projectsResponse.data);

      console.log('Fetching accounting periods...');
      // Fetch accounting periods for filtering
      const periodsResponse = await axios.get(`${baseURL}/api/accounting-periods`);
      console.log('Accounting periods response:', periodsResponse.data);
      
      // Sort periods: open periods first, then closed periods by year/month descending
      const sortedPeriods = periodsResponse.data.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        if (a.status === 'open' && b.status === 'open') {
          // Sort open periods by year/month descending
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        }
        // Sort closed periods by year/month descending
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      setAccountingPeriods(sortedPeriods);
      
      // Set default selected period to the first open period only if no period is currently selected
      if (!selectedPeriod) {
        const openPeriod = sortedPeriods.find(p => p.status === 'open');
        if (openPeriod) {
          setSelectedPeriod(openPeriod.vuid);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError(`Failed to load initial data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchWipData = async (periodVuid) => {
    try {
      setLoading(true);
      const baseURL = 'http://localhost:5001';
      
      console.log('Fetching WIP data...');
      // Fetch actual WIP data with period filter if selected
      let wipUrl = `${baseURL}/api/wip`;
      if (periodVuid) {
        wipUrl += `?accounting_period_vuid=${periodVuid}`;
        console.log('Fetching WIP data with period filter:', periodVuid);
      } else {
        console.log('Fetching WIP data without period filter');
      }
      console.log('WIP URL:', wipUrl);
      const wipResponse = await axios.get(wipUrl);
      console.log('WIP response:', wipResponse.data);
      setWipData(wipResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching WIP data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(`Failed to load WIP data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig.key) return wipData;

    return [...wipData].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      return 0;
    });
  };

  const getFilteredData = () => {
    try {
      let filtered = getSortedData();

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(item =>
          item.project_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply project filter
      if (projectFilter !== 'all') {
        filtered = filtered.filter(item => item.project_number === projectFilter);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(item => item.status === statusFilter);
      }

      // Apply accounting period filter
      if (selectedPeriod) {
        const selectedPeriodData = accountingPeriods.find(p => p.vuid === selectedPeriod);
        if (selectedPeriodData) {
          filtered = filtered.filter(item => {
            // Show data from selected period and prior periods
            // This assumes the WIP data includes accounting period information
            // If not, we'll need to modify the backend to include this
            return true; // For now, show all data until we implement period filtering
          });
        }
      }

      return filtered;
    } catch (error) {
      console.error('Error in getFilteredData:', error);
      return wipData || [];
    }
  };

  const getCurrentData = () => {
    try {
      const filtered = getFilteredData();
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    } catch (error) {
      console.error('Error in getCurrentData:', error);
      return [];
    }
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // CSV Export functions
  const downloadCsvFile = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateJournalEntriesCsv = (previewData) => {
    const headers = [
      'Type', 'Reference Number', 'Project Name', 'Project Number', 
      'Account', 'Description', 'Debit Amount', 'Credit Amount'
    ];
    
    const rows = [];
    previewData.preview_entries.forEach(entry => {
      entry.line_items.forEach(lineItem => {
        rows.push([
          entry.type,
          entry.reference_number,
          entry.project_name,
          entry.project_number,
          lineItem.account,
          lineItem.description || '',
          lineItem.debit_amount || 0,
          lineItem.credit_amount || 0
        ]);
      });
    });
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const generateSummaryCsv = (previewData) => {
    const headers = [
      'Metric', 'Value'
    ];
    
    const rows = [
      ['Total Entries', previewData.preview_summary.total_entries],
      ['AP Invoices', previewData.preview_summary.ap_invoices],
      ['Project Billings', previewData.preview_summary.project_billings],
      ['Labor Costs', previewData.preview_summary.labor_costs || 0],
      ['Project Expenses', previewData.preview_summary.project_expenses || 0],
      ['Retainage Entries', previewData.preview_summary.retainage_entries || 0],
    ];
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const handleCsvExport = () => {
    if (!previewData) return;
    
    try {
      setCsvExportLoading(true);
      const csvContent = generateJournalEntriesCsv(previewData);
      const filename = `journal_entries_preview_${previewData.accounting_period.month}_${previewData.accounting_period.year}.csv`;
      downloadCsvFile(csvContent, filename);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setCsvExportLoading(false);
    }
  };

  const handleSummaryCsvExport = () => {
    if (!previewData) return;
    
    try {
      setCsvExportLoading(true);
      const csvContent = generateSummaryCsv(previewData);
      const filename = `journal_entries_summary_${previewData.accounting_period.month}_${previewData.accounting_period.year}.csv`;
      downloadCsvFile(csvContent, filename);
    } catch (error) {
      console.error('Error exporting summary CSV:', error);
    } finally {
      setCsvExportLoading(false);
    }
  };

  const formatPercent = (value) => {
    if (!value && value !== 0) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  const handlePreviewJournalEntries = async () => {
    if (!selectedPeriod) {
      alert('Please select an accounting period first');
      return;
    }

    try {
      setPreviewLoading(true);
      const baseURL = 'http://localhost:5001';
      
      console.log('Previewing journal entries for period:', selectedPeriod);
      
      // Call the preview API endpoint
      const response = await axios.post(`${baseURL}/api/journal-entries/preview`, {
        accounting_period_vuid: selectedPeriod
      });
      
      console.log('Preview response:', response.data);
      
      if (response.data.success) {
        setPreviewData(response.data);
        setShowPreviewModal(true);
      } else {
        alert(`Error previewing journal entries: ${response.data.error}`);
      }
    } catch (err) {
      console.error('Error previewing journal entries:', err);
      alert(`Failed to preview journal entries: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!selectedPeriod) {
      alert('Please select an accounting period first');
      return;
    }

    try {
      setLoading(true);
      const baseURL = 'http://localhost:5001';
      
      console.log('Closing month for period:', selectedPeriod);
      
      // Call the close month API endpoint
      const response = await axios.post(`${baseURL}/api/wip/close-month`, {
        accounting_period_vuid: selectedPeriod
      });
      
      console.log('Close month response:', response.data);
      
      if (response.data.success) {
        alert(`Month closed successfully! Created ${response.data.journal_entries_created} journal entries.`);
        // Refresh the data to show updated status
        fetchWipData(selectedPeriod);
        
        // Navigate to Journal Entries page filtered to the closed period
        const selectedPeriodData = accountingPeriods.find(p => p.vuid === selectedPeriod);
        if (selectedPeriodData) {
          navigate(`/journal-entries?accounting_period_vuid=${selectedPeriod}`);
        }
      } else {
        alert(`Error closing month: ${response.data.error}`);
      }
    } catch (err) {
      console.error('Error closing month:', err);
      alert(`Failed to close month: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const handleProjectClick = (projectVuid) => {
    navigate(`/projects/${projectVuid}`);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vermillion-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Project Contracts WIP Report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Project Contracts WIP Report</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              fetchInitialData();
              if (selectedPeriod) {
                fetchWipData(selectedPeriod);
              }
            }}
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
  const totalPages = Math.ceil((filteredData?.length || 0) / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 font-sans">
            Project Contracts WIP Report
            {eacEnabled && (
              <span className="ml-3 text-2xl text-indigo-600 font-semibold">
                (EAC Version)
              </span>
            )}
          </h1>
          <p className="text-lg text-gray-700 font-light">
            Track project progress, billings, and earned value across all project contracts
            {selectedPeriod && (
              <span className="block mt-2 text-vermillion-600 font-medium">
                Data as of: {(() => {
                  const period = accountingPeriods.find(p => p.vuid === selectedPeriod);
                  return period ? `${period.month}/${period.year} ${period.status === 'open' ? '(Open Period)' : '(Closed Period)'}` : '';
                })()}
              </span>
            )}
            {eacEnabled && (
              <span className="block mt-2 text-sm text-indigo-600 bg-indigo-50 inline-block px-4 py-2 rounded-lg">
                📊 Using Estimate at Completion (EAC) methodology - Percent complete calculated using EAC values from buyout & forecasting
              </span>
            )}
          </p>
        </div>

        {/* Close Month Buttons */}
        {selectedPeriod && (
          <div className="mb-6 flex justify-center gap-4">
            <button
              onClick={handlePreviewJournalEntries}
              disabled={previewLoading}
              className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg flex items-center gap-2"
            >
              {previewLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Previewing...
                </>
              ) : (
                <>
                  👁️ Preview Journal Entries
                </>
              )}
            </button>
            <button
              onClick={handleCloseMonth}
              className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg"
            >
              Close Month - Generate Journal Entries
            </button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-blue-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + (item.total_contract_amount || 0), 0))}
            </div>
            <div className="text-blue-800 font-medium text-xs leading-tight">Total Contract Value</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-green-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + (item.current_budget_amount || 0), 0))}
            </div>
            <div className="text-green-800 font-medium text-xs leading-tight">{eacEnabled ? 'Total Est. Cost at Completion' : 'Total Current Budget'}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-red-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + (item.costs_to_date || 0), 0))}
            </div>
            <div className="text-red-800 font-medium text-xs leading-tight">Total Costs to Date</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-orange-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + (item.total_project_change_orders || 0), 0))}
            </div>
            <div className="text-orange-800 font-medium text-xs leading-tight">Total Project Change Orders</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-blue-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + (item.project_billings || 0), 0))}
            </div>
            <div className="text-blue-800 font-medium text-xs leading-tight">Total Project Billings (Including Retainage)</div>
          </div>
          

          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-indigo-600 mb-1">
              {(filteredData || []).length}
            </div>
            <div className="text-indigo-800 font-medium text-xs leading-tight">Active Contracts</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-emerald-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + ((item.total_contract_amount || 0) - (item.current_budget_amount || 0)), 0))}
            </div>
            <div className="text-emerald-800 font-medium text-xs leading-tight">Total Profit</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-purple-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + (item.revenue_recognized || 0), 0))}
            </div>
            <div className="text-purple-800 font-medium text-xs leading-tight">Total Earned Revenue</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-red-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + (item.over_billing || 0), 0))}
            </div>
            <div className="text-red-800 font-medium text-xs leading-tight">Total Overbilled</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-blue-600 mb-1">
              {formatCurrency((filteredData || []).reduce((sum, item) => sum + (item.under_billing || 0), 0))}
            </div>
            <div className="text-blue-800 font-medium text-xs leading-tight">Total Underbilled</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="text-lg font-bold text-teal-600 mb-1">
              {(filteredData || []).length > 0 
                ? `${((filteredData || []).reduce((sum, item) => sum + (item.percent_complete || 0), 0) / (filteredData || []).length).toFixed(1)}%`
                : '0.0%'
              }
            </div>
            <div className="text-teal-800 font-medium text-xs leading-tight">Avg % Complete</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects, contracts, customers..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
              />
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Project
              </label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.vuid} value={project.project_number}>
                    {project.project_number} - {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            {/* Accounting Period Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                As Of Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  console.log('Period selection changed to:', e.target.value);
                  setSelectedPeriod(e.target.value);
                }}
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

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setProjectFilter('all');
                  setStatusFilter('all');
                  const openPeriod = accountingPeriods.find(p => p.status === 'open');
                  if (openPeriod) {
                    setSelectedPeriod(openPeriod.vuid);
                  }
                }}
                className="w-full px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* WIP Report Grid */}
        {currentData && currentData.length > 0 ? (
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('project_number')}>
                    <div className="flex items-center space-x-1">
                      <span>Project</span>
                      {getSortIcon('project_number')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('contract_number')}>
                    <div className="flex items-center space-x-1">
                      <span>Contract</span>
                      {getSortIcon('contract_number')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('original_contract_amount')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Original Amount</span>
                      {getSortIcon('original_contract_amount')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('change_orders')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Change Orders</span>
                      {getSortIcon('change_orders')}
                    </div>
                  </th>
                  {eacEnabled && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-indigo-50" onClick={() => handleSort('pending_change_orders_revenue')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Pending CO Revenue</span>
                        {getSortIcon('pending_change_orders_revenue')}
                      </div>
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_contract_amount')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total Contract</span>
                      {getSortIcon('total_contract_amount')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('original_budget_amount')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Original Budget</span>
                      {getSortIcon('original_budget_amount')}
                    </div>
                  </th>
                  {eacEnabled && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-indigo-50" onClick={() => handleSort('pending_change_orders_budget')}>
                      <div className="flex items-center justify-end space-x-1">
                        <span>Pending CO Budget</span>
                        {getSortIcon('pending_change_orders_budget')}
                      </div>
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('current_budget_amount')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>{eacEnabled ? 'Est. Cost at Completion' : 'Current Budget'}</span>
                      {getSortIcon('current_budget_amount')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('costs_to_date')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Costs to Date</span>
                      {getSortIcon('costs_to_date')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('project_billings')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Billed to Date</span>
                      {getSortIcon('project_billings')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('percent_complete')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>% Complete</span>
                      {getSortIcon('percent_complete')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('earned_revenue')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Earned Revenue</span>
                      {getSortIcon('earned_revenue')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('profit_margin_percent')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Profit Margin %</span>
                      {getSortIcon('profit_margin_percent')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('profit')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Profit</span>
                      {getSortIcon('profit')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('over_billing')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Overbilled</span>
                      {getSortIcon('over_billing')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('under_billing')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Underbilled</span>
                      {getSortIcon('under_billing')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(currentData || []).map((item) => (
                  <tr 
                    key={item.id || item.vuid || Math.random()} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleProjectClick(item.project_vuid)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 hover:text-vermillion-600 transition-colors">{item.project_number}</div>
                        <div className="text-sm text-gray-500">{item.project_name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{item.contract_number}</div>
                        <div className="text-sm text-gray-500">{item.contract_name}</div>
                        <div className="text-sm text-gray-400">{item.customer_name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.original_contract_amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.change_orders || 0)}
                    </td>
                    {eacEnabled && (
                      <td 
                        className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-indigo-700 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={(e) => handlePendingCOClick(e, item.project_vuid, selectedPeriod)}
                        title="Click to view pending change orders"
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>{formatCurrency(item.pending_change_orders_revenue || 0)}</span>
                          {(item.pending_change_orders_revenue || 0) > 0 && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(item.total_contract_amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.original_budget_amount)}
                    </td>
                    {eacEnabled && (
                      <td 
                        className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-indigo-700 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={(e) => handlePendingCOClick(e, item.project_vuid, selectedPeriod)}
                        title="Click to view pending change orders"
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>{formatCurrency(item.pending_change_orders_budget || 0)}</span>
                          {(item.pending_change_orders_budget || 0) > 0 && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(item.current_budget_amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.costs_to_date || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.project_billings || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.percent_complete >= 100 ? 'bg-green-100 text-green-800' :
                        item.percent_complete >= 75 ? 'bg-blue-100 text-blue-800' :
                        item.percent_complete >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {formatPercent(item.percent_complete)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.revenue_recognized || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (item.profit_margin_percent || 0) > 10 ? 'bg-green-100 text-green-800' :
                        (item.profit_margin_percent || 0) > 5 ? 'bg-yellow-100 text-yellow-800' :
                        (item.profit_margin_percent || 0) > 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercent(item.profit_margin_percent || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      <span className={`font-semibold ${
                        ((item.total_contract_amount || 0) - (item.current_budget_amount || 0)) > 0 ? 'text-green-600' :
                        ((item.total_contract_amount || 0) - (item.current_budget_amount || 0)) < 0 ? 'text-red-600' :
                        'text-gray-900'
                      }`}>
                        {formatCurrency((item.total_contract_amount || 0) - (item.current_budget_amount || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.over_billing || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(item.under_billing || 0)}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, (filteredData || []).length)} of {(filteredData || []).length} results
            </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
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
                          onClick={() => paginate(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            currentPage === page
                              ? 'bg-black text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
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
            <div className="text-gray-500 text-lg mb-4">No WIP data available</div>
            <button
              onClick={() => {
                if (selectedPeriod) {
                  fetchWipData(selectedPeriod);
                }
              }}
              className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}

        {/* Journal Entries Preview Modal */}
        {showPreviewModal && previewData && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Journal Entries Preview - {previewData.accounting_period.month}/{previewData.accounting_period.year}
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

                {/* Summary */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Preview Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Total Entries:</span>
                      <span className="ml-2 text-blue-900">{previewData.preview_summary.total_entries}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">AP Invoices:</span>
                      <span className="ml-2 text-blue-900">{previewData.preview_summary.ap_invoices}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Project Billings:</span>
                      <span className="ml-2 text-blue-900">{previewData.preview_summary.project_billings}</span>
                    </div>
                                <div>
              <span className="text-blue-700 font-medium">Labor Costs:</span>
              <span className="ml-2 text-blue-900">{previewData.preview_summary.labor_costs || 0}</span>
            </div>
            <div>
              <span className="text-purple-700 font-medium">Project Expenses:</span>
              <span className="ml-2 text-purple-900">{previewData.preview_summary.project_expenses || 0}</span>
            </div>
            <div>
              <span className="text-orange-700 font-medium">Retainage Entries:</span>
              <span className="ml-2 text-orange-900">{previewData.preview_summary.retainage_entries || 0}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Total Debits:</span>
              <span className="ml-2 text-green-900">{formatCurrency(previewData.preview_summary.total_debits || 0)}</span>
            </div>
            <div>
              <span className="text-red-700 font-medium">Total Credits:</span>
              <span className="ml-2 text-red-900">{formatCurrency(previewData.preview_summary.total_credits || 0)}</span>
            </div>
            {previewData.preview_summary.validation_errors && previewData.preview_summary.validation_errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-red-600 text-lg mr-2">⚠️</span>
                  <span className="text-red-800 font-semibold">Accounting Validation Errors</span>
                </div>
                <div className="text-red-700 text-sm">
                  {previewData.preview_summary.validation_errors.map((error, index) => (
                    <div key={index} className="mb-1">{error}</div>
                  ))}
                </div>
              </div>
            )}
            {previewData.preview_summary.is_balanced && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-600 text-lg mr-2">✅</span>
                  <span className="text-green-800 font-semibold">All journal entries are properly balanced</span>
                </div>
              </div>
            )}
                  </div>
                </div>

                {/* Preview Entries */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.preview_entries.map((entry, entryIndex) => (
                        <React.Fragment key={entryIndex}>
                          {/* Header row for the entry */}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap" rowSpan={entry.line_items.length}>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.type === 'AP Invoice' 
                                  ? 'bg-red-100 text-red-800' 
                                  : entry.type === 'Project Billing'
                                  ? 'bg-green-100 text-green-800'
                                  : entry.type === 'Labor Cost'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {entry.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium" rowSpan={entry.line_items.length}>
                              {entry.reference_number}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" rowSpan={entry.line_items.length}>
                              <div>
                                <div className="font-medium">{entry.project_name}</div>
                                <div className="text-gray-500 text-xs">{entry.project_number}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                              {entry.line_items[0].debit_amount > 0 ? (
                                <div>
                                  <div className="font-medium">{formatCurrency(entry.line_items[0].debit_amount)}</div>
                                  <div className="text-xs text-gray-500">{entry.line_items[0].account}</div>
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                              {entry.line_items[0].credit_amount > 0 ? (
                                <div>
                                  <div className="font-medium">{formatCurrency(entry.line_items[0].credit_amount)}</div>
                                  <div className="text-xs text-gray-500">{entry.line_items[0].account}</div>
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                          {/* Additional line items */}
                          {entry.line_items.slice(1).map((lineItem, lineIndex) => (
                            <tr key={`${entryIndex}-${lineIndex + 1}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                                {lineItem.debit_amount > 0 ? (
                                  <div>
                                    <div className="font-medium">{formatCurrency(lineItem.debit_amount)}</div>
                                    <div className="text-xs text-gray-500">{lineItem.account}</div>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                                {lineItem.credit_amount > 0 ? (
                                  <div>
                                    <div className="font-medium">{formatCurrency(lineItem.credit_amount)}</div>
                                    <div className="text-xs text-gray-500">{lineItem.account}</div>
                                  </div>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Modal Actions */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCsvExport}
                      disabled={csvExportLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center gap-2"
                    >
                      {csvExportLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          📄 Export Detailed CSV
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleSummaryCsvExport}
                      disabled={csvExportLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors flex items-center gap-2"
                    >
                      {csvExportLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          📊 Export Summary CSV
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Close Preview
                    </button>
                    <button
                      onClick={() => {
                        setShowPreviewModal(false);
                        handleCloseMonth();
                      }}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    >
                      Close Month & Generate Entries
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Change Orders Modal */}
        {showPendingCOModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Pending Change Orders Included in Forecast</h3>
                  <button 
                    onClick={() => setShowPendingCOModal(false)} 
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {pcoLoading ? (
                  <p className="text-center text-gray-600">Loading pending change orders...</p>
                ) : pendingChangeOrders.length === 0 ? (
                  <p className="text-center text-gray-600">No pending change orders included in forecast for this period.</p>
                ) : (
                  <div className="mt-4 max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingChangeOrders.map((pco) => (
                          <tr key={pco.vuid}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{pco.reference_number}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{pco.description}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(pco.revenue_amount || 0)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(pco.cost_amount || 0)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                              <button
                                onClick={() => handleRemovePendingCO(pco.vuid)}
                                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Remove from Forecast
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                    onClick={() => setShowPendingCOModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WIP;
