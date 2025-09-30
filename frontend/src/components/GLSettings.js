import React, { useState, useEffect } from 'react';
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const GLSettings = () => {
  const [settings, setSettings] = useState(null);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [formData, setFormData] = useState({
    ap_invoices_account_vuid: '',
    ap_retainage_account_vuid: '',
    ar_invoices_account_vuid: '',
    ar_retainage_account_vuid: '',
    cost_in_excess_of_billing_account_vuid: '',
    billing_in_excess_of_cost_account_vuid: '',
    ap_invoice_integration_method: 'invoice',
    ar_invoice_integration_method: 'invoice',
    labor_cost_integration_method: 'actuals',
    description: 'Default GL Settings'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch GL Settings
      const settingsResponse = await axios.get(`${baseURL}/api/gl-settings`);
      if (settingsResponse.data && settingsResponse.data.length > 0) {
        const existingSettings = settingsResponse.data[0];
        setSettings(existingSettings);
        setFormData({
          ap_invoices_account_vuid: existingSettings.ap_invoices_account_vuid || '',
          ap_retainage_account_vuid: existingSettings.ap_retainage_account_vuid || '',
          ar_invoices_account_vuid: existingSettings.ar_invoices_account_vuid || '',
          ar_retainage_account_vuid: existingSettings.ar_retainage_account_vuid || '',
          cost_in_excess_of_billing_account_vuid: existingSettings.cost_in_excess_of_billing_account_vuid || '',
          billing_in_excess_of_cost_account_vuid: existingSettings.billing_in_excess_of_cost_account_vuid || '',
          ap_invoice_integration_method: existingSettings.ap_invoice_integration_method || 'invoice',
          ar_invoice_integration_method: existingSettings.ar_invoice_integration_method || 'invoice',
          labor_cost_integration_method: existingSettings.labor_cost_integration_method || 'actuals',
          description: existingSettings.description || 'Default GL Settings'
        });
      }
      
      // Fetch Chart of Accounts
      const accountsResponse = await axios.get(`${baseURL}/api/chartofaccounts`);
      setChartOfAccounts(accountsResponse.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error loading data. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (settings) {
        // Update existing settings
        await axios.put(`${baseURL}/api/gl-settings/${settings.vuid}`, formData);
        setMessage('GL Settings updated successfully!');
        setMessageType('success');
      } else {
        // Create new settings
        const response = await axios.post(`${baseURL}/api/gl-settings`, formData);
        setSettings(response.data);
        setMessage('GL Settings created successfully!');
        setMessageType('success');
      }
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(error.response?.data?.error || 'Error saving settings. Please try again.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const getAccountDisplay = (accountVuid) => {
    if (!accountVuid) return 'Not set';
    const account = chartOfAccounts.find(acc => acc.vuid === accountVuid);
    return account ? `${account.account_number} - ${account.account_name}` : 'Account not found';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vermillion-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading GL Settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GL Settings</h1>
          <p className="text-gray-600">
            Configure default Chart of Accounts for various financial transactions
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* AP Invoices Account */}
              <div>
                <label htmlFor="ap_invoices_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                  AP Invoices Account *
                </label>
                <select
                  id="ap_invoices_account_vuid"
                  name="ap_invoices_account_vuid"
                  value={formData.ap_invoices_account_vuid}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Account</option>
                  {chartOfAccounts
                    .filter(account => account.account_type === 'Liability' && account.status === 'active')
                    .map(account => (
                      <option key={account.vuid} value={account.vuid}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Default account for Accounts Payable invoices
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
                  value={formData.ap_retainage_account_vuid}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Account</option>
                  {chartOfAccounts
                    .filter(account => account.account_type === 'Liability' && account.status === 'active')
                    .map(account => (
                      <option key={account.vuid} value={account.vuid}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Default account for AP retainage withholdings
                </p>
              </div>



              {/* AR Invoices Account */}
              <div>
                <label htmlFor="ar_invoices_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                  AR Invoices Account *
                </label>
                <select
                  id="ar_invoices_account_vuid"
                  name="ar_invoices_account_vuid"
                  value={formData.ar_invoices_account_vuid}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Account</option>
                  {chartOfAccounts
                    .filter(account => account.account_type === 'Asset' && account.status === 'active')
                    .map(account => (
                      <option key={account.vuid} value={account.vuid}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Default account for Accounts Receivable invoices
                </p>
              </div>

              {/* AR Retainage Account */}
              <div>
                <label htmlFor="ar_retainage_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                  AR Retainage Account
                </label>
                <select
                  id="ar_retainage_account_vuid"
                  name="ar_retainage_account_vuid"
                  value={formData.ar_retainage_account_vuid}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Account</option>
                  {chartOfAccounts
                    .filter(account => account.account_type === 'Asset' && account.status === 'active')
                    .map(account => (
                      <option key={account.vuid} value={account.vuid}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Default account for AR retainage withholdings
                </p>
              </div>



              {/* Cost in Excess of Billing Account */}
              <div>
                <label htmlFor="cost_in_excess_of_billing_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                  Cost in Excess of Billing Account
                </label>
                <select
                  id="cost_in_excess_of_billing_account_vuid"
                  name="cost_in_excess_of_billing_account_vuid"
                  value={formData.cost_in_excess_of_billing_account_vuid}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Account</option>
                  {chartOfAccounts
                    .filter(account => account.account_type === 'Asset' && account.status === 'active')
                    .map(account => (
                      <option key={account.vuid} value={account.vuid}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Default account for costs exceeding billings
                </p>
              </div>

              {/* Billing in Excess of Cost Account */}
              <div>
                <label htmlFor="billing_in_excess_of_cost_account_vuid" className="block text-sm font-medium text-gray-700 mb-2">
                  Billing in Excess of Cost Account
                </label>
                <select
                  id="billing_in_excess_of_cost_account_vuid"
                  name="billing_in_excess_of_cost_account_vuid"
                  value={formData.billing_in_excess_of_cost_account_vuid}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="">Select Account</option>
                  {chartOfAccounts
                    .filter(account => account.account_type === 'Liability' && account.status === 'active')
                    .map(account => (
                      <option key={account.vuid} value={account.vuid}>
                        {account.account_number} - {account.account_name}
                      </option>
                    ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Default account for billings exceeding costs
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                placeholder="Description of these GL settings"
              />
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : (settings ? 'Update Settings' : 'Create Settings')}
              </button>
            </div>
          </form>
        </div>

        {/* Integration Settings Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Integration Settings</h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure how different types of transactions are sent to external accounting systems.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AP Invoice Integration Method */}
              <div>
                <label htmlFor="ap_invoice_integration_method" className="block text-sm font-medium text-gray-700 mb-2">
                  AP Invoice Integration Method
                </label>
                <select
                  id="ap_invoice_integration_method"
                  name="ap_invoice_integration_method"
                  value={formData.ap_invoice_integration_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="invoice">Invoice Records</option>
                  <option value="journal_entries">Journal Entries</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  How AP invoices should be sent to integrations: as invoice records or as journal entries
                </p>
              </div>

              {/* AR Invoice Integration Method */}
              <div>
                <label htmlFor="ar_invoice_integration_method" className="block text-sm font-medium text-gray-700 mb-2">
                  AR Invoice Integration Method
                </label>
                <select
                  id="ar_invoice_integration_method"
                  name="ar_invoice_integration_method"
                  value={formData.ar_invoice_integration_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="invoice">Invoice Records</option>
                  <option value="journal_entries">Journal Entries</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  How AR invoices should be sent to integrations: as invoice records or as journal entries
                </p>
              </div>

              {/* Labor Cost Integration Method */}
              <div>
                <label htmlFor="labor_cost_integration_method" className="block text-sm font-medium text-gray-700 mb-2">
                  Labor Cost Integration Method
                </label>
                <select
                  id="labor_cost_integration_method"
                  name="labor_cost_integration_method"
                  value={formData.labor_cost_integration_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
                >
                  <option value="actuals">Actuals (Use Labor Cost Amount)</option>
                  <option value="charge_rate">Charge Rate (Employee Rate × Hours)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  How labor costs should be calculated for journal entries: use actual labor cost amount or calculate from employee charge rate × hours
                </p>
              </div>
            </div>

            {/* Submit Button for Integration Settings */}
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Update Integration Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Current Settings Display */}
        {settings && (
          <>
            {/* Account Settings Display */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Account Settings</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">AP Invoices:</span>
                  <p className="text-sm text-gray-900">{getAccountDisplay(settings.ap_invoices_account_vuid)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">AP Retainage:</span>
                  <p className="text-sm text-gray-900">{getAccountDisplay(settings.ap_retainage_account_vuid)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">AR Invoices:</span>
                  <p className="text-sm text-gray-900">{getAccountDisplay(settings.ar_invoices_account_vuid)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">AR Retainage:</span>
                  <p className="text-sm text-gray-900">{getAccountDisplay(settings.ar_retainage_account_vuid)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Cost in Excess of Billing:</span>
                  <p className="text-sm text-gray-900">{getAccountDisplay(settings.cost_in_excess_of_billing_account_vuid)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Billing in Excess of Cost:</span>
                  <p className="text-sm text-gray-900">{getAccountDisplay(settings.billing_in_excess_of_cost_account_vuid)}</p>
                </div>
              </div>
            </div>

            {/* Integration Settings Display */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Integration Settings</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">AP Invoice Integration:</span>
                  <p className="text-sm text-gray-900 capitalize">{settings.ap_invoice_integration_method?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">AR Invoice Integration:</span>
                  <p className="text-sm text-gray-900 capitalize">{settings.ar_invoice_integration_method?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Labor Cost Integration:</span>
                  <p className="text-sm text-gray-900 capitalize">{settings.labor_cost_integration_method?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
};

export default GLSettings;


