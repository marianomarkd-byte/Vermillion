import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Commitments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [commitments, setCommitments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredCommitments, setFilteredCommitments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [commitmentsPerPage] = useState(10);
  
  // Integration state
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);
  const [retrieving, setRetrieving] = useState(false);
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [retrievedCommitments, setRetrievedCommitments] = useState([]);
  const [selectedCommitments, setSelectedCommitments] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [importing, setImporting] = useState(false);
  
  // Commitment lines modal state
  const [showLinesModal, setShowLinesModal] = useState(false);
  const [selectedCommitmentForLines, setSelectedCommitmentForLines] = useState(null);
  const [commitmentLines, setCommitmentLines] = useState([]);
  const [loadingLines, setLoadingLines] = useState(false);
  
  // Import progress state
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, message: '' });
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    commitment_name: '',
    commitment_number: '',
    vendor_vuid: '',
    original_amount: '',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);
  
  // Edit commitment lines state
  const [editCommitmentLines, setEditCommitmentLines] = useState([]);
  const [editNewLineData, setEditNewLineData] = useState({
    description: '',
    amount: '',
    quantity: '',
    unit_price: '',
    cost_code_vuid: '',
    cost_type_vuid: ''
  });
  const [loadingEditLines, setLoadingEditLines] = useState(false);
  
  // Edit commitment lines state
  const [editingLineId, setEditingLineId] = useState(null);
  const [editingLineData, setEditingLineData] = useState({
    description: '',
    quantity: '',
    unit_price: '',
    cost_code_vuid: '',
    cost_type_vuid: ''
  });
  const [savingLine, setSavingLine] = useState(false);
  const [costCodes, setCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [projectBudgetLines, setProjectBudgetLines] = useState([]);
  const [projectCostCodes, setProjectCostCodes] = useState([]);
  
  // Create commitment modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    project_vuid: '',
    commitment_number: '',
    commitment_name: '',
    vendor_vuid: '',
    original_amount: '',
    status: 'active',
    description: ''
  });
  const [createCommitmentLines, setCreateCommitmentLines] = useState([]);
  const [newLineData, setNewLineData] = useState({
    description: '',
    amount: '',
    quantity: '',
    unit_price: '',
    cost_code_vuid: '',
    cost_type_vuid: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndPaginateCommitments();
  }, [commitments, searchTerm, statusFilter, currentPage, selectedProject]);

  // Handle URL parameters for project context
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectVuid = searchParams.get('project');
    const shouldCreate = searchParams.get('create') === 'true';
    
    console.log('🔍 URL parameters:', { projectVuid, shouldCreate, projectsLength: projects.length });
    
    if (projectVuid && projects.length > 0) {
      const project = projects.find(p => p.vuid === projectVuid);
      if (project) {
        console.log('✅ Setting project context from URL:', project.project_name);
        setSelectedProject(project);
        
        // If create=true parameter is present, open create modal with project prefilled
        if (shouldCreate) {
          console.log('🚀 Auto-opening create modal for project:', project.project_name);
          setCreateFormData(prev => ({
            ...prev,
            project_vuid: project.vuid
          }));
          // Fetch budget lines for the project
          fetchProjectBudgetLines(project.vuid);
          setShowCreateModal(true);
        }
      } else {
        console.log('❌ Project not found for VUID:', projectVuid);
      }
    } else if (projectVuid && projects.length === 0) {
      console.log('⏳ Project VUID found but projects not loaded yet');
    }
  }, [location.search, projects]);

  const filterAndPaginateCommitments = () => {
    let filtered = commitments.filter(commitment => {
      // First filter by project if one is selected
      if (selectedProject && commitment.project_vuid !== selectedProject.vuid) {
        return false;
      }
      
      const matchesSearch = 
        commitment.commitment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commitment.commitment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projects.find(p => p.vuid === commitment.project_vuid)?.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendors.find(v => v.vuid === commitment.vendor_vuid)?.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || commitment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredCommitments(filtered);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseURL = 'http://localhost:5001';
      const [commitmentsRes, projectsRes, vendorsRes, integrationsRes, costCodesRes, costTypesRes] = await Promise.all([
        fetch(`${baseURL}/api/project-commitments`),
        fetch(`${baseURL}/api/projects`),
        fetch(`${baseURL}/api/vendors`),
        fetch(`${baseURL}/api/integrations`),
        fetch(`${baseURL}/api/cost-codes`),
        fetch(`${baseURL}/api/cost-types`)
      ]);
      
      const [commitmentsData, projectsData, vendorsData, integrationsData, costCodesData, costTypesData] = await Promise.all([
        commitmentsRes.json(),
        projectsRes.json(),
        vendorsRes.json(),
        integrationsRes.json(),
        costCodesRes.json(),
        costTypesRes.json()
      ]);
      
      setCommitments(commitmentsData);
      setProjects(projectsData);
      setVendors(vendorsData);
      setIntegrations(integrationsData);
      setCostCodes(costCodesData);
      setCostTypes(costTypesData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieveModal = () => {
    setRetrieveIntegration(null);
    
    // Automatically set the project context if one is selected
    if (selectedProject) {
      console.log('Setting project context for retrieve modal:', selectedProject.project_name);
      // The project context will be automatically used when the import modal opens
    }
    
    setShowRetrieveModal(true);
  };

  const handleCommitmentSelection = (commitment, isSelected) => {
    console.log('Toggling commitment selection:', commitment.work_order_contract?.number, isSelected);
    
    if (isSelected) {
      setSelectedCommitments(prev => [...prev, commitment]);
    } else {
      setSelectedCommitments(prev => prev.filter(c => 
        c.work_order_contract?.number !== commitment.work_order_contract?.number
      ));
    }
  };

  const handleViewLines = async (commitment) => {
    try {
      setLoadingLines(true);
      setSelectedCommitmentForLines(commitment);
      
      const baseURL = 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/project-commitment-items?commitment_vuid=${commitment.vuid}`);
      
      if (response.ok) {
        const linesData = await response.json();
        setCommitmentLines(linesData);
      } else {
        console.error('Failed to fetch commitment lines');
        setCommitmentLines([]);
      }
      
      setShowLinesModal(true);
    } catch (error) {
      console.error('Error fetching commitment lines:', error);
      setCommitmentLines([]);
      setShowLinesModal(true);
    } finally {
      setLoadingLines(false);
    }
  };

  const handleEditCommitment = async (commitment) => {
    setEditingCommitment(commitment);
    setEditFormData({
      commitment_name: commitment.commitment_name || '',
      commitment_number: commitment.commitment_number || '',
      vendor_vuid: commitment.vendor_vuid || '',
      original_amount: commitment.original_amount || '',
      status: commitment.status || 'active'
    });
    
    // Load existing commitment lines
    setLoadingEditLines(true);
    try {
      const baseURL = 'http://localhost:5001';
      const linesResponse = await fetch(`${baseURL}/api/project-commitment-items?commitment_vuid=${commitment.vuid}`);
      if (linesResponse.ok) {
        const linesData = await linesResponse.json();
        setEditCommitmentLines(linesData);
      } else {
        setEditCommitmentLines([]);
      }
    } catch (error) {
      console.error('Error loading commitment lines:', error);
      setEditCommitmentLines([]);
    } finally {
      setLoadingEditLines(false);
    }
    
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingCommitment) return;
    
    setSaving(true);
    try {
      const baseURL = 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/project-commitments/${editingCommitment.vuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        const updatedCommitment = await response.json();
        setCommitments(prev => prev.map(c => 
          c.vuid === editingCommitment.vuid ? updatedCommitment : c
        ));
        setShowEditModal(false);
        setEditingCommitment(null);
        alert('Commitment updated successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update commitment');
      }
    } catch (error) {
      console.error('Error updating commitment:', error);
      alert(`Error updating commitment: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditLine = (line) => {
    setEditingLineId(line.vuid);
    setEditingLineData({
      description: line.description || '',
      quantity: line.quantity || '',
      unit_price: line.unit_price || '',
      cost_code_vuid: line.cost_code_vuid || '',
      cost_type_vuid: line.cost_type_vuid || ''
    });
  };

  const handleLineFormChange = (e) => {
    const { name, value } = e.target;
    setEditingLineData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveLine = async () => {
    if (!editingLineId || !selectedCommitmentForLines) return;
    
    setSavingLine(true);
    try {
      const baseURL = 'http://localhost:5001';
      const response = await fetch(`${baseURL}/api/project-commitments/${selectedCommitmentForLines.vuid}/items/${editingLineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingLineData)
      });

      if (response.ok) {
        const updatedLine = await response.json();
        setCommitmentLines(prev => prev.map(line => 
          line.vuid === editingLineId ? updatedLine : line
        ));
        setEditingLineId(null);
        setEditingLineData({
          description: '',
          amount: '',
          quantity: '',
          unit_price: '',
          cost_code_vuid: '',
          cost_type_vuid: ''
        });
        
        // Refresh the commitments data to show updated totals
        await fetchData();
        
        alert('Line item updated successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update line item');
      }
    } catch (error) {
      console.error('Error updating line item:', error);
      alert(`Error updating line item: ${error.message}`);
    } finally {
      setSavingLine(false);
    }
  };

  const handleCancelLineEdit = () => {
    setEditingLineId(null);
    setEditingLineData({
      description: '',
      amount: '',
      quantity: '',
      unit_price: '',
      cost_code_vuid: '',
      cost_type_vuid: ''
    });
  };

  // Edit commitment line handlers
  const handleEditAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setEditNewLineData(prev => ({
      ...prev,
      amount: e.target.value,
      quantity: amount > 0 ? '1' : '',
      unit_price: amount > 0 ? amount.toString() : ''
    }));
  };

  const handleEditQuantityChange = (e) => {
    const quantity = parseFloat(e.target.value) || 0;
    const unitPrice = parseFloat(editNewLineData.unit_price) || 0;
    const amount = quantity * unitPrice;
    
    setEditNewLineData(prev => ({
      ...prev,
      quantity: e.target.value,
      amount: amount > 0 ? amount.toString() : ''
    }));
  };

  const handleEditUnitPriceChange = (e) => {
    const unitPrice = parseFloat(e.target.value) || 0;
    const quantity = parseFloat(editNewLineData.quantity) || 0;
    const amount = quantity * unitPrice;
    
    setEditNewLineData(prev => ({
      ...prev,
      unit_price: e.target.value,
      amount: amount > 0 ? amount.toString() : ''
    }));
  };

  const handleAddEditLine = () => {
    if (!editNewLineData.description || (!editNewLineData.amount && (!editNewLineData.quantity || !editNewLineData.unit_price))) {
      alert('Please fill in description and either amount OR both quantity and unit price for the line item');
      return;
    }

    // If amount is provided, use it; otherwise calculate from quantity * unit price
    let finalAmount, finalQuantity, finalUnitPrice;
    
    if (editNewLineData.amount && parseFloat(editNewLineData.amount) > 0) {
      finalAmount = parseFloat(editNewLineData.amount);
      finalQuantity = 1;
      finalUnitPrice = finalAmount;
    } else {
      finalQuantity = parseFloat(editNewLineData.quantity);
      finalUnitPrice = parseFloat(editNewLineData.unit_price);
      finalAmount = finalQuantity * finalUnitPrice;
    }

    const newLine = {
      vuid: `temp-${Date.now()}`,
      description: editNewLineData.description,
      quantity: finalQuantity,
      unit_price: finalUnitPrice,
      total_amount: finalAmount,
      cost_code_vuid: editNewLineData.cost_code_vuid,
      cost_type_vuid: editNewLineData.cost_type_vuid
    };

    setEditCommitmentLines(prev => [...prev, newLine]);
    
    // Clear the new line form
    setEditNewLineData({
      description: '',
      amount: '',
      quantity: '',
      unit_price: '',
      cost_code_vuid: '',
      cost_type_vuid: ''
    });
  };

  const handleRemoveEditLine = (index) => {
    setEditCommitmentLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEditWithLines = async () => {
    if (!editingCommitment) return;
    
    setSaving(true);
    try {
      const baseURL = 'http://localhost:5001';
      
      // First update the commitment header
      const response = await fetch(`${baseURL}/api/project-commitments/${editingCommitment.vuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update commitment');
      }

      // Then create any new line items
      for (const line of editCommitmentLines) {
        if (line.vuid.startsWith('temp-')) {
          const lineData = {
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            total_amount: line.total_amount,
            cost_code_vuid: line.cost_code_vuid,
            cost_type_vuid: line.cost_type_vuid
          };

          const lineResponse = await fetch(`${baseURL}/api/project-commitments/${editingCommitment.vuid}/items`, {
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
      }

      // Update the commitment amount to include new lines
      const totalAmount = editCommitmentLines.reduce((sum, line) => sum + (line.total_amount || 0), 0);
      if (totalAmount > 0) {
        await fetch(`${baseURL}/api/project-commitments/${editingCommitment.vuid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...editFormData,
            original_amount: totalAmount
          }),
        });
      }

      const updatedCommitment = await response.json();
      setCommitments(prev => prev.map(c => 
        c.vuid === editingCommitment.vuid ? updatedCommitment : c
      ));
      setShowEditModal(false);
      setEditingCommitment(null);
      setEditCommitmentLines([]);
      
      // Refresh the commitments data to show updated totals
      await fetchData();
      
      alert('Commitment and lines updated successfully!');
    } catch (error) {
      console.error('Error updating commitment:', error);
      alert(`Error updating commitment: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper functions to get budget-filtered cost codes and cost types
  const getBudgetCostCodes = () => {
    console.log('🔍 getBudgetCostCodes called:', {
      project_vuid: createFormData.project_vuid,
      budgetLinesCount: projectBudgetLines.length,
      globalCostCodesCount: costCodes.length,
      projectCostCodesCount: projectCostCodes.length
    });
    
    if (!createFormData.project_vuid || projectBudgetLines.length === 0) {
      console.log('📋 No project or budget lines, returning all active cost codes');
      return costCodes.filter(c => c.status === 'active');
    }
    
    // Get unique cost codes from budget lines
    const budgetCostCodeVuids = [...new Set(projectBudgetLines.map(line => line.cost_code_vuid))];
    
    // Combine global and project-specific cost codes for filtering
    const allCostCodes = [...costCodes, ...projectCostCodes];
    
    const filteredCostCodes = allCostCodes.filter(c => {
      // Project-specific cost codes don't have a status field, so treat them as active
      const statusMatch = c.status === 'active' || c.is_project_specific;
      const vuidMatch = budgetCostCodeVuids.includes(c.vuid);
      
      return statusMatch && vuidMatch;
    });
    
    console.log('🎯 Budget filtering result:', {
      budgetCostCodeVuids: budgetCostCodeVuids.slice(0, 5),
      allCostCodesCount: allCostCodes.length,
      filteredCount: filteredCostCodes.length,
      sampleFiltered: filteredCostCodes.slice(0, 3).map(c => ({ vuid: c.vuid, code: c.code, is_project_specific: c.is_project_specific })),
      sampleBudgetVuids: budgetCostCodeVuids.slice(0, 3),
      sampleAvailableVuids: allCostCodes.slice(0, 5).map(c => c.vuid),
      vuidsMatch: budgetCostCodeVuids.some(budgetVuid => allCostCodes.some(costCode => costCode.vuid === budgetVuid))
    });
    
    return filteredCostCodes;
  };

  const getBudgetCostTypes = (selectedCostCodeVuid) => {
    if (!createFormData.project_vuid || projectBudgetLines.length === 0 || !selectedCostCodeVuid) {
      return costTypes.filter(t => t.status === 'active');
    }
    
    // Get cost types that exist for the selected cost code in budget lines
    const validCostTypeVuids = projectBudgetLines
      .filter(line => line.cost_code_vuid === selectedCostCodeVuid)
      .map(line => line.cost_type_vuid);
    
    return costTypes.filter(t => t.status === 'active' && validCostTypeVuids.includes(t.vuid));
  };

  // Fetch project budget lines and project cost codes for cost code/type filtering
  const fetchProjectBudgetLines = async (projectVuid) => {
    try {
      console.log('🔄 Fetching budget lines and project cost codes for project:', projectVuid);
      const baseURL = 'http://localhost:5001';
      
      // Fetch both budget lines and project cost codes
      const [budgetLinesResponse, projectCostCodesResponse] = await Promise.all([
        fetch(`${baseURL}/api/projects/${projectVuid}/budget-lines`),
        fetch(`${baseURL}/api/projects/${projectVuid}/cost-codes`)
      ]);
      
      const [budgetLinesData, projectCostCodesData] = await Promise.all([
        budgetLinesResponse.json(),
        projectCostCodesResponse.json()
      ]);
      
      setProjectBudgetLines(budgetLinesData || []);
      
      // Filter to only project-specific cost codes
      const projectSpecificCostCodes = (projectCostCodesData || []).filter(c => c.is_project_specific);
      setProjectCostCodes(projectSpecificCostCodes);
      
      console.log('✅ Fetched budget lines:', budgetLinesData?.length || 0);
      console.log('✅ Fetched project-specific cost codes:', projectSpecificCostCodes.length);
      console.log('📊 Total cost codes from API:', projectCostCodesData?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching project data:', error);
      setProjectBudgetLines([]);
      setProjectCostCodes([]);
    }
  };

  const handleCreateModal = () => {
    console.log('🔧 handleCreateModal called, selectedProject:', selectedProject);
    
    // Pre-populate project if one is selected
    if (selectedProject) {
      console.log('✅ Prefilling project:', selectedProject.project_name);
      setCreateFormData(prev => ({
        ...prev,
        project_vuid: selectedProject.vuid
      }));
      
      // Fetch project budget lines for cost code/type filtering
      fetchProjectBudgetLines(selectedProject.vuid);
    } else {
      console.log('⚠️ No selectedProject found for prefilling');
      setProjectBudgetLines([]); // Clear budget lines if no project
    }
    setShowCreateModal(true);
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If project changes, fetch budget lines for cost code/type filtering
    if (name === 'project_vuid' && value) {
      fetchProjectBudgetLines(value);
      // Clear cost code and cost type selections when project changes
      setNewLineData(prev => ({
        ...prev,
        cost_code_vuid: '',
        cost_type_vuid: ''
      }));
    } else if (name === 'project_vuid' && !value) {
      // Clear budget lines if no project selected
      setProjectBudgetLines([]);
    }
  };

  const handleAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setNewLineData(prev => ({
      ...prev,
      amount: e.target.value,
      quantity: amount > 0 ? '1' : '',
      unit_price: amount > 0 ? amount.toString() : ''
    }));
  };

  const handleQuantityChange = (e) => {
    const quantity = parseFloat(e.target.value) || 0;
    const unitPrice = parseFloat(newLineData.unit_price) || 0;
    const amount = quantity * unitPrice;
    
    setNewLineData(prev => ({
      ...prev,
      quantity: e.target.value,
      amount: amount > 0 ? amount.toString() : ''
    }));
  };

  const handleUnitPriceChange = (e) => {
    const unitPrice = parseFloat(e.target.value) || 0;
    const quantity = parseFloat(newLineData.quantity) || 0;
    const amount = quantity * unitPrice;
    
    setNewLineData(prev => ({
      ...prev,
      unit_price: e.target.value,
      amount: amount > 0 ? amount.toString() : ''
    }));
  };

  const handleAddLine = () => {
    if (!newLineData.description || (!newLineData.amount && (!newLineData.quantity || !newLineData.unit_price))) {
      alert('Please fill in description and either amount OR both quantity and unit price for the line item');
      return;
    }

    // If amount is provided, use it; otherwise calculate from quantity * unit price
    let finalAmount, finalQuantity, finalUnitPrice;
    
    if (newLineData.amount && parseFloat(newLineData.amount) > 0) {
      finalAmount = parseFloat(newLineData.amount);
      finalQuantity = 1;
      finalUnitPrice = finalAmount;
    } else {
      finalQuantity = parseFloat(newLineData.quantity);
      finalUnitPrice = parseFloat(newLineData.unit_price);
      finalAmount = finalQuantity * finalUnitPrice;
    }

    const newLine = {
      vuid: `temp-${Date.now()}`, // Temporary ID for new lines
      description: newLineData.description,
      quantity: finalQuantity,
      unit_price: finalUnitPrice,
      cost_code_vuid: newLineData.cost_code_vuid,
      cost_type_vuid: newLineData.cost_type_vuid,
      total_amount: finalAmount
    };

    setCreateCommitmentLines(prev => [...prev, newLine]);
    
    // Clear the new line form
    setNewLineData({
      description: '',
      amount: '',
      quantity: '',
      unit_price: '',
      cost_code_vuid: '',
      cost_type_vuid: ''
    });
  };

  const handleRemoveLine = (index) => {
    setCreateCommitmentLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateCommitment = async () => {
    if (!createFormData.project_vuid || !createFormData.commitment_number || !createFormData.commitment_name || !createFormData.vendor_vuid) {
      alert('Please fill in all required fields: Project, Commitment Number, Commitment Name, and Vendor');
      return;
    }

    if (createCommitmentLines.length === 0) {
      alert('Please add at least one line item to the commitment');
      return;
    }

    setCreating(true);

    try {
      const baseURL = 'http://localhost:5001';
      
      // First, get an open accounting period
      const accountingPeriodsRes = await fetch(`${baseURL}/api/accounting-periods/open`);
      const accountingPeriods = await accountingPeriodsRes.json();
      
      if (!accountingPeriods || accountingPeriods.length === 0) {
        throw new Error('No open accounting periods found. Please create an open accounting period first.');
      }
      
      const openPeriod = accountingPeriods[0];

      // Create the commitment
      const commitmentData = {
        ...createFormData,
        accounting_period_vuid: openPeriod.vuid,
        commitment_date: new Date().toISOString().split('T')[0],
        original_amount: createCommitmentLines.reduce((sum, line) => sum + (line.total_amount || 0), 0)
      };

      const response = await fetch(`${baseURL}/api/project-commitments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitmentData),
      });

      if (response.ok) {
        const newCommitment = await response.json();
        
        // Create the commitment lines
        for (const line of createCommitmentLines) {
          const lineData = {
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            total_amount: line.total_amount,
            cost_code_vuid: line.cost_code_vuid,
            cost_type_vuid: line.cost_type_vuid
          };

          const lineResponse = await fetch(`${baseURL}/api/project-commitments/${newCommitment.vuid}/items`, {
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
          project_vuid: '',
          commitment_number: '',
          commitment_name: '',
          vendor_vuid: '',
          original_amount: '',
          status: 'active',
          description: ''
        });
        setCreateCommitmentLines([]);
        setShowCreateModal(false);
        
        // Refresh the commitments list
        await fetchData();
        
        alert('Commitment created successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to create commitment');
      }
    } catch (error) {
      console.error('Error creating commitment:', error);
      alert(`Error creating commitment: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectAllCommitments = () => {
    console.log('Selecting all commitments');
    setSelectedCommitments([...retrievedCommitments]);
  };

  const handleClearAllCommitments = () => {
    console.log('Clearing all commitment selections');
    setSelectedCommitments([]);
  };

  const handleImportCommitments = async () => {
    console.log('=== IMPORT COMMITMENTS STARTED ===');
    
    if (!selectedProject) {
      alert('Please select a project for the commitments');
      return;
    }
    
    if (selectedCommitments.length === 0) {
      alert('Please select at least one commitment to import');
      return;
    }

    setImporting(true);

    try {
      console.log('Importing commitments:', {
        project: selectedProject.project_name,
        commitmentCount: selectedCommitments.length
      });

      const baseURL = 'http://localhost:5001';
      
      // First, get an open accounting period
      console.log('Fetching open accounting periods...');
      const accountingPeriodsRes = await fetch(`${baseURL}/api/accounting-periods/open`);
      const accountingPeriods = await accountingPeriodsRes.json();
      
      if (!accountingPeriods || accountingPeriods.length === 0) {
        throw new Error('No open accounting periods found. Please create an open accounting period first.');
      }
      
      const openPeriod = accountingPeriods[0]; // Use the first open period
      console.log('Using accounting period:', openPeriod);
      
      // Get vendors for mapping
      console.log('Fetching vendors for mapping...');
      const vendorsRes = await fetch(`${baseURL}/api/vendors`);
      const allVendors = await vendorsRes.json();
      
      let successCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (let i = 0; i < selectedCommitments.length; i++) {
        const commitment = selectedCommitments[i];
        try {
          setImportProgress({
            current: i + 1,
            total: selectedCommitments.length,
            message: `Processing commitment: ${commitment.work_order_contract?.number}`
          });
          console.log('Processing commitment:', commitment.work_order_contract?.number);
          
          // Try to find matching vendor
          const vendorName = commitment.work_order_contract?.vendor?.name;
          let vendor = null;
          if (vendorName) {
            vendor = allVendors.find(v => 
              v.vendor_name?.toLowerCase().includes(vendorName.toLowerCase()) ||
              vendorName.toLowerCase().includes(v.vendor_name?.toLowerCase())
            );
          }
          
          // If no vendor found, create a default one or use the first available vendor
          if (!vendor && allVendors.length > 0) {
            vendor = allVendors[0]; // Use first vendor as fallback
            console.log(`No matching vendor found for "${vendorName}", using fallback:`, vendor.vendor_name);
          }
          
          if (!vendor) {
            errors.push(`${commitment.work_order_contract?.number}: No vendors available in system`);
            skippedCount++;
            continue;
          }
          
          // Create the commitment object for import with all required fields
          const commitmentData = {
            project_vuid: selectedProject.vuid,
            accounting_period_vuid: openPeriod.vuid,
            commitment_number: commitment.work_order_contract?.number || 'Unknown',
            commitment_name: commitment.work_order_contract?.title || 'Imported Commitment',
            vendor_vuid: vendor.vuid,
            commitment_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
            original_amount: commitment.work_order_contract?.grand_total || 0,
            status: 'active',
            description: `Imported from Procore - Original vendor: ${vendorName || 'Unknown'}`
          };
          
          console.log('Commitment data to import:', commitmentData);
          
          const response = await fetch(`${baseURL}/api/project-commitments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(commitmentData),
          });

          if (response.ok) {
            const newCommitment = await response.json();
            console.log(`Successfully imported commitment: ${commitmentData.commitment_number}`);
            
            // Now import the commitment lines
            if (commitment.work_order_contract_lines && commitment.work_order_contract_lines.length > 0) {
              console.log(`Importing ${commitment.work_order_contract_lines.length} line items for commitment ${commitmentData.commitment_number}`);
              
              let linesImported = 0;
              for (const line of commitment.work_order_contract_lines) {
                try {
                  // Map cost code if available
                  let costCodeVuid = null;
                  if (line.cost_code?.code) {
                    // Try to find matching cost code
                    const costCodesRes = await fetch(`${baseURL}/api/cost-codes`);
                    const costCodes = await costCodesRes.json();
                    const matchingCostCode = costCodes.find(cc => 
                      cc.code === line.cost_code.code || 
                      cc.description?.toLowerCase().includes(line.cost_code.description?.toLowerCase())
                    );
                    if (matchingCostCode) {
                      costCodeVuid = matchingCostCode.vuid;
                    }
                  }
                  
                  // Map cost type if available
                  let costTypeVuid = null;
                  if (line.cost_type?.name) {
                    // Try to find matching cost type
                    const costTypesRes = await fetch(`${baseURL}/api/cost-types`);
                    const costTypes = await costTypesRes.json();
                    const matchingCostType = costTypes.find(ct => 
                      ct.name === line.cost_type.name || 
                      ct.abbreviation === line.cost_type.abbreviation
                    );
                    if (matchingCostType) {
                      costTypeVuid = matchingCostType.vuid;
                    }
                  }
                  
                  const lineData = {
                    commitment_vuid: newCommitment.vuid,
                    line_number: line.id?.toString() || `Line ${linesImported + 1}`,
                    description: line.description || 'Imported line item',
                    quantity: line.quantity || 1,
                    unit_price: line.unit_price || 0,
                    total_amount: line.total_amount || 0,
                    cost_code_vuid: costCodeVuid,
                    cost_type_vuid: costTypeVuid,
                    status: 'active'
                  };
                  
                  const lineResponse = await fetch(`${baseURL}/api/project-commitments/${newCommitment.vuid}/items`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(lineData),
                  });
                  
                  if (lineResponse.ok) {
                    linesImported++;
                    console.log(`Imported line item: ${lineData.description}`);
                  } else {
                    console.error(`Failed to import line item:`, await lineResponse.text());
                  }
                } catch (lineError) {
                  console.error(`Error importing line item:`, lineError);
                }
              }
              
              console.log(`Successfully imported ${linesImported} line items for commitment ${commitmentData.commitment_number}`);
            }
            
            successCount++;
          } else {
            const errorData = await response.text();
            console.error(`Failed to import commitment ${commitmentData.commitment_number}:`, errorData);
            errors.push(`${commitmentData.commitment_number}: ${errorData}`);
            skippedCount++;
          }
        } catch (error) {
          console.error(`Error importing commitment:`, error);
          errors.push(`${commitment.work_order_contract?.number}: ${error.message}`);
          skippedCount++;
        }
      }

      // Show results
      let message = `Import completed: ${successCount} commitments imported`;
      if (skippedCount > 0) {
        message += `, ${skippedCount} skipped`;
        if (errors.length > 0) {
          message += `\n\nErrors:\n${errors.length > 0 ? errors.join('\n') : ''}`;
        }
      }
      message += `\n\nCheck the console for detailed line item import information.`;
      
      alert(message);
      
      // Refresh the commitments list and close the modal
      await fetchData();
      setShowImportModal(false);
      setSelectedCommitments([]);
      setSelectedProject(null);
      
    } catch (error) {
      console.error('Error during import process:', error);
      alert(`Error during import: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleRetrieveCommitments = async () => {
    console.log('=== RETRIEVE COMMITMENTS STARTED ===');
    
    if (!retrieveIntegration) {
      alert('Please select an integration');
      return;
    }

    setRetrieving(true);

    try {
      console.log(`Retrieving commitments from integration ${retrieveIntegration.integration_name}`);
      console.log('Integration details:', retrieveIntegration);
      
      // Call the mock Procore API to get commitments
      const baseURL = 'http://localhost:5001';
      console.log('Making request to:', `${baseURL}/api/mock-procore/commitments`);
      
      const response = await fetch(`${baseURL}/api/mock-procore/commitments`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Retrieved data from Procore API:', data);
      console.log('Data type:', typeof data);
      console.log('Data structure:', data);
      
      // The API returns an object with a 'commitments' key, not a direct array
      let commitmentsArray = data.commitments || data;
      
      if (!Array.isArray(commitmentsArray)) {
        console.error('Expected array but got:', typeof commitmentsArray);
        console.error('Data structure:', data);
        throw new Error('Invalid data format received from API - expected array of commitments');
      }
      
      console.log('Number of commitments retrieved:', commitmentsArray.length);
      
      // Check if any commitments are locked
      const lockedCommitments = commitmentsArray.filter(commitment => 
        commitment.work_order_contract && commitment.work_order_contract.locked === true
      );
      
      console.log('Locked commitments found:', lockedCommitments.length);
      console.log('Locked commitments data:', lockedCommitments);
      
      // Log vendor details for debugging
      commitmentsArray.forEach((commitment, index) => {
        console.log(`Commitment ${index + 1}:`, {
          number: commitment.work_order_contract?.number,
          vendor: commitment.work_order_contract?.vendor,
          locked: commitment.work_order_contract?.locked,
          items: commitment.work_order_contract_lines?.length || 0
        });
      });
      
      if (lockedCommitments.length === 0) {
        alert(`Retrieved ${commitmentsArray.length} commitments but none are locked. Only locked commitments can be imported. Check console for details.`);
        setShowRetrieveModal(false);
        setRetrieveIntegration(null);
        return;
      }
      
      console.log('Setting retrieved commitments and opening import modal...');
      
      // Set the retrieved commitments and show the import modal
      setRetrievedCommitments(lockedCommitments);
      setSelectedCommitments([]); // Clear previous selections
      // Keep the selectedProject context for automatic import
      setShowImportModal(true);
      
      // Close the retrieve modal
      setShowRetrieveModal(false);
      setRetrieveIntegration(null);
    } catch (error) {
      console.error('Error retrieving commitments from integration:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Error retrieving commitments from integration: ${error.message}. Check console for details.`);
    } finally {
      setRetrieving(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDeleteCommitment = async (commitment) => {
    if (!window.confirm(`Are you sure you want to delete commitment "${commitment.commitment_number}"? This action cannot be undone and will also delete all associated line items.`)) {
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      
      // First delete all commitment items (lines)
      const itemsResponse = await fetch(`${baseURL}/api/project-commitment-items?commitment_vuid=${commitment.vuid}`);
      if (itemsResponse.ok) {
        const items = await itemsResponse.json();
        for (const item of items) {
          await fetch(`${baseURL}/api/project-commitments/${commitment.vuid}/items/${item.vuid}`, {
            method: 'DELETE'
          });
        }
      }
      
      // Then delete the commitment
      const response = await fetch(`${baseURL}/api/project-commitments/${commitment.vuid}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log(`Successfully deleted commitment: ${commitment.commitment_number}`);
        // Refresh the commitments list
        await fetchData();
        alert(`Commitment "${commitment.commitment_number}" has been deleted successfully.`);
      } else {
        const errorData = await response.text();
        console.error(`Failed to delete commitment ${commitment.commitment_number}:`, errorData);
        alert(`Failed to delete commitment: ${errorData}`);
      }
    } catch (error) {
      console.error('Error deleting commitment:', error);
      alert(`Error deleting commitment: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg font-semibold text-gray-600">Loading commitments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Commitments</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage project commitments and contracts. Click "View Lines" to see detailed line items for each commitment.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateModal}
                className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                + Create New Commitment
              </button>
              <button
                onClick={handleRetrieveModal}
                className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Retrieve Commitments
              </button>
            </div>
          </div>
          
          {/* Project Filter Indicator */}
          {selectedProject && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Showing commitments for:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {selectedProject.project_name}
              </span>
              <button
                onClick={() => {
                  setSelectedProject(null);
                  // Clear the URL parameter
                  const newUrl = new URL(window.location);
                  newUrl.searchParams.delete('project');
                  window.history.replaceState({}, '', newUrl);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear project filter"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {selectedProject ? 'Project Commitments' : 'Total Commitments'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{filteredCommitments.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">{filteredCommitments.filter(c => c.status === 'active').length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inactive</dt>
                    <dd className="text-lg font-medium text-gray-900">{filteredCommitments.filter(c => c.status === 'inactive').length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(filteredCommitments.reduce((sum, c) => sum + (c.original_amount || 0), 0))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search commitments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Commitments List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commitment #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
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
              {filteredCommitments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">No commitments found</p>
                      <p className="text-gray-600">
                        {selectedProject 
                          ? `No commitments found for project "${selectedProject.project_name}". Try adjusting your search criteria or create a new commitment.`
                          : 'Try adjusting your search criteria or create a new commitment.'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCommitments
                  .slice((currentPage - 1) * commitmentsPerPage, currentPage * commitmentsPerPage)
                  .map((commitment) => (
                  <tr key={commitment.vuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {commitment.commitment_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {commitment.commitment_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {projects.find(p => p.vuid === commitment.project_vuid)?.project_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendors.find(v => v.vuid === commitment.vendor_vuid)?.vendor_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(commitment.original_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        commitment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {commitment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCommitment(commitment)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleViewLines(commitment)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          View Lines
                        </button>
                        <button
                          onClick={() => navigate(`/commitment-change-orders?commitment=${commitment.vuid}`)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                          title="View Commitment Change Orders"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Change Orders
                        </button>
                        <button
                          onClick={() => handleDeleteCommitment(commitment)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredCommitments.length > commitmentsPerPage && (
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * commitmentsPerPage) + 1} to {Math.min(currentPage * commitmentsPerPage, filteredCommitments.length)} of {filteredCommitments.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {Math.ceil(filteredCommitments.length / commitmentsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredCommitments.length / commitmentsPerPage), currentPage + 1))}
                disabled={currentPage >= Math.ceil(filteredCommitments.length / commitmentsPerPage)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Retrieve Commitments Modal */}
      {showRetrieveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Retrieve Commitments</h2>
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
                  Select an integration to retrieve commitments from external systems.
                </p>
                {selectedProject && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Project Context:</strong> Commitments will be imported to "{selectedProject.project_name}"
                    </p>
                  </div>
                )}
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
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetrieveCommitments}
                  disabled={!retrieveIntegration || retrieving}
                  className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                    retrieveIntegration && !retrieving
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {retrieving ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Retrieving...</span>
                    </div>
                  ) : (
                    'Retrieve Commitments'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Commitments Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Import Commitments from Procore</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Project Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project for Import:
                </label>
                <select
                  value={selectedProject?.vuid || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.vuid === e.target.value);
                    setSelectedProject(project);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a project...</option>
                  {projects.map((project) => (
                    <option key={project.vuid} value={project.vuid}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
                {selectedProject && (
                  <p className="mt-2 text-sm text-green-600">
                    <strong>✓ Project Context Set:</strong> Commitments will be imported to "{selectedProject.project_name}"
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Note:</strong> Each commitment will be imported with its line items, cost codes, and cost types.
                </p>
              </div>

              {/* Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {retrievedCommitments.length} Locked Commitments Available for Import
                    </h3>
                    <p className="text-blue-700">
                      Selected: {selectedCommitments.length} commitments
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllCommitments}
                      className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearAllCommitments}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Commitments List */}
              <div className="space-y-3">
                {retrievedCommitments.map((commitment, index) => {
                  const isSelected = selectedCommitments.some(c => 
                    c.work_order_contract?.number === commitment.work_order_contract?.number
                  );
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleCommitmentSelection(commitment, !isSelected)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleCommitmentSelection(commitment, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {commitment.work_order_contract?.number || 'Unknown Number'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {commitment.work_order_contract?.title || 'No title'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Vendor:</span>
                              <span className="ml-1 text-gray-900">
                                {commitment.work_order_contract?.vendor?.name || 'Unknown Vendor'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Amount:</span>
                              <span className="ml-1 text-gray-900">
                                ${commitment.work_order_contract?.grand_total?.toLocaleString() || '0.00'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Status:</span>
                              <span className="ml-1 text-green-600 font-medium">Locked</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Line Items:</span>
                              <span className="ml-1 text-gray-900">
                                {commitment.work_order_contract_lines?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-blue-600 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Import Progress */}
            {importing && (
              <div className="px-6 py-4 border-t border-gray-200 bg-blue-50">
                <div className="flex items-center space-x-3">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900">{importProgress.message}</div>
                    <div className="text-xs text-blue-700">
                      Progress: {importProgress.current} of {importProgress.total}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCommitments}
                disabled={!selectedProject || selectedCommitments.length === 0 || importing}
                className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                  selectedProject && selectedCommitments.length > 0 && !importing
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {importing ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Importing...</span>
                  </div>
                ) : (
                  `Import ${selectedCommitments.length} Commitment${selectedCommitments.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commitment Lines Modal */}
      {showLinesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Commitment Lines - {selectedCommitmentForLines?.commitment_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCommitmentForLines?.commitment_number} • {projects.find(p => p.vuid === selectedCommitmentForLines?.project_vuid)?.project_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowLinesModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Lines Table */}
              {loadingLines ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-lg font-semibold text-gray-600">Loading commitment lines...</div>
                </div>
              ) : commitmentLines.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 mb-2">No commitment lines found</p>
                  <p className="text-gray-600">This commitment doesn't have any line items yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Line #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commitmentLines.map((line, index) => (
                        <tr key={line.vuid || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {line.line_number || `Line ${index + 1}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingLineId === line.vuid ? (
                              <input
                                type="text"
                                name="description"
                                value={editingLineData.description}
                                onChange={handleLineFormChange}
                                className="block w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              line.description || 'No description'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingLineId === line.vuid ? (
                              <input
                                type="number"
                                name="quantity"
                                value={editingLineData.quantity}
                                onChange={handleLineFormChange}
                                step="0.01"
                                min="0"
                                className="block w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              line.quantity ? line.quantity.toLocaleString() : '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingLineId === line.vuid ? (
                              <input
                                type="number"
                                name="unit_price"
                                value={editingLineData.unit_price}
                                onChange={handleLineFormChange}
                                step="0.01"
                                min="0"
                                className="block w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              line.unit_price ? formatCurrency(line.unit_price) : '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(line.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingLineId === line.vuid ? (
                              <select
                                name="cost_code_vuid"
                                value={editingLineData.cost_code_vuid}
                                onChange={handleLineFormChange}
                                className="block w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select cost code...</option>
                                {costCodes.map((costCode) => (
                                  <option key={costCode.vuid} value={costCode.vuid}>
                                    {costCode.code} - {costCode.description}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              line.cost_code?.code || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingLineId === line.vuid ? (
                              <select
                                name="cost_type_vuid"
                                value={editingLineData.cost_type_vuid}
                                onChange={handleLineFormChange}
                                className="block w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select cost type...</option>
                                {costTypes.map((costType) => (
                                  <option key={costType.vuid} value={costType.vuid}>
                                    {costType.cost_type}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              line.cost_type?.cost_type || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingLineId === line.vuid ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleSaveLine}
                                  disabled={savingLine}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                >
                                  {savingLine ? (
                                    <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelLineEdit}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditLine(line)}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                     {/* Summary Row */}
                     <tfoot className="bg-gray-50">
                       <tr className="font-semibold">
                         <td colSpan="4" className="px-6 py-3 text-right text-sm text-gray-700">
                           Total:
                         </td>
                         <td className="px-6 py-3 text-sm font-bold text-gray-900">
                           {formatCurrency(commitmentLines.reduce((sum, line) => sum + (line.total_amount || 0), 0))}
                         </td>
                         <td colSpan="3" className="px-6 py-3"></td>
                       </tr>
                     </tfoot>
                   </table>
                 </div>
               )}

              {/* Modal Footer */}
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowLinesModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Commitment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Commitment</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 gap-6">
                {/* Commitment Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment Name *
                  </label>
                  <input
                    type="text"
                    name="commitment_name"
                    value={editFormData.commitment_name}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Commitment Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment Number *
                  </label>
                  <input
                    type="text"
                    name="commitment_number"
                    value={editFormData.commitment_number}
                    onChange={handleEditFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Vendor */}
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

                {/* Original Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Amount *
                  </label>
                  <input
                    type="number"
                    name="original_amount"
                    value={editFormData.original_amount}
                    onChange={handleEditFormChange}
                    step="0.01"
                    min="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Status */}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Calculated Total Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Commitment Amount
                  </label>
                  <div className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-lg font-semibold text-gray-900">
                    {formatCurrency(editCommitmentLines.reduce((sum, line) => sum + (line.total_amount || 0), 0))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Automatically calculated from line items</p>
                </div>
              </div>

              {/* Commitment Lines Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commitment Lines</h3>
                
                {/* Existing Lines */}
                {loadingEditLines ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading lines...</p>
                  </div>
                ) : (
                  <>
                    {editCommitmentLines.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Existing Lines</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700 mb-2">
                            <div>Description</div>
                            <div>Quantity</div>
                            <div>Unit Price</div>
                            <div>Total Amount</div>
                            <div>Cost Code</div>
                            <div>Cost Type</div>
                          </div>
                          {editCommitmentLines.map((line, index) => (
                            <div key={line.vuid} className="grid grid-cols-6 gap-4 py-2 border-t border-gray-200">
                              <div className="text-sm text-gray-900">{line.description}</div>
                              <div className="text-sm text-gray-900">{line.quantity}</div>
                              <div className="text-sm text-gray-900">${line.unit_price}</div>
                              <div className="text-sm text-gray-900">${line.total_amount}</div>
                              <div className="text-sm text-gray-900">
                                {costCodes.find(c => c.vuid === line.cost_code_vuid)?.code || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-900">
                                {costTypes.find(c => c.vuid === line.cost_type_vuid)?.cost_type || 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Line Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="text-md font-medium text-gray-700 mb-3">Add New Line</h4>
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                          </label>
                          <input
                            type="text"
                            name="description"
                            value={editNewLineData.description}
                            onChange={(e) => setEditNewLineData(prev => ({ ...prev, description: e.target.value }))}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Line description"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cost Code
                          </label>
                          <select
                            name="cost_code_vuid"
                            value={editNewLineData.cost_code_vuid}
                            onChange={(e) => setEditNewLineData(prev => ({ ...prev, cost_code_vuid: e.target.value }))}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select cost code...</option>
                            {costCodes.map((costCode) => (
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
                            value={editNewLineData.cost_type_vuid}
                            onChange={(e) => setEditNewLineData(prev => ({ ...prev, cost_type_vuid: e.target.value }))}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select cost type...</option>
                            {costTypes.map((costType) => (
                              <option key={costType.vuid} value={costType.vuid}>
                                {costType.cost_type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            name="quantity"
                            value={editNewLineData.quantity}
                            onChange={handleEditQuantityChange}
                            step="0.01"
                            min="0"
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
                            name="unit_price"
                            value={editNewLineData.unit_price}
                            onChange={handleEditUnitPriceChange}
                            step="0.01"
                            min="0"
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
                            name="amount"
                            value={editNewLineData.amount}
                            onChange={handleEditAmountChange}
                            step="0.01"
                            min="0"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <button
                            onClick={handleAddEditLine}
                            className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                          >
                            Add Line
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* New Lines Table */}
                    {editCommitmentLines.filter(line => line.vuid.startsWith('temp-')).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3">New Lines to Add</h4>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {editCommitmentLines.filter(line => line.vuid.startsWith('temp-')).map((line, index) => (
                                <tr key={line.vuid}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.description}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.quantity}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${line.unit_price}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${line.total_amount}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <button
                                      onClick={() => handleRemoveEditLine(index)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditWithLines}
                disabled={saving}
                className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes & Lines'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Commitment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New Commitment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Commitment Header Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Project */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    name="project_vuid"
                    value={createFormData.project_vuid}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a project...</option>
                    {projects.map((project) => (
                      <option key={project.vuid} value={project.vuid}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commitment Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment Number *
                  </label>
                  <input
                    type="text"
                    name="commitment_number"
                    value={createFormData.commitment_number}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Commitment Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commitment Name *
                  </label>
                  <input
                    type="text"
                    name="commitment_name"
                    value={createFormData.commitment_name}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor *
                  </label>
                  <select
                    name="vendor_vuid"
                    value={createFormData.vendor_vuid}
                    onChange={handleCreateFormChange}
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

                {/* Status */}
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={createFormData.description}
                    onChange={handleCreateFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Calculated Total Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Commitment Amount
                  </label>
                  <div className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-lg font-semibold text-gray-900">
                    {formatCurrency(createCommitmentLines.reduce((sum, line) => sum + (line.total_amount || 0), 0))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Automatically calculated from line items</p>
                </div>
              </div>

              {/* Commitment Lines Excel-like Grid */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commitment Lines</h3>
                
                {/* Add New Line Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  {createFormData.project_vuid && projectBudgetLines.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Budget Constraint:</strong> Cost code and cost type combinations are limited to those available in the project budget ({projectBudgetLines.length} budget lines).
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={newLineData.description}
                        onChange={(e) => setNewLineData(prev => ({ ...prev, description: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Line description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost Code
                      </label>
                      <select
                        name="cost_code_vuid"
                        value={newLineData.cost_code_vuid}
                        onChange={(e) => setNewLineData(prev => ({ 
                          ...prev, 
                          cost_code_vuid: e.target.value,
                          cost_type_vuid: '' // Clear cost type when cost code changes
                        }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select cost code...</option>
                        {getBudgetCostCodes().map((costCode) => (
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
                        value={newLineData.cost_type_vuid}
                        onChange={(e) => setNewLineData(prev => ({ ...prev, cost_type_vuid: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select cost type...</option>
                        {getBudgetCostTypes(newLineData.cost_code_vuid).map((costType) => (
                          <option key={costType.vuid} value={costType.vuid}>
                            {costType.cost_type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={newLineData.quantity}
                        onChange={handleQuantityChange}
                        step="0.01"
                        min="0"
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
                        name="unit_price"
                        value={newLineData.unit_price}
                        onChange={handleUnitPriceChange}
                        step="0.01"
                        min="0"
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
                        name="amount"
                        value={newLineData.amount}
                        onChange={handleAmountChange}
                        step="0.01"
                        min="0"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <button
                        onClick={handleAddLine}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Add Line
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lines Table */}
                {createCommitmentLines.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Line #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Total Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Cost Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            Cost Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {createCommitmentLines.map((line, index) => (
                          <tr key={line.vuid} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {line.description}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {line.quantity.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {formatCurrency(line.unit_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                              {formatCurrency(line.total_amount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {costCodes.find(c => c.vuid === line.cost_code_vuid)?.code || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {costTypes.find(t => t.vuid === line.cost_type_vuid)?.name || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => handleRemoveLine(index)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Remove line"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr className="font-semibold">
                          <td colSpan="4" className="px-4 py-3 text-right text-sm text-gray-700 border-r border-gray-200">
                            Total:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 border-r border-gray-200">
                            {formatCurrency(createCommitmentLines.reduce((sum, line) => sum + (line.total_amount || 0), 0))}
                          </td>
                          <td colSpan="3" className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">No commitment lines added yet</p>
                    <p className="text-gray-600">Use the form above to add line items to this commitment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCommitment}
                disabled={creating || createCommitmentLines.length === 0}
                className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                  creating || createCommitmentLines.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {creating ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                    </div>
                ) : (
                  `Create Commitment (${createCommitmentLines.length} line${createCommitmentLines.length !== 1 ? 's' : ''})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commitments;
