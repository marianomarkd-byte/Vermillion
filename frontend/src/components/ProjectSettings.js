import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProjectCostCodes from './ProjectCostCodes';

const ProjectSettings = () => {
  const { projectVuid } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [costTypeSettings, setCostTypeSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSetting, setEditingSetting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cost_type_vuid: '',
    expense_account: '',
    is_override: true,
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // GL Settings state
  const [glSettings, setGlSettings] = useState(null);
  const [globalGlSettings, setGlobalGlSettings] = useState(null);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [glFormData, setGlFormData] = useState({
    ap_invoices_account_vuid: '',
    ap_retainage_account_vuid: '',
    ar_invoices_account_vuid: '',
    ar_retainage_account_vuid: '',
    cost_in_excess_of_billing_account_vuid: '',
    billing_in_excess_of_cost_account_vuid: '',
    description: ''
  });
  const [glErrors, setGlErrors] = useState({});
  const [showGlForm, setShowGlForm] = useState(false);

  // Project Settings state
  const [projectSettings, setProjectSettings] = useState(null);
  const [showProjectSettingsForm, setShowProjectSettingsForm] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    allow_project_cost_codes: false,
    allocate_contract_lines_to_cost_codes: false,
    labor_cost_method: 'default'
  });

  useEffect(() => {
    console.log('ProjectSettings useEffect - projectVuid:', projectVuid);
    if (projectVuid) {
      fetchProjectData();
      fetchCostTypeSettings();
      fetchGlSettings();
      fetchGlobalGlSettings();
      fetchChartOfAccounts();
      fetchProjectSettings();
    } else {
      console.error('No projectVuid provided to ProjectSettings component');
      setError('No project ID provided');
      setLoading(false);
    }
  }, [projectVuid]);

  const fetchProjectData = async () => {
    try {
      console.log('Fetching project data for projectVuid:', projectVuid);
      // Use hardcoded network URL for Safari compatibility
      const baseURL = 'http://localhost:5001';
      console.log('Using baseURL:', baseURL);
      const response = await axios.get(`${baseURL}/api/projects/${projectVuid}`);
      console.log('Project data response:', response.data);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      setError(`Failed to load project data: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }
  };

  const fetchCostTypeSettings = async () => {
    try {
      console.log('Fetching cost type settings for projectVuid:', projectVuid);
      // Use hardcoded network URL for Safari compatibility
      const baseURL = 'http://localhost:5001';
      console.log('Using baseURL:', baseURL);
      const response = await axios.get(`${baseURL}/api/projects/${projectVuid}/cost-type-settings`);
      console.log('Cost type settings response:', response.data);
      setCostTypeSettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cost type settings:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      setError(`Failed to load cost type settings: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  const fetchGlSettings = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/projects/${projectVuid}/gl-settings`);
      if (response.data && Object.keys(response.data).length > 0) {
        setGlSettings(response.data);
        setGlFormData({
          ap_invoices_account_vuid: response.data.ap_invoices_account_vuid || '',
          ap_retainage_account_vuid: response.data.ap_retainage_account_vuid || '',
          ar_invoices_account_vuid: response.data.ar_invoices_account_vuid || '',
          ar_retainage_account_vuid: response.data.ar_retainage_account_vuid || '',
          cost_in_excess_of_billing_account_vuid: response.data.cost_in_excess_of_billing_account_vuid || '',
          billing_in_excess_of_cost_account_vuid: response.data.billing_in_excess_of_cost_account_vuid || '',
          description: response.data.description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching project GL settings:', error);
    }
  };

  const fetchGlobalGlSettings = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/gl-settings`);
      if (response.data && response.data.length > 0) {
        setGlobalGlSettings(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching global GL settings:', error);
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/chartofaccounts`);
      setChartOfAccounts(response.data);
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
    }
  };

  const fetchProjectSettings = async () => {
    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.get(`${baseURL}/api/projects/${projectVuid}/settings`);
      setProjectSettings(response.data);
      
      // Update form data with current settings
      setProjectFormData({
        allow_project_cost_codes: response.data.allow_project_cost_codes || false,
        allocate_contract_lines_to_cost_codes: response.data.allocate_contract_lines_to_cost_codes || false,
        labor_cost_method: response.data.labor_cost_method || 'default'
      });
    } catch (error) {
      console.error('Error fetching project settings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEditSetting = (setting) => {
    if (setting.project_setting) {
      // Edit existing setting
      setEditingSetting(setting.project_setting);
      setFormData({
        cost_type_vuid: setting.cost_type_vuid,
        expense_account: setting.project_setting.expense_account,
        is_override: setting.project_setting.is_override,
        notes: setting.project_setting.notes || ''
      });
    } else {
      // Create new setting
      setEditingSetting(null);
      setFormData({
        cost_type_vuid: setting.cost_type_vuid,
        expense_account: setting.default_expense_account,
        is_override: true,
        notes: ''
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.expense_account.trim()) {
      setErrors({ expense_account: 'Expense account is required' });
      return;
    }

    try {
      // Use hardcoded network URL for Safari compatibility
      const baseURL = 'http://localhost:5001';
      
      if (editingSetting) {
        // Update existing setting
        await axios.put(`${baseURL}/api/project-cost-type-settings/${editingSetting.vuid}`, formData);
      } else {
        // Create new setting
        await axios.post(`${baseURL}/api/project-cost-type-settings`, {
          ...formData,
          project_vuid: projectVuid
        });
      }
      
      // Refresh data and close form
      await fetchCostTypeSettings();
      setShowForm(false);
      setEditingSetting(null);
      setFormData({
        cost_type_vuid: '',
        expense_account: '',
        is_override: true,
        notes: ''
      });
      setErrors({});
    } catch (error) {
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'An error occurred while saving the setting' });
      }
    }
  };

  const handleDeleteSetting = async (settingVuid) => {
    if (!window.confirm('Are you sure you want to delete this setting? This will revert to the default expense account.')) {
      return;
    }

    try {
      // Use hardcoded network URL for Safari compatibility
      const baseURL = 'http://localhost:5001';
      await axios.delete(`${baseURL}/api/project-cost-type-settings/${settingVuid}`);
      await fetchCostTypeSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      alert('Error deleting setting');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSetting(null);
    setFormData({
      cost_type_vuid: '',
      expense_account: '',
      is_override: true,
      notes: ''
    });
    setErrors({});
  };

  // GL Settings handlers
  const handleGlInputChange = (e) => {
    const { name, value } = e.target;
    setGlFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (glErrors[name]) {
      setGlErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGlSubmit = async (e) => {
    e.preventDefault();
    setGlErrors({});

    try {
      const baseURL = 'http://localhost:5001';
      const response = await axios.post(`${baseURL}/api/project-gl-settings`, {
        ...glFormData,
        project_vuid: projectVuid
      });
      
      setGlSettings(response.data);
      setShowGlForm(false);
      await fetchGlSettings();
      
    } catch (error) {
      if (error.response?.data?.error) {
        setGlErrors({ general: error.response.data.error });
      } else {
        setGlErrors({ general: 'An error occurred while saving GL settings' });
      }
    }
  };

  const handleGlCancel = () => {
    setShowGlForm(false);
    setGlErrors({});
  };

  const handleProjectSettingsSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const baseURL = 'http://localhost:5001';
      await axios.put(`${baseURL}/api/projects/${projectVuid}/settings`, {
        allow_project_cost_codes: projectFormData.allow_project_cost_codes,
        allocate_contract_lines_to_cost_codes: projectFormData.allocate_contract_lines_to_cost_codes,
        labor_cost_method: projectFormData.labor_cost_method
      });
      
      await fetchProjectSettings();
      setShowProjectSettingsForm(false);
    } catch (error) {
      console.error('Error updating project settings:', error);
    }
  };

  const handleProjectSettingsCancel = () => {
    setShowProjectSettingsForm(false);
  };

  const handleCostCodeChange = () => {
    // Refresh project settings when cost codes change
    fetchProjectSettings();
  };

  const getAccountDisplay = (accountVuid) => {
    if (!accountVuid) return 'Not set';
    const account = chartOfAccounts.find(acc => acc.vuid === accountVuid);
    return account ? `${account.account_number} - ${account.account_name}` : 'Account not found';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vermillion-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project settings...</p>
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
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
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
                Project Settings: {project.project_name}
              </h1>
              <p className="text-xl text-gray-600">
                Project Number: {project.project_number}
              </p>
              <p className="text-lg text-gray-500">
                Customize expense accounts for cost types on this project
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate(`/projects/${project.vuid}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Back to Project
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

        {/* Cost Type Settings */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cost Type Expense Account Settings</h2>
            <p className="text-sm text-gray-500">
              Override default expense accounts for specific cost types on this project
            </p>
          </div>

          {costTypeSettings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No cost types found</p>
              <p className="text-sm">Cost types must be created first</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default Expense Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Override
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {costTypeSettings.map((setting) => (
                    <tr key={setting.cost_type_vuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {setting.cost_type}
                          </div>
                          <div className="text-sm text-gray-500">
                            {setting.abbreviation} - {setting.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">
                          {setting.default_expense_account}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {setting.project_setting ? (
                          <div>
                            <span className="text-sm text-green-900 font-medium">
                              {setting.project_setting.expense_account}
                            </span>
                            <div className="text-xs text-green-600">
                              Override Active
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Using Default
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {setting.project_setting?.notes || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditSetting(setting)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {setting.project_setting ? 'Edit' : 'Override'}
                        </button>
                        {setting.project_setting && (
                          <button
                            onClick={() => handleDeleteSetting(setting.project_setting.vuid)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GL Account Settings */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">GL Account Overrides</h2>
            <p className="text-sm text-gray-500">
              Override default GL accounts for this specific project
            </p>
          </div>

          {!glSettings ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No GL account overrides configured</p>
              <p className="text-sm">This project will use the global GL settings</p>
              <button
                onClick={() => setShowGlForm(true)}
                className="mt-4 bg-vermillion-600 hover:bg-vermillion-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Configure GL Overrides
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Project Overrides</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">AP Invoices:</span>
                      <p className="text-sm text-gray-900 font-medium">{getAccountDisplay(glSettings.ap_invoices_account_vuid)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">AP Retainage:</span>
                      <p className="text-sm text-gray-900 font-medium">{getAccountDisplay(glSettings.ap_retainage_account_vuid)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">AR Invoices:</span>
                      <p className="text-sm text-gray-900 font-medium">{getAccountDisplay(glSettings.ar_invoices_account_vuid)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">AR Retainage:</span>
                      <p className="text-sm text-gray-900 font-medium">{getAccountDisplay(glSettings.ar_retainage_account_vuid)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Cost in Excess of Billing:</span>
                      <p className="text-sm text-gray-900 font-medium">{getAccountDisplay(glSettings.cost_in_excess_of_billing_account_vuid)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Billing in Excess of Cost:</span>
                      <p className="text-sm text-gray-900 font-medium">{getAccountDisplay(glSettings.billing_in_excess_of_cost_account_vuid)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setShowGlForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors mr-2"
                    >
                      Edit Overrides
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to remove all GL overrides? This will revert to global settings.')) {
                          try {
                            const baseURL = 'http://localhost:5001';
                            await axios.delete(`${baseURL}/api/project-gl-settings/${glSettings.vuid}`);
                            setGlSettings(null);
                            setGlFormData({
                              ap_invoices_account_vuid: '',
                              ap_retainage_account_vuid: '',
                              ar_invoices_account_vuid: '',
                              ar_retainage_account_vuid: '',
                              cost_in_excess_of_billing_account_vuid: '',
                              billing_in_excess_of_cost_account_vuid: '',
                              description: ''
                            });
                          } catch (error) {
                            console.error('Error deleting GL settings:', error);
                            alert('Error deleting GL settings');
                          }
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Remove Overrides
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Defaults</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">AP Invoices:</span>
                      <p className="text-sm text-gray-900 font-medium">{globalGlSettings ? getAccountDisplay(globalGlSettings.ap_invoices_account_vuid) : 'Not configured'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">AP Retainage:</span>
                      <p className="text-sm text-gray-900 font-medium">{globalGlSettings ? getAccountDisplay(globalGlSettings.ap_retainage_account_vuid) : 'Not configured'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">AR Invoices:</span>
                      <p className="text-sm text-gray-900 font-medium">{globalGlSettings ? getAccountDisplay(globalGlSettings.ar_invoices_account_vuid) : 'Not configured'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">AR Retainage:</span>
                      <p className="text-sm text-gray-900 font-medium">{globalGlSettings ? getAccountDisplay(globalGlSettings.ar_retainage_account_vuid) : 'Not configured'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Cost in Excess of Billing:</span>
                      <p className="text-sm text-gray-900 font-medium">{globalGlSettings ? getAccountDisplay(globalGlSettings.cost_in_excess_of_billing_account_vuid) : 'Not configured'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Billing in Excess of Cost:</span>
                      <p className="text-sm text-gray-900 font-medium">{globalGlSettings ? getAccountDisplay(globalGlSettings.billing_in_excess_of_cost_account_vuid) : 'Not configured'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {editingSetting ? 'Edit Cost Type Setting' : 'Override Cost Type Expense Account'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    Cost Type
                  </label>
                  <input
                    type="text"
                    value={costTypeSettings.find(s => s.cost_type_vuid === formData.cost_type_vuid)?.cost_type || ''}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium bg-gray-50 text-gray-700"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    Default Expense Account
                  </label>
                  <input
                    type="text"
                    value={costTypeSettings.find(s => s.cost_type_vuid === formData.cost_type_vuid)?.default_expense_account || ''}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium bg-gray-50 text-gray-700"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    Project Override Expense Account *
                  </label>
                  <input
                    type="text"
                    name="expense_account"
                    value={formData.expense_account}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.expense_account ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter custom expense account"
                  />
                  {errors.expense_account && (
                    <p className="text-red-600 font-medium mt-2">{errors.expense_account}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_override"
                      checked={formData.is_override}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-lg font-semibold text-gray-900">
                      Active Override
                    </span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    When checked, this override will be used instead of the default expense account
                  </p>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Optional notes about this override"
                  />
                </div>

                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 font-medium">{errors.general}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {editingSetting ? 'Update Setting' : 'Create Override'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project Settings */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Settings</h2>
            <p className="text-sm text-gray-500">
              Configure project-specific behavior and features
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Allow Project Cost Codes:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      projectSettings?.allow_project_cost_codes 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {projectSettings?.allow_project_cost_codes ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Allocate Contract Lines to Cost Codes:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      projectSettings?.allocate_contract_lines_to_cost_codes 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {projectSettings?.allocate_contract_lines_to_cost_codes ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Labor Cost Method:</span>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {projectSettings?.labor_cost_method === 'default' ? 'Use Global Default' : 
                       projectSettings?.labor_cost_method === 'actuals' ? 'Use Actual Costs' :
                       projectSettings?.labor_cost_method === 'charge_rate' ? 'Use Charge Rate' : 'Default'}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowProjectSettingsForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Edit Settings
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About Project Cost Codes</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    When enabled, users can create project-specific cost codes that are only available 
                    within this project. These custom cost codes will appear in dropdowns throughout 
                    the project alongside the global cost codes.
                  </p>
                  <p>
                    Project-specific cost codes are useful for project-specific activities, 
                    phases, or cost categories that don't exist in the global master data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Cost Codes */}
        {projectSettings?.allow_project_cost_codes && (
          <div className="mb-8">
            <ProjectCostCodes 
              projectVuid={projectVuid} 
              onCostCodeChange={handleCostCodeChange}
            />
          </div>
        )}

        {/* GL Settings Form Modal */}
        {showGlForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {glSettings ? 'Edit GL Account Overrides' : 'Configure GL Account Overrides'}
              </h3>
              
              <form onSubmit={handleGlSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* AP Invoices Account */}
                  <div>
                    <label htmlFor="ap_invoices_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                      AP Invoices Account
                    </label>
                    <select
                      id="ap_invoices_account_vuid"
                      name="ap_invoices_account_vuid"
                      value={glFormData.ap_invoices_account_vuid}
                      onChange={handleGlInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                    >
                      <option value="">Use Global Default</option>
                      {chartOfAccounts
                        .filter(account => account.account_type === 'Liability' && account.status === 'active')
                        .map(account => (
                          <option key={account.vuid} value={account.vuid}>
                            {account.account_number} - {account.account_name}
                          </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to use global default
                    </p>
                  </div>

                  {/* AP Retainage Account */}
                  <div>
                    <label htmlFor="ap_retainage_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                      AP Retainage Account
                    </label>
                    <select
                      id="ap_retainage_account_vuid"
                      name="ap_retainage_account_vuid"
                      value={glFormData.ap_retainage_account_vuid}
                      onChange={handleGlInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                    >
                      <option value="">Use Global Default</option>
                      {chartOfAccounts
                        .filter(account => account.account_type === 'Liability' && account.status === 'active')
                        .map(account => (
                          <option key={account.vuid} value={account.vuid}>
                            {account.account_number} - {account.account_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* AR Invoices Account */}
                  <div>
                    <label htmlFor="ar_invoices_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                      AR Invoices Account
                    </label>
                    <select
                      id="ar_invoices_account_vuid"
                      name="ar_invoices_account_vuid"
                      value={glFormData.ar_invoices_account_vuid}
                      onChange={handleGlInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                    >
                      <option value="">Use Global Default</option>
                      {chartOfAccounts
                        .filter(account => account.account_type === 'Asset' && account.status === 'active')
                        .map(account => (
                          <option key={account.vuid} value={account.vuid}>
                            {account.account_number} - {account.account_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* AR Retainage Account */}
                  <div>
                    <label htmlFor="ar_retainage_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                      AR Retainage Account
                    </label>
                    <select
                      id="ar_retainage_account_vuid"
                      name="ar_retainage_account_vuid"
                      value={glFormData.ar_retainage_account_vuid}
                      onChange={handleGlInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                    >
                      <option value="">Use Global Default</option>
                      {chartOfAccounts
                        .filter(account => account.account_type === 'Asset' && account.status === 'active')
                        .map(account => (
                          <option key={account.vuid} value={account.vuid}>
                            {account.account_number} - {account.account_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Cost in Excess of Billing Account */}
                  <div>
                    <label htmlFor="cost_in_excess_of_billing_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                      Cost in Excess of Billing Account
                    </label>
                    <select
                      id="cost_in_excess_of_billing_account_vuid"
                      name="cost_in_excess_of_billing_account_vuid"
                      value={glFormData.cost_in_excess_of_billing_account_vuid}
                      onChange={handleGlInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                    >
                      <option value="">Use Global Default</option>
                      {chartOfAccounts
                        .filter(account => account.account_type === 'Asset' && account.status === 'active')
                        .map(account => (
                          <option key={account.vuid} value={account.vuid}>
                            {account.account_number} - {account.account_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Billing in Excess of Cost Account */}
                  <div>
                    <label htmlFor="billing_in_excess_of_cost_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                      Billing in Excess of Cost Account
                    </label>
                    <select
                      id="billing_in_excess_of_cost_account_vuid"
                      name="billing_in_excess_of_cost_account_vuid"
                      value={glFormData.billing_in_excess_of_cost_account_vuid}
                      onChange={handleGlInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                    >
                      <option value="">Use Global Default</option>
                      {chartOfAccounts
                        .filter(account => account.account_type === 'Liability' && account.status === 'active')
                        .map(account => (
                          <option key={account.vuid} value={account.vuid}>
                            {account.account_number} - {account.account_name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={glFormData.description}
                    onChange={handleGlInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                    placeholder="Optional description of these overrides"
                  />
                </div>

                {glErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 font-medium">{glErrors.general}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleGlCancel}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-vermillion-600 hover:bg-vermillion-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {glSettings ? 'Update Overrides' : 'Create Overrides'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project Settings Form Modal */}
        {showProjectSettingsForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Edit Project Settings
              </h3>
              
              <form onSubmit={handleProjectSettingsSubmit} className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={projectFormData.allow_project_cost_codes}
                      onChange={(e) => setProjectFormData(prev => ({
                        ...prev,
                        allow_project_cost_codes: e.target.checked
                      }))}
                      className="h-4 w-4 text-vermillion-600 focus:ring-vermillion-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Allow Project Cost Codes
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2 ml-7">
                    Enable users to create project-specific cost codes for this project
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={projectFormData.allocate_contract_lines_to_cost_codes}
                      onChange={(e) => setProjectFormData(prev => ({
                        ...prev,
                        allocate_contract_lines_to_cost_codes: e.target.checked
                      }))}
                      className="h-4 w-4 text-vermillion-600 focus:ring-vermillion-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Allocate Contract Lines to Cost Codes
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2 ml-7">
                    Show alerts for missing contract line allocations to cost codes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labor Cost Method
                  </label>
                  <select
                    value={projectFormData.labor_cost_method}
                    onChange={(e) => setProjectFormData(prev => ({
                      ...prev,
                      labor_cost_method: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-vermillion-500 focus:border-vermillion-500"
                  >
                    <option value="default">Use Global Default</option>
                    <option value="actuals">Use Actual Costs</option>
                    <option value="charge_rate">Use Charge Rate</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-2">
                    How to calculate labor costs for this project
                  </p>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleProjectSettingsCancel}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-vermillion-600 hover:bg-vermillion-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Update Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSettings;
