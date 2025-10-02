import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectContracts = () => {
  // Currency formatting function
  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '$0.00';
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const location = useLocation();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [projectCostCodes, setProjectCostCodes] = useState([]);
  const [costTypes, setCostTypes] = useState([]);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [projectBudgetLines, setProjectBudgetLines] = useState([]);
  const [externalChangeOrders, setExternalChangeOrders] = useState([]);
  const [changeOrderLines, setChangeOrderLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Allocation management state
  const [showAllocationsModal, setShowAllocationsModal] = useState(false);
  const [selectedItemForAllocations, setSelectedItemForAllocations] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [allocationsByItem, setAllocationsByItem] = useState({});
  const [newAllocation, setNewAllocation] = useState({
    cost_code_vuid: '',
    cost_type_vuid: '',
  });
  
  // Add allocation form states
  const [showAddAllocationForm, setShowAddAllocationForm] = useState(false);
  const [itemAllocations, setItemAllocations] = useState([]);
  
  // Integration states
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [selectedContractForIntegration, setSelectedContractForIntegration] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showItemsForm, setShowItemsForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractItems, setContractItems] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    project_vuid: '',
    contract_number: '',
    contract_date: '',
    customer_vuid: '',
    accounting_period_vuid: '',
    contract_type: 'sales_order',
    status: 'active',
    description: '',
    total_amount: '',
    currency: 'USD',
    payment_terms: '',
    delivery_terms: '',
    warranty_terms: '',
    start_date: '',
    end_date: '',
    delivery_date: '',
    notes: ''
  });
  
  const [itemFormData, setItemFormData] = useState({
    item_number: '',
    description: '',
    quantity: 1,
    unit_of_measure: 'EA',
    unit_price: '',
    total_amount: '',
    status: 'active',
    cost_code_vuid: null,
    cost_type_vuid: null,
    specifications: '',
    delivery_location: '',
    delivery_date: '',
    warranty_info: '',
    notes: ''
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsPerPage] = useState(10);
  
  // Project settings and allocation status
  const [projectSettings, setProjectSettings] = useState({});
  const [allocationStatus, setAllocationStatus] = useState({});
  const [showAllocationAlert, setShowAllocationAlert] = useState(false);
  
  // Dropdown states
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [accountingPeriodDropdownOpen, setAccountingPeriodDropdownOpen] = useState(false);
  const [contractTypeDropdownOpen, setContractTypeDropdownOpen] = useState(false);
  
  // Search states for smart dropdowns
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  // Errors
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});

  // State for contract items grid
  const [newItemData, setNewItemData] = useState({
    item_number: '',
    cost_code_vuid: '',
    cost_type_vuid: '',
    description: '',
    total_amount: '',
    notes: ''
  });

  // State for dropdowns
  const [costCodeDropdownOpen, setCostCodeDropdownOpen] = useState(null);
  const [costTypeDropdownOpen, setCostTypeDropdownOpen] = useState(null);
  const [newItemCostCodeDropdownOpen, setNewItemCostCodeDropdownOpen] = useState(false);
  const [newItemCostTypeDropdownOpen, setNewItemCostTypeDropdownOpen] = useState(false);

  // State for filtered dropdowns
  const [filteredCostCodes, setFilteredCostCodes] = useState([]);
  const [filteredCostTypes, setFilteredCostTypes] = useState([]);

  const baseURL = 'http://localhost:5001';

  useEffect(() => {
    fetchData();
  }, []);

  // Add click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setProjectDropdownOpen(false);
        setStatusDropdownOpen(false);
        setCustomerDropdownOpen(false);
        setAccountingPeriodDropdownOpen(false);
        setContractTypeDropdownOpen(false);
        setCostCodeDropdownOpen(null);
        setCostTypeDropdownOpen(null);
        setNewItemCostCodeDropdownOpen(false);
        setNewItemCostTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    filterAndPaginateContracts();
  }, [contracts, searchTerm, projectFilter, statusFilter, currentPage]);

  // Reset cost type selection when cost code changes
  useEffect(() => {
    if (newAllocation.cost_code_vuid) {
      setNewAllocation(prev => ({ ...prev, cost_type_vuid: '' }));
    }
  }, [newAllocation.cost_code_vuid]);

  // Fetch project's budget line combinations when a contract is selected/viewed
  useEffect(() => {
    const projectVuid = selectedContract?.project_vuid;
    if (projectVuid) {
      axios
        .get(`${baseURL}/api/projects/${projectVuid}/budget-lines`)
        .then((res) => setProjectBudgetLines(res.data || []))
        .catch((err) => {
          console.warn('Failed to fetch project budget lines:', err);
          setProjectBudgetLines([]);
        });
    } else {
      setProjectBudgetLines([]);
    }
  }, [selectedContract]);

  // Handle query parameters for project filtering and contract viewing
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectVuid = searchParams.get('project');
    const contractVuid = searchParams.get('contract');
    
    if (projectVuid) {
      // Pre-filter contracts for this project
      setProjectFilter(projectVuid);
      
      // If there's also a create parameter, open the create form
      if (searchParams.get('create') === 'true') {
        setFormData(prev => ({
          ...prev,
          project_vuid: projectVuid
        }));
        setShowCreateForm(true);
      }
      
      // Refetch data with project filter
      fetchData();
      
      // Fetch project settings for allocation alerts
      fetchProjectSettings(projectVuid);
    }
    
    if (contractVuid) {
      // Find and select the contract to view
      const contract = contracts.find(c => c.vuid === contractVuid);
      if (contract) {
        setSelectedContract(contract);
        
        // Fetch project-specific cost codes for this contract's project
        axios.get(`${baseURL}/api/projects/${contract.project_vuid}/cost-codes`)
          .then(response => {
            setProjectCostCodes(response.data || []);
            console.log(`Fetched ${response.data?.length || 0} project cost codes for contract ${contract.contract_number}`);
          })
          .catch(e => {
            console.warn('Failed to fetch project cost codes:', e);
            setProjectCostCodes([]);
          });
        
        // Fetch project budget lines for this contract's project
        axios.get(`${baseURL}/api/projects/${contract.project_vuid}/budget-lines`)
          .then(response => {
            setProjectBudgetLines(response.data || []);
            console.log(`Fetched ${response.data?.length || 0} budget lines for contract ${contract.contract_number}`);
          })
          .catch(e => {
            console.warn('Failed to fetch project budget lines:', e);
            setProjectBudgetLines([]);
          });
        
        fetchContractItems(contract.vuid);
      }
    }
  }, [location.search]);

  // Fetch project settings when project filter changes
  useEffect(() => {
    if (projectFilter && projectFilter !== 'all') {
      fetchProjectSettings(projectFilter);
    } else {
      setShowAllocationAlert(false);
      setAllocationStatus({});
    }
  }, [projectFilter]);

  // Log project cost codes when they change
  useEffect(() => {
    if (projectCostCodes.length > 0) {
      console.log('✅ Project cost codes loaded:', projectCostCodes.length);
    }
  }, [projectCostCodes]);

  // Fetch budget lines when project is selected in create form
  useEffect(() => {
    if (formData.project_vuid && showCreateForm) {
      axios
        .get(`${baseURL}/api/projects/${formData.project_vuid}/budget-lines`)
        .then((res) => {
          setProjectBudgetLines(res.data || []);
          console.log(`Fetched ${res.data?.length || 0} budget lines for project ${formData.project_vuid}`);
        })
        .catch((err) => {
          console.warn('Failed to fetch project budget lines for create form:', err);
          setProjectBudgetLines([]);
        });
    } else if (!formData.project_vuid) {
      setProjectBudgetLines([]);
    }
  }, [formData.project_vuid, showCreateForm]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setProjectDropdownOpen(false);
        setCustomerDropdownOpen(false);
        setAccountingPeriodDropdownOpen(false);
        setContractTypeDropdownOpen(false);
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
      console.log('Fetching data from APIs...');
      
      // Check if we have a project filter from URL params
      const searchParams = new URLSearchParams(location.search);
      const projectVuid = searchParams.get('project');
      
      // Build the contracts URL with project filter if available
      let contractsUrl = `${baseURL}/api/project-contracts`;
      if (projectVuid) {
        contractsUrl += `?project_vuid=${projectVuid}`;
      }
      
      // Fetch core data first
      const contractsRes = await axios.get(contractsUrl);
      const projectsRes = await axios.get(`${baseURL}/api/projects`);
      const customersRes = await axios.get(`${baseURL}/api/customers`);
      const accountingPeriodsRes = await axios.get(`${baseURL}/api/accounting-periods/open`);
      
      console.log('Core data fetched successfully');
      setContracts(contractsRes.data || []);
      setProjects(projectsRes.data || []);
      setCustomers(customersRes.data || []);
      setAccountingPeriods(accountingPeriodsRes.data || []);
      

      
      // Try to fetch cost codes and cost types, but don't fail if they don't work
      try {
        const costCodesRes = await axios.get(`${baseURL}/api/costcodes`);
        setCostCodes(costCodesRes.data || []);
        console.log('Cost codes fetched successfully');
      } catch (costCodesErr) {
        console.warn('Failed to fetch cost codes:', costCodesErr);
        setCostCodes([]);
      }
      
      try {
        const costTypesRes = await axios.get(`${baseURL}/api/costtypes`);
        setCostTypes(costTypesRes.data || []);
        console.log('Cost types fetched successfully');
      } catch (costTypesErr) {
        console.warn('Failed to fetch cost types:', costTypesErr);
        setCostTypes([]);
      }
      
      // Try to fetch integrations
      try {
        const integrationsRes = await axios.get(`${baseURL}/api/integrations`);
        
        // Filter integrations to only show those that have 'contracts' enabled
        const filteredIntegrations = integrationsRes.data.filter(integration => 
          integration.enabled_objects && integration.enabled_objects.contracts === true
        );
        
        setIntegrations(filteredIntegrations || []);
        console.log('Integrations fetched successfully');
      } catch (integrationsErr) {
        console.warn('Failed to fetch integrations:', integrationsErr);
        setIntegrations([]);
      }
      
      setError(null);
      console.log('All data fetched successfully');
      
      // Safely refresh contract amounts after data is loaded
      if (contractsRes.data && contractsRes.data.length > 0) {
        setTimeout(() => {
          refreshContractAmounts().catch(err => {
            console.warn('Background contract amount refresh failed:', err);
          });
        }, 1000); // Delay by 1 second to avoid blocking the UI
      }
    } catch (err) {
      console.error('Error fetching core data:', err);
      setError(`Failed to load data: ${err.message}`);
      // Set empty arrays as fallback
      setContracts([]);
      setProjects([]);
      setCustomers([]);
      setAccountingPeriods([]);
      setCostCodes([]);
      setCostTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectSettings = async (projectVuid) => {
    if (!projectVuid) return;
    
    try {
      const response = await axios.get(`${baseURL}/api/projects/${projectVuid}/settings`);
      setProjectSettings(response.data || {});
      
      // Check if we should show allocation alerts
      const shouldShowAlerts = response.data?.allocate_contract_lines_to_cost_codes || false;
      setShowAllocationAlert(shouldShowAlerts);
      
      if (shouldShowAlerts) {
        // Fetch allocation status if alerts are enabled
        await fetchAllocationStatus(projectVuid);
      }
    } catch (error) {
      console.warn('Failed to fetch project settings:', error);
      setProjectSettings({});
      setShowAllocationAlert(false);
    }
  };

  const fetchAllocationStatus = async (projectVuid) => {
    if (!projectVuid) return;
    
    try {
      const response = await axios.get(`${baseURL}/api/projects/${projectVuid}/budget-allocation-status`);
      setAllocationStatus(response.data || {});
    } catch (error) {
      console.warn('Failed to fetch allocation status:', error);
      setAllocationStatus({});
    }
  };



  const filterAndPaginateContracts = () => {
    try {
      let filtered = contracts.filter(contract => {
        const matchesSearch = !searchTerm || 
          (contract.contract_number && contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.description && contract.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (contract.customer && contract.customer.customer_name && contract.customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesProject = projectFilter === 'all' || contract.project_vuid === projectFilter;
        const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
        
        return matchesSearch && matchesProject && matchesStatus;
      });
      
      setFilteredContracts(filtered);
    } catch (err) {
      console.error('Error filtering contracts:', err);
      setFilteredContracts([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field immediately when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-calculate total amount
    if (name === 'quantity' || name === 'unit_price') {
      const quantity = name === 'quantity' ? parseFloat(value) || 0 : parseFloat(itemFormData.quantity) || 0;
      const unitPrice = name === 'unit_price' ? parseFloat(value) || 0 : parseFloat(itemFormData.unit_price) || 0;
      setItemFormData(prev => ({
        ...prev,
        total_amount: (quantity * unitPrice).toFixed(2)
      }));
    }
    
    // Clear error for this field
    if (itemErrors[name]) {
      setItemErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    console.log('Starting form validation...');
    console.log('Current form data:', formData);
    
    const newErrors = {};
    if (!formData.project_vuid) {
      newErrors.project_vuid = 'Project is required';
      console.log('Project validation failed - project_vuid is empty');
    }
    if (!formData.contract_number) {
      newErrors.contract_number = 'Contract number is required';
      console.log('Contract number validation failed - contract_number is empty');
    }
    if (!formData.description) {
      newErrors.description = 'Description is required';
      console.log('Description validation failed - description is empty');
    }
    if (!formData.contract_type) {
      newErrors.contract_type = 'Contract type is required';
      console.log('Contract type validation failed - contract_type is empty');
    }
          if (!formData.customer_vuid) {
        newErrors.customer_vuid = 'Customer is required';
        console.log('Customer validation failed - customer_vuid is empty');
      }
      if (!formData.accounting_period_vuid) {
        newErrors.accounting_period_vuid = 'Accounting period is required';
        console.log('Accounting period validation failed - accounting_period_vuid is empty');
      }
    // Start and end dates are optional - removed required validation
    // if (!formData.start_date) {
    //   newErrors.start_date = 'Start date is required';
    //   console.log('Start date validation failed - start_date is empty');
    // }
    // if (!formData.end_date) {
    //   newErrors.end_date = 'End date is required';
    //   console.log('End date validation failed - end_date is empty');
    // }
    
    console.log('Validation errors found:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form validation result:', isValid);
    return isValid;
  };

  const validateItemForm = () => {
    const newErrors = {};
    if (!itemFormData.item_number) newErrors.item_number = 'Item number is required';
    if (!itemFormData.description) newErrors.description = 'Description is required';
    if (!itemFormData.quantity) newErrors.quantity = 'Quantity is required';
    if (!itemFormData.unit_price) newErrors.unit_price = 'Unit price is required';
    
    setItemErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form validation passed, proceeding with submission');
    
    try {
      let response;
      // Compute amount from current items if available, otherwise 0 for new contracts
      const computedAmount = Array.isArray(contractItems) && contractItems.length > 0
        ? contractItems.reduce((sum, it) => sum + (parseFloat(it.total_amount || 0) || 0), 0)
        : 0;

      // Map frontend fields to backend expectations
      const payload = {
        project_vuid: formData.project_vuid,
        contract_number: formData.contract_number,
        contract_name: formData.description,
        contract_type: formData.contract_type,
        contract_amount: computedAmount,
        customer_vuid: formData.customer_vuid || null,
        accounting_period_vuid: formData.accounting_period_vuid,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        notes: formData.notes || null,
      };

      console.log('Sending payload:', payload);

      if (editingContract) {
        console.log('Updating existing contract');
        response = await axios.put(`${baseURL}/api/project-contracts/${editingContract.vuid}`, payload);
        await fetchData();
        resetForm();
        setSuccessMessage('Contract updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Creating new contract
        console.log('Creating new contract');
        response = await axios.post(`${baseURL}/api/project-contracts`, payload);
        console.log('Response received:', response);
        await fetchData();
        
        // Get the newly created contract to show its items form
        const newContract = response.data;
        if (newContract && newContract.vuid) {
          // Set the newly created contract as selected and show items form
          setSelectedContract(newContract);
          setShowItemsForm(true);
          setShowCreateForm(false);
          
          // Pre-populate the item form with the new contract's VUID
          setItemFormData(prev => ({
            ...prev,
            contract_vuid: newContract.vuid
          }));
          
          // Optionally generate items from budget lines
          if (createItemsFromBudget) {
            await generateItemsFromBudget(newContract);
          }
          
          // Fetch contract items for the new contract (may now include generated items)
          await fetchContractItems(newContract.vuid);
          
          // Show success message
          setSuccessMessage(`Contract "${newContract.contract_number}" created successfully! Now add your contract items below.`);
          setError(''); // Clear any previous errors
          return; // Don't call resetForm yet, let user add contract items
        }
      }
      
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error saving contract:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError('Error saving contract: ' + err.response.data.error);
      } else {
        setError('Error saving contract: ' + err.message);
      }
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateItemForm()) return;
    
    // Debug logging
    console.log('handleItemSubmit - editingItem:', editingItem);
    console.log('handleItemSubmit - selectedContract:', selectedContract);
    console.log('handleItemSubmit - itemFormData:', itemFormData);
    
    // Check if we have a selected contract for new items
    if (!editingItem && !selectedContract) {
      console.log('No contract selected - showing error');
      setError('No contract selected. Please view contract items first.');
      return;
    }
    
    try {
      let savedItem;
      if (editingItem) {
        console.log('Updating existing item');
        const response = await axios.put(`${baseURL}/api/project-contract-items/${editingItem.vuid}`, itemFormData);
        savedItem = response.data;
        setContractItems(prev => prev.map(item => item.vuid === editingItem.vuid ? savedItem : item));
        
        // Refresh contract data to update total amount
        const contractResponse = await axios.get(`${baseURL}/api/project-contracts/${editingItem.contract_vuid}`);
        const updatedContract = contractResponse.data;
        setContracts(prev => prev.map(c => c.vuid === editingItem.contract_vuid ? updatedContract : c));
        if (selectedContract && selectedContract.vuid === editingItem.contract_vuid) {
          setSelectedContract(updatedContract);
        }
      } else {
        console.log('Creating new item with contract_vuid:', selectedContract.vuid);
        
        // Clean the data - convert empty strings to null for optional fields
        const cleanedData = {
          ...itemFormData,
          contract_vuid: selectedContract.vuid,
          cost_code_vuid: itemFormData.cost_code_vuid || null,
          cost_type_vuid: itemFormData.cost_type_vuid || null,
          specifications: itemFormData.specifications || null,
          delivery_location: itemFormData.delivery_location || null,
          delivery_date: itemFormData.delivery_date || null,
          warranty_info: itemFormData.warranty_info || null,
          notes: itemFormData.notes || null
        };
        
        const requestData = cleanedData;
        console.log('Request data being sent:', requestData);
        console.log('API endpoint:', `${baseURL}/api/project-contract-items`);
        const response = await axios.post(`${baseURL}/api/project-contract-items`, requestData);
        savedItem = response.data;
        
        setContractItems(prev => [...prev, savedItem]);
        
        // Refresh contract data to update total amount
        const contractResponse = await axios.get(`${baseURL}/api/project-contracts/${selectedContract.vuid}`);
        const updatedContract = contractResponse.data;
        setContracts(prev => prev.map(c => c.vuid === selectedContract.vuid ? updatedContract : c));
        setSelectedContract(updatedContract);
      }
      
      // Only show success message if API call succeeded
      setSuccessMessage('Item saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      resetItemForm();
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving item:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      if (errorMessage.includes('accounting period is closed')) {
        setError(`Cannot save item: The accounting period for this contract is closed. Please create a change order to add new items.`);
      } else {
        setError(`Error saving item: ${errorMessage}`);
      }
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemFormData({
      item_number: item.item_number || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_of_measure: item.unit_of_measure || 'EA',
      unit_price: item.unit_price || '',
      total_amount: item.total_amount || '',
      status: item.status || 'active',
      cost_code_vuid: item.cost_code_vuid || null,
      cost_type_vuid: item.cost_type_vuid || null,
      specifications: item.specifications || '',
      delivery_location: item.delivery_location || '',
      delivery_date: item.delivery_date || '',
      warranty_info: item.warranty_info || '',
      notes: item.notes || ''
    });
    setShowItemsForm(true);
  };

  const handleDeleteItem = async (itemVuid) => {
    if (itemVuid.startsWith('temp-')) {
      // Remove temporary item from local state
      setContractItems(prev => prev.filter(item => item.vuid !== itemVuid));
    } else {
      // Delete existing item from backend
      try {
        await axios.delete(`${baseURL}/api/project-contract-items/${itemVuid}`);
        await fetchContractItems(selectedContract.vuid);
        setSuccessMessage('Contract item deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Error deleting contract item: ' + err.message);
      }
    }
  };

  // Handle manage allocations
  const handleManageAllocations = async (item) => {
    console.log('🔧 handleManageAllocations called with item:', item);
    setSelectedItemForAllocations(item);
    setShowAllocationsModal(true);
    console.log('🔧 Modal should be showing now');
    
    // Find the contract that contains this item
    const contract = contracts.find(c => c.vuid === item.contract_vuid);
    if (contract) {
      setSelectedContract(contract);
    }
    
    // Get the project VUID from the contract
    const projectVuid = contract?.project_vuid || selectedContract?.project_vuid;
    
    // Load existing allocations for this item if it has a vuid (not a new item)
    if (item.vuid && !item.vuid.startsWith('temp-')) {
      try {
        const res = await axios.get(`${baseURL}/api/project-contract-items/${item.vuid}/allocations`);
        const fetched = res.data || [];
        setAllocations(fetched);
        setAllocationsByItem((prev) => ({ ...prev, [item.vuid]: fetched }));
        console.log(`Loaded ${fetched.length} existing allocations for item ${item.item_number}:`, fetched);
      } catch (err) {
        console.error('Error fetching allocations:', err);
        // If fetch fails, try to use cached allocations
        const cached = allocationsByItem[item.vuid] || [];
        setAllocations(cached);
        console.log(`Using cached allocations for item ${item.item_number}:`, cached);
      }
    } else {
      // For temp items, use cached allocations
      const cached = allocationsByItem[item.vuid] || [];
      setAllocations(cached);
      console.log(`Using cached allocations for temp item ${item.item_number}:`, cached);
    }
    
    // Fetch project budget lines to filter allocation options
    if (projectVuid) {
      axios
        .get(`${baseURL}/api/projects/${projectVuid}/budget-lines`)
        .then((res) => {
          setProjectBudgetLines(res.data || []);
        })
        .catch((err) => {
          console.warn('Failed to fetch project budget lines:', err);
          setProjectBudgetLines([]);
        });
    }
  };

  // Handle add allocation
  const handleAddAllocation = () => {
    if (newAllocation.cost_code_vuid && newAllocation.cost_type_vuid) {
      const allocation = {
        ...newAllocation,
        vuid: `temp-allocation-${Date.now()}`,
        contract_item_vuid: selectedItemForAllocations.vuid
      };
      setAllocations([...allocations, allocation]);
      setNewAllocation({
        cost_code_vuid: '',
        cost_type_vuid: '',
      });
      setShowAddAllocationForm(false);
    }
  };

  // Handle delete allocation
  const handleDeleteAllocation = async (allocationVuid) => {
    try {
      // If this is an existing allocation (has a real vuid), delete it from the database
      if (allocationVuid && !allocationVuid.startsWith('temp-')) {
        await axios.delete(`${baseURL}/api/project-contract-items/allocations/${allocationVuid}`);
        console.log(`Deleted allocation ${allocationVuid} from database`);
      }
      
      // Remove from local state
      setAllocations(allocations.filter(a => a.vuid !== allocationVuid));
      
      // Refresh allocation status to update the alert
      const projectVuid = selectedContract?.project_vuid;
      if (projectVuid) {
        await fetchAllocationStatus(projectVuid);
      }
    } catch (error) {
      console.error('Error deleting allocation:', error);
      setError('Error deleting allocation: ' + error.message);
    }
  };

  // Handle save allocations
  const handleSaveAllocations = async () => {
    try {
      const item = selectedItemForAllocations;
      if (!item) return;
      
      console.log('=== SAVING ALLOCATIONS ===');
      console.log('Item:', item.item_number, 'vuid:', item.vuid);
      console.log('Allocations to save:', allocations);
      
      if (item.vuid && !item.vuid.startsWith('temp-')) {
        // Validate all allocations before making any changes
        console.log('Validating allocations before save...');
        for (const alloc of allocations) {
          const validation = validateCostCodeTypeCombination(alloc.cost_code_vuid, alloc.cost_type_vuid, item.vuid);
          if (!validation.isValid) {
            throw new Error(`Allocation validation failed: ${validation.message}`);
          }
        }
        console.log('All allocations validated successfully');
        
        // Get current allocations from backend to compare
        const existingRes = await axios.get(`${baseURL}/api/project-contract-items/${item.vuid}/allocations`);
        const existingAllocs = existingRes.data || [];
        console.log('Current allocations in database:', existingAllocs);
        
        // Check if allocations actually changed to avoid unnecessary operations
        const allocationsChanged = allocations.length !== existingAllocs.length || 
          allocations.some((alloc, index) => {
            const existing = existingAllocs[index];
            return !existing || 
                   existing.cost_code_vuid !== alloc.cost_code_vuid || 
                   existing.cost_type_vuid !== alloc.cost_type_vuid;
          });
        
        if (!allocationsChanged) {
          console.log('No changes detected, skipping save operation');
          setShowAllocationsModal(false);
          setSuccessMessage('No changes to save');
          setTimeout(() => setSuccessMessage(''), 3000);
          return;
        }
        
        // Only create new allocations (deletions are handled by handleDeleteAllocation)
        console.log(`Creating ${allocations.length} new allocations...`);
        const createdAllocs = [];
        for (const alloc of allocations) {
          // Only create if it's a new allocation (doesn't have a real vuid yet)
          if (!alloc.vuid || alloc.vuid.startsWith('temp-')) {
            console.log(`Creating new allocation:`, alloc);
            const response = await axios.post(`${baseURL}/api/project-contract-items/${item.vuid}/allocations`, {
              cost_code_vuid: alloc.cost_code_vuid,
              cost_type_vuid: alloc.cost_type_vuid,
              notes: alloc.notes || ''
            });
            createdAllocs.push(response.data);
            console.log(`Allocation created successfully:`, response.data);
          } else {
            // Keep existing allocation
            createdAllocs.push(alloc);
            console.log(`Keeping existing allocation:`, alloc.vuid);
          }
        }
        
        // Update local state with the newly created allocations
        console.log(`Final allocations for item ${item.item_number}:`, createdAllocs);
        setAllocations(createdAllocs);
        setAllocationsByItem(prev => ({ ...prev, [item.vuid]: createdAllocs }));
        
        // Refresh the contract items to ensure consistency
        await fetchContractItems(selectedContract.vuid);
        
        // Refresh allocation status to update the alert
        const projectVuid = selectedContract?.project_vuid;
        if (projectVuid) {
          await fetchAllocationStatus(projectVuid);
        }
        
      } else {
        // Cache locally for temp items
        console.log('Caching allocations for temp item:', item.item_number);
        setAllocationsByItem(prev => ({ ...prev, [item.vuid]: allocations }));
      }
      
      setShowAllocationsModal(false);
      setSuccessMessage('Allocations saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error in handleSaveAllocations:', err);
      setError('Error saving allocations: ' + err.message);
    }
  };

  // Helper function to get all allocations for a contract
  const getAllContractAllocations = (contract) => {
    if (!contract?.items) return [];
    return contract.items.flatMap(item => allocationsByItem[item.vuid] || []);
  };

  // Helper function to validate cost code + cost type combination uniqueness
  const validateCostCodeTypeCombination = (costCodeVuid, costTypeVuid, currentItemVuid = null) => {
    if (!costCodeVuid || !costTypeVuid) return { isValid: true, message: '' };
    
    console.log('=== VALIDATION DEBUG ===');
    console.log('Validating:', { costCodeVuid, costTypeVuid, currentItemVuid });
    console.log('selectedContract:', selectedContract);
    console.log('contractItems:', contractItems);
    
    // Check against existing contract items first (more reliable)
    // IMPORTANT: Only check against items that are NOT temp items and NOT the current item being validated
    const existingItems = contractItems.filter(item => 
      item.vuid && 
      !item.vuid.startsWith('temp-') && 
      item.vuid !== currentItemVuid &&
      item.cost_code_vuid && 
      item.cost_type_vuid
    );
    
    console.log('Existing items to check:', existingItems);
    
    // Check if any existing item has the same cost code + cost type combination
    const duplicateItem = existingItems.find(item => 
      item.cost_code_vuid === costCodeVuid && item.cost_type_vuid === costTypeVuid
    );
    
    if (duplicateItem) {
      const costCode = costCodes.find(c => c.vuid === costCodeVuid);
      const costType = costTypes.find(t => t.vuid === costTypeVuid);
      const codeName = costCode ? costCode.code : costCodeVuid;
      const typeName = costType ? costType.cost_type : costTypeVuid;
      
      console.log('DUPLICATE FOUND:', { duplicateItem, codeName, typeName });
      
      return {
        isValid: false,
        message: `Cost code ${codeName} with cost type ${typeName} is already used by item ${duplicateItem.item_number}.`
      };
    }
    
    // Also check against allocations as a backup
    const allContractAllocations = getAllContractAllocations(selectedContract);
    console.log('All contract allocations:', allContractAllocations);
    
    const duplicateAllocation = allContractAllocations.find(allocation => {
      // Skip the current item if we're editing
      if (currentItemVuid && allocation.contract_item_vuid === currentItemVuid) {
        return false;
      }
      
      return allocation.cost_code_vuid === costCodeVuid && 
             allocation.cost_type_vuid === costTypeVuid;
    });
    
    if (duplicateAllocation) {
      const costCode = costCodes.find(c => c.vuid === costCodeVuid);
      const costType = costTypes.find(t => t.vuid === costTypeVuid);
      const codeName = costCode ? costCode.code : costCodeVuid;
      const typeName = costType ? costType.cost_type : costTypeVuid;
      
      console.log('DUPLICATE ALLOCATION FOUND:', { duplicateAllocation, codeName, typeName });
      
      return {
        isValid: false,
        message: `Cost code ${codeName} with cost type ${typeName} is already allocated to another contract item.`
      };
    }
    
    console.log('Validation passed - no duplicates found');
    return { isValid: true, message: '' };
  };

  // Helper function to get all available cost codes (global + project-specific)
  const getAllCostCodes = () => {
    return [...costCodes, ...projectCostCodes];
  };

  // Helper function to get the display value for cost code input
  const getCostCodeInputValue = (item) => {
    if (!item.cost_code_vuid) return '';
    
    // If project-specific cost codes are enabled, try to find the actual cost code
    if (projectSettings?.allow_project_cost_codes) {
      // First check if it's a VUID (36 characters)
      if (item.cost_code_vuid.length === 36) {
        // It's a VUID, find the corresponding cost code
        const costCode = getAllCostCodes().find(c => c.vuid === item.cost_code_vuid);
        return costCode ? costCode.code : item.cost_code_vuid;
      } else {
        // It's already a cost code string
        return item.cost_code_vuid;
      }
    } else {
      // Global mode: find the cost code by VUID
      const costCode = costCodes.find(c => c.vuid === item.cost_code_vuid);
      return costCode ? costCode.code : '';
    }
  };

  // Function to create project-specific cost code if it doesn't exist (similar to budget entries)
  const createProjectCostCodeIfNeeded = async (costCodeValue) => {
    if (!projectSettings?.allow_project_cost_codes) {
      return costCodeValue; // Return as-is for global mode
    }

    // Check if this cost code already exists as a project cost code
    const existingProjectCostCode = projectCostCodes.find(
      cc => cc.is_project_specific && cc.code === costCodeValue
    );

    if (existingProjectCostCode) {
      return existingProjectCostCode.vuid; // Return existing VUID
    }

    // Create new project-specific cost code
    try {
      const response = await axios.post(`${baseURL}/api/projects/${selectedContract.project_vuid}/cost-codes`, {
        code: costCodeValue,
        description: `Project-specific cost code: ${costCodeValue}`
      });
      
      // Add to local state
      const newCostCode = response.data;
      setProjectCostCodes(prev => [...prev, newCostCode]);
      
      return newCostCode.vuid;
    } catch (error) {
      console.error('Error creating project cost code:', error);
      throw error;
    }
  };

  // Helper functions for smart dropdowns
  const getFilteredProjects = () => {
    if (!projectSearchTerm) return projects;
    return projects.filter(project => 
      project.project_name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
      project.project_number.toLowerCase().includes(projectSearchTerm.toLowerCase())
    );
  };

  const getFilteredCustomers = () => {
    if (!customerSearchTerm) return customers;
    return customers.filter(customer => 
      customer.customer_name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.customer_number.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  };

  // Helper functions to get display values for cost code and cost type columns
  const getCostCodeDisplay = (item) => {
    const itemAllocs = allocationsByItem[item.vuid] || [];
    console.log('getCostCodeDisplay for item:', item.item_number, 'vuid:', item.vuid, 'allocations:', itemAllocs, 'cost_code_vuid:', item.cost_code_vuid);
    
    // If there are multiple allocations, always show "Multiple"
    if (itemAllocs.length > 1) {
      return 'Multiple';
    }
    
    // If there's exactly one allocation, show that allocation's cost code
    if (itemAllocs.length === 1) {
      // Check both global and project-specific cost codes
      let costCode = costCodes.find(c => c.vuid === itemAllocs[0].cost_code_vuid);
      if (!costCode) {
        costCode = projectCostCodes.find(c => c.vuid === itemAllocs[0].cost_code_vuid);
      }
      return costCode ? `${costCode.code} - ${costCode.description}` : 'Unknown';
    }
    
    // If no allocations, show the item's own cost code (if any)
    if (item.cost_code_vuid) {
      // Check both global and project-specific cost codes
      let costCode = costCodes.find(c => c.vuid === item.cost_code_vuid);
      if (!costCode) {
        costCode = projectCostCodes.find(c => c.vuid === item.cost_code_vuid);
      }
      return costCode ? `${costCode.code} - ${costCode.description}` : 'Unknown';
    }
    
    return '';
  };

  const getCostTypeDisplay = (item) => {
    const itemAllocs = allocationsByItem[item.vuid] || [];
    console.log('getCostTypeDisplay for item:', item.item_number, 'vuid:', item.vuid, 'allocations:', itemAllocs, 'cost_type_vuid:', item.cost_type_vuid);
    
    // If there are multiple allocations, always show "Multiple"
    if (itemAllocs.length > 1) {
      return 'Multiple';
    }
    
    // If there's exactly one allocation, show that allocation's cost type
    if (itemAllocs.length === 1) {
      const costType = costTypes.find(t => t.vuid === itemAllocs[0].cost_type_vuid);
      return costType ? costType.cost_type : 'Unknown';
    }
    
    // If no allocations, show the item's own cost type (if any)
    if (item.cost_type_vuid) {
      const costType = costTypes.find(t => t.vuid === item.cost_type_vuid);
      return costType ? costType.cost_type : 'Unknown';
    }
    
    return '';
  };

  // Handle view items
  const handleViewItems = async (contract) => {
    console.log('🔧 handleViewItems called for contract:', contract.contract_number);
    setSelectedContract(contract);
    setShowItemsForm(true);
    setShowCreateForm(false);
    
    // Reset percentage adjustment states when viewing a different contract
    setAdjustmentPercentage(0);
    setShowPercentageAdjustment(false);
    setOriginalAmounts({});
    
    // Clear existing project cost codes first
    setProjectCostCodes([]);
    
    // Fetch project-specific cost codes for this contract's project
    try {
      console.log('🔄 Fetching project cost codes...');
      const projectCostCodesRes = await axios.get(`${baseURL}/api/projects/${contract.project_vuid}/cost-codes`);
      const projectCostCodesData = projectCostCodesRes.data || [];
      setProjectCostCodes(projectCostCodesData);
      console.log(`✅ Fetched ${projectCostCodesData.length} project cost codes for contract ${contract.contract_number}`);
      console.log('First 3 project cost codes:', projectCostCodesData.slice(0, 3).map(c => ({ vuid: c.vuid, code: c.code, description: c.description })));
    } catch (e) {
      console.error('❌ Failed to fetch project cost codes:', e);
      setProjectCostCodes([]);
    }
    
    // Fetch project budget lines for this contract's project
    try {
      const budgetLinesRes = await axios.get(`${baseURL}/api/projects/${contract.project_vuid}/budget-lines`);
      setProjectBudgetLines(budgetLinesRes.data || []);
      console.log(`Fetched ${budgetLinesRes.data?.length || 0} budget lines for contract ${contract.contract_number}`);
    } catch (e) {
      console.warn('Failed to fetch project budget lines:', e);
      setProjectBudgetLines([]);
    }
    
    // Fetch project settings
    try {
      const settingsRes = await axios.get(`${baseURL}/api/projects/${contract.project_vuid}/settings`);
      setProjectSettings(settingsRes.data || {});
      console.log(`Fetched project settings:`, settingsRes.data);
    } catch (e) {
      console.warn('Failed to fetch project settings:', e);
      setProjectSettings({});
    }
    
    fetchContractItems(contract.vuid);
  };

  // Handle hide items
  const handleHideItems = () => {
    setSelectedContract(null);
    setShowItemsForm(false);
    setContractItems([]);
  };

  // Fetch contract items for a specific contract
  const fetchContractItems = async (contractVuid) => {
    try {
      console.log('🔍 fetchContractItems called for contract:', contractVuid);
      const response = await axios.get(`${baseURL}/api/project-contracts/${contractVuid}/items`);
      console.log('📦 API response data:', response.data);
      console.log('📊 Number of items received:', response.data?.length || 0);
      
      // Log each item to see what we're getting
      if (response.data) {
        response.data.forEach((item, index) => {
          console.log(`📋 Item ${index}:`, {
            item_number: item.item_number,
            description: item.description,
            total_amount: item.total_amount,
            cost_code_vuid: item.cost_code_vuid,
            cost_type_vuid: item.cost_type_vuid
          });
        });
      }
      
      setContractItems(response.data || []);
      console.log('💾 contractItems state updated with:', response.data?.length || 0, 'items');
      
      // Also fetch change order lines for this contract
      await fetchChangeOrderLines(contractVuid);
      
      // Fetch allocations for each existing item
      const itemsWithVuid = response.data?.filter(item => item.vuid && !item.vuid.startsWith('temp-')) || [];
      for (const item of itemsWithVuid) {
        try {
          const allocResponse = await axios.get(`${baseURL}/api/project-contract-items/${item.vuid}/allocations`);
          const itemAllocs = allocResponse.data || [];
          setAllocationsByItem(prev => ({ ...prev, [item.vuid]: itemAllocs }));
        } catch (err) {
          console.error(`Error fetching allocations for item ${item.vuid}:`, err);
          setAllocationsByItem(prev => ({ ...prev, [item.vuid]: [] }));
        }
      }
      
      // Update contract amount based on fetched items
      if (response.data && response.data.length > 0) {
        const total = response.data.reduce((sum, item) => sum + (parseFloat(item.total_amount || 0) || 0), 0);
        
        // Update local contract state
        setContracts(prev => prev.map(c => 
          c.vuid === contractVuid ? { ...c, contract_amount: total } : c
        ));
        
        // Update selected contract if it's the current one
        if (selectedContract && selectedContract.vuid === contractVuid) {
          setSelectedContract(prev => prev ? { ...prev, contract_amount: total } : null);
        }
        
        // Update the contract amount in the backend (non-blocking)
        axios.put(`${baseURL}/api/project-contracts/${contractVuid}`, {
          contract_amount: total
        }).catch(err => {
          console.warn('Error updating contract amount:', err);
        });
      }
    } catch (err) {
      console.error('Error fetching contract items:', err);
      setContractItems([]);
    }
  };

  // Fetch change order lines for a specific contract
  const fetchChangeOrderLines = async (contractVuid) => {
    try {
      console.log('🔍 fetchChangeOrderLines called for contract:', contractVuid);
      
      // First get all external change orders for this contract
      const changeOrdersResponse = await axios.get(`${baseURL}/api/external-change-orders?contract_vuid=${contractVuid}`);
      const changeOrders = changeOrdersResponse.data || [];
      setExternalChangeOrders(changeOrders);
      
      console.log('📋 Found change orders:', changeOrders.length);
      
      // Then get all change order lines for these change orders
      const allChangeOrderLines = [];
      for (const changeOrder of changeOrders) {
        try {
          const linesResponse = await axios.get(`${baseURL}/api/external-change-orders/${changeOrder.vuid}/lines`);
          const lines = linesResponse.data || [];
          // Add change order info to each line
          const linesWithChangeOrder = lines.map(line => ({
            ...line,
            change_order_number: changeOrder.change_order_number,
            change_order_date: changeOrder.change_order_date,
            change_order_status: changeOrder.status
          }));
          allChangeOrderLines.push(...linesWithChangeOrder);
        } catch (err) {
          console.error(`Error fetching lines for change order ${changeOrder.vuid}:`, err);
        }
      }
      
      setChangeOrderLines(allChangeOrderLines);
      console.log('📊 Total change order lines:', allChangeOrderLines.length);
      
    } catch (err) {
      console.error('Error fetching change order lines:', err);
      setChangeOrderLines([]);
      setExternalChangeOrders([]);
    }
  };

  // Calculate change order amount for a specific contract line
  const getChangeOrderAmount = (contractLine) => {
    if (!contractLine.cost_code_vuid || !contractLine.cost_type_vuid) {
      return 0;
    }
    
    const matchingChangeOrderLines = changeOrderLines.filter(changeLine => 
      changeLine.cost_code_vuid === contractLine.cost_code_vuid &&
      changeLine.cost_type_vuid === contractLine.cost_type_vuid
    );
    
    const totalChangeAmount = matchingChangeOrderLines.reduce((sum, changeLine) => {
      return sum + (parseFloat(changeLine.contract_amount_change || 0) || 0);
    }, 0);
    
    return totalChangeAmount;
  };

  // Reset forms
  const resetForm = () => {
    setFormData({
      project_vuid: '',
      contract_number: '',
      contract_date: '',
      customer_vuid: '',
      accounting_period_vuid: '',
      contract_type: 'sales_order',
      status: 'active',
      description: '',
      total_amount: '',
      currency: 'USD',
      payment_terms: '',
      delivery_terms: '',
      warranty_terms: '',
      start_date: '',
      end_date: '',
      delivery_date: '',
      notes: ''
    });
    setCreateItemsFromBudget(false);
    setBudgetIncreasePercentage(0);
    
    // Clear search terms
    setProjectSearchTerm('');
    setCustomerSearchTerm('');
    setEditingContract(null);
    setShowCreateForm(false); // Hide the create form
    setShowItemsForm(false);
    setEditingItem(null);
    setSuccessMessage(''); // Clear success message
  };

  const resetItemForm = () => {
    setItemFormData({
      item_number: '',
      description: '',
      quantity: 1,
      unit_of_measure: 'EA',
      unit_price: '',
      total_amount: '',
      status: 'active',
      cost_code_vuid: null,
      cost_type_vuid: null,
      specifications: '',
      delivery_location: '',
      delivery_date: '',
      warranty_info: '',
      notes: ''
    });
    setEditingItem(null);
    setShowItemsForm(false);
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setEditingContract(null);
    // Reset form data but don't hide the form
    setFormData({
      project_vuid: '',
      contract_number: '',
      contract_date: '',
      customer_vuid: '',
      accounting_period_vuid: '',
      contract_type: 'sales_order',
      status: 'active',
      description: '',
      total_amount: '',
      currency: 'USD',
      payment_terms: '',
      delivery_terms: '',
      warranty_terms: '',
      start_date: '',
      end_date: '',
      delivery_date: '',
      notes: ''
    });
    setSuccessMessage('');
  };

  const handleShowItemsForm = () => {
    setShowItemsForm(true);
    setEditingItem(null);
    resetItemForm();
  };

  const closeItemsForm = () => {
    setShowItemsForm(false);
    setSelectedContract(null);
    setContractItems([]);
    setEditingItem(null);
    resetItemForm();
  };

  const closeForm = () => {
    setShowCreateForm(false);
    setEditingContract(null);
    resetForm();
  };

  // Refresh contract amounts for all contracts
  const refreshContractAmounts = async () => {
    try {
      for (const contract of contracts) {
        if (contract.vuid) {
          try {
            const itemsResponse = await axios.get(`${baseURL}/api/project-contracts/${contract.vuid}/items`);
            const items = itemsResponse.data || [];
            
            if (items.length > 0) {
              const total = items.reduce((sum, item) => sum + (parseFloat(item.total_amount || 0) || 0), 0);
              
              // Update local contract state
              setContracts(prev => prev.map(c => 
                c.vuid === contract.vuid ? { ...c, contract_amount: total } : c
              ));
              
              // Update backend (non-blocking)
              axios.put(`${baseURL}/api/project-contracts/${contract.vuid}`, {
                contract_amount: total
              }).catch(err => {
                console.warn(`Failed to update backend for contract ${contract.contract_number}:`, err);
              });
            }
          } catch (err) {
            console.warn(`Error refreshing amount for contract ${contract.contract_number}:`, err);
          }
        }
      }
    } catch (err) {
      console.warn('Error refreshing contract amounts:', err);
    }
  };

  // Handle going back to main contract view after adding items
  const handleDoneAddingItems = () => {
    setShowItemsForm(false);
    setSelectedContract(null);
    setShowCreateForm(false);
    setEditingItem(null);
    setEditingContract(null);
    setSuccessMessage(''); // Clear success message
    // Reset the item form data
    setItemFormData({
      item_number: '',
      description: '',
      quantity: 1,
      unit_of_measure: 'EA',
      unit_price: '',
      total_amount: '',
      status: 'active',
      cost_code_vuid: null,
      cost_type_vuid: null,
      specifications: '',
      delivery_location: '',
      delivery_date: '',
      warranty_info: '',
      notes: ''
    });
  };

  // Handle edit contract
  const handleEditContract = (contract) => {
    setEditingContract(contract);
    setFormData({
      project_vuid: contract.project_vuid || '',
      contract_number: contract.contract_number || '',
      contract_date: contract.contract_date || '',
              customer_vuid: contract.customer_vuid || '',
        accounting_period_vuid: contract.accounting_period_vuid || '',
      contract_type: contract.contract_type || 'sales_order',
      status: contract.status || 'active',
      description: contract.description || '',
      total_amount: contract.total_amount || '',
      currency: contract.currency || 'USD',
      payment_terms: contract.payment_terms || '',
      delivery_terms: contract.delivery_terms || '',
      warranty_terms: contract.warranty_terms || '',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      delivery_date: contract.delivery_date || '',
      notes: contract.notes || ''
    });
    setShowCreateForm(true);
  };

  // Handle delete contract
  const handleDeleteContract = async (contract) => {
    if (window.confirm('Are you sure you want to delete this contract? This will also delete all associated contract items and allocations.')) {
      try {
        await axios.delete(`${baseURL}/api/project-contracts/${contract.vuid}`);
        setContracts(prev => prev.filter(c => c.vuid !== contract.vuid));
        
        // If we were viewing items for this contract, clear the view
        if (selectedContract && selectedContract.vuid === contract.vuid) {
          setSelectedContract(null);
          setShowItemsForm(false);
          setContractItems([]);
          setAllocationsByItem({});
        }
        
        setSuccessMessage('Contract and all associated items deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting contract:', err);
        setError('Error deleting contract: ' + err.message);
      }
    }
  };

  // Handle integration modal
  const handleIntegrationModal = (contract) => {
    setSelectedContractForIntegration(contract);
    setShowIntegrationModal(true);
  };

  // Handle send to integration
  const handleSendToIntegration = async (integration) => {
    try {
      // Here you would implement the logic to send the contract to the selected integration
      console.log(`Sending contract ${selectedContractForIntegration.contract_number} to integration ${integration.integration_name}`);
      
      // For now, just show a success message
      alert(`Contract ${selectedContractForIntegration.contract_number} sent to ${integration.integration_name} successfully!`);
      
      // Close the modal
      setShowIntegrationModal(false);
      setSelectedContractForIntegration(null);
    } catch (error) {
      console.error('Error sending contract to integration:', error);
      alert('Error sending contract to integration');
    }
  };

  // Handle retrieve from integration
  const handleRetrieveFromIntegration = async (integration) => {
    try {
      // Here you would implement the logic to retrieve contracts from the selected integration
      console.log(`Retrieving contracts from integration ${integration.integration_name}`);
      
      // For now, just show a success message
      alert(`Contracts retrieved from ${integration.integration_name} successfully!`);
      
      // Close the modal
      setShowRetrieveModal(false);
    } catch (error) {
      console.error('Error retrieving contracts from integration:', error);
      alert('Error retrieving contracts from integration');
    }
  };

  // Handle retrieve modal
  const handleRetrieveModal = () => {
    setShowRetrieveModal(true);
  };



  // Pagination
  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);
  const startIndex = (currentPage - 1) * contractsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, startIndex + contractsPerPage);

  // Excel-style form functions for contract items
  // Handle cost code/type changes for existing items
  const handleCostCodeTypeChange = async (itemVuid, newCostCodeVuid, newCostTypeVuid) => {
    console.log('=== HANDLING COST CODE/TYPE CHANGE ===');
    console.log('Item:', itemVuid, 'New cost code:', newCostCodeVuid, 'New cost type:', newCostTypeVuid);
    
    const item = contractItems.find(i => i.vuid === itemVuid);
    if (!item) {
      console.log('Item not found:', itemVuid);
      return;
    }
    
    // If both cost code and type are provided, create new allocation
    if (newCostCodeVuid && newCostTypeVuid) {
      console.log('Creating new allocation for changed cost code/type');
      
      // Validate the new combination
      const validation = validateCostCodeTypeCombination(newCostCodeVuid, newCostTypeVuid, itemVuid);
      if (!validation.isValid) {
        alert(`Cannot change to this combination: ${validation.message}`);
        // Revert the change in the form
        return false; // Signal that the change should be reverted
      }
      
      // Create new allocation
      const newAllocation = {
        vuid: `temp-allocation-${Date.now()}`,
        contract_item_vuid: itemVuid,
        cost_code_vuid: newCostCodeVuid,
        cost_type_vuid: newCostTypeVuid,
        notes: 'Auto-generated allocation'
      };
      
      // Update allocationsByItem
      setAllocationsByItem(prev => ({
        ...prev,
        [itemVuid]: [newAllocation]
      }));
      
      console.log('New allocation created for item:', item.item_number);
      return true; // Signal that the change was successful
    } else {
      // If either is missing, clear allocations
      console.log('Clearing allocations due to missing cost code or type');
      setAllocationsByItem(prev => {
        const updated = { ...prev };
        delete updated[itemVuid];
        return updated;
      });
      return true; // Signal that the change was successful
    }
  };

  const handleAddNewItem = () => {
    console.log('=== ADDING NEW ITEM TO GRID ===');
    console.log('New item data:', newItemData);
    console.log('Has required fields:', {
      item_number: !!newItemData.item_number,
      description: !!newItemData.description,
      total_amount: !!newItemData.total_amount,
      cost_code_vuid: !!newItemData.cost_code_vuid,
      cost_type_vuid: !!newItemData.cost_type_vuid
    });
    
    if (newItemData.item_number && newItemData.description && newItemData.total_amount !== undefined && newItemData.total_amount !== '') {
      // VALIDATE BEFORE ADDING TO GRID
      if (newItemData.cost_code_vuid && newItemData.cost_type_vuid) {
        console.log('Validating new item before adding to grid:', newItemData.item_number, newItemData.cost_code_vuid, newItemData.cost_type_vuid);
        const validation = validateCostCodeTypeCombination(newItemData.cost_code_vuid, newItemData.cost_type_vuid);
        if (!validation.isValid) {
          alert(`Cannot add item: ${validation.message}`);
          return; // Don't add the item
        }
        console.log('Validation passed for new item in grid:', newItemData.item_number);
      } else {
        console.log('WARNING: Item added without cost code or type - will not get auto-allocation');
      }
      
      const newItem = {
        ...newItemData,
        contract_vuid: selectedContract.vuid,
        status: 'active',
        vuid: `temp-${Date.now()}` // Temporary ID for new items
      };
      
      console.log('Created new item object:', newItem);
      const updatedItems = [...contractItems, newItem];
      setContractItems(updatedItems);
      
      // If cost code and type are provided, create allocation immediately
      if (newItemData.cost_code_vuid && newItemData.cost_type_vuid) {
        console.log('Creating immediate allocation for new item:', newItem.item_number);
        const newAllocation = {
          vuid: `temp-allocation-${Date.now()}`,
          contract_item_vuid: newItem.vuid,
          cost_code_vuid: newItemData.cost_code_vuid,
          cost_type_vuid: newItemData.cost_type_vuid,
          notes: 'Auto-generated allocation'
        };
        
        setAllocationsByItem(prev => ({
          ...prev,
          [newItem.vuid]: [newAllocation]
        }));
        console.log('Immediate allocation created for item:', newItem.item_number);
      }
      
      // Clear the new item form
      setNewItemData({
        item_number: '',
        cost_code_vuid: '',
        cost_type_vuid: '',
        description: '',
        total_amount: '',
        notes: ''
      });
      
      // Focus on the first field of the new item
      setTimeout(() => {
        const newItemInput = document.getElementById('new-item-number');
        if (newItemInput) {
          newItemInput.focus();
          // Also scroll to the new item
          newItemInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleSaveAllItems = async () => {
    try {
      console.log('🚀 SAVE ALL ITEMS BUTTON CLICKED!');
      console.log('Saving all items. Count:', contractItems.length);
      const savedItemsInfo = [];
      
      // Save all new items
      for (const item of contractItems) {
        try {
          console.log('Processing item:', item.item_number, 'vuid:', item.vuid);
          if (item.vuid.startsWith('temp-')) {
            // VALIDATE BEFORE SAVING - this is the key fix!
            if (item.cost_code_vuid && item.cost_type_vuid) {
              console.log('=== VALIDATION BEFORE SAVE ===');
              console.log('Validating new item before save:', item.item_number, item.cost_code_vuid, item.cost_type_vuid);
              console.log('selectedContract at validation:', selectedContract);
              console.log('contractItems at validation:', contractItems);
              
              const validation = validateCostCodeTypeCombination(item.cost_code_vuid, item.cost_type_vuid);
              console.log('Validation result:', validation);
              
              if (!validation.isValid) {
                throw new Error(`Item ${item.item_number}: ${validation.message}`);
              }
              console.log('Validation passed for new item:', item.item_number);
            } else {
              console.log('=== SKIPPING VALIDATION ===');
              console.log('Item missing cost code or type:', {
                item_number: item.item_number,
                cost_code_vuid: item.cost_code_vuid,
                cost_type_vuid: item.cost_type_vuid
              });
            }
            
            // This is a new item, save it
            const res = await axios.post(`${baseURL}/api/project-contract-items`, {
              contract_vuid: item.contract_vuid,
              item_number: item.item_number,
              cost_code_vuid: item.cost_code_vuid || null,
              cost_type_vuid: item.cost_type_vuid || null,
              description: item.description,
              total_amount: item.total_amount || 0,
              notes: item.notes || '',
              status: item.status
            });
            const savedItem = res.data;
            
            // Track for post-pass verification
            savedItemsInfo.push({
              tempVuid: item.vuid,
              realVuid: savedItem.vuid,
              item_number: item.item_number,
              cost_code_vuid: item.cost_code_vuid,
              cost_type_vuid: item.cost_type_vuid,
            });
            
            // Update the saved item with cost code/type info for consistent display
            const updatedSavedItem = {
              ...savedItem,
              cost_code_vuid: item.cost_code_vuid,
              cost_type_vuid: item.cost_type_vuid
            };
            
            // Create allocation for the newly saved item (validation already passed above)
            console.log('=== ALLOCATION CREATION CHECK ===');
            console.log('Item being processed:', {
              item_number: item.item_number,
              cost_code_vuid: item.cost_code_vuid,
              cost_type_vuid: item.cost_type_vuid,
              has_cost_code: !!item.cost_code_vuid,
              has_cost_type: !!item.cost_type_vuid,
              saved_vuid: savedItem.vuid
            });
            
            if (item.cost_code_vuid && item.cost_type_vuid) {
              
              console.log('=== AUTO-ALLOCATION DEBUG ===');
              console.log('Item details:', {
                item_number: item.item_number,
                cost_code_vuid: item.cost_code_vuid,
                cost_type_vuid: item.cost_type_vuid,
                saved_vuid: savedItem.vuid
              });
              console.log('selectedContract:', selectedContract);
              console.log('contractItems:', contractItems);
              
              try {
                console.log('Creating auto-allocation for item:', item.item_number, 'with cost code:', item.cost_code_vuid, 'and cost type:', item.cost_type_vuid);
                const allocationResponse = await axios.post(`${baseURL}/api/project-contract-items/${savedItem.vuid}/allocations`, {
                  cost_code_vuid: item.cost_code_vuid,
                  cost_type_vuid: item.cost_type_vuid,
                  notes: 'Auto-generated allocation'
                });
                console.log('Auto-allocation created successfully for item:', savedItem.vuid, 'Response:', allocationResponse.data);
                
                // Get the newly created allocation to update state properly
                const allocsRes = await axios.get(`${baseURL}/api/project-contract-items/${savedItem.vuid}/allocations`);
                const savedAllocs = allocsRes.data || [];
                console.log('Retrieved saved allocations for new item:', savedAllocs);
                
                // Update allocationsByItem with the real allocations from the backend
                setAllocationsByItem(prev => {
                  const updated = {
                    ...prev,
                    [savedItem.vuid]: savedAllocs
                  };
                  console.log('Updated allocationsByItem:', updated);
                  return updated;
                });
                
                // IMPORTANT: Refresh the contract items to show the new allocation immediately
                console.log('Refreshing contract items to show new allocation...');
                await fetchContractItems(selectedContract.vuid);
                
              } catch (error) {
                console.error('Error creating auto-allocation:', error);
                console.error('Error details:', {
                  message: error.message,
                  response: error.response?.data,
                  status: error.response?.status
                });
              }
              
            } else {
              console.log('=== SKIPPING AUTO-ALLOCATION ===');
              console.log('Item missing cost code or type:', {
                item_number: item.item_number,
                cost_code_vuid: item.cost_code_vuid,
                cost_type_vuid: item.cost_type_vuid,
                reason: !item.cost_code_vuid ? 'Missing cost code' : 'Missing cost type'
              });
            }
            
            // If we have cached allocations for this temp item, persist them and remap cache to real id
            const cachedAllocs = allocationsByItem[item.vuid];
            if (Array.isArray(cachedAllocs) && cachedAllocs.length > 0) {
              console.log('Persisting cached allocations for temp item:', item.vuid, '→', savedItem.vuid, cachedAllocs);
              
              // Get current allocations to avoid conflicts
              const existingRes = await axios.get(`${baseURL}/api/project-contract-items/${savedItem.vuid}/allocations`);
              const existingAllocs = existingRes.data || [];
              
              // Only create cached allocations if they don't conflict with auto-created ones
              for (const cachedAlloc of cachedAllocs) {
                const isDuplicate = existingAllocs.some(existing => 
                  existing.cost_code_vuid === cachedAlloc.cost_code_vuid && 
                  existing.cost_type_vuid === cachedAlloc.cost_type_vuid
                );
                
                if (!isDuplicate) {
                  console.log('Creating additional cached allocation:', cachedAlloc);
                  await axios.post(`${baseURL}/api/project-contract-items/${savedItem.vuid}/allocations`, {
                    cost_code_vuid: cachedAlloc.cost_code_vuid,
                    cost_type_vuid: cachedAlloc.cost_type_vuid,
                    notes: cachedAlloc.notes || ''
                  });
                } else {
                  console.log('Skipping duplicate cached allocation:', cachedAlloc);
                }
              }
              
              // Refresh allocations after all operations
              const finalAllocsRes = await axios.get(`${baseURL}/api/project-contract-items/${savedItem.vuid}/allocations`);
              const finalAllocs = finalAllocsRes.data || [];
              console.log('Final allocations after processing cached ones:', finalAllocs);
              
              setAllocationsByItem(prev => {
                const next = { ...prev };
                delete next[item.vuid];
                next[savedItem.vuid] = finalAllocs;
                return next;
              });
              
              // Refresh contract items after processing cached allocations
              console.log('Refreshing contract items after processing cached allocations...');
              await fetchContractItems(selectedContract.vuid);
            }
            
            // Update the contractItems state to replace the temp item with the saved item (including cost code/type)
            setContractItems(prev => prev.map(existingItem => 
              existingItem.vuid === item.vuid ? updatedSavedItem : existingItem
            ));
            
          } else {
            // This is an existing item - update it if data has changed
            console.log('Updating existing item:', item.item_number, 'vuid:', item.vuid);
            
            // Update the existing item
            console.log('Sending update request for item:', item.item_number, 'with total_amount:', item.total_amount);
            console.log('Item VUID being used in URL:', item.vuid);
            console.log('Full URL being called:', `${baseURL}/api/project-contract-items/${item.vuid}`);
            const updateResponse = await axios.put(`${baseURL}/api/project-contract-items/${item.vuid}`, {
              item_number: item.item_number,
              description: item.description,
              quantity: item.quantity,
              unit_of_measure: item.unit_of_measure,
              unit_price: item.unit_price,
              total_amount: item.total_amount,
              status: item.status,
              cost_code_vuid: item.cost_code_vuid,
              cost_type_vuid: item.cost_type_vuid,
              specifications: item.specifications,
              delivery_location: item.delivery_location,
              delivery_date: item.delivery_date,
              warranty_info: item.warranty_info,
              notes: item.notes
            });
            console.log('Update response:', updateResponse.data);
            console.log('Existing item updated successfully:', item.item_number);
            
            // Update the local state to reflect the saved changes
            setContractItems(prev => prev.map(existingItem => 
              existingItem.vuid === item.vuid ? { ...existingItem, ...updateResponse.data } : existingItem
            ));
            console.log('Local state updated for item:', item.item_number);
            
            // Check if it needs allocations created
            if (item.cost_code_vuid && item.cost_type_vuid) {
              const existingAllocs = allocationsByItem[item.vuid] || [];
              if (existingAllocs.length === 0) {
                // Validate cost code + cost type combination uniqueness before creating allocation
                const validation = validateCostCodeTypeCombination(item.cost_code_vuid, item.cost_type_vuid, item.vuid);
                if (!validation.isValid) {
                  throw new Error(`Item ${item.item_number}: ${validation.message}`);
                }
                
                // No allocations exist but cost code/type are set - create allocation
                console.log('Creating missing allocation for existing item:', item.item_number);
                await axios.post(`${baseURL}/api/project-contract-items/${item.vuid}/allocations`, {
                  cost_code_vuid: item.cost_code_vuid,
                  cost_type_vuid: item.cost_type_vuid,
                  notes: 'Auto-generated allocation'
                });
                console.log('Missing allocation created successfully for item:', item.vuid);
                
                // Refresh allocations for this item
                const allocsRes = await axios.get(`${baseURL}/api/project-contract-items/${item.vuid}/allocations`);
                const savedAllocs = allocsRes.data || [];
                setAllocationsByItem(prev => ({ ...prev, [item.vuid]: savedAllocs }));
              }
            }
          }
        } catch (perItemErr) {
          console.error('Error processing item:', item.item_number, 'vuid:', item.vuid, perItemErr);
        }
      }
      
      // Post-pass: ensure allocations exist for all saved items with code/type
      for (const info of savedItemsInfo) {
        try {
          if (info.cost_code_vuid && info.cost_type_vuid) {
            console.log('Post-pass ensure allocation for item:', info.item_number, info.realVuid);
            await axios.put(`${baseURL}/api/project-contract-items/${info.realVuid}/allocations`, {
              allocations: [{ cost_code_vuid: info.cost_code_vuid, cost_type_vuid: info.cost_type_vuid }]
            });
          }
        } catch (postErr) {
          console.error('Post-pass allocation error for item:', info.item_number, info.realVuid, postErr);
        }
      }
      
      // Update contract total amount
      if (selectedContract?.vuid) {
        const updatedItems = contractItems.filter(item => !item.vuid.startsWith('temp-'));
        const total = updatedItems.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
        
        try {
          await axios.put(`${baseURL}/api/project-contracts/${selectedContract.vuid}`, {
            contract_amount: total
          });
          // Update local contract state
          setContracts(prev => prev.map(c => 
            c.vuid === selectedContract.vuid ? { ...c, contract_amount: total } : c
          ));
          setSelectedContract(prev => prev ? { ...prev, contract_amount: total } : null);
        } catch (err) {
          console.error('Error updating contract total:', err);
        }
      }
      
      setError('');
      setSuccessMessage('All contract items saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error saving contract items: ' + err.message);
    }
  };

  // Handle Done button - close lines view and refresh contracts
  const handleDoneEditing = async () => {
    try {
      // Close the lines view
      setShowItemsForm(false);
      
      // Refresh the project contracts data
      await fetchData();
      
      // Show success message
      setSuccessMessage('Contract lines closed and data refreshed!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error refreshing contracts:', err);
      setError('Error refreshing contracts: ' + err.message);
    }
  };

  // Option: auto-create contract items from budget lines when creating a contract
  const [createItemsFromBudget, setCreateItemsFromBudget] = useState(false);
  const [budgetIncreasePercentage, setBudgetIncreasePercentage] = useState(0);
  
  // Post-creation percentage adjustment
  const [adjustmentPercentage, setAdjustmentPercentage] = useState(0);
  const [showPercentageAdjustment, setShowPercentageAdjustment] = useState(false);
  const [originalAmounts, setOriginalAmounts] = useState({}); // Store original amounts before adjustments

  // Function to apply percentage adjustment to all contract items
  const applyPercentageAdjustment = async () => {
    if (!selectedContract || !contractItems.length) return;
    
    try {
      setError('');
      
      // Store original amounts if not already stored
      if (Object.keys(originalAmounts).length === 0) {
        const originals = {};
        contractItems.forEach(item => {
          originals[item.vuid] = item.total_amount;
        });
        setOriginalAmounts(originals);
      }
      
      // Calculate new amounts and update each item
      const updatePromises = contractItems.map(async (item) => {
        const originalAmount = originalAmounts[item.vuid] || item.total_amount;
        const adjustmentMultiplier = 1 + (adjustmentPercentage / 100);
        const newAmount = originalAmount * adjustmentMultiplier;
        
        // Update the item via API
        const response = await axios.put(`${baseURL}/api/project-contract-items/${item.vuid}`, {
          total_amount: newAmount,
          unit_price: newAmount // Assuming quantity is 1 for budget-based items
        });
        
        return response.data;
      });
      
      await Promise.all(updatePromises);
      
      // Refresh contract items to show updated amounts
      await fetchContractItems(selectedContract.vuid);
      
      setSuccessMessage(`Successfully applied ${adjustmentPercentage}% adjustment to all contract items`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Error applying percentage adjustment:', error);
      setError('Error applying percentage adjustment: ' + error.message);
    }
  };
  
  // Function to reset amounts to original values
  const resetToOriginalAmounts = async () => {
    if (!selectedContract || !contractItems.length || Object.keys(originalAmounts).length === 0) return;
    
    try {
      setError('');
      
      // Reset each item to its original amount
      const updatePromises = contractItems.map(async (item) => {
        const originalAmount = originalAmounts[item.vuid];
        if (originalAmount !== undefined) {
          const response = await axios.put(`${baseURL}/api/project-contract-items/${item.vuid}`, {
            total_amount: originalAmount,
            unit_price: originalAmount
          });
          return response.data;
        }
      });
      
      await Promise.all(updatePromises);
      
      // Refresh contract items and reset states
      await fetchContractItems(selectedContract.vuid);
      setAdjustmentPercentage(0);
      setOriginalAmounts({});
      
      setSuccessMessage('Successfully reset all amounts to original values');
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (error) {
      console.error('Error resetting to original amounts:', error);
      setError('Error resetting amounts: ' + error.message);
    }
  };

  // Helper: create contract items for each budget line in the selected project
  const generateItemsFromBudget = async (newContract) => {
    try {
      const projectVuid = formData.project_vuid || newContract.project_vuid;
      if (!projectVuid) return;

      // Get all budgets for the project
      const budgetsRes = await axios.get(`${baseURL}/api/project-budgets`);
      const projectBudgets = (budgetsRes.data || []).filter(b => b.project_vuid === projectVuid);

      // Gather all budget lines across budgets
      let allLines = [];
      for (const budget of projectBudgets) {
        try {
          const linesRes = await axios.get(`${baseURL}/api/project-budgets/${budget.vuid}/lines`);
          const lines = linesRes.data || [];
          allLines = allLines.concat(lines);
        } catch (e) {
          console.warn('Failed to fetch lines for budget', budget.vuid, e);
        }
      }

      // Get project-specific cost codes for this project
      let projectCostCodes = [];
      try {
        const projectCostCodesRes = await axios.get(`${baseURL}/api/projects/${projectVuid}/cost-codes`);
        projectCostCodes = projectCostCodesRes.data || [];
        console.log(`Fetched ${projectCostCodes.length} project cost codes`);
      } catch (e) {
        console.warn('Failed to fetch project cost codes:', e);
      }

      // Create a contract item per budget line
      let index = 1;
      console.log(`Processing ${allLines.length} budget lines to create contract items`);
      
      for (const line of allLines) {
        const item_number = String(index).padStart(4, '0');
        const cost_code_vuid = line.cost_code_vuid || null;
        const cost_type_vuid = line.cost_type_vuid || null;
        
        // Look for cost code in both global and project-specific cost codes
        let costCode = costCodes.find(c => c.vuid === cost_code_vuid);
        if (!costCode) {
          costCode = projectCostCodes.find(c => c.vuid === cost_code_vuid);
        }
        
        // Use the budget line description as-is, don't add cost code to description
        const description = line.description || 'Budget Line';
        const budgetAmount = line.budget_amount || 0;
        
        // Apply percentage increase if specified
        const increaseMultiplier = 1 + (budgetIncreasePercentage / 100);
        const total_amount = budgetAmount * increaseMultiplier;
        
        console.log(`Line ${index}: cost_code_vuid=${cost_code_vuid}, cost_type_vuid=${cost_type_vuid}, amount=${total_amount}`);

        try {
          console.log(`Creating contract item ${item_number} for contract ${newContract.vuid}`);
          const itemRes = await axios.post(`${baseURL}/api/project-contract-items`, {
            contract_vuid: newContract.vuid,
            item_number,
            cost_code_vuid,
            cost_type_vuid,
            description,
            quantity: 1, // Default quantity for budget-based items
            unit_price: total_amount, // Use budget amount as unit price
            total_amount,
            status: 'active',
            notes: ''
          });
          const savedItem = itemRes.data;
          console.log(`Contract item created successfully:`, savedItem);

          // Create a matching allocation if both are present
          if (cost_code_vuid && cost_type_vuid) {
            console.log(`Creating allocation for item ${savedItem.vuid} with cost_code: ${cost_code_vuid}, cost_type: ${cost_type_vuid}`);
            try {
              const allocationRes = await axios.post(`${baseURL}/api/project-contract-items/${savedItem.vuid}/allocations`, {
                cost_code_vuid,
                cost_type_vuid,
                notes: 'Auto-generated from budget line'
              });
              console.log('Allocation created successfully:', allocationRes.data);
              
              // Update local allocations cache for immediate display
              setAllocationsByItem(prev => ({
                ...prev,
                [savedItem.vuid]: [{ cost_code_vuid, cost_type_vuid }]
              }));
            } catch (allocationError) {
              console.error('Failed to create allocation:', allocationError);
            }
          }
        } catch (e) {
          console.error('Failed creating contract item from budget line', line?.vuid, e);
        }

        index += 1;
      }
    } catch (err) {
      console.error('Error generating items from budget:', err);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Project Contracts</h1>
          <p className="text-xl text-gray-600">Manage project contracts and sales orders</p>
        </div>

        {/* Unallocated Budget Lines Alert */}
        {showAllocationAlert && allocationStatus.has_unallocated_budget_lines && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Unallocated Budget Lines
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    {allocationStatus.budget_lines_without_allocations} of {allocationStatus.total_budget_lines} budget lines 
                    are not allocated to any contract items. This may indicate missing contract coverage or budget planning issues.
                  </p>
                  {allocationStatus.unallocated_budget_lines && allocationStatus.unallocated_budget_lines.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium">Budget lines needing contract allocations:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        {allocationStatus.unallocated_budget_lines.slice(0, 5).map((budgetLine, index) => (
                          <li key={index} className="text-xs">
                            {budgetLine.cost_code?.code || 'Unknown'} - {budgetLine.cost_type?.abbreviation || 'Unknown'}: {budgetLine.notes || 'No description'} 
                            ({formatCurrency(budgetLine.budget_amount)})
                          </li>
                        ))}
                        {allocationStatus.unallocated_budget_lines.length > 5 && (
                          <li className="text-xs text-amber-600">
                            ... and {allocationStatus.unallocated_budget_lines.length - 5} more budget lines
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex justify-center space-x-4">
          <button
            onClick={handleShowCreateForm}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            + Add Contract
          </button>
          <button
            onClick={refreshContractAmounts}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🔄 Refresh Amounts
          </button>

          <button
            onClick={() => {
              const searchParams = new URLSearchParams(location.search);
              const projectVuid = searchParams.get('project');
              const url = projectVuid ? `/external-change-orders?project=${projectVuid}` : '/external-change-orders';
              navigate(url);
            }}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            📋 External Change Orders
          </button>
        </div>

        {/* Create/Edit Contract Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingContract ? 'Edit Contract' : 'Add New Contract'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">{errors.error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="project_vuid" className="block text-lg font-semibold text-gray-900 mb-2">
                    Project *
                  </label>
                  <div className="relative dropdown-container">
                    <input
                      type="text"
                      placeholder={formData.project_vuid ? "Type to search projects..." : "Select project..."}
                      value={formData.project_vuid ? 
                        (projects.find(p => p.vuid === formData.project_vuid)?.project_name || '') : 
                        projectSearchTerm
                      }
                      onChange={(e) => {
                        if (!formData.project_vuid) {
                          setProjectSearchTerm(e.target.value);
                          setProjectDropdownOpen(true);
                        }
                      }}
                      onClick={() => {
                        if (!formData.project_vuid) {
                          setProjectDropdownOpen(!projectDropdownOpen);
                        } else {
                          // Clear selection to allow searching
                          setFormData(prev => ({ ...prev, project_vuid: '' }));
                          setProjectSearchTerm('');
                          setProjectDropdownOpen(true);
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                        errors.project_vuid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {projectDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search projects..."
                            value={projectSearchTerm}
                            onChange={(e) => setProjectSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                        {getFilteredProjects().length > 0 ? (
                          getFilteredProjects().map(project => (
                            <div
                              key={project.vuid}
                              onClick={async () => {
                                setFormData(prev => ({ ...prev, project_vuid: project.vuid }));
                                setProjectDropdownOpen(false);
                                setProjectSearchTerm('');
                              
                              // Fetch project-specific cost codes for this project
                              try {
                                const projectCostCodesRes = await axios.get(`${baseURL}/api/projects/${project.vuid}/cost-codes`);
                                setProjectCostCodes(projectCostCodesRes.data || []);
                                console.log(`Fetched ${projectCostCodesRes.data?.length || 0} project cost codes for project ${project.project_name}`);
                              } catch (e) {
                                console.warn('Failed to fetch project cost codes:', e);
                                setProjectCostCodes([]);
                              }
                              
                              // Fetch project budget lines for this project
                              try {
                                const budgetLinesRes = await axios.get(`${baseURL}/api/projects/${project.vuid}/budget-lines`);
                                setProjectBudgetLines(budgetLinesRes.data || []);
                                console.log(`Fetched ${budgetLinesRes.data?.length || 0} budget lines for project ${project.project_name}`);
                              } catch (e) {
                                console.warn('Failed to fetch project budget lines:', e);
                                setProjectBudgetLines([]);
                              }
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{project.project_number}</div>
                            <div className="text-sm text-gray-600">{project.project_name}</div>
                          </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No projects found matching "{projectSearchTerm}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.project_vuid && (
                    <p className="mt-1 text-sm text-red-600">{errors.project_vuid}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contract_number" className="block text-lg font-semibold text-gray-900 mb-2">
                    Contract Number *
                  </label>
                  <input
                    type="text"
                    id="contract_number"
                    name="contract_number"
                    value={formData.contract_number}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.contract_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter contract number"
                    required
                  />
                  {errors.contract_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.contract_number}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="customer_vuid" className="block text-lg font-semibold text-gray-900 mb-2">
                    Customer *
                  </label>
                  <div className="relative dropdown-container">
                    <input
                      type="text"
                      placeholder={formData.customer_vuid ? "Type to search customers..." : "Select customer..."}
                      value={formData.customer_vuid ? 
                        (customers.find(c => c.vuid === formData.customer_vuid)?.customer_name || '') : 
                        customerSearchTerm
                      }
                      onChange={(e) => {
                        if (!formData.customer_vuid) {
                          setCustomerSearchTerm(e.target.value);
                          setCustomerDropdownOpen(true);
                        }
                      }}
                      onClick={() => {
                        if (!formData.customer_vuid) {
                          setCustomerDropdownOpen(!customerDropdownOpen);
                        } else {
                          // Clear selection to allow searching
                          setFormData(prev => ({ ...prev, customer_vuid: '' }));
                          setCustomerSearchTerm('');
                          setCustomerDropdownOpen(true);
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                        errors.customer_vuid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {customerDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search customers..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                        {getFilteredCustomers().length > 0 ? (
                          getFilteredCustomers().map(customer => (
                            <div
                              key={customer.vuid}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, customer_vuid: customer.vuid }));
                                setCustomerDropdownOpen(false);
                                setCustomerSearchTerm('');
                              }}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{customer.customer_name}</div>
                              <div className="text-sm text-gray-600">{customer.company_name}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No customers found matching "{customerSearchTerm}"
                          </div>
                        )}
                      </div>
                    )}
                    {errors.customer_vuid && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer_vuid}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="accounting_period_vuid" className="block text-lg font-semibold text-gray-900 mb-2">
                    Accounting Period *
                  </label>
                  <div className="relative dropdown-container">
                    <input
                      type="text"
                      placeholder="Select accounting period..."
                      value={accountingPeriods.find(ap => ap.vuid === formData.accounting_period_vuid) ? 
                        `${accountingPeriods.find(ap => ap.vuid === formData.accounting_period_vuid)?.month}/${accountingPeriods.find(ap => ap.vuid === formData.accounting_period_vuid)?.year}` : ''}
                      onClick={() => setAccountingPeriodDropdownOpen(!accountingPeriodDropdownOpen)}
                      readOnly
                      className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                        errors.accounting_period_vuid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {accountingPeriodDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {accountingPeriods.map(period => (
                          <div
                            key={period.vuid}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, accounting_period_vuid: period.vuid }));
                              setAccountingPeriodDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{period.month}/{period.year}</div>
                            <div className="text-sm text-gray-600">{period.status === 'open' ? 'Open' : 'Closed'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.accounting_period_vuid && (
                      <p className="mt-1 text-sm text-red-600">{errors.accounting_period_vuid}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="contract_type" className="block text-lg font-semibold text-gray-900 mb-2">
                    Contract Type *
                  </label>
                  <div className="relative dropdown-container">
                    <input
                      type="text"
                      placeholder="Select contract type..."
                      value={formData.contract_type === 'sales_order' ? 'Sales Order' : 'Purchase Order'}
                      onClick={() => setContractTypeDropdownOpen(!contractTypeDropdownOpen)}
                      readOnly
                      className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                        errors.contract_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {contractTypeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          <div
                            onClick={() => {
                              setFormData(prev => ({ ...prev, contract_type: 'sales_order' }));
                              setContractTypeDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                          >
                            Sales Order
                          </div>
                          <div
                            onClick={() => {
                              setFormData(prev => ({ ...prev, contract_type: 'purchase_order' }));
                              setContractTypeDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                          >
                            Purchase Order
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.contract_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.contract_type}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block text-lg font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <div className="relative dropdown-container">
                    <input
                      type="text"
                      placeholder="Select status..."
                      value={formData.status === 'active' ? 'Active' : 
                             formData.status === 'completed' ? 'Completed' : 
                             formData.status === 'on-hold' ? 'On Hold' : 
                             formData.status === 'cancelled' ? 'Cancelled' : 
                             formData.status}
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      readOnly
                      className="w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all border-gray-300"
                    />
                    {statusDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          <div
                            onClick={() => {
                              setFormData(prev => ({ ...prev, status: 'active' }));
                              setStatusDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                          >
                            Active
                          </div>
                          <div
                            onClick={() => {
                              setFormData(prev => ({ ...prev, status: 'completed' }));
                              setStatusDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                          >
                            Completed
                          </div>
                          <div
                            onClick={() => {
                              setFormData(prev => ({ ...prev, status: 'on-hold' }));
                              setStatusDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                          >
                            On Hold
                          </div>
                          <div
                            onClick={() => {
                              setFormData(prev => ({ ...prev, status: 'cancelled' }));
                              setStatusDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                          >
                            Cancelled
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter contract description"
                    required
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Auto-calculated Amount (read-only) */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    Total Amount (auto)
                  </label>
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg font-bold bg-gray-50">
                    ${Array.isArray(contractItems) && contractItems.length > 0
                      ? contractItems.reduce((sum, it) => sum + (parseFloat(it.total_amount || 0) || 0), 0).toFixed(2)
                      : '0.00'}
                  </div>
                </div>

                <div>
                  <label htmlFor="start_date" className="block text-lg font-semibold text-gray-900 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-lg font-semibold text-gray-900 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-lg font-semibold text-gray-900 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all resize-none"
                    placeholder="Enter additional notes"
                  />
                </div>
              </div>

              {/* Option: Create items from budget lines - show if project is selected */}
              {formData.project_vuid && (
                <div className="mt-2">
                  <label className="inline-flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={createItemsFromBudget}
                      onChange={(e) => setCreateItemsFromBudget(e.target.checked)}
                      className="h-5 w-5 text-gray-800 border-gray-300 rounded focus:ring-gray-800"
                    />
                    <span className="text-gray-900 text-md font-medium">
                      Create Contract Items based on Budget lines
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    When selected, a contract item will be created for each project budget line with matching cost code and cost type, amount prefilled, and line numbers auto-incremented starting at 0001.
                    {projectBudgetLines.length > 0 ? (
                      <span className="block mt-1 text-green-600 font-medium">
                        ✓ {projectBudgetLines.length} budget lines available for this project
                      </span>
                    ) : (
                      <span className="block mt-1 text-orange-600 font-medium">
                        ⚠ No budget lines found for this project - items will need to be created manually
                      </span>
                    )}
                    {projectSettings.allow_project_cost_codes === 'true' && (
                      <span className="block mt-1 text-blue-600 font-medium">
                        Project-specific cost codes are enabled - any cost code format will be supported.
                      </span>
                    )}
                  </p>
                  
                  {createItemsFromBudget && projectBudgetLines.length > 0 && (
                    <div className="mt-3 ml-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Increase Percentage (Optional)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={budgetIncreasePercentage}
                          onChange={(e) => setBudgetIncreasePercentage(parseFloat(e.target.value) || 0)}
                          min="0"
                          max="200"
                          step="0.1"
                          placeholder="0.0"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-gray-600">%</span>
                        <span className="text-sm text-gray-500">
                          (e.g., 15% for contractor fee)
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Contract amounts will be: Budget Amount × (1 + {budgetIncreasePercentage}%)
                        {budgetIncreasePercentage > 0 && (
                          <span className="text-blue-600 font-medium">
                            {' '}= Budget Amount × {(1 + budgetIncreasePercentage / 100).toFixed(3)}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  type="submit"
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  {editingContract ? 'Update Contract' : 'Create Contract'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Allocations Modal */}
        {console.log('🔧 Modal render check:', { showAllocationsModal, selectedItemForAllocations: !!selectedItemForAllocations })}
        {showAllocationsModal && selectedItemForAllocations && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Manage Allocations for Item: {selectedItemForAllocations.item_number}
                </h2>
                <button
                  onClick={() => setShowAllocationsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Allocate this contract item across multiple cost codes and cost types.
                </p>

                {/* Current Allocations */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Allocations</h3>
                  {allocations.length === 0 ? (
                    <p className="text-gray-500 italic">No allocations defined yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {allocations.map((allocation) => (
                        <div key={allocation.vuid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {getAllCostCodes().find(c => c.vuid === allocation.cost_code_vuid)?.code} - 
                              {costTypes.find(t => t.vuid === allocation.cost_type_vuid)?.cost_type}
                            </div>
                            <div className="text-sm text-gray-600">
                              {getAllCostCodes().find(c => c.vuid === allocation.cost_code_vuid)?.description} - 
                              {costTypes.find(t => t.vuid === allocation.cost_type_vuid)?.description}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleDeleteAllocation(allocation.vuid)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Allocation */}
                {!showAddAllocationForm ? (
                  <button
                    onClick={() => setShowAddAllocationForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    + Add Allocation
                  </button>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Only unallocated cost code/type combinations from the project budget are shown. This prevents duplicate allocations across all contract items in this project.
                      </p>
                    </div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Add New Allocation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost Code</label>
                        <select
                          value={newAllocation.cost_code_vuid}
                          onChange={(e) => setNewAllocation({...newAllocation, cost_code_vuid: e.target.value, cost_type_vuid: ''})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Cost Code</option>
                          {getAllCostCodes()
                            .filter(c => c.status === 'active')
                            .filter(costCode => (
                              projectBudgetLines.length === 0 ||
                              projectBudgetLines.some(budgetLine => budgetLine.cost_code_vuid === costCode.vuid)
                            ))
                            .filter(costCode => {
                              // Filter out cost codes that are already allocated to any contract item in this project
                              const contract = contracts.find(c => c.vuid === selectedItemForAllocations?.contract_vuid);
                              if (!contract?.items) return true;
                              
                              const allProjectAllocations = contract.items.flatMap(item => allocationsByItem[item.vuid] || []);
                              return !allProjectAllocations.some(alloc => alloc.cost_code_vuid === costCode.vuid);
                            })
                            .map((costCode) => (
                              <option key={costCode.vuid} value={costCode.vuid}>
                                {costCode.code} - {costCode.description}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost Type</label>
                        <select
                          value={newAllocation.cost_type_vuid}
                          onChange={(e) => setNewAllocation({...newAllocation, cost_type_vuid: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Cost Type</option>
                          {costTypes
                            .filter(t => t.status === 'active')
                            .filter(costType => 
                              projectBudgetLines.some(budgetLine => 
                                budgetLine.cost_code_vuid === newAllocation.cost_code_vuid &&
                                budgetLine.cost_type_vuid === costType.vuid
                            ))
                            .filter(costType => {
                              // Filter out cost types that are already allocated to any contract item with the selected cost code
                              const contract = contracts.find(c => c.vuid === selectedItemForAllocations?.contract_vuid);
                              if (!contract?.items) return true;
                              
                              const allProjectAllocations = contract.items.flatMap(item => allocationsByItem[item.vuid] || []);
                              return !allProjectAllocations.some(alloc => 
                                alloc.cost_code_vuid === newAllocation.cost_code_vuid && 
                                alloc.cost_type_vuid === costType.vuid
                              );
                            })
                            .map((costType) => (
                              <option key={costType.vuid} value={costType.vuid}>
                                {costType.cost_type} ({costType.abbreviation})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleAddAllocation}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Add Allocation
                      </button>
                      <button
                        onClick={() => setShowAddAllocationForm(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAllocationsModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllocations}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Save Allocations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search contracts..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Project Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
              >
                Project: {projectFilter === 'all' ? 'All' : projects.find(p => p.vuid === projectFilter)?.project_name || 'Unknown'}
                <svg className="inline ml-2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {projectDropdownOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-300">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProjectFilter('all');
                        setProjectDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      All Projects
                    </button>
                    {projects.map(project => (
                      <button
                        key={project.vuid}
                        onClick={() => {
                          setProjectFilter(project.vuid);
                          setProjectDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        {project.project_number} - {project.project_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
              >
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
                <svg className="inline ml-2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {statusDropdownOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-300">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setStatusDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('active');
                        setStatusDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('completed');
                        setStatusDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('cancelled');
                        setStatusDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      Cancelled
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('on_hold');
                        setStatusDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      On Hold
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contracts List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contracts</h2>
          
          {/* Contracts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedContracts.map((contract) => (
              <div key={contract.vuid} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {contract.contract_type === 'sales_order' ? 'SO' : 'PO'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{contract.contract_number}</h3>
                    <p className="text-lg text-gray-600 font-medium">{contract.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                        {contract.contract_type === 'sales_order' ? 'Sales Order' : 'Purchase Order'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Project:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {projects.find(p => p.vuid === contract.project_vuid)?.project_name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Customer:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {customers.find(c => c.vuid === contract.customer_vuid)?.customer_name || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Accounting Period:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {accountingPeriods.find(ap => ap.vuid === contract.accounting_period_vuid) ? 
                        `${accountingPeriods.find(ap => ap.vuid === contract.accounting_period_vuid)?.month}/${accountingPeriods.find(ap => ap.vuid === contract.accounting_period_vuid)?.year}` : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${parseFloat(contract.contract_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Start Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">End Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => selectedContract && selectedContract.vuid === contract.vuid && showItemsForm ? handleHideItems() : handleViewItems(contract)}
                    className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedContract && selectedContract.vuid === contract.vuid && showItemsForm
                        ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                        : 'text-vermillion-700 bg-vermillion-100 hover:bg-vermillion-200 focus:ring-vermillion-500'
                    }`}
                  >
                    {selectedContract && selectedContract.vuid === contract.vuid && showItemsForm ? 'Hide Items' : 'View Items'}
                  </button>
                  <button
                    onClick={() => handleIntegrationModal(contract)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    title="Send to integration"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEditContract(contract)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Edit contract"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteContract(contract)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Delete contract"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {paginatedContracts.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">No contracts found</p>
              <p className="text-gray-600">Get started by creating your first contract.</p>
            </div>
          )}

          {/* Contract Items Form - MOVED HERE */}
          {showItemsForm && selectedContract && (
            <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                Contract Items Entry - Excel Style
              </h2>
              
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-600 font-medium">{successMessage}</p>
                </div>
              )}
              
              {/* Percentage Adjustment Controls */}
              {contractItems.length > 0 && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Mark-up Adjustments</h3>
                    <button
                      onClick={() => setShowPercentageAdjustment(!showPercentageAdjustment)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showPercentageAdjustment ? 'Hide' : 'Show'} Adjustment Tools
                    </button>
                  </div>
                  
                  {showPercentageAdjustment && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700">
                          Mark-up Percentage:
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={adjustmentPercentage}
                            onChange={(e) => setAdjustmentPercentage(parseFloat(e.target.value) || 0)}
                            min="-50"
                            max="200"
                            step="0.1"
                            placeholder="0.0"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-600">%</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={applyPercentageAdjustment}
                            disabled={adjustmentPercentage === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            Apply to All Items
                          </button>
                          {Object.keys(originalAmounts).length > 0 && (
                            <button
                              onClick={resetToOriginalAmounts}
                              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                            >
                              Reset to Original
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Current calculation:</strong> Original Amount × (1 + {adjustmentPercentage}%)
                          {adjustmentPercentage !== 0 && (
                            <span className="text-blue-600 font-medium">
                              {' '}= Original Amount × {(1 + adjustmentPercentage / 100).toFixed(3)}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          This will update all contract item amounts. Use positive percentages for markups (e.g., 15%) or negative for discounts (e.g., -5%).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-6">
                <p className="text-gray-600 text-center">
                  Use Tab to navigate between fields, Enter to add a new line, and start typing in dropdowns to search
                </p>
              </div>

              {/* Add Item Button */}
              <div className="mb-4 text-center">
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
                  title="Add new contract item"
                >
                  + Add Item
                </button>
              </div>

              {/* Excel-style grid */}
              <div className="overflow-x-auto">
                <table key={`contract-items-${projectCostCodes.length}`} className="min-w-max border border-gray-300" style={{ position: 'relative' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Item # *</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Cost Code</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Cost Type</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Description *</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Total Amount *</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Change Order Amount</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Total with Changes</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {console.log('🎨 Rendering contractItems:', contractItems.length, 'items', contractItems)}
                    {contractItems && contractItems.length > 0 ? (
                      contractItems
                        .sort((a, b) => {
                          const aNum = parseInt(a.item_number || '0', 10);
                          const bNum = parseInt(b.item_number || '0', 10);
                          return aNum - bNum;
                        })
                        .map((item, index) => (
                          <tr key={item.vuid || index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">
                              <input
                                type="text"
                                value={item.item_number || ''}
                                onChange={(e) => {
                                  const newItems = [...contractItems];
                                  newItems[index] = { ...newItems[index], item_number: e.target.value };
                                  setContractItems(newItems);
                                }}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                placeholder="Item #"
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {projectSettings?.allow_project_cost_codes ? (
                                // Project-specific mode: text input
                                <input
                                  type="text"
                                  value={getCostCodeInputValue(item)}
                                  onChange={(e) => {
                                    const newCostCodeValue = e.target.value;
                                    const newItems = [...contractItems];
                                    newItems[index] = { ...newItems[index], cost_code_vuid: newCostCodeValue };
                                    setContractItems(newItems);
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                  placeholder="Enter cost code..."
                                />
                              ) : (
                                // Global mode: dropdown
                                <select
                                  value={item.cost_code_vuid || ''}
                                  onChange={async (e) => {
                                    const newCostCodeVuid = e.target.value;
                                    const newItems = [...contractItems];
                                    newItems[index] = { ...newItems[index], cost_code_vuid: newCostCodeVuid };
                                    setContractItems(newItems);
                                  
                                  // Auto-select cost type if there's only one option for this cost code
                                  if (newCostCodeVuid) {
                                    const availableCostTypes = costTypes
                                      .filter(t => t.status === 'active')
                                      .filter(costType => 
                                        projectBudgetLines.some(budgetLine => 
                                          budgetLine.cost_type_vuid === costType.vuid &&
                                          budgetLine.cost_code_vuid === newCostCodeVuid
                                        )
                                      );
                                    
                                    console.log('Grid: Available cost types for cost code:', newCostCodeVuid, ':', availableCostTypes);
                                    
                                    if (availableCostTypes.length === 1) {
                                      console.log('Grid: Auto-selecting single cost type:', availableCostTypes[0].cost_type);
                                      newItems[index] = { ...newItems[index], cost_type_vuid: availableCostTypes[0].vuid };
                                      setContractItems(newItems);
                                      
                                      // Handle allocation update with auto-selected cost type
                                      await handleCostCodeTypeChange(item.vuid, newCostCodeVuid, availableCostTypes[0].vuid);
                                    } else if (availableCostTypes.length > 1) {
                                      console.log('Grid: Multiple cost types available, user must select');
                                      // Clear cost type so user can choose
                                      newItems[index] = { ...newItems[index], cost_type_vuid: '' };
                                      setContractItems(newItems);
                                      
                                      // Handle allocation update (cost type will be cleared)
                                      await handleCostCodeTypeChange(item.vuid, newCostCodeVuid, '');
                                    } else {
                                      console.log('Grid: No cost types available for this cost code');
                                      // Clear cost type
                                      newItems[index] = { ...newItems[index], cost_type_vuid: '' };
                                      setContractItems(newItems);
                                      
                                      // Handle allocation update (cost type will be cleared)
                                      await handleCostCodeTypeChange(item.vuid, newCostCodeVuid, '');
                                    }
                                  } else {
                                    // Cost code cleared, clear cost type too
                                    newItems[index] = { ...newItems[index], cost_type_vuid: '' };
                                    setContractItems(newItems);
                                    
                                    // Handle allocation update (both will be cleared)
                                    await handleCostCodeTypeChange(item.vuid, '', '');
                                  }
                                }}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm"
                              >
                                <option value="">Select Cost Code</option>
                                {(() => {
                                  const allCostCodes = getAllCostCodes();
                                  const filteredCostCodes = allCostCodes
                                    .filter(c => c.status === 'active');
                                  
                                  console.log(`🎯 Cost codes for item ${item.item_number}:`, {
                                    allCostCodes: allCostCodes.length,
                                    filteredCostCodes: filteredCostCodes.length,
                                    itemCostCodeVuid: item.cost_code_vuid,
                                    projectSettings: projectSettings,
                                    allowProjectCostCodes: projectSettings?.allow_project_cost_codes,
                                    availableOptions: filteredCostCodes.map(c => ({ vuid: c.vuid, code: c.code, description: c.description, is_project_specific: c.is_project_specific }))
                                  });
                                  
                                  return filteredCostCodes.map((costCode) => (
                                    <option key={costCode.vuid} value={costCode.vuid}>
                                      {costCode.code} - {costCode.description}
                                    </option>
                                  ));
                                })()}
                              </select>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <select
                                value={item.cost_type_vuid || ''}
                                onChange={async (e) => {
                                  const newCostTypeVuid = e.target.value;
                                  const newItems = [...contractItems];
                                  newItems[index] = { ...newItems[index], cost_type_vuid: newCostTypeVuid };
                                  setContractItems(newItems);
                                  
                                  // Handle allocation update
                                  await handleCostCodeTypeChange(item.vuid, item.cost_code_vuid, newCostTypeVuid);
                                }}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm"
                              >
                                <option value="">Select Cost Type</option>
                                {costTypes
                                  .filter(t => t.status === 'active')
                                  .filter(costType => (
                                    projectBudgetLines.length === 0 ||
                                    projectBudgetLines.some(budgetLine => 
                                      budgetLine.cost_type_vuid === costType.vuid &&
                                      budgetLine.cost_code_vuid === item.cost_code_vuid
                                    )
                                  ))
                                  .map((costType) => (
                                   <option key={costType.vuid} value={costType.vuid}>
                                     {costType.cost_type}
                                   </option>
                                 ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-4 py-2 align-top whitespace-normal break-words">
                              <textarea
                                value={item.description || ''}
                                onChange={(e) => {
                                  const newItems = [...contractItems];
                                  newItems[index] = { ...newItems[index], description: e.target.value };
                                  setContractItems(newItems);
                                }}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded resize-none"
                                placeholder="Description"
                                rows={2}
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                <input
                                  type="text"
                                  value={item.total_amount || ''}
                                  onChange={(e) => {
                                    const newItems = [...contractItems];
                                    newItems[index] = { ...newItems[index], total_amount: e.target.value };
                                    setContractItems(newItems);
                                  }}
                                  className="w-full pl-6 pr-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-gray-50"
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <div className="text-sm font-medium">
                                {(() => {
                                  const changeOrderAmount = getChangeOrderAmount(item);
                                  return changeOrderAmount !== 0 ? (
                                    <span className={`${changeOrderAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {changeOrderAmount > 0 ? '+' : ''}{formatCurrency(changeOrderAmount)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">$0.00</span>
                                  );
                                })()}
                              </div>
                              {(() => {
                                const changeOrderAmount = getChangeOrderAmount(item);
                                if (changeOrderAmount !== 0) {
                                  const matchingLines = changeOrderLines.filter(changeLine => 
                                    changeLine.cost_code_vuid === item.cost_code_vuid &&
                                    changeLine.cost_type_vuid === item.cost_type_vuid
                                  );
                                  return (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {matchingLines.length} change order{matchingLines.length !== 1 ? 's' : ''}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <div className="text-sm font-semibold">
                                {(() => {
                                  const originalAmount = parseFloat(item.total_amount || 0) || 0;
                                  const changeOrderAmount = getChangeOrderAmount(item);
                                  const totalWithChanges = originalAmount + changeOrderAmount;
                                  
                                  return (
                                    <span className={`${totalWithChanges !== originalAmount ? 'text-blue-600' : 'text-gray-900'}`}>
                                      {formatCurrency(totalWithChanges)}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <textarea
                                value={item.notes || ''}
                                onChange={(e) => {
                                  const newItems = [...contractItems];
                                  newItems[index] = { ...newItems[index], notes: e.target.value };
                                  setContractItems(newItems);
                                }}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded resize-none"
                                placeholder="Notes"
                                rows={2}
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {console.log('🔧 Rendering Actions column for item:', item.item_number)}
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleManageAllocations(item)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  title="Manage cost code and cost type allocations"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  Allocations
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.vuid)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          No contract items found. Add your first item below.
                        </td>
                      </tr>
                    )}
                    {/* New item row */}
                    <tr className="bg-blue-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="text"
                          id="new-item-number"
                          value={newItemData.item_number}
                          onChange={(e) => setNewItemData({...newItemData, item_number: e.target.value})}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50"
                          placeholder="Item #"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {projectSettings?.allow_project_cost_codes ? (
                          // Project-specific mode: text input
                          <input
                            type="text"
                            value={newItemData.cost_code_vuid || ''}
                            onChange={(e) => setNewItemData({...newItemData, cost_code_vuid: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50"
                            placeholder="Enter cost code..."
                          />
                        ) : (
                          // Global mode: dropdown
                          <select
                            value={newItemData.cost_code_vuid || ''}
                            onChange={(e) => setNewItemData({...newItemData, cost_code_vuid: e.target.value})}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50 text-sm"
                          >
                            <option value="">Select Cost Code</option>
                            {getAllCostCodes()
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
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <select
                          value={newItemData.cost_type_vuid || ''}
                          onChange={(e) => setNewItemData({...newItemData, cost_type_vuid: e.target.value})}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50 text-sm"
                        >
                          <option value="">Select Cost Type</option>
                          {costTypes
                            .filter(t => t.status === 'active')
                            .filter(costType => (
                              projectBudgetLines.length === 0 ||
                              projectBudgetLines.some(budgetLine => 
                                budgetLine.cost_type_vuid === costType.vuid &&
                                budgetLine.cost_code_vuid === newItemData.cost_code_vuid
                              )
                            ))
                            .map((costType) => (
                             <option key={costType.vuid} value={costType.vuid}>
                               {costType.cost_type}
                             </option>
                           ))}
                        </select>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <textarea
                          value={newItemData.description}
                          onChange={(e) => setNewItemData({...newItemData, description: e.target.value})}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50 resize-none"
                          placeholder="Description"
                          rows={2}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="text"
                            value={newItemData.total_amount}
                            onChange={(e) => setNewItemData({...newItemData, total_amount: e.target.value})}
                            className="w-full pl-6 pr-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50"
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <textarea
                          value={newItemData.notes}
                          onChange={(e) => setNewItemData({...newItemData, notes: e.target.value})}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded bg-blue-50 resize-none"
                          placeholder="Notes"
                          rows={2}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          type="button"
                          onClick={handleAddNewItem}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
                          title="Add new contract item"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Save All Items and Done Buttons */}
              <div className="mt-6 text-center space-x-4">
                <button
                  type="button"
                  onClick={handleSaveAllItems}
                  className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  💾 Save All Items
                </button>
                <button
                  type="button"
                  onClick={handleDoneEditing}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  ✅ Done
                </button>
              </div>
            </div>
          )}

          {/* Change Order Lines Section */}
          {changeOrderLines && changeOrderLines.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Change Order Lines</h3>
              <div className="overflow-x-auto">
                <table className="min-w-max border border-gray-300">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Change Order</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Cost Code</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Cost Type</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Contract Change</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Budget Change</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeOrderLines.map((changeLine, index) => {
                      const costCode = getAllCostCodes().find(c => c.vuid === changeLine.cost_code_vuid);
                      const costType = costTypes.find(t => t.vuid === changeLine.cost_type_vuid);
                      const changeOrder = externalChangeOrders.find(co => co.vuid === changeLine.change_order_vuid);
                      
                      return (
                        <tr key={`change-${changeLine.vuid || index}`} className="hover:bg-blue-50">
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                            <div className="font-medium">{changeLine.change_order_number || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{changeLine.change_order_date || ''}</div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                            {costCode ? `${costCode.code} - ${costCode.description}` : 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                            {costType ? `${costType.abbreviation} - ${costType.cost_type}` : 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                            {changeLine.notes || 'No description'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right">
                            <span className={`font-medium ${(parseFloat(changeLine.contract_amount_change || 0) >= 0) ? 'text-green-600' : 'text-red-600'}`}>
                              {(parseFloat(changeLine.contract_amount_change || 0) >= 0) ? '+' : ''}{formatCurrency(changeLine.contract_amount_change || 0)}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right">
                            <span className={`font-medium ${(parseFloat(changeLine.budget_amount_change || 0) >= 0) ? 'text-green-600' : 'text-red-600'}`}>
                              {(parseFloat(changeLine.budget_amount_change || 0) >= 0) ? '+' : ''}{formatCurrency(changeLine.budget_amount_change || 0)}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              changeLine.change_order_status === 'approved' ? 'bg-green-100 text-green-800' :
                              changeLine.change_order_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {changeLine.change_order_status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectContracts;
