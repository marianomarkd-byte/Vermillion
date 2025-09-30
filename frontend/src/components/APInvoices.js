import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const APInvoices = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectVuid = searchParams.get('project');
  
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [projectCostCodes, setProjectCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [projectBudgets, setProjectBudgets] = useState([]);
  const [currentProjectBudgetLines, setCurrentProjectBudgetLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    invoice_number: '',
    vendor_vuid: '',
    project_vuid: projectVuid || '',
    commitment_vuid: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    accounting_period_vuid: '',
    description: '',
    status: 'pending'
  });
  const [createInvoiceLines, setCreateInvoiceLines] = useState([]);
  const [newLineData, setNewLineData] = useState({
    description: '',
    quantity: '',
    unit_price: '',
    total_amount: '',
    percent_complete: '',
    retainage_percentage: '',
    retention_held: '',
    retention_released: '',
    cost_code_vuid: '',
    cost_type_vuid: '',
    commitment_line_vuid: ''
  });
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState(projectVuid || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // View/Edit line items state
  const [showViewLinesModal, setShowViewLinesModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState(null);
  const [editingLineData, setEditingLineData] = useState({});
  
  // Edit invoice state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Preview journal entry state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Retrieve invoices state
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);
  const [procoreInvoices, setProcoreInvoices] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  


  const baseURL = 'http://localhost:5001';

  // Helper function to get all cost codes (global + project-specific)
  const getAllCostCodes = () => {
    return [...costCodes, ...projectCostCodes];
  };

  // Fetch budget lines for a specific project
  const fetchProjectBudgetLines = async (projectVuid) => {
    if (!projectVuid) {
      setCurrentProjectBudgetLines([]);
      return;
    }
    
    try {
      console.log('Fetching budget lines for project:', projectVuid);
      const response = await fetch(`${baseURL}/api/projects/${projectVuid}/budget-lines`);
      const data = await response.json();
      console.log('Fetched budget lines:', data);
      setCurrentProjectBudgetLines(data);
    } catch (error) {
      console.error('Error fetching project budget lines:', error);
      setCurrentProjectBudgetLines([]);
    }
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

  // Get cost codes and cost types that are budgeted for the selected project
  const getBudgetedCostCodes = (projectVuid) => {
    console.log('getBudgetedCostCodes called with projectVuid:', projectVuid);
    console.log('currentProjectBudgetLines:', currentProjectBudgetLines);
    
    if (!projectVuid) {
      console.log('No projectVuid provided, returning all cost codes');
      return costCodes;
    }
    
    // Use the current project's budget lines directly
    const projectBudgetLines = currentProjectBudgetLines;
    console.log('projectBudgetLines for project:', projectBudgetLines);
    
    // Get unique cost codes from budget lines
    const budgetedCostCodeVuids = [...new Set(projectBudgetLines.map(line => line.cost_code_vuid))];
    console.log('budgetedCostCodeVuids:', budgetedCostCodeVuids);
    
    const filteredCostCodes = getAllCostCodes().filter(code => budgetedCostCodeVuids.includes(code.vuid));
    console.log('filteredCostCodes:', filteredCostCodes);
    
    // If no budgeted cost codes found, return all cost codes as fallback
    if (filteredCostCodes.length === 0) {
      console.log('No budgeted cost codes found, returning all cost codes as fallback');
      return getAllCostCodes();
    }
    
    return filteredCostCodes;
  };

  const getBudgetedCostTypes = (projectVuid) => {
    console.log('getBudgetedCostTypes called with projectVuid:', projectVuid);
    console.log('currentProjectBudgetLines:', currentProjectBudgetLines);
    
    if (!projectVuid) {
      console.log('No projectVuid provided, returning all cost types');
      return costTypes;
    }
    
    // Use the current project's budget lines directly
    const projectBudgetLines = currentProjectBudgetLines;
    console.log('projectBudgetLines for cost types:', projectBudgetLines);
    
    // Get unique cost types from budget lines
    const budgetedCostTypeVuids = [...new Set(projectBudgetLines.map(line => line.cost_type_vuid))];
    console.log('budgetedCostTypeVuids:', budgetedCostTypeVuids);
    
    const filteredCostTypes = costTypes.filter(type => budgetedCostTypeVuids.includes(type.vuid));
    console.log('filteredCostTypes:', filteredCostTypes);
    
    // If no budgeted cost types found, return all cost types as fallback
    if (filteredCostTypes.length === 0) {
      console.log('No budgeted cost types found, returning all cost types as fallback');
      return costTypes;
    }
    
    return filteredCostTypes;
  };

  // Get valid cost code/type combinations for the selected project
  const getValidCostCodeTypeCombinations = (projectVuid) => {
    if (!projectVuid) return [];
    
    // Use the current project's budget lines directly
    const projectBudgetLines = currentProjectBudgetLines;
    
    // Create combinations of cost code and cost type
    const combinations = projectBudgetLines.map(line => ({
      cost_code_vuid: line.cost_code_vuid,
      cost_type_vuid: line.cost_type_vuid,
      cost_code: getAllCostCodes().find(c => c.vuid === line.cost_code_vuid),
      cost_type: costTypes.find(t => t.vuid === line.cost_type_vuid)
    }));
    
    return combinations;
  };

  // Toggle column visibility


  useEffect(() => {
    fetchData();
  }, []);

  // Pre-populate project if provided in URL
  useEffect(() => {
    if (projectVuid) {
      setCreateFormData(prev => ({
        ...prev,
        project_vuid: projectVuid
      }));
      setProjectFilter(projectVuid);
      // Fetch budget lines for the pre-selected project
      fetchProjectBudgetLines(projectVuid);
      // Fetch project-specific cost codes for the pre-selected project
      fetchProjectCostCodes(projectVuid);
    }
  }, [projectVuid]);

  useEffect(() => {
    console.log('AP Invoices - invoices state changed:', invoices);
    console.log('AP Invoices - invoices state length:', invoices.length);
  }, [invoices]);

  useEffect(() => {
    console.log('AP Invoices - procoreInvoices state changed:', procoreInvoices);
    console.log('AP Invoices - procoreInvoices state length:', procoreInvoices.length);
  }, [procoreInvoices]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        invoicesRes,
        vendorsRes,
        projectsRes,
        commitmentsRes,
        costCodesRes,
        costTypesRes,
        accountingPeriodsRes,
        integrationsRes,
        projectBudgetsRes
      ] = await Promise.all([
        fetch(`${baseURL}/api/ap-invoices`),
        fetch(`${baseURL}/api/vendors`),
        fetch(`${baseURL}/api/projects`),
        fetch(`${baseURL}/api/project-commitments`),
        fetch(`${baseURL}/api/cost-codes`),
        fetch(`${baseURL}/api/cost-types`),
        fetch(`${baseURL}/api/accounting-periods/open`),
        fetch(`${baseURL}/api/integrations`),
        fetch(`${baseURL}/api/project-budgets`)
      ]);

      const [
        invoicesData,
        vendorsData,
        projectsData,
        commitmentsData,
        costCodesData,
        costTypesData,
        accountingPeriodsData,
        integrationsData,
        projectBudgetsData
      ] = await Promise.all([
        invoicesRes.json(),
        vendorsRes.json(),
        projectsRes.json(),
        commitmentsRes.json(),
        costCodesRes.json(),
        costTypesRes.json(),
        accountingPeriodsRes.json(),
        integrationsRes.json(),
        projectBudgetsRes.json()
      ]);

      console.log('AP Invoices fetchData - invoicesData:', invoicesData);
      console.log('AP Invoices fetchData - invoicesData length:', invoicesData.length);

      setInvoices(invoicesData);
      setVendors(vendorsData);
      setProjects(projectsData);
      console.log('AP Invoices fetchData - commitmentsData:', commitmentsData);
      console.log('AP Invoices fetchData - costCodesData:', costCodesData);
      console.log('AP Invoices fetchData - costTypesData:', costTypesData);
      console.log('AP Invoices fetchData - costCodesData length:', costCodesData.length);
      console.log('AP Invoices fetchData - costTypesData length:', costTypesData.length);
      if (costCodesData.length > 0) {
        console.log('AP Invoices fetchData - first cost code:', costCodesData[0]);
      }
      if (costTypesData.length > 0) {
        console.log('AP Invoices fetchData - first cost type:', costTypesData[0]);
      }
      
      // Debug: Check if cost codes and cost types have the expected structure
      console.log('AP Invoices fetchData - costCodesData sample:', costCodesData.slice(0, 3));
      console.log('AP Invoices fetchData - costTypesData sample:', costTypesData.slice(0, 3));
      
      setCommitments(commitmentsData);
      setCostCodes(costCodesData);
      setCostTypes(costTypesData);
      setAccountingPeriods(accountingPeriodsData);
      setIntegrations(integrationsData);
      setProjectBudgets(projectBudgetsData);
      
      console.log('AP Invoices fetchData - projectBudgetsData:', projectBudgetsData);
      console.log('AP Invoices fetchData - projectBudgetsData length:', projectBudgetsData.length);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    console.log('Manual refresh triggered');
    await fetchData();
  };



  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US');
    } catch (error) {
      return dateString;
    }
  };

  const generateNextInvoiceNumber = async (commitmentVuid) => {
    try {
      const response = await fetch(`/api/ap-invoices/next-number/${commitmentVuid}`);
      if (response.ok) {
        const data = await response.json();
        setCreateFormData(prev => ({
          ...prev,
          invoice_number: data.next_invoice_number
        }));
      }
    } catch (error) {
      console.error('Error generating invoice number:', error);
    }
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // If project is changed, clear commitment, vendor, and invoice lines
      if (name === 'project_vuid') {
        newData.commitment_vuid = '';
        newData.vendor_vuid = '';
        setCreateInvoiceLines([]);
        // Fetch budget lines for the new project
        fetchProjectBudgetLines(value);
        // Fetch project-specific cost codes for the new project
        if (value) {
          fetchProjectCostCodes(value);
        } else {
          setProjectCostCodes([]);
        }
      }
      
      // If commitment is changed, auto-populate vendor and prefill lines
      if (name === 'commitment_vuid') {
        if (value) {
          const selectedCommitment = commitments.find(c => c.vuid === value);
          if (selectedCommitment) {
            newData.vendor_vuid = selectedCommitment.vendor_vuid;
            // Generate next invoice number
            generateNextInvoiceNumber(value);
            // Auto-prefill lines from commitment
            setTimeout(() => {
              handlePrefillLinesFromCommitment(value);
            }, 100); // Small delay to ensure state is updated
          }
        } else {
          // If commitment is cleared, clear vendor and lines
          newData.vendor_vuid = '';
          newData.invoice_number = '';
          setCreateInvoiceLines([]);
        }
      }
      
      return newData;
    });
  };

  // Unified functions that handle both new line form and existing line editing
  const handleQuantityChange = (indexOrEvent, value) => {
    // If called with event (new line form)
    if (indexOrEvent.target) {
      const e = indexOrEvent;
      const quantity = parseFloat(e.target.value) || 0;
      const unitPrice = parseFloat(newLineData.unit_price) || 0;
      const amount = quantity * unitPrice;
      
      setNewLineData(prev => ({
        ...prev,
        quantity: e.target.value,
        total_amount: amount > 0 ? amount.toString() : ''
      }));
    } else {
      // If called with index and value (editing existing lines)
      const index = indexOrEvent;
      const updatedLines = [...createInvoiceLines];
      const quantity = parseFloat(value) || 0;
      const unitPrice = parseFloat(updatedLines[index].unit_price) || 0;
      const amount = quantity * unitPrice;
      
      updatedLines[index] = { 
        ...updatedLines[index], 
        quantity: value,
        total_amount: amount > 0 ? amount : 0
      };
      setCreateInvoiceLines(updatedLines);
    }
  };

  const handleUnitPriceChange = (indexOrEvent, value) => {
    // If called with event (new line form)
    if (indexOrEvent.target) {
      const e = indexOrEvent;
      const unitPrice = parseFloat(e.target.value) || 0;
      const quantity = parseFloat(newLineData.quantity) || 0;
      const amount = quantity * unitPrice;
      
      setNewLineData(prev => ({
        ...prev,
        unit_price: e.target.value,
        total_amount: amount > 0 ? amount.toString() : ''
      }));
    } else {
      // If called with index and value (editing existing lines)
      const index = indexOrEvent;
      const updatedLines = [...createInvoiceLines];
      const unitPrice = parseFloat(value) || 0;
      const quantity = parseFloat(updatedLines[index].quantity) || 0;
      const amount = quantity * unitPrice;
      
      updatedLines[index] = { 
        ...updatedLines[index], 
        unit_price: value,
        total_amount: amount > 0 ? amount : 0
      };
      setCreateInvoiceLines(updatedLines);
    }
  };

  const handleAmountChange = (indexOrEvent, value) => {
    // If called with event (new line form)
    if (indexOrEvent.target) {
      const e = indexOrEvent;
      const amount = parseFloat(e.target.value) || 0;
      const retainagePercentage = parseFloat(newLineData.retainage_percentage) || 0;
      const calculatedRetention = (amount * retainagePercentage) / 100;
      
      setNewLineData(prev => ({
        ...prev,
        total_amount: e.target.value,
        quantity: amount > 0 ? '1' : '',
        unit_price: amount > 0 ? amount.toString() : '',
        retention_held: (Math.round(calculatedRetention * 100) / 100).toFixed(2)
      }));
    } else {
      // If called with index and value (editing existing lines)
      const index = indexOrEvent;
      const updatedLines = [...createInvoiceLines];
      const amount = parseFloat(value) || 0;
      const retainagePercentage = parseFloat(updatedLines[index].retainage_percentage) || 0;
      const calculatedRetention = (amount * retainagePercentage) / 100;
      
      updatedLines[index] = { 
        ...updatedLines[index], 
        total_amount: amount,
        quantity: 1,
        unit_price: amount,
        retention_held: (Math.round(calculatedRetention * 100) / 100).toFixed(2)
      };
      setCreateInvoiceLines(updatedLines);
    }
  };

  const handleCommitmentLineChange = (commitmentLineVuid) => {
    if (!commitmentLineVuid) {
      // Clear commitment line data
      setNewLineData(prev => ({
        ...prev,
        commitment_line_vuid: '',
        cost_code_vuid: '',
        cost_type_vuid: '',
        total_amount: '0',
        percent_complete: '',
        quantity: '1',
        unit_price: '0'
      }));
      return;
    }

    // Find the selected commitment line
    const selectedCommitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
    const commitmentLine = selectedCommitment?.line_items?.find(item => item.vuid === commitmentLineVuid);
    
    if (commitmentLine) {
      console.log('Selected commitment line:', commitmentLine); // Debug log
      // Prefill with commitment line data, but set amount to 0
      setNewLineData(prev => ({
        ...prev,
        commitment_line_vuid: commitmentLineVuid,
        description: commitmentLine.description || prev.description,
        cost_code_vuid: commitmentLine.cost_code_vuid || '',
        cost_type_vuid: commitmentLine.cost_type_vuid || '',
        total_amount: '0', // Default to 0 for invoice line
        percent_complete: '',
        quantity: '1',
        unit_price: '0'
      }));
    }
  };

  const handlePercentCompleteChange = (indexOrEvent, value) => {
    // If called with event (new line form)
    if (indexOrEvent.target) {
      const e = indexOrEvent;
      const percentComplete = parseFloat(e.target.value) || 0;
      
      // Calculate amount based on commitment line amount and percentage
      if (newLineData.commitment_line_vuid && percentComplete > 0) {
        const selectedCommitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
        const commitmentLine = selectedCommitment?.line_items?.find(item => item.vuid === newLineData.commitment_line_vuid);
        
        if (commitmentLine) {
          const calculatedAmount = (commitmentLine.total_amount * percentComplete) / 100;
          setNewLineData(prev => ({
            ...prev,
            percent_complete: e.target.value,
            total_amount: calculatedAmount.toFixed(2)
          }));
        }
      } else {
        setNewLineData(prev => ({
          ...prev,
          percent_complete: e.target.value
        }));
      }
    } else {
      // If called with index and value (editing existing lines)
      const index = indexOrEvent;
      const updatedLines = [...createInvoiceLines];
      const percentComplete = parseFloat(value) || 0;
      
      // Calculate amount based on commitment line amount and percentage
      if (updatedLines[index].commitment_line_vuid && percentComplete > 0) {
        const selectedCommitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
        const commitmentLine = selectedCommitment?.line_items?.find(item => item.vuid === updatedLines[index].commitment_line_vuid);
        
        if (commitmentLine) {
          const calculatedAmount = (commitmentLine.total_amount * percentComplete) / 100;
          updatedLines[index] = { 
            ...updatedLines[index], 
            percent_complete: value,
            total_amount: calculatedAmount
          };
        }
      } else {
        updatedLines[index] = { 
          ...updatedLines[index], 
          percent_complete: value
        };
      }
      
      setCreateInvoiceLines(updatedLines);
    }
  };

  const handleRetainagePercentageChange = (indexOrEvent, value) => {
    // If called with event (new line form)
    if (indexOrEvent.target) {
      const e = indexOrEvent;
      const retainagePercentage = parseFloat(e.target.value) || 0;
      const totalAmount = parseFloat(newLineData.total_amount) || 0;
      
      // Calculate retention held based on percentage and total amount
      const calculatedRetention = (totalAmount * retainagePercentage) / 100;
      
      setNewLineData(prev => ({
        ...prev,
        retainage_percentage: e.target.value,
        retention_held: (Math.round(calculatedRetention * 100) / 100).toFixed(2)
      }));
    } else {
      // If called with index and value (editing existing lines)
      const index = indexOrEvent;
      const updatedLines = [...createInvoiceLines];
      const retainagePercentage = parseFloat(value) || 0;
      const totalAmount = parseFloat(updatedLines[index].total_amount) || 0;
      
      // Calculate retention held based on percentage and total amount
      const calculatedRetention = (totalAmount * retainagePercentage) / 100;
      
      updatedLines[index] = { 
        ...updatedLines[index], 
        retainage_percentage: value,
        retention_held: (Math.round(calculatedRetention * 100) / 100).toFixed(2)
      };
      
      setCreateInvoiceLines(updatedLines);
    }
  };

  const handleAddLine = () => {
    // Prevent manual line addition when a commitment is selected
    if (createFormData.commitment_vuid) {
      alert('Cannot add manual lines when a commitment is selected. Only commitment and change order lines are allowed.');
      return;
    }

    if (!newLineData.description || (!newLineData.total_amount && (!newLineData.quantity || !newLineData.unit_price))) {
      alert('Please fill in description and either total amount OR both quantity and unit price for the line item');
      return;
    }

    // If not matching to a commitment, require cost code and cost type
    if (!newLineData.commitment_line_vuid && (!newLineData.cost_code_vuid || !newLineData.cost_type_vuid)) {
      alert('Please select both Cost Code and Cost Type for manual line items');
      return;
    }

    let finalAmount, finalQuantity, finalUnitPrice;
    
    if (newLineData.total_amount && parseFloat(newLineData.total_amount) > 0) {
      finalAmount = parseFloat(newLineData.total_amount);
      finalQuantity = 1;
      finalUnitPrice = finalAmount;
    } else {
      finalQuantity = parseFloat(newLineData.quantity);
      finalUnitPrice = parseFloat(newLineData.unit_price);
      finalAmount = finalQuantity * finalUnitPrice;
    }

    const newLine = {
      vuid: `temp-${Date.now()}`,
      description: newLineData.description,
      quantity: finalQuantity,
      unit_price: finalUnitPrice,
      total_amount: finalAmount,
      percent_complete: parseFloat(newLineData.percent_complete) || 0,
      retainage_percentage: parseFloat(newLineData.retainage_percentage) || 0,
      retention_held: parseFloat(newLineData.retention_held) || 0,
      retention_released: parseFloat(newLineData.retention_released) || 0,
      cost_code_vuid: newLineData.cost_code_vuid,
      cost_type_vuid: newLineData.cost_type_vuid,
      commitment_line_vuid: newLineData.commitment_line_vuid
    };

    setCreateInvoiceLines(prev => [...prev, newLine]);
    
    setNewLineData({
      description: '',
      quantity: '',
      unit_price: '',
      total_amount: '',
      percent_complete: '',
      retainage_percentage: '',
      retention_held: '',
      retention_released: '',
      cost_code_vuid: '',
      cost_type_vuid: '',
      commitment_line_vuid: ''
    });
  };

  const handleRemoveLine = (index) => {
    // Prevent line removal when a commitment is selected
    if (createFormData.commitment_vuid) {
      alert('Cannot remove lines when a commitment is selected. All lines must come from the commitment and change orders.');
      return;
    }
    
    setCreateInvoiceLines(prev => prev.filter((_, i) => i !== index));
  };

  const handlePrefillLines = () => {
    if (!createFormData.commitment_vuid) {
      alert('Please select a commitment first');
      return;
    }

    const selectedCommitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
    if (!selectedCommitment) {
      alert('Selected commitment not found');
      return;
    }

    console.log('Prefilling lines from commitment:', selectedCommitment);
    
    // Prefill invoice lines with commitment items (which already include change order items)
    const commitmentItems = selectedCommitment.line_items || [];
    
    console.log('Commitment line items found:', commitmentItems);
    
    if (commitmentItems.length === 0) {
      alert('This commitment has no line items to prefill');
      return;
    }

    // Use only commitment line items (change order items are already included)
    const allItems = commitmentItems;
    
    const prefilledLines = allItems.map(item => {
      console.log('Processing commitment item:', item);
      console.log('Item cost_code_vuid:', item.cost_code_vuid);
      console.log('Item cost_type_vuid:', item.cost_type_vuid);
      console.log('Item cost_code object:', item.cost_code);
      console.log('Item cost_type object:', item.cost_type);
      console.log('Full item structure:', JSON.stringify(item, null, 2));
      
      // Handle both direct vuid fields and nested objects
      const costCodeVuid = item.cost_code_vuid || (item.cost_code?.vuid) || '';
      const costTypeVuid = item.cost_type_vuid || (item.cost_type?.vuid) || '';
      
      console.log('Extracted costCodeVuid:', costCodeVuid);
      console.log('Extracted costTypeVuid:', costTypeVuid);
      
      // Calculate current percent complete based on previous billing
      const commitmentLineAmount = parseFloat(item.total_amount) || 0;
      let currentPercentComplete = 0;
      
      if (commitmentLineAmount > 0) {
        // Sum up all previous billing amounts for this commitment line
        const billedToDate = invoices
          .filter(invoice => 
            invoice.status === 'approved' && 
            invoice.project_vuid === createFormData.project_vuid
          )
          .flatMap(invoice => invoice.line_items || [])
          .filter(lineItem => lineItem.commitment_line_vuid === item.vuid)
          .reduce((sum, lineItem) => sum + (parseFloat(lineItem.total_amount) || 0), 0);
        
        // Calculate percent complete: (billed to date / commitment line amount) * 100
        currentPercentComplete = (billedToDate / commitmentLineAmount) * 100;
        console.log(`Commitment line ${item.vuid}: Billed to date: $${billedToDate}, Commitment amount: $${commitmentLineAmount}, Percent complete: ${currentPercentComplete.toFixed(2)}%`);
      }
      
      return {
        description: item.description || '',
        cost_code_vuid: costCodeVuid,
        cost_type_vuid: costTypeVuid,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_amount: 0, // Default to 0 for invoice lines
        percent_complete: currentPercentComplete > 0 ? currentPercentComplete.toFixed(2) : '', // Auto-populate with current percent complete
        retainage_percentage: item.retainage_percentage || 10, // Default to 10% or commitment value
        retention_held: 0,
        retention_released: 0,
        commitment_line_vuid: item.vuid || ''
      };
    });

    console.log('Prefilled lines created:', prefilledLines);
    // Clear any existing lines and set only the commitment/change order lines
    setCreateInvoiceLines(prefilledLines);
    
    alert(`Prefilled ${prefilledLines.length} line items from commitment and change orders. You can now modify quantities, amounts, and retention values as needed.`);
  };

  const handlePrefillLinesFromCommitment = (commitmentVuid) => {
    if (!commitmentVuid) {
      return;
    }

    const selectedCommitment = commitments.find(c => c.vuid === commitmentVuid);
    if (!selectedCommitment) {
      console.log('Selected commitment not found for auto-prefill');
      return;
    }

    console.log('Auto-prefilling lines from commitment:', selectedCommitment);
    
    // Prefill invoice lines with commitment items (which already include change order items)
    const commitmentItems = selectedCommitment.line_items || [];
    
    console.log('Commitment line items found:', commitmentItems);
    
    if (commitmentItems.length === 0) {
      console.log('This commitment has no line items to prefill');
      return;
    }

    // Use only commitment line items (change order items are already included)
    const allItems = commitmentItems;
    
    const prefilledLines = allItems.map(item => {
      console.log('Processing commitment item:', item);
      
      // Handle both direct vuid fields and nested objects
      const costCodeVuid = item.cost_code_vuid || (item.cost_code?.vuid) || '';
      const costTypeVuid = item.cost_type_vuid || (item.cost_type?.vuid) || '';
      
      // Calculate current percent complete based on previous billing
      const commitmentLineAmount = parseFloat(item.total_amount) || 0;
      let currentPercentComplete = 0;
      
      if (commitmentLineAmount > 0) {
        // Sum up all previous billing amounts for this commitment line
        const billedToDate = invoices
          .filter(invoice => 
            invoice.status === 'approved' && 
            invoice.project_vuid === createFormData.project_vuid
          )
          .flatMap(invoice => invoice.line_items || [])
          .filter(lineItem => lineItem.commitment_line_vuid === item.vuid)
          .reduce((sum, lineItem) => sum + (parseFloat(lineItem.total_amount) || 0), 0);
        
        // Calculate percent complete: (billed to date / commitment line amount) * 100
        currentPercentComplete = (billedToDate / commitmentLineAmount) * 100;
        console.log(`Commitment line ${item.vuid}: Billed to date: $${billedToDate}, Commitment amount: $${commitmentLineAmount}, Percent complete: ${currentPercentComplete.toFixed(2)}%`);
      }
      
      return {
        description: item.description || '',
        cost_code_vuid: costCodeVuid,
        cost_type_vuid: costTypeVuid,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_amount: 0, // Default to 0 for invoice lines
        percent_complete: currentPercentComplete > 0 ? currentPercentComplete.toFixed(2) : '', // Auto-populate with current percent complete
        retainage_percentage: item.retainage_percentage || 10, // Default to 10% or commitment value
        retention_held: 0,
        retention_released: 0,
        commitment_line_vuid: item.vuid || ''
      };
    });

    console.log('Auto-prefilled lines created:', prefilledLines);
    // Clear any existing lines and set only the commitment/change order lines
    setCreateInvoiceLines(prefilledLines);
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...createInvoiceLines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setCreateInvoiceLines(updatedLines);
  };

  const handleCreateInvoice = async () => {
    if (!createFormData.invoice_number || !createFormData.vendor_vuid || !createFormData.invoice_date) {
      alert('Please fill in all required fields: Invoice Number, Vendor, and Invoice Date');
      return;
    }

    if (createInvoiceLines.length === 0) {
      alert('Please add at least one line item to the invoice');
      return;
    }

    if (!createFormData.accounting_period_vuid) {
      alert('Please select an accounting period for the invoice');
      return;
    }

    setCreating(true);

    try {
      const subtotal = createInvoiceLines.reduce((sum, line) => sum + (line.total_amount || 0), 0);
      const retentionHeld = createInvoiceLines.reduce((sum, line) => {
        const totalAmount = parseFloat(line.total_amount) || 0;
        const retainagePercentage = parseFloat(line.retainage_percentage) || 0;
        const calculatedRetention = (totalAmount * retainagePercentage) / 100;
        return sum + calculatedRetention;
      }, 0);
      const retentionReleased = createInvoiceLines.reduce((sum, line) => sum + (line.retention_released || 0), 0);
      const totalAmount = subtotal - retentionHeld + retentionReleased;

      // Clean up the form data to handle optional fields properly
      const cleanFormData = {
        ...createFormData,
        commitment_vuid: createFormData.commitment_vuid || null,
        project_vuid: createFormData.project_vuid || null
      };

      const invoiceData = {
        ...cleanFormData,
        subtotal: subtotal,
        retention_held: retentionHeld,
        retention_released: retentionReleased,
        total_amount: totalAmount
      };

      console.log('Creating invoice with data:', invoiceData);

      const response = await fetch(`${baseURL}/api/ap-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const newInvoice = await response.json();
        
        // Create the invoice line items
        for (const line of createInvoiceLines) {
          // Calculate retention held dynamically
          const totalAmount = parseFloat(line.total_amount) || 0;
          const retainagePercentage = parseFloat(line.retainage_percentage) || 0;
          const calculatedRetention = (totalAmount * retainagePercentage) / 100;
          
          const lineData = {
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            total_amount: line.total_amount,
            retainage_percentage: line.retainage_percentage,
            retention_held: calculatedRetention,
            retention_released: line.retention_released,
            cost_code_vuid: line.cost_code_vuid || null,
            cost_type_vuid: line.cost_type_vuid || null,
            commitment_line_vuid: line.commitment_line_vuid || null
          };

          const lineResponse = await fetch(`${baseURL}/api/ap-invoices/${newInvoice.vuid}/line-items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(lineData),
          });

          if (!lineResponse.ok) {
            const lineErrorData = await lineResponse.text();
            throw new Error(`Failed to create line item: ${lineErrorData || 'Unknown error'}`);
          }
        }

        // Reset form and close modal
        setCreateFormData({
          invoice_number: '',
          vendor_vuid: '',
          project_vuid: projectVuid || '', // Preserve project context if available
          commitment_vuid: '',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: '',
          accounting_period_vuid: '',
          description: '',
          status: 'pending'
        });
        setCreateInvoiceLines([]);
        setShowCreateModal(false);
        
        // Refresh the invoices list
        await fetchData();
        
        alert('AP Invoice created successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to create AP invoice');
      }
    } catch (error) {
      console.error('Error creating AP invoice:', error);
      alert(`Error creating AP invoice: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvoice = async (vuid) => {
    // Find the invoice to check if it's exported
    const invoice = invoices.find(inv => inv.vuid === vuid);
    if (invoice && invoice.exported_to_accounting) {
      alert('Cannot delete this invoice because it has been exported to the accounting system.');
      return;
    }
    
    // Check if the accounting period is closed
    if (invoice && invoice.accounting_period && invoice.accounting_period.status === 'closed') {
      alert('Cannot delete this invoice because it is in a closed accounting period.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`${baseURL}/api/ap-invoices/${vuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        alert('Invoice deleted successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert(`Error deleting invoice: ${error.message}`);
    }
  };

  // View line items for an invoice
  const handleViewLines = async (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewLinesModal(true);
    setLoadingLines(true);
    
    try {
      const response = await fetch(`${baseURL}/api/ap-invoices/${invoice.vuid}/line-items`);
      if (response.ok) {
        const lineItems = await response.json();
        setInvoiceLineItems(lineItems);
      } else {
        setInvoiceLineItems([]);
      }
    } catch (error) {
      console.error('Error fetching line items:', error);
      setInvoiceLineItems([]);
    } finally {
      setLoadingLines(false);
    }
  };

  // Start editing a line item
  const handleEditLine = (index) => {
    setEditingLineIndex(index);
    setEditingLineData({ ...invoiceLineItems[index] });
  };

  // Save edited line item
  const handleSaveLine = async (index) => {
    try {
      const response = await fetch(`${baseURL}/api/ap-invoices/${selectedInvoice.vuid}/line-items/${invoiceLineItems[index].vuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingLineData),
      });

      if (response.ok) {
        const updatedLine = await response.json();
        const updatedLines = [...invoiceLineItems];
        updatedLines[index] = updatedLine;
        setInvoiceLineItems(updatedLines);
        setEditingLineIndex(null);
        setEditingLineData({});
        
        // Refresh the main invoices list to update totals
        fetchData();
      } else {
        console.error('Failed to update line item');
      }
    } catch (error) {
      console.error('Error updating line item:', error);
      alert(`Error updating line item: ${error.message}`);
    }
  };

  // Cancel editing a line item
  const handleCancelEdit = () => {
    setEditingLineIndex(null);
    setEditingLineData({});
  };

  // Preview journal entry for an invoice
  const handlePreviewJournalEntry = async (invoice) => {
    try {
      setPreviewLoading(true);
      setPreviewData(null);
      
      const response = await fetch(`${baseURL}/api/ap-invoices/${invoice.vuid}/preview-journal-entry`);
      
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

  // Handle line item field changes
  const handleLineFieldChange = (index, field, value) => {
    setEditingLineData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle edit invoice form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Start editing an invoice
  const handleEditInvoice = (invoice) => {
    // Check if the accounting period is closed
    if (invoice.accounting_period && invoice.accounting_period.status === 'closed') {
      alert('Cannot edit this invoice because it is in a closed accounting period.');
      return;
    }
    
    setEditingInvoice(invoice);
    setEditFormData({
      invoice_number: invoice.invoice_number || '',
      vendor_vuid: invoice.vendor_vuid || '',
      project_vuid: invoice.project_vuid || '',
      commitment_vuid: invoice.commitment_vuid || '',
      invoice_date: invoice.invoice_date || '',
      due_date: invoice.due_date || '',
      accounting_period_vuid: invoice.accounting_period_vuid || '',
      description: invoice.description || '',
      status: invoice.status || 'pending'
    });
    setShowEditModal(true);
  };
  
  // Save edited invoice
  const handleSaveInvoice = async () => {
    try {
      // Clean up the edit form data to handle optional fields properly
      const cleanEditData = {
        ...editFormData,
        commitment_vuid: editFormData.commitment_vuid || null,
        project_vuid: editFormData.project_vuid || null
      };

      const response = await fetch(`${baseURL}/api/ap-invoices/${editingInvoice.vuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanEditData),
      });

      if (response.ok) {
        await fetchData(); // Refresh the invoices list
        setShowEditModal(false);
        setEditingInvoice(null);
        setEditFormData({});
        alert('Invoice updated successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert(`Error updating invoice: ${error.message}`);
    }
  };

  // Calculate line totals when editing
  const calculateLineTotal = (quantity, unitPrice) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return qty * price;
  };

  // Retrieve invoices functions
  const handleRetrieveInvoices = async () => {
    if (!retrieveIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      setLoadingInvoices(true);
      
      // Call the mock Procore invoices API
      const response = await fetch(`${baseURL}/api/mock-procore/invoices`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received data from mock API:', data);
        if (data && data.invoices) {
          setProcoreInvoices(data.invoices);
          setSelectedInvoices([]);
          console.log('Set procoreInvoices:', data.invoices);
        } else {
          alert('No invoices found from the integration');
        }
      } else {
        alert('Error retrieving invoices from integration');
      }
    } catch (error) {
      console.error('Error retrieving invoices from integration:', error);
      alert('Error retrieving invoices from integration');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleImportInvoices = async () => {
    if (selectedInvoices.length === 0) {
      alert('Please select at least one invoice to import');
      return;
    }

    if (accountingPeriods.length === 0) {
      alert('No accounting periods available. Please create an accounting period first.');
      return;
    }

    console.log('Starting import with selected invoices:', selectedInvoices);
    console.log('Available accounting periods:', accountingPeriods);

    try {
      for (const invoiceId of selectedInvoices) {
        // Find the actual invoice data from procoreInvoices
        const invoice = procoreInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
          console.error('Invoice not found for ID:', invoiceId);
          continue;
        }

        console.log('Processing invoice:', invoice);
        console.log('Invoice vendor:', invoice.vendor);
        console.log('Invoice vendor name:', invoice.vendor?.name);

        // Validate invoice structure
        if (!invoice.vendor || !invoice.vendor.name) {
          console.error('Invalid invoice structure - missing vendor information:', invoice);
          alert(`Invoice ${invoice.invoice_number} is missing vendor information and cannot be imported.`);
          continue;
        }

        // Find the vendor by name or create a new one
        let vendorVuid = null;
        try {
          const vendorsResponse = await fetch(`${baseURL}/api/vendors`);
          const vendorsData = await vendorsResponse.json();
          const existingVendor = vendorsData.find(v => 
            v.vendor_name.toLowerCase() === invoice.vendor.name.toLowerCase()
          );
          
          if (existingVendor) {
            vendorVuid = existingVendor.vuid;
          } else {
            // Create new vendor
            const newVendorResponse = await fetch(`${baseURL}/api/vendors`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                vendor_name: invoice.vendor.name,
                company_name: invoice.vendor.company_name || invoice.vendor.name,
                email: '',
                phone: '',
                address: ''
              }),
            });
            const newVendorData = await newVendorResponse.json();
            vendorVuid = newVendorData.vuid;
          }
        } catch (error) {
          console.error('Error handling vendor:', error);
          continue;
        }

        // Create the AP invoice
        console.log('=== INVOICE IMPORT DEBUG ===');
        console.log('Raw invoice data from Procore:', invoice);
        console.log('Invoice subtotal:', invoice.subtotal, 'Type:', typeof invoice.subtotal);
        console.log('Invoice total_amount:', invoice.total_amount, 'Type:', typeof invoice.total_amount);
        console.log('Parsed subtotal:', parseFloat(invoice.subtotal) || 0);
        console.log('Parsed total_amount:', parseFloat(invoice.total_amount) || 0);
        
        const invoiceData = {
          invoice_number: invoice.invoice_number,
          vendor_vuid: vendorVuid,
          project_vuid: projectVuid, // Use project context from URL
          commitment_vuid: null, // No commitment linked for now
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date || null, // Handle null/empty due_date
          description: invoice.description || '',
          status: invoice.status,
          accounting_period_vuid: accountingPeriods.length > 0 ? accountingPeriods[0].vuid : null, // Use first available accounting period
          subtotal: Number(invoice.subtotal) || 0, // Ensure it's a number
          total_amount: Number(invoice.total_amount) || 0, // Ensure it's a number
          retention_held: 0.00,
          retention_released: 0.00
        };

        console.log('Final invoice data being sent to API:', invoiceData);
        console.log('Data types - subtotal:', typeof invoiceData.subtotal, 'total_amount:', typeof invoiceData.total_amount);
        console.log('Values - subtotal:', invoiceData.subtotal, 'total_amount:', invoiceData.total_amount);

        const invoiceResponse = await fetch(`${baseURL}/api/ap-invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });
        
        if (!invoiceResponse.ok) {
          const errorText = await invoiceResponse.text();
          console.error('Error creating invoice:', errorText);
          console.error('Response status:', invoiceResponse.status);
          throw new Error(`Failed to create invoice: ${errorText}`);
        }
        
        const createdInvoice = await invoiceResponse.json();
        
        console.log('Created invoice response:', createdInvoice);
        console.log('Created invoice amounts - subtotal:', createdInvoice.subtotal, 'total_amount:', createdInvoice.total_amount);

        // Create line items
        for (const lineItem of invoice.line_items) {
          // Find cost code by code
          let costCodeVuid = null;
          try {
            const costCodesResponse = await fetch(`${baseURL}/api/cost-codes`);
            const costCodesData = await costCodesResponse.json();
            const existingCostCode = costCodesData.find(cc => 
              cc.code === lineItem.cost_code.code
            );
            if (existingCostCode) {
              costCodeVuid = existingCostCode.vuid;
            }
          } catch (error) {
            console.error('Error finding cost code:', error);
          }

          // Find cost type by name
          let costTypeVuid = null;
          try {
            const costTypesResponse = await fetch(`${baseURL}/api/cost-types`);
            const costTypesData = await costTypesResponse.json();
            const existingCostType = costTypesData.find(ct => 
              ct.cost_type.toLowerCase() === lineItem.cost_type.name.toLowerCase()
            );
            if (existingCostType) {
              costTypeVuid = existingCostType.vuid;
            }
          } catch (error) {
            console.error('Error finding cost type:', error);
          }

          const lineItemData = {
            invoice_vuid: createdInvoice.vuid,
            description: lineItem.description,
            quantity: lineItem.quantity,
            unit_price: lineItem.unit_price,
            total_amount: lineItem.total_amount,
            cost_code_vuid: costCodeVuid,
            cost_type_vuid: costTypeVuid,
            retention_held: 0.00,
            retention_released: 0.00
          };

          console.log('Creating line item with data:', lineItemData);

          const lineItemResponse = await fetch(`${baseURL}/api/ap-invoices/${createdInvoice.vuid}/line-items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(lineItemData),
          });
          
          if (!lineItemResponse.ok) {
            const errorText = await lineItemResponse.text();
            console.error('Error creating line item:', errorText);
            throw new Error(`Failed to create line item: ${errorText}`);
          }
          
          const createdLineItem = await lineItemResponse.json();
          console.log('Created line item:', createdLineItem);
        }
      }

      alert(`Successfully imported ${selectedInvoices.length} invoice(s)`);
      
      // Reset all modal states
      setShowRetrieveModal(false);
      setRetrieveIntegration(null);
      setProcoreInvoices([]);
      setSelectedInvoices([]);
      
      console.log('Import completed, about to refresh data...');
      
      // Refresh the invoices list
      await fetchData();
      
      console.log('Data refresh completed');
      
      // Debug: Check what's in the invoices state after refresh
      setTimeout(() => {
        console.log('AP Invoices state after refresh:', invoices);
        console.log('AP Invoices state length after refresh:', invoices.length);
        console.log('Filtered invoices after refresh:', filteredInvoices);
        console.log('Filtered invoices length after refresh:', filteredInvoices.length);
      }, 100);
    } catch (error) {
      console.error('Error importing invoices:', error);
      alert('Error importing invoices');
    }
  };

  const handleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };

  // Filter commitments by selected project
  const filteredCommitments = createFormData.project_vuid 
    ? commitments.filter(c => c.project_vuid === createFormData.project_vuid)
    : [];

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.vendor?.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.project?.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    const matchesProject = !projectFilter || invoice.project_vuid === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts Payable Invoices</h1>
        <p className="text-gray-600">Manage vendor invoices and payment processing</p>
        {projectFilter && (
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Filtered by: {projects.find(p => p.vuid === projectFilter)?.project_name || 'Unknown Project'}
            </span>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-xl font-semibold text-gray-900">{filteredInvoices.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">
                {filteredInvoices.filter(i => i.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-xl font-semibold text-gray-900">
                {filteredInvoices.filter(i => i.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold text-gray-900 leading-tight">
                {formatCurrency(filteredInvoices.reduce((sum, i) => {
                  const amount = parseFloat(i.total_amount) || 0;
                  return sum + amount;
                }, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Top Centered */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Create Invoice
          </button>
          <button
            onClick={() => setShowRetrieveModal(true)}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Retrieve Invoices
          </button>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setProjectFilter('');
              setCurrentPage(1);
            }}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Clear Filters
          </button>
          <button
            onClick={handleManualRefresh}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.vuid} value={project.vuid}>
                {project.project_number} - {project.project_name}
              </option>
            ))}
          </select>
        </div>
      </div>



      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accounting Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {paginatedInvoices.map((invoice) => (
                <tr key={invoice.vuid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.vendor?.vendor_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.project?.project_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice.invoice_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.accounting_period ? `${invoice.accounting_period.month}/${invoice.accounting_period.year}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.status === 'approved' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                      {invoice.exported_to_accounting && (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Exported
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        disabled={invoice.accounting_period && invoice.accounting_period.status === 'closed'}
                        className={`${
                          invoice.accounting_period && invoice.accounting_period.status === 'closed'
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={
                          invoice.accounting_period && invoice.accounting_period.status === 'closed'
                            ? 'Cannot edit invoice from closed accounting period'
                            : 'Edit invoice'
                        }
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleViewLines(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Lines
                      </button>
                      <button
                        onClick={() => handlePreviewJournalEntry(invoice)}
                        disabled={previewLoading}
                        className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        title="Preview Journal Entry"
                      >
                        {previewLoading ? '⏳' : '👁️'}
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.vuid)}
                        disabled={invoice.exported_to_accounting || (invoice.accounting_period && invoice.accounting_period.status === 'closed')}
                        className={`${
                          invoice.exported_to_accounting || (invoice.accounting_period && invoice.accounting_period.status === 'closed')
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        title={
                          invoice.exported_to_accounting 
                            ? 'Cannot delete exported invoice' 
                            : (invoice.accounting_period && invoice.accounting_period.status === 'closed')
                            ? 'Cannot delete invoice from closed accounting period'
                            : 'Delete invoice'
                        }
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-black text-white border-black'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Create New AP Invoice</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Invoice Header Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={createFormData.invoice_number}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor *
                  </label>
                  <select
                    name="vendor_vuid"
                    value={createFormData.vendor_vuid}
                    onChange={handleCreateFormChange}
                    disabled={!!createFormData.commitment_vuid}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select a vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.vuid} value={vendor.vuid}>
                        {vendor.vendor_name}
                      </option>
                    ))}
                  </select>
                  {createFormData.commitment_vuid && (
                    <p className="text-xs text-blue-600 mt-1">
                      Vendor auto-populated from selected commitment
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    name="project_vuid"
                    value={createFormData.project_vuid}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((project) => (
                      <option key={project.vuid} value={project.vuid}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Required to select commitments and auto-populate vendor
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment
                  </label>
                  <select
                    name="commitment_vuid"
                    value={createFormData.commitment_vuid}
                    onChange={handleCreateFormChange}
                    disabled={!createFormData.project_vuid}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {createFormData.project_vuid ? 'Select a commitment...' : 'Select a project first...'}
                    </option>
                    {filteredCommitments.map((commitment) => (
                      <option key={commitment.vuid} value={commitment.vuid}>
                        {commitment.commitment_number} - {commitment.commitment_name}
                      </option>
                    ))}
                  </select>
                  {createFormData.project_vuid && filteredCommitments.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No commitments found for this project</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Selecting a commitment will automatically populate the vendor field and prefill invoice lines from commitment and change orders
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={createFormData.invoice_date}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={createFormData.due_date}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting Period *
                  </label>
                  <select
                    name="accounting_period_vuid"
                    value={createFormData.accounting_period_vuid}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select an accounting period...</option>
                    {accountingPeriods.map((period) => (
                      <option key={period.vuid} value={period.vuid}>
                        {period.month}/{period.year} - {period.period_name || 'Open Period'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select which accounting period this invoice will be recorded in
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={createFormData.status}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={createFormData.description}
                    onChange={handleCreateFormChange}
                    rows="3"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Invoice description"
                  />
                </div>
              </div>

              {/* Invoice Lines Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Line Items</h3>
                  <div className="flex space-x-3">
                    {createFormData.commitment_vuid ? (
                      <div className="text-sm text-gray-600 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                        </svg>
                        Lines automatically prefilled from commitment and change orders
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="bg-black hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Add Manual Line
                      </button>
                    )}
                  </div>
                </div>
                


                {/* Excel-Like Grid Table */}




                {/* Lines Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200" style={{tableLayout: 'fixed', width: '100%'}}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '60px'}}>
                            Line #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '150px'}}>
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '150px'}}>
                            Commitment Line
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Commitment Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '200px'}}>
                            Cost Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '200px'}}>
                            Cost Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '100px'}}>
                            Unit Price
                          </th>
                                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                              Billed to Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                              Percent Complete
                            </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Total Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Retainage %
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Retention Held
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Retained to Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Retention Released
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '100px'}}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {createInvoiceLines.length === 0 && (
                          <tr>
                            <td colSpan="16" className="px-4 py-8 text-center text-gray-500 border-r border-gray-200">
                              <div className="flex flex-col items-center">
                                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-sm">No invoice lines added yet. Use the form below to add your first line.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {createInvoiceLines.map((line, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200" style={{width: '60px'}}>
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '150px'}}>
                              {line.commitment_line_vuid ? (
                                <span className="text-sm break-words">
                                  {line.description}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={line.description}
                                  onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Description"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '150px'}}>
                              {line.commitment_line_vuid ? (
                                <span className="text-sm">
                                  {(() => {
                                    const commitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
                                    const commitmentLine = commitment?.line_items?.find(item => item.vuid === line.commitment_line_vuid);
                                    const lineIndex = commitment?.line_items?.findIndex(item => item.vuid === line.commitment_line_vuid);
                                    return lineIndex !== undefined ? `Line ${lineIndex + 1}` : '-';
                                  })()}
                                </span>
                              ) : (
                                <select
                                  value={line.commitment_line_vuid}
                                  onChange={(e) => handleLineChange(index, 'commitment_line_vuid', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Select commitment line...</option>
                                  {createFormData.commitment_vuid && commitments.find(c => c.vuid === createFormData.commitment_vuid)?.line_items?.map((item, itemIndex) => (
                                    <option key={item.vuid} value={item.vuid}>
                                      Line {itemIndex + 1} - {item.description} (${item.total_amount})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              {line.commitment_line_vuid ? (
                                (() => {
                                  const commitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
                                  const commitmentLine = commitment?.line_items?.find(item => item.vuid === line.commitment_line_vuid);
                                  return commitmentLine ? formatCurrency(commitmentLine.total_amount) : '-';
                                })()
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '200px'}}>
                              {line.commitment_line_vuid ? (
                                <span className="text-sm break-words">
                                  {(() => {
                                    const costCode = getAllCostCodes().find(c => c.vuid === line.cost_code_vuid);
                                    return costCode ? `${costCode.code} - ${costCode.description}` : '-';
                                  })()}
                                </span>
                              ) : (
                                <select
                                  value={line.cost_code_vuid}
                                  onChange={(e) => handleLineChange(index, 'cost_code_vuid', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Select Cost Code</option>
                                  {getBudgetedCostCodes(createFormData.project_vuid).map((code) => (
                                    <option key={code.vuid} value={code.vuid}>
                                      {code.code} - {code.description}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '200px'}}>
                              {line.commitment_line_vuid ? (
                                <span className="text-sm break-words">
                                  {(() => {
                                    const costType = costTypes.find(t => t.vuid === line.cost_type_vuid);
                                    return costType ? `${costType.cost_type} - ${costType.description}` : '-';
                                  })()}
                                </span>
                              ) : (
                                <select
                                  value={line.cost_type_vuid}
                                  onChange={(e) => handleLineChange(index, 'cost_type_vuid', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Select Cost Type</option>
                                  {getBudgetedCostTypes(createFormData.project_vuid).map((type) => (
                                    <option key={type.vuid} value={type.vuid}>
                                      {type.cost_type} - {type.description}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              <input
                                type="number"
                                step="0.01"
                                value={line.quantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Qty"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '100px'}}>
                              <input
                                type="number"
                                step="0.01"
                                value={line.unit_price}
                                onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Unit Price"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              {line.commitment_line_vuid ? (
                                <span className="text-sm">
                                  {(() => {
                                    // Calculate billed to date for this commitment line
                                    const commitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
                                    const commitmentLine = commitment?.line_items?.find(item => item.vuid === line.commitment_line_vuid);
                                    
                                    if (!commitmentLine) return '$0.00';
                                    
                                    // Sum up all previous AP invoice line items for this commitment line
                                    const billedToDate = invoices
                                      .filter(invoice => 
                                        invoice.status === 'approved' && 
                                        invoice.project_vuid === createFormData.project_vuid
                                      )
                                      .flatMap(invoice => invoice.line_items || [])
                                      .filter(lineItem => lineItem.commitment_line_vuid === line.commitment_line_vuid)
                                      .reduce((sum, lineItem) => sum + (parseFloat(lineItem.total_amount) || 0), 0);
                                    
                                    return `$${billedToDate.toFixed(2)}`;
                                  })()}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              <input
                                type="number"
                                step="0.01"
                                value={line.percent_complete || ''}
                                onChange={(e) => handlePercentCompleteChange(index, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="0.00"
                                min="0"
                                max="100"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              <input
                                type="number"
                                step="0.01"
                                value={line.total_amount}
                                onChange={(e) => handleAmountChange(index, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Amount"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              <input
                                type="number"
                                step="0.01"
                                value={line.retainage_percentage || ''}
                                onChange={(e) => handleRetainagePercentageChange(index, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="0.00"
                                min="0"
                                max="100"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              <span className="text-sm">
                                {(() => {
                                  const totalAmount = parseFloat(line.total_amount) || 0;
                                  const retainagePercentage = parseFloat(line.retainage_percentage) || 0;
                                  const calculatedRetention = (totalAmount * retainagePercentage) / 100;
                                  return `$${calculatedRetention.toFixed(2)}`;
                                })()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              {line.commitment_line_vuid ? (
                                <span className="text-sm">
                                  {(() => {
                                    // Calculate retained to date for this commitment line
                                    const commitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
                                    const commitmentLine = commitment?.line_items?.find(item => item.vuid === line.commitment_line_vuid);
                                    
                                    if (!commitmentLine) return '$0.00';
                                    
                                    // Sum up all previous retention held from AP invoice line items for this commitment line
                                    const retainedToDate = invoices
                                      .filter(invoice => 
                                        invoice.status === 'approved' && 
                                        invoice.project_vuid === createFormData.project_vuid
                                      )
                                      .flatMap(invoice => invoice.line_items || [])
                                      .filter(lineItem => lineItem.commitment_line_vuid === line.commitment_line_vuid)
                                      .reduce((sum, lineItem) => sum + (parseFloat(lineItem.retention_held) || 0), 0);
                                    
                                    return `$${retainedToDate.toFixed(2)}`;
                                  })()}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              <input
                                type="number"
                                step="0.01"
                                value={line.retention_released}
                                onChange={(e) => handleLineChange(index, 'retention_released', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900" style={{width: '100px'}}>
                              {!createFormData.commitment_vuid && (
                                <button
                                  onClick={() => handleRemoveLine(index)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                  title="Remove line"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                              {createFormData.commitment_vuid && (
                                <span className="text-xs text-gray-400">From commitment</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        
                        {/* Manual Line Entry Row - Only show when no commitment is selected */}
                        {!createFormData.commitment_vuid && (
                        <tr className="bg-blue-50 border-t-2 border-blue-200">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200" style={{width: '60px'}}>
                            {createInvoiceLines.length + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '150px'}}>
                            <input
                              type="text"
                              value={newLineData.description}
                              onChange={(e) => setNewLineData(prev => ({...prev, description: e.target.value}))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '150px'}}>
                            <select
                              value={newLineData.commitment_line_vuid}
                              onChange={(e) => handleCommitmentLineChange(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select commitment line...</option>
                              {createFormData.commitment_vuid && commitments.find(c => c.vuid === createFormData.commitment_vuid)?.line_items?.map((item, itemIndex) => (
                                <option key={item.vuid} value={item.vuid}>
                                  Line {itemIndex + 1} - {item.description} (${item.total_amount})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            {newLineData.commitment_line_vuid ? (
                              (() => {
                                const commitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
                                const commitmentLine = commitment?.line_items?.find(item => item.vuid === newLineData.commitment_line_vuid);
                                return commitmentLine ? formatCurrency(commitmentLine.total_amount) : '-';
                              })()
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '200px'}}>
                            {newLineData.commitment_line_vuid ? (
                              <span className="text-sm break-words">
                                {(() => {
                                  const costCode = getAllCostCodes().find(c => c.vuid === newLineData.cost_code_vuid);
                                  return costCode ? `${costCode.code} - ${costCode.description}` : '-';
                                })()}
                              </span>
                            ) : (
                              <select
                                value={newLineData.cost_code_vuid}
                                onChange={(e) => setNewLineData(prev => ({...prev, cost_code_vuid: e.target.value}))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select Cost Code</option>
                                {getBudgetedCostCodes(createFormData.project_vuid).map((code) => (
                                  <option key={code.vuid} value={code.vuid}>
                                    {code.code} - {code.description}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '200px'}}>
                            {newLineData.commitment_line_vuid ? (
                              <span className="text-sm break-words">
                                {(() => {
                                  const costType = costTypes.find(c => c.vuid === newLineData.cost_type_vuid);
                                  return costType ? `${costType.cost_type} - ${costType.description}` : '-';
                                })()}
                              </span>
                            ) : (
                              <select
                                value={newLineData.cost_type_vuid}
                                onChange={(e) => setNewLineData(prev => ({...prev, cost_type_vuid: e.target.value}))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select Cost Type</option>
                                {getBudgetedCostTypes(createFormData.project_vuid).map((type) => (
                                  <option key={type.vuid} value={type.vuid}>
                                    {type.cost_type} - {type.description}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            <input
                              type="number"
                              step="0.01"
                              value={newLineData.quantity}
                              onChange={handleQuantityChange}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="1.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '100px'}}>
                            <input
                              type="number"
                              step="0.01"
                              value={newLineData.unit_price}
                              onChange={handleUnitPriceChange}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            {(() => {
                              const commitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
                              const commitmentLine = commitment?.line_items?.find(item => item.vuid === newLineData.commitment_line_vuid);
                              if (commitmentLine) {
                                // Calculate billed to date for this commitment line
                                const billedToDate = invoices
                                  .filter(inv => inv.project_vuid === createFormData.project_vuid && inv.status === 'approved')
                                  .flatMap(inv => inv.line_items || [])
                                  .filter(line => line.commitment_line_vuid === newLineData.commitment_line_vuid)
                                  .reduce((sum, line) => sum + (parseFloat(line.total_amount) || 0), 0);
                                return formatCurrency(billedToDate);
                              }
                              return '-';
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={newLineData.percent_complete}
                              onChange={handlePercentCompleteChange}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            <input
                              type="number"
                              step="0.01"
                              value={newLineData.total_amount}
                              onChange={handleAmountChange}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={newLineData.retainage_percentage}
                              onChange={handleRetainagePercentageChange}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="10.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            <span className="text-sm font-medium">
                              {formatCurrency((parseFloat(newLineData.total_amount) || 0) * (parseFloat(newLineData.retainage_percentage) || 0) / 100)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            {(() => {
                              const commitment = commitments.find(c => c.vuid === createFormData.commitment_vuid);
                              const commitmentLine = commitment?.line_items?.find(item => item.vuid === newLineData.commitment_line_vuid);
                              if (commitmentLine) {
                                // Calculate retained to date for this commitment line
                                const retainedToDate = invoices
                                  .filter(inv => inv.project_vuid === createFormData.project_vuid && inv.status === 'approved')
                                  .flatMap(inv => inv.line_items || [])
                                  .filter(line => line.commitment_line_vuid === newLineData.commitment_line_vuid)
                                  .reduce((sum, line) => sum + (parseFloat(line.retention_held) || 0), 0);
                                return formatCurrency(retainedToDate);
                              }
                              return '-';
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                            <input
                              type="number"
                              step="0.01"
                              value={newLineData.retention_released}
                              onChange={(e) => setNewLineData(prev => ({...prev, retention_released: e.target.value}))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900" style={{width: '100px'}}>
                            <button
                              onClick={handleAddLine}
                              className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded text-sm transition-colors"
                              title="Add this line"
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="font-semibold">
                          <td colSpan="10" className="px-4 py-3 text-right text-sm text-gray-700 border-r border-gray-200">
                            Totals:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                            {formatCurrency(createInvoiceLines.reduce((sum, line) => {
                              const amount = parseFloat(line.total_amount) || 0;
                              return sum + amount;
                            }, 0))}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-200">
                            {/* Retainage % - empty for totals */}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                            {formatCurrency(createInvoiceLines.reduce((sum, line) => {
                              const totalAmount = parseFloat(line.total_amount) || 0;
                              const retainagePercentage = parseFloat(line.retainage_percentage) || 0;
                              const calculatedRetention = Math.round((totalAmount * retainagePercentage) / 100 * 100) / 100;
                              return sum + calculatedRetention;
                            }, 0))}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-200">
                            {/* Retained to Date - empty for totals */}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                            {formatCurrency(createInvoiceLines.reduce((sum, line) => {
                              const released = parseFloat(line.retention_released) || 0;
                              return sum + released;
                            }, 0))}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {/* Actions - empty for totals */}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={creating || createInvoiceLines.length === 0}
                className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {creating ? 'Creating...' : `Create Invoice (${createInvoiceLines.length} lines)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Lines Modal */}
      {showViewLinesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Invoice Lines - {selectedInvoice?.invoice_number}
              </h3>
              <button
                onClick={() => setShowViewLinesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingLines ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {invoiceLineItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200" style={{tableLayout: 'fixed', width: '100%'}}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '50px'}}>
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '150px'}}>
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '80px'}}>
                            Qty
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '100px'}}>
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Retention Held
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '120px'}}>
                            Retention Released
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '200px'}}>
                            Cost Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{width: '200px'}}>
                            Cost Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '100px'}}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoiceLineItems.map((line, index) => (
                          <tr key={line.vuid} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200" style={{width: '50px'}}>
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '150px'}}>
                              {editingLineIndex === index ? (
                                <input
                                  type="text"
                                  value={editingLineData.description || ''}
                                  onChange={(e) => handleLineFieldChange(index, 'description', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="break-words">{line.description}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '80px'}}>
                              {editingLineIndex === index ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingLineData.quantity || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    handleLineFieldChange(index, 'quantity', value);
                                    const unitPrice = editingLineData.unit_price || line.unit_price;
                                    const total = calculateLineTotal(value, unitPrice);
                                    handleLineFieldChange(index, 'total_amount', total);
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                line.quantity
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '100px'}}>
                              {editingLineIndex === index ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingLineData.unit_price || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    handleLineFieldChange(index, 'unit_price', value);
                                    const quantity = editingLineData.quantity || line.quantity;
                                    const total = calculateLineTotal(quantity, value);
                                    handleLineFieldChange(index, 'total_amount', total);
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                formatCurrency(line.unit_price)
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              {editingLineIndex === index ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingLineData.total_amount || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    handleLineFieldChange(index, 'total_amount', value);
                                    handleLineFieldChange(index, 'quantity', '1');
                                    handleLineFieldChange(index, 'unit_price', value);
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                formatCurrency(line.total_amount)
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              {editingLineIndex === index ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingLineData.retention_held || ''}
                                  onChange={(e) => handleLineFieldChange(index, 'retention_held', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                formatCurrency(line.retention_held)
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '120px'}}>
                              {editingLineIndex === index ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingLineData.retention_released || ''}
                                  onChange={(e) => handleLineFieldChange(index, 'retention_released', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                formatCurrency(line.retention_released)
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '200px'}}>
                              {editingLineIndex === index ? (
                                <select
                                  value={editingLineData.cost_code_vuid || ''}
                                  onChange={(e) => handleLineFieldChange(index, 'cost_code_vuid', e.target.value)}
                                  disabled={!!line.commitment_line_vuid}
                                  className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${
                                    line.commitment_line_vuid ? 'bg-gray-100 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <option value="">Select Cost Code</option>
                                  {getBudgetedCostCodes(selectedInvoice?.project_vuid).map((code) => (
                                    <option key={code.vuid} value={code.vuid}>
                                      {code.code} - {code.description}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  <span className="text-sm break-words">
                                    {(() => {
                                      console.log('Rendering cost code for line:', line);
                                      console.log('Line cost_code_vuid:', line.cost_code_vuid);
                                      console.log('Available cost codes:', getAllCostCodes());
                                      const costCode = getAllCostCodes().find(c => c.vuid === line.cost_code_vuid);
                                      console.log('Found cost code:', costCode);
                                      return costCode ? `${costCode.code} - ${costCode.description}` : '-';
                                    })()}
                                  </span>
                                  {line.commitment_line_vuid && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded w-fit">
                                      From Commitment
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200" style={{width: '200px'}}>
                              {editingLineIndex === index ? (
                                <select
                                  value={editingLineData.cost_type_vuid || ''}
                                  onChange={(e) => handleLineFieldChange(index, 'cost_type_vuid', e.target.value)}
                                  disabled={!!line.commitment_line_vuid}
                                  className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${
                                    line.commitment_line_vuid ? 'bg-gray-100 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <option value="">Select Cost Type</option>
                                  {getBudgetedCostTypes(selectedInvoice?.project_vuid).map((type) => (
                                    <option key={type.vuid} value={type.vuid}>
                                      {type.cost_type} - {type.description}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  <span className="text-sm break-words">
                                    {(() => {
                                      console.log('Rendering cost type for line:', line);
                                      console.log('Line cost_type_vuid:', line.cost_type_vuid);
                                      console.log('Available cost types:', costTypes);
                                      const costType = costTypes.find(t => t.vuid === line.cost_type_vuid);
                                      console.log('Found cost type:', costType);
                                      return costType ? `${costType.cost_type} - ${costType.description}` : '-'
                                    })()}
                                  </span>
                                  {line.commitment_line_vuid && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded w-fit">
                                      From Commitment
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium" style={{width: '100px'}}>
                              {editingLineIndex === index ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleSaveLine(index)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Save changes"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-600 hover:text-gray-900"
                                    title="Cancel editing"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditLine(index)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit line"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="font-semibold">
                          <td colSpan="4" className="px-4 py-3 text-right text-sm text-gray-700 border-r border-gray-200">
                            Totals:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                            {formatCurrency(invoiceLineItems.reduce((sum, line) => {
                              const amount = parseFloat(line.total_amount) || 0;
                              return sum + amount;
                            }, 0))}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                            {formatCurrency(invoiceLineItems.reduce((sum, line) => {
                              const held = parseFloat(line.retention_held) || 0;
                              return sum + held;
                            }, 0))}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                            {formatCurrency(invoiceLineItems.reduce((sum, line) => {
                              const released = parseFloat(line.retention_released) || 0;
                              return sum + released;
                            }, 0))}
                          </td>
                          <td colSpan="2" className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">No line items found</p>
                    <p className="text-gray-600">This invoice doesn't have any line items yet.</p>
                  </div>
                )}
              </>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowViewLinesModal(false)}
                className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Invoice - {editingInvoice?.invoice_number}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Invoice Header Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={editFormData.invoice_number}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor *
                  </label>
                  <select
                    name="vendor_vuid"
                    value={editFormData.vendor_vuid}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.vuid} value={vendor.vuid}>
                        {vendor.vendor_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    name="project_vuid"
                    value={editFormData.project_vuid}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((project) => (
                      <option key={project.vuid} value={project.vuid}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment
                  </label>
                  <select
                    name="commitment_vuid"
                    value={editFormData.commitment_vuid}
                    onChange={handleEditFormChange}
                    disabled={!editFormData.project_vuid}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {editFormData.project_vuid ? 'Select a commitment...' : 'Select a project first...'}
                    </option>
                    {commitments
                      .filter(c => c.project_vuid === editFormData.project_vuid)
                      .map((commitment) => (
                        <option key={commitment.vuid} value={commitment.vuid}>
                          {commitment.commitment_number} - {commitment.commitment_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={editFormData.invoice_date}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={editFormData.due_date}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accounting Period *
                  </label>
                  <select
                    name="accounting_period_vuid"
                    value={editFormData.accounting_period_vuid}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select an accounting period...</option>
                    {accountingPeriods.map((period) => (
                      <option key={period.vuid} value={period.vuid}>
                        {period.month}/{period.year} - {period.period_name || 'Open Period'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select which accounting period this invoice will be recorded in
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    rows="3"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Invoice description"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInvoice}
                className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retrieve Invoices Modal */}
      {showRetrieveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Retrieve Invoices</h2>
              <button
                onClick={() => setShowRetrieveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600">
                  Select an integration to retrieve invoices from external systems.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Select Integration *
                </label>
                {integrations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">No integrations available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                            <p className="text-sm text-gray-600">{integration.integration_type}</p>
                          </div>
                          {retrieveIntegration?.vuid === integration.vuid && (
                            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRetrieveModal(false)}
                  className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetrieveInvoices}
                  disabled={!retrieveIntegration || loadingInvoices}
                  className={`px-8 py-4 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                    retrieveIntegration && !loadingInvoices
                      ? 'bg-gray-800 text-white hover:bg-gray-900'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loadingInvoices ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Retrieving...</span>
                    </div>
                  ) : (
                    'Retrieve Invoices'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Invoices Modal */}
      {procoreInvoices.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Import Invoices from Procore</h2>
              <button
                onClick={() => {
                  setProcoreInvoices([]);
                  setSelectedInvoices([]);
                  setRetrieveIntegration(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {procoreInvoices.length} Invoices Available for Import
                    </h3>
                    <p className="text-blue-700">
                      Selected: {selectedInvoices.length} invoices
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedInvoices(procoreInvoices.map(inv => inv.id))}
                      className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedInvoices([])}
                      className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-3">
                {procoreInvoices.map((invoice) => {
                  const isSelected = selectedInvoices.includes(invoice.id);
                  
                  return (
                    <div
                      key={invoice.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleInvoiceSelection(invoice.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleInvoiceSelection(invoice.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {invoice.invoice_number}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {invoice.description || 'No description'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Vendor:</span>
                              <span className="ml-1 text-gray-900">
                                {invoice.vendor?.name || 'Unknown Vendor'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Amount:</span>
                              <span className="ml-1 text-gray-900">
                                {formatCurrency(invoice.total_amount)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Date:</span>
                              <span className="ml-1 text-gray-900">
                                {formatDate(invoice.invoice_date)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Status:</span>
                              <span className={`ml-1 font-medium ${
                                invoice.status === 'approved' ? 'text-green-600' : 
                                invoice.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                                {invoice.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setProcoreInvoices([]);
                  setSelectedInvoices([]);
                  setRetrieveIntegration(null);
                }}
                className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleImportInvoices}
                disabled={selectedInvoices.length === 0}
                className={`px-8 py-4 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  selectedInvoices.length > 0
                    ? 'bg-gray-800 text-white hover:bg-gray-900'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Import Selected Invoices ({selectedInvoices.length})
              </button>
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

export default APInvoices;
