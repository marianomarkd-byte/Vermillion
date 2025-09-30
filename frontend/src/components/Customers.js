import React, { useState, useEffect } from 'react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    fax: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tax_id: '',
    duns_number: '',
    business_type: '',
    industry: '',
    credit_limit: '',
    payment_terms: '',
    discount_terms: '',
    insurance_certificate: false,
    insurance_expiry: '',
    workers_comp: false,
    liability_insurance: false,
    status: 'active',
    customer_type: '',
    rating: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [customerTypeDropdownOpen, setCustomerTypeDropdownOpen] = useState(false);
  const [formStatusDropdownOpen, setFormStatusDropdownOpen] = useState(false);
  const [formCustomerTypeDropdownOpen, setFormCustomerTypeDropdownOpen] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterAndPaginateCustomers();
  }, [customers, searchTerm, statusFilter, customerTypeFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setStatusDropdownOpen(false);
        setCustomerTypeDropdownOpen(false);
        setFormStatusDropdownOpen(false);
        setFormCustomerTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filterAndPaginateCustomers = () => {
    let filtered = customers.filter(customer => {
      const matchesSearch = 
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      const matchesType = customerTypeFilter === 'all' || customer.customer_type === customerTypeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
    
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  };

  const getCurrentCustomers = () => {
    const indexOfLastCustomer = currentPage * customersPerPage;
    const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
    return filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'search') {
      setSearchTerm(value);
    } else if (filterType === 'status') {
      setStatusFilter(value);
    } else if (filterType === 'customerType') {
      setCustomerTypeFilter(value);
    }
    setCurrentPage(1);
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        console.error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
    if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clean up empty strings to null for optional fields
    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '' && key !== 'customer_name' && key !== 'company_name') {
        cleanedData[key] = null;
      }
    });

    try {
      const url = editingCustomer 
        ? `http://localhost:5001/api/customers/${editingCustomer.vuid}`
        : 'http://localhost:5001/api/customers';
      
              const method = editingCustomer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (editingCustomer) {
          setCustomers(customers.map(c => 
            c.vuid === editingCustomer.vuid ? result : c
          ));
        } else {
          setCustomers([...customers, result]);
        }
        
        setFormData({
          customer_name: '',
          company_name: '',
          contact_person: '',
          email: '',
          phone: '',
          fax: '',
          website: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          tax_id: '',
          duns_number: '',
          business_type: '',
          industry: '',
          credit_limit: '',
          payment_terms: '',
          discount_terms: '',
          insurance_certificate: false,
          insurance_expiry: '',
          workers_comp: false,
          liability_insurance: false,
          status: 'active',
          customer_type: '',
          rating: '',
          notes: ''
        });
        setEditingCustomer(null);
        setShowCreateForm(false);
        setErrors({});
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'An error occurred' });
      }
    } catch (error) {
              setErrors({ submit: 'An error occurred while saving the customer' });
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowCreateForm(false);
    setFormData({
      customer_name: customer.customer_name,
      company_name: customer.company_name,
      contact_person: customer.contact_person || '',
      email: customer.email || '',
      phone: customer.phone || '',
      fax: customer.fax || '',
      website: customer.website || '',
      address_line1: customer.address_line1 || '',
      address_line2: customer.address_line2 || '',
      city: customer.city || '',
      state: customer.state || '',
      postal_code: customer.postal_code || '',
      country: customer.country || '',
      tax_id: customer.tax_id || '',
      duns_number: customer.duns_number || '',
      business_type: customer.business_type || '',
      industry: customer.industry || '',
      credit_limit: customer.credit_limit || '',
      payment_terms: customer.payment_terms || '',
      discount_terms: customer.discount_terms || '',
      insurance_certificate: customer.insurance_certificate || false,
      insurance_expiry: customer.insurance_expiry || '',
      workers_comp: customer.workers_comp || false,
      liability_insurance: customer.liability_insurance || false,
      status: customer.status,
      customer_type: customer.customer_type || '',
      rating: customer.rating || '',
      notes: customer.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setShowCreateForm(false);
    setFormData({
      customer_name: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      fax: '',
      website: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      tax_id: '',
      duns_number: '',
      business_type: '',
      industry: '',
      credit_limit: '',
      payment_terms: '',
      discount_terms: '',
      insurance_certificate: false,
      insurance_expiry: '',
      workers_comp: false,
      liability_insurance: false,
      status: 'active',
      customer_type: '',
      rating: '',
      notes: ''
    });
    setErrors({});
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setEditingCustomer(null);
    setFormData({
      customer_name: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      fax: '',
      website: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      tax_id: '',
      duns_number: '',
      business_type: '',
      industry: '',
      credit_limit: '',
      payment_terms: '',
      discount_terms: '',
      insurance_certificate: false,
      insurance_expiry: '',
      workers_comp: false,
      liability_insurance: false,
      status: 'active',
      customer_type: '',
      rating: '',
      notes: ''
    });
    setErrors({});
  };

  const handleDelete = async (vuid) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/customers/${vuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomers(customers.filter(c => c.vuid !== vuid));
      } else {
        alert('Failed to delete customer');
      }
    } catch (error) {
      alert('An error occurred while deleting the customer');
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/integrations');
      const data = await response.json();
      
      // Filter integrations to only show those that have 'customers' enabled
      const filteredIntegrations = data.filter(integration => 
        integration.enabled_objects && integration.enabled_objects.customers === true
      );
      
      setIntegrations(filteredIntegrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const handleIntegrationModal = (customer) => {
    setSelectedCustomer(customer);
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
      // Here you would implement the logic to send the customer to the selected integration
      console.log(`Sending customer ${selectedCustomer.customer_name} to integration ${selectedIntegration.integration_name}`);
      
      // For now, just show a success message
      alert(`Customer ${selectedCustomer.customer_name} sent to ${selectedIntegration.integration_name} successfully!`);
      
      // Close the modal
      setShowIntegrationModal(false);
      setSelectedCustomer(null);
      setSelectedIntegration(null);
    } catch (error) {
      console.error('Error sending customer to integration:', error);
      alert('Error sending customer to integration');
    }
  };

  const handleRetrieveModal = () => {
    setRetrieveIntegration(null);
    setShowRetrieveModal(true);
    fetchIntegrations();
  };

  const handleRetrieveCustomers = async () => {
    if (!retrieveIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      // Here you would implement the logic to retrieve customers from the selected integration
      console.log(`Retrieving customers from integration ${retrieveIntegration.integration_name}`);
      
      // For now, just show a success message
      alert(`Customers retrieved from ${retrieveIntegration.integration_name} successfully!`);
      
      // Close the modal
      setShowRetrieveModal(false);
      setRetrieveIntegration(null);
    } catch (error) {
      console.error('Error retrieving customers from integration:', error);
      alert('Error retrieving customers from integration');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-populate DBA with customer name if customer name changes
    if (name === 'customer_name') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        company_name: value // Auto-populate DBA with customer name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center">
                      <div className="text-2xl font-semibold text-gray-700">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-sans">
            Customers
          </h1>
          <p className="text-xl text-gray-700 font-light">
            Manage construction customers, clients, and contract recipients
          </p>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={showCreateForm ? handleCancelEdit : handleShowCreateForm}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {showCreateForm ? 'Cancel' : '+ Create New Customer'}
            </button>
            <button
              onClick={handleRetrieveModal}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Retrieve Customers
            </button>
          </div>
        </div>

        {/* Create/Edit Form */}
                        {(showCreateForm || editingCustomer) && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                              {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
            </h2>
                          {!editingCustomer && (
              <div className="text-center mb-6">
                <p className="text-gray-600 text-lg">
                  Customer numbers are automatically generated as sequential numbers (e.g., C000001, C000002)
                </p>
                <p className="text-gray-500 text-base mt-2">
                  DBA (Doing Business As) is the business name under which the customer operates
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">{errors.submit}</p>
                </div>
              )}
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="customer_name" className="block text-lg font-semibold text-gray-900 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.customer_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., ABC Construction"
                  />
                  {errors.customer_name && (
                    <p className="text-red-600 font-medium mt-2">{errors.customer_name}</p>
                  )}
                </div>



                <div>
                  <label htmlFor="company_name" className="block text-lg font-semibold text-gray-900 mb-2">
                    DBA *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.company_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., ABC Construction Co."
                  />
                  {errors.company_name && (
                    <p className="text-red-600 font-medium mt-2">{errors.company_name}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contact_person" className="block text-lg font-semibold text-gray-900 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-lg font-semibold text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-lg font-semibold text-gray-900 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="fax" className="block text-lg font-semibold text-gray-900 mb-2">
                    Fax
                  </label>
                  <input
                    type="tel"
                    id="fax"
                    name="fax"
                    value={formData.fax}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="(555) 123-4568"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="website" className="block text-lg font-semibold text-gray-900 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="https://www.company.com"
                  />
                </div>

                <div>
                  <label htmlFor="address_line2" className="block text-lg font-semibold text-gray-900 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="Suite 100, Building B"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="address_line1" className="block text-lg font-semibold text-gray-900 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-lg font-semibold text-gray-900 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="state" className="block text-lg font-semibold text-gray-900 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label htmlFor="postal_code" className="block text-lg font-semibold text-gray-900 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-lg font-semibold text-gray-900 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customer_type" className="block text-lg font-semibold text-gray-900 mb-2">
                    Customer Type
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setFormCustomerTypeDropdownOpen(!formCustomerTypeDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white"
                    >
                      {formData.customer_type || 'Select Type'}
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {formCustomerTypeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_type: '' }));
                              setFormCustomerTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Select Type
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_type: 'Subcontractor' }));
                              setFormCustomerTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Subcontractor
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_type: 'Supplier' }));
                              setFormCustomerTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Supplier
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_type: 'Service Provider' }));
                              setFormCustomerTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Service Provider
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_type: 'Equipment Rental' }));
                              setFormCustomerTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Equipment Rental
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_type: 'Consultant' }));
                              setFormCustomerTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Consultant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className="block text-lg font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setFormStatusDropdownOpen(!formStatusDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white"
                    >
                      {formData.status === 'active' ? 'Active' : 
                       formData.status === 'inactive' ? 'Inactive' : 
                       formData.status === 'suspended' ? 'Suspended' : 'Active'}
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {formStatusDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, status: 'active' }));
                              setFormStatusDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Active
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, status: 'inactive' }));
                              setFormStatusDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Inactive
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, status: 'suspended' }));
                              setFormStatusDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Suspended
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="business_type" className="block text-lg font-semibold text-gray-900 mb-2">
                    Business Type
                  </label>
                  <input
                    type="text"
                    id="business_type"
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., Corporation, LLC, Partnership"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-lg font-semibold text-gray-900 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., Construction, Electrical, Plumbing"
                  />
                </div>
              </div>

              {/* Tax and Identification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tax_id" className="block text-lg font-semibold text-gray-900 mb-2">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    id="tax_id"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., 12-3456789"
                  />
                </div>

                <div>
                  <label htmlFor="duns_number" className="block text-lg font-semibold text-gray-900 mb-2">
                    DUNS Number
                  </label>
                  <input
                    type="text"
                    id="duns_number"
                    name="duns_number"
                    value={formData.duns_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., 123456789"
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="credit_limit" className="block text-lg font-semibold text-gray-900 mb-2">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    id="credit_limit"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="rating" className="block text-lg font-semibold text-gray-900 mb-2">
                    Rating
                  </label>
                  <input
                    type="number"
                    id="rating"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="1-10"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="payment_terms" className="block text-lg font-semibold text-gray-900 mb-2">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    id="payment_terms"
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., Net 30, Net 60"
                  />
                </div>

                <div>
                  <label htmlFor="discount_terms" className="block text-lg font-semibold text-gray-900 mb-2">
                    Discount Terms
                  </label>
                  <input
                    type="text"
                    id="discount_terms"
                    name="discount_terms"
                    value={formData.discount_terms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                    placeholder="e.g., 2% 10 Net 30"
                  />
                </div>
              </div>

              {/* Insurance Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="insurance_expiry" className="block text-lg font-semibold text-gray-900 mb-2">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    id="insurance_expiry"
                    name="insurance_expiry"
                    value={formData.insurance_expiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="insurance_certificate"
                      name="insurance_certificate"
                      checked={formData.insurance_certificate}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-gray-800 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-800"
                    />
                    <label htmlFor="insurance_certificate" className="ml-2 text-lg font-semibold text-gray-900">
                      Insurance Certificate
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Insurance Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="workers_comp"
                      name="workers_comp"
                      checked={formData.workers_comp}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-gray-800 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-800"
                    />
                    <label htmlFor="workers_comp" className="ml-2 text-lg font-semibold text-gray-900">
                      Workers Compensation
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="liability_insurance"
                      name="liability_insurance"
                      checked={formData.liability_insurance}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-gray-800 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-800"
                    />
                    <label htmlFor="liability_insurance" className="ml-2 text-lg font-semibold text-gray-900">
                      Liability Insurance
                    </label>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
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
                                      placeholder="Additional notes about the customer..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-all"
                >
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                                  placeholder="Search by customer name, company, contact, or number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white text-left font-medium text-gray-900"
                >
                  {statusFilter === 'all' ? 'All Statuses' : 
                   statusFilter === 'active' ? 'Active' : 
                   statusFilter === 'inactive' ? 'Inactive' : 
                   statusFilter === 'suspended' ? 'Suspended' : 'All Statuses'}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {statusDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'suspended', label: 'Suspended' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleFilterChange('status', option.value);
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left font-medium hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          statusFilter === option.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

                          {/* Customer Type Filter */}
            <div>
                                <label htmlFor="customerTypeFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Type
                  </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                                      onClick={() => setCustomerTypeDropdownOpen(!customerTypeDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white text-left font-medium text-gray-900"
                >
                  {customerTypeFilter === 'all' ? 'All Types' : customerTypeFilter}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {customerTypeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {[
                      { value: 'all', label: 'All Types' },
                      { value: 'Subcontractor', label: 'Subcontractor' },
                      { value: 'Supplier', label: 'Supplier' },
                      { value: 'Service Provider', label: 'Service Provider' },
                      { value: 'Equipment Rental', label: 'Equipment Rental' },
                      { value: 'Consultant', label: 'Consultant' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleFilterChange('customerType', option.value);
                          setCustomerTypeDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left font-medium hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          customerTypeFilter === option.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCustomerTypeFilter('all');
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Customers ({filteredCustomers.length})
            </h2>
            <div className="text-lg text-gray-600">
              Showing {getCurrentCustomers().length} of {filteredCustomers.length}
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600">Get started by creating your first customer.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCurrentCustomers().map((customer) => (
                  <div key={customer.vuid} className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {customer.customer_name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{customer.customer_name}</h3>
                        <p className="text-lg text-gray-600 font-medium">DBA: {customer.company_name}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.status === 'active' ? 'bg-green-100 text-gray-800' : 
                            customer.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                            #{customer.customer_number}
                          </span>
                          {customer.customer_type && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {customer.customer_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {customer.contact_person && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Contact:</span> {customer.contact_person}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {customer.email}
                        </p>
                      )}
                      {customer.city && customer.state && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {customer.city}, {customer.state}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-mono">VUID</p>
                        <p className="text-xs text-gray-600 font-mono">{customer.vuid.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit customer"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIntegrationModal(customer);
                          }}
                          className="text-green-500 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Send to integration"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer.vuid)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete customer"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {filteredCustomers.length > customersPerPage && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.ceil(filteredCustomers.length / customersPerPage) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === i + 1
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === Math.ceil(filteredCustomers.length / customersPerPage)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Results Count */}
              <div className="text-center mt-4 text-gray-600">
                Showing {Math.min((currentPage - 1) * customersPerPage + 1, filteredCustomers.length)} to {Math.min(currentPage * customersPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
              </div>
            </>
          )}

          {/* Integration Modal */}
          {showIntegrationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">Send Customer to Integration</h2>
                  <button onClick={() => { setShowIntegrationModal(false); setSelectedCustomer(null); setSelectedIntegration(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium text-gray-600">Name:</span><p className="text-gray-900">{selectedCustomer?.customer_name}</p></div>
                    <div><span className="font-medium text-gray-600">DBA:</span><p className="text-gray-900">{selectedCustomer?.company_name}</p></div>
                    <div><span className="font-medium text-gray-600">Status:</span><p className="text-gray-900 capitalize">{selectedCustomer?.status}</p></div>
                                          <div><span className="font-medium text-gray-600">Type:</span><p className="text-gray-900 capitalize">{selectedCustomer?.customer_type || 'Not specified'}</p></div>
                  </div>
                </div>
                {/* Integration Selection */}
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">Select Integration *</label>
                  {integrations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <p className="text-lg">No integrations available</p>
                      <p className="text-sm">Create an integration first to send customers to external systems.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {integrations.map((integration) => (
                        <div key={integration.vuid} onClick={() => setSelectedIntegration(integration)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedIntegration?.vuid === integration.vuid ? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{integration.integration_name}</h4>
                              <p className="text-sm text-gray-600 capitalize">{integration.integration_type.replace('_', ' ')}</p>
                              {integration.base_url && (<p className="text-xs text-gray-500 mt-1">{integration.base_url}</p>)}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${integration.status === 'active' ? 'bg-green-100 text-green-800' : integration.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                                {integration.status}
                              </span>
                              {selectedIntegration?.vuid === integration.vuid && (
                                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
                  <button onClick={() => { setShowIntegrationModal(false); setSelectedCustomer(null); setSelectedIntegration(null); }} className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
                  <button onClick={handleSendToIntegration} disabled={!selectedIntegration} className={`px-6 py-3 font-semibold rounded-lg transition-all ${selectedIntegration ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Send to Integration</button>
                </div>
              </div>
            </div>
          )}

          {/* Retrieve Customers Modal */}
          {showRetrieveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Retrieve Customers from Integration
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
                        Select an integration to retrieve customers from external systems. This will import customer data 
                        and create new customer records in your system.
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
                      <p className="text-sm">Create an integration first to retrieve customers from external systems.</p>
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
                    onClick={handleRetrieveCustomers}
                    disabled={!retrieveIntegration}
                    className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                      retrieveIntegration
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    Retrieve Customers
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;
