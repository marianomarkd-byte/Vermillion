import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JournalEntriesPreview = () => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [expandedEntries, setExpandedEntries] = useState(new Set());

  useEffect(() => {
    fetchAccountingPeriods();
  }, []);

  const fetchAccountingPeriods = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/accounting-periods');
      setAccountingPeriods(response.data);
    } catch (error) {
      console.error('Error fetching accounting periods:', error);
    }
  };

  const fetchPreviewData = async () => {
    if (!selectedPeriod) {
      alert('Please select an accounting period first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:5001/api/journal-entries/preview/${selectedPeriod}`);
      setPreviewData(response.data);
    } catch (error) {
      console.error('Error fetching preview data:', error);
      setError(error.response?.data?.error || 'Error fetching preview data');
    } finally {
      setLoading(false);
    }
  };

  const toggleEntryExpansion = (entryId) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getEntryTypeColor = (referenceType) => {
    const colors = {
      'ap_invoice': 'bg-blue-100 text-blue-800',
      'ap_invoice_retainage': 'bg-blue-50 text-blue-700',
      'project_billing': 'bg-green-100 text-green-800',
      'project_billing_retainage': 'bg-green-50 text-green-700',
      'labor_cost': 'bg-purple-100 text-purple-800',
      'project_expense': 'bg-orange-100 text-orange-800',
      'over_billing': 'bg-yellow-100 text-yellow-800',
      'under_billing': 'bg-red-100 text-red-800',
      'reversal': 'bg-gray-100 text-gray-800'
    };
    return colors[referenceType] || 'bg-gray-100 text-gray-800';
  };

  const getEntryTypeIcon = (referenceType) => {
    const icons = {
      'ap_invoice': '📄',
      'ap_invoice_retainage': '🔒',
      'project_billing': '💰',
      'project_billing_retainage': '🔒',
      'labor_cost': '👷',
      'project_expense': '📊',
      'over_billing': '⬆️',
      'under_billing': '⬇️',
      'reversal': '↩️'
    };
    return icons[referenceType] || '📋';
  };

  const getAccountName = (accountVuid, accounts) => {
    const account = accounts.find(acc => acc.vuid === accountVuid);
    return account ? `${account.account_number} - ${account.account_name}` : accountVuid;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading journal entries preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 font-sans">
            Journal Entries Preview
          </h1>
          <p className="text-lg text-gray-700 font-light">
            Preview all transactions that will create journal entries with expected debits and credits
          </p>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Accounting Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a period...</option>
                {accountingPeriods.map(period => (
                  <option key={period.vuid} value={period.vuid}>
                    {period.month}/{period.year} - {period.description}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchPreviewData}
              disabled={!selectedPeriod || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Preview Journal Entries'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Preview Data */}
        {previewData && (
          <>
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Total Journal Entries</div>
                  <div className="text-2xl font-bold text-blue-900">{previewData.preview_summary?.total_entries || 0}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Total Debits</div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(previewData.preview_summary?.total_debits || 0)}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-red-600">Total Credits</div>
                  <div className="text-2xl font-bold text-red-900">
                    {formatCurrency(previewData.preview_summary?.total_credits || 0)}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${
                  previewData.preview_summary?.is_balanced 
                    ? 'bg-green-50' 
                    : 'bg-red-50'
                }`}>
                  <div className={`text-sm font-medium ${
                    previewData.preview_summary?.is_balanced 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    Balance Status
                  </div>
                  <div className={`text-2xl font-bold ${
                    previewData.preview_summary?.is_balanced 
                      ? 'text-green-900' 
                      : 'text-red-900'
                  }`}>
                    {previewData.preview_summary?.is_balanced ? '✅ Balanced' : '❌ Unbalanced'}
                  </div>
                </div>
              </div>

              {/* Validation Errors */}
              {previewData.preview_summary?.validation_errors?.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Validation Errors</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {previewData.preview_summary.validation_errors.map((error, index) => (
                      <li key={index} className="text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Journal Entries */}
            <div className="space-y-4">
              {previewData.journal_entries?.map((entry, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Entry Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleEntryExpansion(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getEntryTypeIcon(entry.reference_type)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entry.journal_number || `Entry ${index + 1}`}
                          </h3>
                          <p className="text-sm text-gray-600">{entry.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEntryTypeColor(entry.reference_type)}`}>
                              {entry.reference_type?.replace('_', ' ').toUpperCase()}
                            </span>
                            {entry.project_number && (
                              <span className="text-xs text-gray-500">
                                Project: {entry.project_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(entry.total_amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.line_items?.length || 0} line items
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {expandedEntries.has(index) ? 'Click to collapse' : 'Click to expand'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Entry Details */}
                  {expandedEntries.has(index) && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      <div className="p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Line Items</h4>
                        <div className="space-y-2">
                          {entry.line_items?.map((line, lineIndex) => (
                            <div key={lineIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {getAccountName(line.gl_account_vuid, previewData.chart_of_accounts || [])}
                                  </div>
                                  <div className="text-sm text-gray-600">{line.description}</div>
                                </div>
                                <div className="text-right">
                                  {line.debit_amount > 0 && (
                                    <div className="text-green-600 font-semibold">
                                      Debit: {formatCurrency(line.debit_amount)}
                                    </div>
                                  )}
                                  {line.credit_amount > 0 && (
                                    <div className="text-red-600 font-semibold">
                                      Credit: {formatCurrency(line.credit_amount)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Entry Totals */}
                        <div className="mt-4 pt-3 border-t border-gray-300">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Entry Total:</span>
                            <div className="flex gap-4">
                              <span className="text-green-600 font-semibold">
                                Debits: {formatCurrency(entry.total_debits || 0)}
                              </span>
                              <span className="text-red-600 font-semibold">
                                Credits: {formatCurrency(entry.total_credits || 0)}
                              </span>
                              <span className={`font-semibold ${
                                (entry.total_debits || 0) === (entry.total_credits || 0) 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                Balance: {formatCurrency((entry.total_debits || 0) - (entry.total_credits || 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Data State */}
        {previewData && (!previewData.journal_entries || previewData.journal_entries.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Journal Entries Found</h3>
            <p className="text-gray-600">No transactions will create journal entries for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntriesPreview;

