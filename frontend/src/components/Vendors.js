import React, { useState, useEffect } from 'react';
import IntegrationIndicator from './IntegrationIndicator';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    vendor_name: '',
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
    vendor_type: '',
    rating: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorsPerPage] = useState(10);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [vendorTypeDropdownOpen, setVendorTypeDropdownOpen] = useState(false);
  const [formStatusDropdownOpen, setFormStatusDropdownOpen] = useState(false);
  const [formVendorTypeDropdownOpen, setFormVendorTypeDropdownOpen] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveIntegration, setRetrieveIntegration] = useState(null);
  const [retrievedVendorsData, setRetrievedVendorsData] = useState([]);
  const [showRetrievedVendorsModal, setShowRetrievedVendorsModal] = useState(false);
  const [selectedVendorsToImport, setSelectedVendorsToImport] = useState([]);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterAndPaginateVendors();
  }, [vendors, searchTerm, statusFilter, vendorTypeFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setStatusDropdownOpen(false);
        setVendorTypeDropdownOpen(false);
        setFormStatusDropdownOpen(false);
        setFormVendorTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filterAndPaginateVendors = () => {
    let filtered = vendors.filter(vendor => {
      const matchesSearch = 
        vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
      const matchesType = vendorTypeFilter === 'all' || vendor.vendor_type === vendorTypeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
    
    setFilteredVendors(filtered);
    setCurrentPage(1);
  };

  const getCurrentVendors = () => {
    const indexOfLastVendor = currentPage * vendorsPerPage;
    const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
    return filteredVendors.slice(indexOfFirstVendor, indexOfLastVendor);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'search') {
      setSearchTerm(value);
    } else if (filterType === 'status') {
      setStatusFilter(value);
    } else if (filterType === 'vendorType') {
      setVendorTypeFilter(value);
    }
    setCurrentPage(1);
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      } else {
        console.error('Failed to fetch vendors');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.vendor_name.trim()) newErrors.vendor_name = 'Vendor name is required';
    if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clean up empty strings to null for optional fields
    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '' && key !== 'vendor_name' && key !== 'company_name') {
        cleanedData[key] = null;
      }
    });

    try {
      const url = editingVendor 
        ? `http://localhost:5001/api/vendors/${editingVendor.vuid}`
        : 'http://localhost:5001/api/vendors';
      
      const method = editingVendor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (editingVendor) {
          setVendors(vendors.map(v => 
            v.vuid === editingVendor.vuid ? result : v
          ));
        } else {
          setVendors([...vendors, result]);
        }
        
        setFormData({
          vendor_name: '',
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
          vendor_type: '',
          rating: '',
          notes: ''
        });
        setEditingVendor(null);
        setShowCreateForm(false);
        setErrors({});
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'An error occurred' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while saving the vendor' });
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setShowCreateForm(true);
    // Scroll to top to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFormData({
      vendor_name: vendor.vendor_name,
      company_name: vendor.company_name,
      contact_person: vendor.contact_person || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      fax: vendor.fax || '',
      website: vendor.website || '',
      address_line1: vendor.address_line1 || '',
      address_line2: vendor.address_line2 || '',
      city: vendor.city || '',
      state: vendor.state || '',
      postal_code: vendor.postal_code || '',
      country: vendor.country || '',
      tax_id: vendor.tax_id || '',
      duns_number: vendor.duns_number || '',
      business_type: vendor.business_type || '',
      industry: vendor.industry || '',
      credit_limit: vendor.credit_limit || '',
      payment_terms: vendor.payment_terms || '',
      discount_terms: vendor.discount_terms || '',
      insurance_certificate: vendor.insurance_certificate || false,
      insurance_expiry: vendor.insurance_expiry || '',
      workers_comp: vendor.workers_comp || false,
      liability_insurance: vendor.liability_insurance || false,
      status: vendor.status,
      vendor_type: vendor.vendor_type || '',
      rating: vendor.rating || '',
      notes: vendor.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingVendor(null);
    setShowCreateForm(false);
    setFormData({
      vendor_name: '',
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
      vendor_type: '',
      rating: '',
      notes: ''
    });
    setErrors({});
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setEditingVendor(null);
    // Scroll to top to show the create form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFormData({
      vendor_name: '',
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
      vendor_type: '',
      rating: '',
      notes: ''
    });
    setErrors({});
  };

  const handleDelete = async (vuid) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/vendors/${vuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVendors(vendors.filter(v => v.vuid !== vuid));
      } else {
        alert('Failed to delete vendor');
      }
    } catch (error) {
      alert('An error occurred while deleting the vendor');
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/integrations');
      const data = await response.json();
      
      // Filter integrations to only show those that have 'vendors' enabled
      const filteredIntegrations = data.filter(integration => 
        integration.enabled_objects && integration.enabled_objects.vendors === true
      );
      
      setIntegrations(filteredIntegrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const handleIntegrationModal = (vendor) => {
    setSelectedVendor(vendor);
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
      // Here you would implement the logic to send the vendor to the selected integration
      console.log(`Sending vendor ${selectedVendor.vendor_name} to integration ${selectedIntegration.integration_name}`);
      
      // For now, just show a success message
      alert(`Vendor ${selectedVendor.vendor_name} sent to ${selectedIntegration.integration_name} successfully!`);
      
      // Close the modal
      setShowIntegrationModal(false);
      setSelectedVendor(null);
      setSelectedIntegration(null);
    } catch (error) {
      console.error('Error sending vendor to integration:', error);
      alert('Error sending vendor to integration');
    }
  };

  const handleRetrieveModal = () => {
    setRetrieveIntegration(null);
    setShowRetrieveModal(true);
    fetchIntegrations();
  };

  const handleRetrieveVendors = async () => {
    if (!retrieveIntegration) {
      alert('Please select an integration');
      return;
    }

    try {
      console.log(`Retrieving vendors from integration ${retrieveIntegration.integration_name}`);
      let retrievedVendors = [];
      
      if (retrieveIntegration.integration_type === 'quickbooks_online') {
        const baseURL = 'http://localhost:5001';
        const response = await fetch(`${baseURL}/api/mock-quickbooks/vendors`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.vendors) {
            retrievedVendors = data.vendors.map(qbVendor => ({
              vendor_name: qbVendor.name,
              company_name: qbVendor.company_name,
              contact_person: qbVendor.contact_name,
              email: qbVendor.email,
              phone: qbVendor.phone,
              fax: qbVendor.fax,
              website: qbVendor.website,
              address_line1: qbVendor.billing_address?.line1 || '',
              address_line2: qbVendor.billing_address?.line2 || '',
              city: qbVendor.billing_address?.city || '',
              state: qbVendor.billing_address?.country_sub_division_code || '',
              postal_code: qbVendor.billing_address?.postal_code || '',
              country: qbVendor.billing_address?.country || '',
              tax_id: qbVendor.tax_identifier || '',
              notes: qbVendor.notes || '',
              status: qbVendor.active ? 'active' : 'inactive',
              quickbooks_id: qbVendor.id,
              account_number: qbVendor.account_number,
              bill_rate: qbVendor.bill_rate,
              vendor_1099: qbVendor.vendor_1099
            }));
          }
        }
      } else {
        alert(`Integration type ${retrieveIntegration.integration_type} is not yet implemented`);
        return;
      }
      
      if (retrievedVendors.length > 0) {
        setRetrievedVendorsData(retrievedVendors);
        setSelectedVendorsToImport([]); // Reset selection when opening modal
        setShowRetrievedVendorsModal(true);
      } else {
        alert('No vendors found in the integration');
      }
    } catch (error) {
      console.error('Error retrieving vendors from integration:', error);
      alert('Error retrieving vendors from integration: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleVendorSelection = (vendorData) => {
    setSelectedVendorsToImport(prev => {
      const isSelected = prev.some(v => v.quickbooks_id === vendorData.quickbooks_id);
      if (isSelected) {
        return prev.filter(v => v.quickbooks_id !== vendorData.quickbooks_id);
      } else {
        return [...prev, vendorData];
      }
    });
  };

  const handleSelectAllVendors = () => {
    setSelectedVendorsToImport([...retrievedVendorsData]);
  };

  const handleDeselectAllVendors = () => {
    setSelectedVendorsToImport([]);
  };

  const isVendorSelected = (vendorData) => {
    return selectedVendorsToImport.some(v => v.quickbooks_id === vendorData.quickbooks_id);
  };

  const handleImportVendors = async () => {
    if (selectedVendorsToImport.length === 0) {
      alert('Please select at least one vendor to import');
      return;
    }

    try {
      const baseURL = 'http://localhost:5001';
      let importedCount = 0;
      let skippedCount = 0;

      for (const vendorData of selectedVendorsToImport) {
        const existingVendor = vendors.find(v => v.vendor_name === vendorData.vendor_name);
        if (existingVendor) {
          console.log(`Vendor ${vendorData.vendor_name} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        const response = await fetch(`${baseURL}/api/vendors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendor_name: vendorData.vendor_name,
            company_name: vendorData.company_name,
            contact_person: vendorData.contact_person,
            email: vendorData.email,
            phone: vendorData.phone,
            fax: vendorData.fax,
            website: vendorData.website,
            address_line1: vendorData.address_line1,
            address_line2: vendorData.address_line2,
            city: vendorData.city,
            state: vendorData.state,
            postal_code: vendorData.postal_code,
            country: vendorData.country,
            tax_id: vendorData.tax_id,
            notes: vendorData.notes,
            status: vendorData.status
          })
        });

        if (response.ok) {
          const newVendor = await response.json();
          console.log(`Imported vendor: ${newVendor.vendor_name}`);
          importedCount++;

          // Create external system ID mapping for this vendor
          try {
            await fetch(`${baseURL}/api/external-system-ids`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                integration_vuid: retrieveIntegration.vuid,
                object_type: 'vendor',
                project_vuid: null, // Vendors are not project-specific
                object_vuid: newVendor.vuid,
                external_id: vendorData.quickbooks_id.toString(),
                external_object_type: 'vendor',
                external_metadata: {
                  account_number: vendorData.account_number,
                  bill_rate: vendorData.bill_rate,
                  vendor_1099: vendorData.vendor_1099,
                  contact_name: vendorData.contact_person,
                  tax_identifier: vendorData.tax_id
                },
                external_status: vendorData.status
              })
            });
            console.log(`External system ID mapping created for vendor ${newVendor.vendor_name}`);
          } catch (mappingError) {
            console.error('Error creating external system ID mapping:', mappingError);
          }
        }
      }

      await fetchVendors();
      setShowRetrievedVendorsModal(false);
      setShowRetrieveModal(false);
      setRetrieveIntegration(null);
      setRetrievedVendorsData([]);
      setSelectedVendorsToImport([]);

      if (skippedCount > 0) {
        alert(`Import completed! ${importedCount} vendors imported, ${skippedCount} vendors skipped (already exist).`);
      } else {
        alert(`Successfully imported ${importedCount} vendors!`);
      }
    } catch (error) {
      console.error('Error importing vendors:', error);
      alert('Error importing vendors: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Auto-populate DBA with vendor name if vendor name changes
    if (name === 'vendor_name') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        company_name: value // Auto-populate DBA with vendor name
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
        <div className="text-2xl font-semibold text-gray-700">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-sans">
            Vendors
          </h1>
          <p className="text-xl text-gray-700 font-light">
            Manage construction vendors, subcontractors, and suppliers
          </p>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={showCreateForm ? handleCancelEdit : handleShowCreateForm}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {showCreateForm ? 'Cancel' : '+ Create New Vendor'}
            </button>
            <button
              onClick={handleRetrieveModal}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Retrieve Vendors
            </button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingVendor) && (
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-12 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {editingVendor ? 'Edit Vendor' : 'Create New Vendor'}
            </h2>
            {!editingVendor && (
              <div className="text-center mb-6">
                <p className="text-gray-600 text-lg">
                  Vendor numbers are automatically generated as sequential 7-digit numbers (e.g., 0000001, 0000002)
                </p>
                <p className="text-gray-500 text-base mt-2">
                  DBA (Doing Business As) is the business name under which the vendor operates
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
                  <label htmlFor="vendor_name" className="block text-lg font-semibold text-gray-900 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    id="vendor_name"
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all ${
                      errors.vendor_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., ABC Construction"
                  />
                  {errors.vendor_name && (
                    <p className="text-red-600 font-medium mt-2">{errors.vendor_name}</p>
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
                  <label htmlFor="vendor_type" className="block text-lg font-semibold text-gray-900 mb-2">
                    Vendor Type
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setFormVendorTypeDropdownOpen(!formVendorTypeDropdownOpen)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all text-left bg-white"
                    >
                      {formData.vendor_type || 'Select Type'}
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {formVendorTypeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, vendor_type: '' }));
                              setFormVendorTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Select Type
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, vendor_type: 'Subcontractor' }));
                              setFormVendorTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Subcontractor
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, vendor_type: 'Supplier' }));
                              setFormVendorTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Supplier
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, vendor_type: 'Service Provider' }));
                              setFormVendorTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Service Provider
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, vendor_type: 'Equipment Rental' }));
                              setFormVendorTypeDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-lg font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            Equipment Rental
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, vendor_type: 'Consultant' }));
                              setFormVendorTypeDropdownOpen(false);
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
                  placeholder="Additional notes about the vendor..."
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
                  {editingVendor ? 'Update Vendor' : 'Create Vendor'}
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
                placeholder="Search by vendor name, company, contact, or number..."
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

            {/* Vendor Type Filter */}
            <div>
              <label htmlFor="vendorTypeFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                Vendor Type
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setVendorTypeDropdownOpen(!vendorTypeDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent bg-white text-left font-medium text-gray-900"
                >
                  {vendorTypeFilter === 'all' ? 'All Types' : vendorTypeFilter}
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {vendorTypeDropdownOpen && (
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
                          handleFilterChange('vendorType', option.value);
                          setVendorTypeDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left font-medium hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          vendorTypeFilter === option.value ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
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
                  setVendorTypeFilter('all');
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Vendors List */}
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Vendors ({filteredVendors.length})
            </h2>
            <div className="text-lg text-gray-600">
              Showing {getCurrentVendors().length} of {filteredVendors.length}
            </div>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-600">Get started by creating your first vendor.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCurrentVendors().map((vendor) => (
                  <div key={vendor.vuid} className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {vendor.vendor_name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{vendor.vendor_name}</h3>
                        <p className="text-lg text-gray-600 font-medium">DBA: {vendor.company_name}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.status === 'active' ? 'bg-green-100 text-green-800' : 
                            vendor.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                            #{vendor.vendor_number}
                          </span>
                          {vendor.vendor_type && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {vendor.vendor_type}
                            </span>
                          )}
                          <IntegrationIndicator 
                            objectVuid={vendor.vuid} 
                            objectType="vendor" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {vendor.contact_person && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Contact:</span> {vendor.contact_person}
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {vendor.phone}
                        </p>
                      )}
                      {vendor.email && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {vendor.email}
                        </p>
                      )}
                      {vendor.city && vendor.state && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {vendor.city}, {vendor.state}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-mono">VUID</p>
                        <p className="text-xs text-gray-600 font-mono">{vendor.vuid.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit vendor"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIntegrationModal(vendor);
                          }}
                          className="text-green-500 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Send to integration"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.vuid)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete vendor"
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
              {filteredVendors.length > vendorsPerPage && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.ceil(filteredVendors.length / vendorsPerPage) }, (_, i) => (
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
                    disabled={currentPage === Math.ceil(filteredVendors.length / vendorsPerPage)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Results Count */}
              <div className="text-center mt-4 text-gray-600">
                Showing {Math.min((currentPage - 1) * vendorsPerPage + 1, filteredVendors.length)} to {Math.min(currentPage * vendorsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
              </div>
            </>
          )}

          {/* Integration Modal */}
          {showIntegrationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">Send Vendor to Integration</h2>
                  <button onClick={() => { setShowIntegrationModal(false); setSelectedVendor(null); setSelectedIntegration(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Vendor Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium text-gray-600">Name:</span><p className="text-gray-900">{selectedVendor?.vendor_name}</p></div>
                    <div><span className="font-medium text-gray-600">DBA:</span><p className="text-gray-900">{selectedVendor?.company_name}</p></div>
                    <div><span className="font-medium text-gray-600">Status:</span><p className="text-gray-900 capitalize">{selectedVendor?.status}</p></div>
                    <div><span className="font-medium text-gray-600">Type:</span><p className="text-gray-900 capitalize">{selectedVendor?.vendor_type || 'Not specified'}</p></div>
                  </div>
                </div>
                {/* Integration Selection */}
                <div className="mb-6">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">Select Integration *</label>
                  {integrations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <p className="text-lg">No integrations available</p>
                      <p className="text-sm">Create an integration first to send vendors to external systems.</p>
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
                  <button onClick={() => { setShowIntegrationModal(false); setSelectedVendor(null); setSelectedIntegration(null); }} className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
                  <button onClick={handleSendToIntegration} disabled={!selectedIntegration} className={`px-6 py-3 font-semibold rounded-lg transition-all ${selectedIntegration ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>Send to Integration</button>
                </div>
              </div>
            </div>
          )}

          {/* Retrieve Vendors Modal */}
          {showRetrieveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Retrieve Vendors from Integration
                  </h2>
                  <button
                    onClick={() => {
                      setShowRetrieveModal(false);
                      setRetrieveIntegration(null);
                      setRetrievedVendorsData([]);
                      setSelectedVendorsToImport([]);
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
                        Select an integration to retrieve vendors from external systems. This will import vendor data 
                        and create new vendor records in your system.
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
                      <p className="text-sm">Create an integration first to retrieve vendors from external systems.</p>
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
                      setRetrievedVendorsData([]);
                      setSelectedVendorsToImport([]);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRetrieveVendors}
                    disabled={!retrieveIntegration}
                    className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                      retrieveIntegration
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    Retrieve Vendors
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review Retrieved Vendors Modal */}
          {showRetrievedVendorsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Review Retrieved Vendors
                  </h2>
                  <button
                    onClick={() => {
                      setShowRetrievedVendorsModal(false);
                      setRetrievedVendorsData([]);
                      setSelectedVendorsToImport([]);
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
                      <h3 className="text-lg font-semibold text-green-900 mb-1">Vendors Retrieved Successfully</h3>
                      <p className="text-green-800 text-sm">
                        Review the vendors below and select which ones you'd like to import into your system. 
                        Vendors that already exist will be automatically skipped.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selection Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSelectAllVendors}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllVendors}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedVendorsToImport.length} of {retrievedVendorsData.length} vendors selected
                  </div>
                </div>

                {/* Vendors Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedVendorsToImport.length === retrievedVendorsData.length}
                            onChange={() => {
                              if (selectedVendorsToImport.length === retrievedVendorsData.length) {
                                handleDeselectAllVendors();
                              } else {
                                handleSelectAllVendors();
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {retrievedVendorsData.map((vendorData, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isVendorSelected(vendorData)}
                              onChange={() => handleVendorSelection(vendorData)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{vendorData.vendor_name}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vendorData.company_name}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vendorData.contact_person}</div>
                            <div className="text-sm text-gray-500">{vendorData.email}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vendorData.city}, {vendorData.state}</div>
                            <div className="text-sm text-gray-500">{vendorData.address_line1}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vendorData.account_number}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${vendorData.bill_rate?.toFixed(2) || '0.00'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowRetrievedVendorsModal(false);
                      setRetrievedVendorsData([]);
                      setSelectedVendorsToImport([]);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportVendors}
                    disabled={selectedVendorsToImport.length === 0}
                    className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                      selectedVendorsToImport.length > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    Import Selected Vendors ({selectedVendorsToImport.length})
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

export default Vendors;
