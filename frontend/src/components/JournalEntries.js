import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const JournalEntries = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinesModal, setShowLinesModal] = useState(false);
  const [showQBOExportModal, setShowQBOExportModal] = useState(false);
  const [showAccountingExportModal, setShowAccountingExportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [qboExportLoading, setQboExportLoading] = useState(false);
  const [qboExportResult, setQboExportResult] = useState(null);
  const [qboConnectionStatus, setQboConnectionStatus] = useState('disconnected');
  const [qboCompanyInfo, setQboCompanyInfo] = useState(null);
  const [qboConnectionLoading, setQboConnectionLoading] = useState(false);
  const [exportStep, setExportStep] = useState(1); // 1: Select Accounting Period, 2: Select Projects, 3: Select Data Types, 4: Export
  const [csvExportLoading, setCsvExportLoading] = useState(false);
  const [selectedAccountingPeriod, setSelectedAccountingPeriod] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState({
    journals: false,
    ap_invoices: false,
    project_billings: false
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    project_vuid: '',
    accounting_period_vuid: '',
    reference_type: ''
  });
  
  // Form data for create/edit
  const [formData, setFormData] = useState({
    accounting_period_vuid: '',
    project_vuid: '',
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference_type: '',
    reference_vuid: ''
  });
  
  // Line items for create/edit
  const [lineItems, setLineItems] = useState([
    { line_number: 1, gl_account_vuid: '', description: '', debit_amount: 0, credit_amount: 0 }
  ]);
  
  // Reference data
  const [projects, setProjects] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);
  
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const location = useLocation();
  const navigate = useNavigate();

  // Get context from URL parameters if available
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectVuid = searchParams.get('project_vuid');
    const accountingPeriodVuid = searchParams.get('accounting_period_vuid');
    
    if (projectVuid) {
      setFilters(prev => ({ ...prev, project_vuid: projectVuid }));
      setFormData(prev => ({ ...prev, project_vuid: projectVuid }));
    }
    
    if (accountingPeriodVuid) {
      setFilters(prev => ({ ...prev, accounting_period_vuid: accountingPeriodVuid }));
    }
  }, [location]);

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [projectsRes, periodsRes, accountsRes] = await Promise.all([
          fetch(`${baseURL}/api/projects`),
          fetch(`${baseURL}/api/accounting-periods`),
          fetch(`${baseURL}/api/chartofaccounts`)
        ]);
        
        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (periodsRes.ok) setAccountingPeriods(await periodsRes.json());
        if (accountsRes.ok) setGlAccounts(await accountsRes.json());
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };
    
    fetchReferenceData();
  }, [baseURL]);

  // Set all projects as selected by default when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && selectedProjects.length === 0) {
      const allProjectVuids = projects.map(p => p.vuid);
      setSelectedProjects(allProjectVuids);
    }
  }, [projects, selectedProjects.length]);

  // Fetch journal entries
  useEffect(() => {
    fetchJournalEntries();
    testQBOConnection(); // Test QBO connection on component mount
  }, [filters, currentPage]);

  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${baseURL}/api/journal-entries?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setJournalEntries(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
        setError(null); // Clear error on success
      } else {
        setError('Failed to fetch journal entries');
      }
    } catch (error) {
      setError('Error fetching journal entries');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    try {
      // Validate line items
      const totalDebits = lineItems.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
      const totalCredits = lineItems.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        setError('Total debits must equal total credits');
        return;
      }
      
      // Create journal entry
      const entryResponse = await fetch(`${baseURL}/api/journal-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!entryResponse.ok) {
        throw new Error('Failed to create journal entry');
      }
      
      const entry = await entryResponse.json();
      
      // Create line items
      for (const line of lineItems) {
        if (line.gl_account_vuid && (line.debit_amount > 0 || line.credit_amount > 0)) {
          await fetch(`${baseURL}/api/journal-entries/${entry.vuid}/line-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(line)
          });
        }
      }
      
      setShowCreateModal(false);
      setFormData({
        accounting_period_vuid: '',
        project_vuid: '',
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        reference_type: '',
        reference_vuid: '',
        status: 'draft'
      });
      setLineItems([{ line_number: 1, gl_account_vuid: '', description: '', debit_amount: 0, credit_amount: 0 }]);
      fetchJournalEntries();
      
    } catch (error) {
      setError(`Error creating journal entry: ${error.message}`);
    }
  };


  const handleQBOExport = async () => {
    try {
      setQboExportLoading(true);
      setQboExportResult(null);
      
      // Get the current accounting period from selectedAccountingPeriod or filters
      const accountingPeriodVuid = selectedAccountingPeriod || filters.accounting_period_vuid;
      if (!accountingPeriodVuid) {
        setError('Please select an accounting period to export');
        return;
      }
      
      const requestBody = {
        accounting_period_vuid: accountingPeriodVuid
      };
      
      // Add project filter if selected
      if (filters.project_vuid) {
        requestBody.project_vuid = filters.project_vuid;
      }
      
      const response = await fetch(`${baseURL}/api/mock-quickbooks-online/journal-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const result = await response.json();
        setQboExportResult(result);
        setShowQBOExportModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to export to QuickBooks Online');
      }
    } catch (error) {
      setError('Error exporting to QuickBooks Online');
      console.error('Error:', error);
    } finally {
      setQboExportLoading(false);
    }
  };

  const handleQBOInvoiceExport = async () => {
    try {
      setQboExportLoading(true);
      setQboExportResult(null);
      
      // Get the current accounting period from selectedAccountingPeriod or filters
      const accountingPeriodVuid = selectedAccountingPeriod || filters.accounting_period_vuid;
      if (!accountingPeriodVuid) {
        setError('Please select an accounting period to export');
        return;
      }
      
      const requestBody = {
        accounting_period_vuid: accountingPeriodVuid
      };
      
      // Add project filter if selected
      if (filters.project_vuid) {
        requestBody.project_vuid = filters.project_vuid;
      }
      
      const response = await fetch(`${baseURL}/api/mock-quickbooks-online/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const result = await response.json();
        setQboExportResult(result);
        setShowQBOExportModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to export invoices to QuickBooks Online');
      }
    } catch (error) {
      setError('Error exporting invoices to QuickBooks Online');
      console.error('Error:', error);
    } finally {
      setQboExportLoading(false);
    }
  };

  const handleQBOProjectBillingExport = async () => {
    try {
      setQboExportLoading(true);
      setQboExportResult(null);
      
      // Get the current accounting period from selectedAccountingPeriod or filters
      const accountingPeriodVuid = selectedAccountingPeriod || filters.accounting_period_vuid;
      if (!accountingPeriodVuid) {
        setError('Please select an accounting period to export');
        return;
      }
      
      const requestBody = {
        accounting_period_vuid: accountingPeriodVuid
      };
      
      // Add project filter if selected
      if (filters.project_vuid) {
        requestBody.project_vuid = filters.project_vuid;
      }
      
      const response = await fetch(`${baseURL}/api/mock-quickbooks-online/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const result = await response.json();
        setQboExportResult(result);
        setShowQBOExportModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to export project billings to QuickBooks Online');
      }
    } catch (error) {
      setError('Error exporting project billings to QuickBooks Online');
      console.error('Error:', error);
    } finally {
      setQboExportLoading(false);
    }
  };

  // QuickBooks Online Connection Functions
  const testQBOConnection = async () => {
    try {
      setQboConnectionLoading(true);
      const response = await fetch(`${baseURL}/api/qbo/test-connection`);
      const result = await response.json();
      
      if (result.success) {
        setQboConnectionStatus('connected');
        setQboCompanyInfo(result.company_name);
        if (result.mock_mode) {
          console.log('QBO Mock Mode: Connected to mock QuickBooks Online');
        }
      } else {
        setQboConnectionStatus('disconnected');
        console.warn('QBO Connection failed:', result.error);
        // Don't set main error state for QBO connection issues
      }
    } catch (error) {
      setQboConnectionStatus('disconnected');
      console.warn('QBO Connection test failed:', error);
      // Don't set main error state for QBO connection issues
    } finally {
      setQboConnectionLoading(false);
    }
  };

  const handleQBOConnect = async () => {
    try {
      setQboConnectionLoading(true);
      const response = await fetch(`${baseURL}/api/qbo/auth-url`);
      const result = await response.json();
      
      if (result.success) {
        // Open QuickBooks authorization in new window
        const authWindow = window.open(
          result.auth_url,
          'qbo-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        // Listen for the callback
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            // Test connection after window closes
            setTimeout(testQBOConnection, 1000);
          }
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to initiate QuickBooks connection');
    } finally {
      setQboConnectionLoading(false);
    }
  };


  const addLineItem = () => {
    const newLineNumber = lineItems.length + 1;
    setLineItems([...lineItems, {
      line_number: newLineNumber,
      gl_account_vuid: '',
      description: '',
      debit_amount: 0,
      credit_amount: 0
    }]);
  };

  // Accounting Export Modal Functions
  const openAccountingExportModal = () => {
    setShowAccountingExportModal(true);
    setExportStep(1);
    setSelectedAccountingPeriod(filters.accounting_period_vuid || '');
    setSelectedProjects([]);
    setSelectedDataTypes({
      journals: false,
      ap_invoices: false,
      project_billings: false
    });
    setQboExportResult(null);
  };

  const closeAccountingExportModal = () => {
    setShowAccountingExportModal(false);
    setExportStep(1);
    setSelectedAccountingPeriod('');
    setSelectedProjects([]);
    setSelectedDataTypes({
      journals: false,
      ap_invoices: false,
      project_billings: false
    });
    setQboExportResult(null);
  };

  const handleProjectSelection = (projectVuid) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectVuid)) {
        return prev.filter(vuid => vuid !== projectVuid);
      } else {
        return [...prev, projectVuid];
      }
    });
  };

  const handleDataTypeSelection = (dataType) => {
    setSelectedDataTypes(prev => ({
      ...prev,
      [dataType]: !prev[dataType]
    }));
  };

  const nextStep = () => {
    if (exportStep === 1) {
      if (!selectedAccountingPeriod) {
        setError('Please select an accounting period');
        return;
      }
      setExportStep(2);
    } else if (exportStep === 2) {
      if (selectedProjects.length === 0) {
        setError('Please select at least one project');
        return;
      }
      setExportStep(3);
    } else if (exportStep === 3) {
      const hasSelectedDataType = Object.values(selectedDataTypes).some(selected => selected);
      if (!hasSelectedDataType) {
        setError('Please select at least one data type to export');
        return;
      }
      setExportStep(4);
      executeAccountingExport();
    }
  };

  const prevStep = () => {
    if (exportStep > 1) {
      setExportStep(exportStep - 1);
    }
  };

  const executeAccountingExport = async () => {
    try {
      setQboExportLoading(true);
      setQboExportResult(null);
      
      const accountingPeriodVuid = selectedAccountingPeriod;
      if (!accountingPeriodVuid) {
        setError('Please select an accounting period to export');
        return;
      }

      const results = {
        accounting_period: null,
        integration_settings: null,
        journal_entries: [],
        invoices: []
      };

      // Determine which API endpoints to use based on connection status
      const isRealExport = qboConnectionStatus === 'connected' && !qboCompanyInfo?.includes('Mock');
      const apiPrefix = isRealExport ? '/api/qbo' : '/api/mock-quickbooks-online';

      // Export for each selected project
      for (const projectVuid of selectedProjects) {
        const requestBody = {
          accounting_period_vuid: accountingPeriodVuid,
          project_vuid: projectVuid
        };

        // Export journal entries if selected
        if (selectedDataTypes.journals) {
          const journalResponse = await fetch(`${baseURL}${apiPrefix}/journal-entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          if (journalResponse.ok) {
            const journalData = await journalResponse.json();
            if (!results.accounting_period) results.accounting_period = journalData.accounting_period;
            if (!results.integration_settings) results.integration_settings = journalData.integration_settings;
            results.journal_entries.push(...(journalData.journal_entries || []));
          }
        }

        // Export invoices if selected
        if (selectedDataTypes.ap_invoices || selectedDataTypes.project_billings) {
          const invoiceResponse = await fetch(`${baseURL}${apiPrefix}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          if (invoiceResponse.ok) {
            const invoiceData = await invoiceResponse.json();
            if (!results.accounting_period) results.accounting_period = invoiceData.accounting_period;
            if (!results.integration_settings) results.integration_settings = invoiceData.integration_settings;
            results.invoices.push(...(invoiceData.invoices || []));
          }
        }
      }

      setQboExportResult(results);
      setShowQBOExportModal(true);
      closeAccountingExportModal();
      
    } catch (error) {
      setError('Error exporting to accounting system');
      console.error('Error:', error);
    } finally {
      setQboExportLoading(false);
    }
  };

  // CSV Export Functions
  const handleCsvExport = async () => {
    try {
      setCsvExportLoading(true);
      
      // Get all journal entries (not just the current page)
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${baseURL}/api/journal-entries?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }
      
      const allEntries = await response.json();
      
      // Generate CSV content
      const csvContent = generateJournalEntriesCsv(allEntries);
      
      // Download the CSV file
      downloadCsvFile(csvContent, 'journal_entries.csv');
      
    } catch (error) {
      setError('Error exporting CSV: ' + error.message);
      console.error('Error:', error);
    } finally {
      setCsvExportLoading(false);
    }
  };

  const generateJournalEntriesCsv = (entries) => {
    // CSV headers
    const headers = [
      'Journal Number',
      'Entry Date',
      'Description',
      'Project Number',
      'Project Name',
      'Reference Type',
      'Total Debit',
      'Total Credit',
      'Line Items Count'
    ];
    
    // CSV rows
    const rows = entries.map(entry => [
      entry.journal_number || '',
      entry.entry_date || '',
      entry.description || '',
      entry.project?.project_number || 'N/A',
      entry.project?.project_name || 'N/A',
      getReferenceTypeLabel(entry.reference_type) || '',
      formatCurrency(entry.total_debit || 0),
      formatCurrency(entry.total_credit || 0),
      entry.line_items?.length || 0
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

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

  // Detailed CSV Export with Line Items
  const handleDetailedCsvExport = async () => {
    try {
      setCsvExportLoading(true);
      
      // Get all journal entries with line items
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await fetch(`${baseURL}/api/journal-entries?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }
      
      const allEntries = await response.json();
      
      // Generate detailed CSV content with line items
      const csvContent = generateDetailedJournalEntriesCsv(allEntries);
      
      // Download the CSV file
      downloadCsvFile(csvContent, 'journal_entries_detailed.csv');
      
    } catch (error) {
      setError('Error exporting detailed CSV: ' + error.message);
      console.error('Error:', error);
    } finally {
      setCsvExportLoading(false);
    }
  };

  const handleDeletePeriodJournalEntries = async () => {
    if (!filters.accounting_period_vuid) {
      alert('Please select an accounting period first');
      return;
    }

    // Check if any journal entries in this period have been exported
    const exportedEntries = journalEntries.filter(entry => entry.exported_to_accounting);
    if (exportedEntries.length > 0) {
      alert(`Cannot delete journal entries for this period. ${exportedEntries.length} journal entry(ies) have been exported and cannot be deleted.`);
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ALL journal entries and journal entry lines for this period? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(true);
      const baseURL = 'http://localhost:5001';
      
      console.log('Deleting journal entries for period:', filters.accounting_period_vuid);
      
      // Call the delete period journal entries API endpoint
      const response = await fetch(`${baseURL}/api/journal-entries/delete-period/${filters.accounting_period_vuid}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      console.log('Delete journal entries response:', result);
      
      if (result.success) {
        alert(`Successfully deleted ${result.deleted_entries} journal entries and ${result.deleted_lines} journal entry lines.`);
        // Refresh the journal entries list
        fetchJournalEntries();
      } else {
        alert(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Error deleting journal entries:', error);
      alert(`Error deleting journal entries: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const generateDetailedJournalEntriesCsv = (entries) => {
    // CSV headers for detailed export
    const headers = [
      'Journal Number',
      'Entry Date',
      'Description',
      'Project Number',
      'Project Name',
      'Reference Type',
      'Line Number',
      'Account Number',
      'Account Name',
      'Line Description',
      'Debit Amount',
      'Credit Amount'
    ];
    
    // CSV rows - one row per line item
    const rows = [];
    entries.forEach(entry => {
      if (entry.line_items && entry.line_items.length > 0) {
        entry.line_items.forEach(line => {
          rows.push([
            entry.journal_number || '',
            entry.entry_date || '',
            entry.description || '',
            entry.project?.project_number || 'N/A',
            entry.project?.project_name || 'N/A',
            getReferenceTypeLabel(entry.reference_type) || '',
            line.line_number || '',
            line.gl_account?.account_number || '',
            line.gl_account?.account_name || '',
            line.description || '',
            formatCurrency(line.debit_amount || 0),
            formatCurrency(line.credit_amount || 0)
          ]);
        });
      } else {
        // If no line items, still include the journal entry
        rows.push([
          entry.journal_number || '',
          entry.entry_date || '',
          entry.description || '',
            entry.project?.project_number || 'N/A',
            entry.project?.project_name || 'N/A',
            getReferenceTypeLabel(entry.reference_type) || '',
            '',
            '',
            '',
            '',
            '',
            ''
        ]);
      }
    });
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      const newLines = lineItems.filter((_, i) => i !== index);
      // Renumber lines
      newLines.forEach((line, i) => {
        line.line_number = i + 1;
      });
      setLineItems(newLines);
    }
  };

  const updateLineItem = (index, field, value) => {
    const newLines = [...lineItems];
    newLines[index][field] = value;
    
    // Ensure only one of debit or credit has a value
    if (field === 'debit_amount' && parseFloat(value) > 0) {
      newLines[index].credit_amount = 0;
    } else if (field === 'credit_amount' && parseFloat(value) > 0) {
      newLines[index].debit_amount = 0;
    }
    
    setLineItems(newLines);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };


  const getReferenceTypeLabel = (type) => {
    switch (type) {
      case 'ap_invoice': return 'AP Invoice';
      case 'project_billing': return 'Project Billing';
      case 'over_billing': return 'Over Billing';
      case 'under_billing': return 'Under Billing';
      case 'reversal': return 'Reversal';
      default: return type;
    }
  };

  const handlePreviewInvoice = async (entry) => {
    // Only show preview modal for AP invoice and AP retainage entries
    if (entry.reference_type !== 'ap_invoice' && entry.reference_type !== 'ap_invoice_retainage') {
      return;
    }

    setAuditLoading(true);
    setShowAuditModal(true);
    
    try {
      const baseURL = 'http://localhost:5001';
      
      // Fetch the AP invoice details
      const response = await fetch(`${baseURL}/api/ap-invoices/${entry.reference_vuid}`);
      if (response.ok) {
        const invoiceData = await response.json();
        setAuditData({
          journalEntry: entry,
          apInvoice: invoiceData
        });
      } else {
        setError('Failed to fetch AP invoice details for preview');
        setShowAuditModal(false);
      }
    } catch (err) {
      setError('Error fetching invoice data: ' + err.message);
      setShowAuditModal(false);
    } finally {
      setAuditLoading(false);
    }
  };

  const handlePreviewProjectBilling = async (entry) => {
    // Only show preview modal for project billing and project billing retainage entries
    if (entry.reference_type !== 'project_billing' && entry.reference_type !== 'project_billing_retainage') {
      return;
    }

    setAuditLoading(true);
    setShowAuditModal(true);
    
    try {
      const baseURL = 'http://localhost:5001';
      
      // Fetch the project billing details
      const response = await fetch(`${baseURL}/api/project-billings/${entry.reference_vuid}`);
      if (response.ok) {
        const billingData = await response.json();
        setAuditData({
          journalEntry: entry,
          projectBilling: billingData
        });
      } else {
        setError('Failed to fetch project billing details for preview');
        setShowAuditModal(false);
      }
    } catch (err) {
      setError('Error fetching billing data: ' + err.message);
      setShowAuditModal(false);
    } finally {
      setAuditLoading(false);
    }
  };

  const handlePreviewLaborCost = async (entry) => {
    // Only show preview modal for labor cost entries
    if (entry.reference_type !== 'labor_cost') {
      return;
    }

    setAuditLoading(true);
    setShowAuditModal(true);
    
    try {
      const baseURL = 'http://localhost:5001';
      
      // Fetch the labor cost details
      const response = await fetch(`${baseURL}/api/labor-costs/${entry.reference_vuid}`);
      if (response.ok) {
        const laborCostData = await response.json();
        setAuditData({
          journalEntry: entry,
          laborCost: laborCostData
        });
      } else {
        setError('Failed to fetch labor cost details for preview');
        setShowAuditModal(false);
      }
    } catch (err) {
      setError('Error fetching labor cost data: ' + err.message);
      setShowAuditModal(false);
    } finally {
      setAuditLoading(false);
    }
  };

  const handlePreviewProjectExpense = async (entry) => {
    // Only show preview modal for project expense entries
    if (entry.reference_type !== 'project_expense') {
      return;
    }

    setAuditLoading(true);
    setShowAuditModal(true);
    
    try {
      const baseURL = 'http://localhost:5001';
      
      // Fetch the project expense details
      const response = await fetch(`${baseURL}/api/project-expenses/${entry.reference_vuid}`);
      if (response.ok) {
        const expenseData = await response.json();
        setAuditData({
          journalEntry: entry,
          projectExpense: expenseData
        });
      } else {
        setError('Failed to fetch project expense details for preview');
        setShowAuditModal(false);
      }
    } catch (err) {
      setError('Error fetching expense data: ' + err.message);
      setShowAuditModal(false);
    } finally {
      setAuditLoading(false);
    }
  };

  const paginate = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
          <p className="mt-2 text-gray-600">Manage accounting journal entries and transactions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <select
                value={filters.project_vuid}
                onChange={(e) => setFilters({...filters, project_vuid: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.vuid} value={project.vuid}>
                    {project.project_number} - {project.project_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accounting Period</label>
              <select
                value={filters.accounting_period_vuid}
                onChange={(e) => setFilters({...filters, accounting_period_vuid: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Periods</option>
                {accountingPeriods.map(period => (
                  <option key={period.vuid} value={period.vuid}>
                    {period.month}/{period.year}
                  </option>
                ))}
              </select>
            </div>
            
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reference Type</label>
              <select
                value={filters.reference_type}
                onChange={(e) => setFilters({...filters, reference_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="ap_invoice">AP Invoice</option>
                <option value="project_billing">Project Billing</option>
                <option value="over_billing">Over Billing</option>
                <option value="under_billing">Under Billing</option>
                <option value="reversal">Reversal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Create Journal Entry
          </button>
          
          <button
            onClick={openAccountingExportModal}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            📊 Send to Accounting
          </button>

          <button
            onClick={handleCsvExport}
            disabled={csvExportLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
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
                📄 Export CSV
              </>
            )}
          </button>

          <button
            onClick={handleDetailedCsvExport}
            disabled={csvExportLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
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
                📋 Export Detailed CSV
              </>
            )}
          </button>

          {filters.accounting_period_vuid && (
            <button
              onClick={handleDeletePeriodJournalEntries}
              disabled={deleteLoading || journalEntries.some(entry => entry.exported_to_accounting)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={journalEntries.some(entry => entry.exported_to_accounting) ? 'Cannot delete period with exported journal entries' : 'Delete all journal entries for this period'}
            >
              {deleteLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  🗑️ Delete All Journal Entries
                </>
              )}
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Journal Entries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Journal #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {journalEntries
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((entry) => (
                  <tr key={entry.vuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.journal_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.entry_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.project?.project_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getReferenceTypeLabel(entry.reference_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(entry.line_items?.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0) || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {entry.exported_to_accounting && (
                          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 gap-1 font-medium">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Exported & Locked
                          </span>
                        )}
                        <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowLinesModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Lines
                        </button>
                        
                        {(entry.reference_type === 'ap_invoice' || entry.reference_type === 'ap_invoice_retainage') && (
                          <button
                            onClick={() => handlePreviewInvoice(entry)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Preview source AP invoice"
                          >
                            Preview Invoice
                          </button>
                        )}
                        
                        {(entry.reference_type === 'project_billing' || entry.reference_type === 'project_billing_retainage') && (
                          <button
                            onClick={() => handlePreviewProjectBilling(entry)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Preview source project billing"
                          >
                            Preview Billing
                          </button>
                        )}
                        
                        {entry.reference_type === 'labor_cost' && (
                          <button
                            onClick={() => handlePreviewLaborCost(entry)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Preview source labor cost"
                          >
                            Preview Labor
                          </button>
                        )}
                        
                        {entry.reference_type === 'project_expense' && (
                          <button
                            onClick={() => handlePreviewProjectExpense(entry)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Preview source project expense"
                          >
                            Preview Expense
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowEditModal(true);
                          }}
                          disabled={entry.exported_to_accounting}
                          className={`${
                            entry.exported_to_accounting 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-yellow-600 hover:text-yellow-900'
                          }`}
                          title={entry.exported_to_accounting ? 'Cannot edit exported journal entry' : 'Edit journal entry'}
                        >
                          Edit
                        </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, journalEntries.length)} of {journalEntries.length} results
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

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Journal Entry</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accounting Period</label>
                    <select
                      value={formData.accounting_period_vuid}
                      onChange={(e) => setFormData({...formData, accounting_period_vuid: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Period</option>
                      {accountingPeriods.map(period => (
                        <option key={period.vuid} value={period.vuid}>
                          {period.month}/{period.year}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                    <select
                      value={formData.project_vuid}
                      onChange={(e) => setFormData({...formData, project_vuid: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option key={project.vuid} value={project.vuid}>
                          {project.project_number} - {project.project_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Entry Date</label>
                    <input
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Type</label>
                    <select
                      value={formData.reference_type}
                      onChange={(e) => setFormData({...formData, reference_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="ap_invoice">AP Invoice</option>
                      <option value="project_billing">Project Billing</option>
                      <option value="over_billing">Over Billing</option>
                      <option value="under_billing">Under Billing</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference VUID</label>
                  <input
                    type="text"
                    value={formData.reference_vuid}
                    onChange={(e) => setFormData({...formData, reference_vuid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter reference VUID"
                  />
                </div>
                
                {/* Line Items */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Line Items</label>
                    <button
                      onClick={addLineItem}
                      className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded text-sm"
                    >
                      Add Line
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {lineItems.map((line, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1">
                          <span className="text-sm text-gray-500">{line.line_number}</span>
                        </div>
                        <div className="col-span-3">
                          <select
                            value={line.gl_account_vuid}
                            onChange={(e) => updateLineItem(index, 'gl_account_vuid', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            required
                          >
                            <option value="">Select Account</option>
                            {glAccounts.map(account => (
                              <option key={account.vuid} value={account.vuid}>
                                {account.account_number} - {account.account_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Description"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            value={line.debit_amount}
                            onChange={(e) => updateLineItem(index, 'debit_amount', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Debit"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            value={line.credit_amount}
                            onChange={(e) => updateLineItem(index, 'credit_amount', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Credit"
                          />
                        </div>
                        <div className="col-span-1">
                          {lineItems.length > 1 && (
                            <button
                              onClick={() => removeLineItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEntry}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  >
                    Create Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Lines Modal */}
        {showLinesModal && selectedEntry && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Journal Entry Lines - {selectedEntry.journal_number}
                </h3>
                
                <div className="mb-4">
                  <p><strong>Description:</strong> {selectedEntry.description}</p>
                  <p><strong>Date:</strong> {formatDate(selectedEntry.entry_date)}</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Line</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEntry.line_items?.map((line) => (
                        <tr key={line.vuid}>
                          <td className="px-4 py-2 text-sm text-gray-900">{line.line_number}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {line.gl_account?.account_number} - {line.gl_account?.account_name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{line.description}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {formatCurrency(line.debit_amount)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {formatCurrency(line.credit_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-right">
                  <button
                    onClick={() => setShowLinesModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QBO Export Results Modal */}
        {showQBOExportModal && qboExportResult && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  QuickBooks Online Export Results
                </h3>
                
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 font-medium">Export completed successfully!</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Accounting Period:</strong> {qboExportResult.accounting_period?.month}/{qboExportResult.accounting_period?.year}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Journal Entries:</strong> {qboExportResult.journal_entries?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Invoices:</strong> {qboExportResult.invoices?.length || 0}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Integration Settings</h4>
                    <p className="text-sm text-gray-600">
                      <strong>AP Integration:</strong> {qboExportResult.integration_settings?.ap_integration_method === 'invoice' ? 'Invoice Records' : 'Journal Entries'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>AR Integration:</strong> {qboExportResult.integration_settings?.ar_integration_method === 'invoice' ? 'Invoice Records' : 'Journal Entries'}
                    </p>
                  </div>
                </div>
                
                {qboExportResult.journal_entries && qboExportResult.journal_entries.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Exported Journal Entries</h4>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doc Number</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lines</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {qboExportResult.journal_entries.slice(0, 10).map((entry, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900">{entry.DocNumber}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{entry.TxnDate}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{entry.Line?.length || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {qboExportResult.journal_entries.length > 10 && (
                        <p className="px-3 py-2 text-sm text-gray-500 text-center">
                          ... and {qboExportResult.journal_entries.length - 10} more entries
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {qboExportResult.invoices && qboExportResult.invoices.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Exported Invoices</h4>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doc Number</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {qboExportResult.invoices.slice(0, 10).map((invoice, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900">{invoice.DocNumber}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{invoice.TxnDate}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(invoice.TotalAmt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {qboExportResult.invoices.length > 10 && (
                        <p className="px-3 py-2 text-sm text-gray-500 text-center">
                          ... and {qboExportResult.invoices.length - 10} more invoices
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowQBOExportModal(false);
                      setQboExportResult(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accounting Export Modal */}
        {showAccountingExportModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Send to Accounting System
                </h3>
                
                {/* QuickBooks Online Connection Status */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {qboConnectionStatus === 'connected' ? '✅' : '❌'}
                      </span>
                      <div>
                        <h4 className="text-md font-medium text-gray-900">
                          QuickBooks Online Connection
                        </h4>
                        <p className={`text-sm ${
                          qboConnectionStatus === 'connected' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {qboConnectionStatus === 'connected' 
                            ? `Connected to ${qboCompanyInfo || 'QuickBooks Online'}${qboCompanyInfo?.includes('Mock') ? ' (Mock Mode)' : ''}`
                            : 'Not connected to QuickBooks Online'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {qboConnectionStatus === 'connected' ? (
                        <button
                          onClick={testQBOConnection}
                          disabled={qboConnectionLoading}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {qboConnectionLoading ? 'Testing...' : 'Test Connection'}
                        </button>
                      ) : (
                        <button
                          onClick={handleQBOConnect}
                          disabled={qboConnectionLoading}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {qboConnectionLoading ? 'Connecting...' : 'Connect to QuickBooks'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Step 1: Select Accounting Period */}
                {exportStep === 1 && (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Step 1: Select Accounting Period</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose the accounting period for the data you want to export.
                      </p>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="accounting-period" className="block text-sm font-medium text-gray-700 mb-2">
                        Accounting Period
                      </label>
                      <select
                        id="accounting-period"
                        value={selectedAccountingPeriod}
                        onChange={(e) => setSelectedAccountingPeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Accounting Period</option>
                        {accountingPeriods.map(period => (
                          <option key={period.vuid} value={period.vuid}>
                            {period.month}/{period.year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Projects */}
                {exportStep === 2 && (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Step 2: Select Projects</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose which projects to export data for. You can select multiple projects.
                      </p>
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={() => {
                            const allProjectVuids = projects.map(p => p.vuid);
                            setSelectedProjects(allProjectVuids);
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedProjects([])}
                          className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      <div className="space-y-2 p-4">
                        {projects.map(project => (
                          <label key={project.vuid} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedProjects.includes(project.vuid)}
                              onChange={() => handleProjectSelection(project.vuid)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {project.project_number} - {project.project_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {project.client_name || 'No Client'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {selectedProjects.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>{selectedProjects.length}</strong> project{selectedProjects.length > 1 ? 's' : ''} selected
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Select Data Types */}
                {exportStep === 3 && (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Step 3: Select Data Types</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose which types of data to export to the accounting system.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedDataTypes.journals}
                          onChange={() => handleDataTypeSelection('journals')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            💰 Journal Entries
                          </div>
                          <div className="text-xs text-gray-500">
                            Export accounting journal entries and transactions
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedDataTypes.ap_invoices}
                          onChange={() => handleDataTypeSelection('ap_invoices')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            📄 AP Invoices
                          </div>
                          <div className="text-xs text-gray-500">
                            Export accounts payable invoices (vendor bills)
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-4 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedDataTypes.project_billings}
                          onChange={() => handleDataTypeSelection('project_billings')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            🏗️ Project Billings
                          </div>
                          <div className="text-xs text-gray-500">
                            Export accounts receivable invoices (customer billings)
                          </div>
                        </div>
                      </label>
                      
                    </div>
                  </div>
                )}

                {/* Step 4: Export Progress */}
                {exportStep === 4 && (
                  <div className="text-center">
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-700 mb-2">Step 4: Exporting Data</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Please wait while we export your data to the accounting system...
                      </p>
                    </div>
                    
                    <div className="flex justify-center">
                      <svg className="animate-spin h-8 w-8 text-green-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="mt-6 flex justify-between">
                  <div>
                    {exportStep > 1 && (
                      <button
                        onClick={prevStep}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Previous
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={closeAccountingExportModal}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    
                    {exportStep < 4 && (
                      <button
                        onClick={nextStep}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                      >
                        {exportStep === 1 ? 'Next' : exportStep === 2 ? 'Next' : 'Export Data'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Modal */}
        {showAuditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {auditData?.apInvoice ? 'Preview Invoice' : 
                     auditData?.projectBilling ? 'Preview Billing' :
                     auditData?.laborCost ? 'Preview Labor Cost' :
                     auditData?.projectExpense ? 'Preview Expense' : 'Preview'} - {auditData?.journalEntry?.journal_number}
                  </h3>
                  <button
                    onClick={() => setShowAuditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {auditLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  </div>
                ) : auditData ? (
                  <div className="space-y-6">
                    {/* Journal Entry Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Related Journal Entry</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Journal Number:</span>
                          <span className="ml-2 text-gray-900">{auditData.journalEntry.journal_number}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Entry Date:</span>
                          <span className="ml-2 text-gray-900">{formatDate(auditData.journalEntry.entry_date)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Description:</span>
                          <span className="ml-2 text-gray-900">{auditData.journalEntry.description}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Reference Type:</span>
                          <span className="ml-2 text-gray-900">{getReferenceTypeLabel(auditData.journalEntry.reference_type)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Total Amount:</span>
                          <span className="ml-2 text-gray-900">
                            {formatCurrency(auditData.journalEntry.line_items?.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0) || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Source Document Details */}
                    {auditData.apInvoice ? (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">AP Invoice Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Invoice Number:</span>
                            <span className="ml-2 text-gray-900">{auditData.apInvoice.invoice_number}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Invoice Date:</span>
                            <span className="ml-2 text-gray-900">{formatDate(auditData.apInvoice.invoice_date)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Vendor:</span>
                            <span className="ml-2 text-gray-900">{auditData.apInvoice.vendor?.vendor_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Total Amount:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(auditData.apInvoice.total_amount || 0)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Retainage %:</span>
                            <span className="ml-2 text-gray-900">{(auditData.apInvoice.retainage_percentage || 0).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Retainage Amount:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(auditData.apInvoice.retainage_amount || 0)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-gray-600">Description:</span>
                            <span className="ml-2 text-gray-900">{auditData.apInvoice.description || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : auditData.projectBilling ? (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Project Billing Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Billing Number:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectBilling.billing_number}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Billing Date:</span>
                            <span className="ml-2 text-gray-900">{formatDate(auditData.projectBilling.billing_date)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Project:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectBilling.project?.project_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Contract:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectBilling.contract?.contract_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Total Amount:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(auditData.projectBilling.total_amount || 0)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Retainage %:</span>
                            <span className="ml-2 text-gray-900">{(auditData.projectBilling.retainage_percentage || 0).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Retainage Amount:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(auditData.projectBilling.retainage_amount || 0)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Status:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectBilling.status || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-gray-600">Description:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectBilling.description || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : auditData.laborCost ? (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Labor Cost Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Employee:</span>
                            <span className="ml-2 text-gray-900">{auditData.laborCost.employee?.employee_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Payroll Date:</span>
                            <span className="ml-2 text-gray-900">{formatDate(auditData.laborCost.payroll_date)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Project:</span>
                            <span className="ml-2 text-gray-900">{auditData.laborCost.project?.project_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Cost Code:</span>
                            <span className="ml-2 text-gray-900">{auditData.laborCost.cost_code?.cost_code || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Cost Type:</span>
                            <span className="ml-2 text-gray-900">{auditData.laborCost.cost_type?.cost_type || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Hours:</span>
                            <span className="ml-2 text-gray-900">{auditData.laborCost.hours || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Rate:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(auditData.laborCost.rate || 0)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Amount:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(auditData.laborCost.amount || 0)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Status:</span>
                            <span className="ml-2 text-gray-900">{auditData.laborCost.status || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-gray-600">Memo:</span>
                            <span className="ml-2 text-gray-900">{auditData.laborCost.memo || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : auditData.projectExpense ? (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Project Expense Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Expense Number:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectExpense.expense_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Expense Date:</span>
                            <span className="ml-2 text-gray-900">{formatDate(auditData.projectExpense.expense_date)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Project:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectExpense.project?.project_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Vendor:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectExpense.vendor?.vendor_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Cost Code:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectExpense.cost_code?.cost_code || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Cost Type:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectExpense.cost_type?.cost_type || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Amount:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(auditData.projectExpense.amount || 0)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Status:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectExpense.status || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-gray-600">Description:</span>
                            <span className="ml-2 text-gray-900">{auditData.projectExpense.description || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Line Items */}
                    {auditData.apInvoice?.line_items && auditData.apInvoice.line_items.length > 0 && (
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Invoice Line Items</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line #</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Code</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Type</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {auditData.apInvoice.line_items.map((line, index) => (
                                <tr key={line.vuid || index}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{line.line_number || index + 1}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900">{line.description || 'N/A'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{line.cost_code?.cost_code || 'N/A'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{line.cost_type?.cost_type || 'N/A'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(line.amount || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {auditData.projectBilling?.line_items && auditData.projectBilling.line_items.length > 0 && (
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Billing Line Items</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line #</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Code</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Type</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Amount</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Billed to Date</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Billing</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Retention Held</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {auditData.projectBilling.line_items.map((line, index) => (
                                <tr key={line.vuid || index}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{line.line_number || index + 1}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900">{line.description || 'N/A'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{line.cost_code?.cost_code || 'N/A'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{line.cost_type?.cost_type || 'N/A'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(line.contract_amount || 0)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(line.billed_to_date || 0)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(line.actual_billing_amount || 0)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(line.retention_held || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No source data available
                  </div>
                )}

                {/* Modal Actions */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowAuditModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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

export default JournalEntries;
