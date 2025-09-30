import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BuyoutAndForecasting = () => {
  const { projectVuid } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [accountingPeriods, setAccountingPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [budgetLines, setBudgetLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState({});
  const [saving, setSaving] = useState(false);

  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    if (projectVuid) {
      fetchProjectData();
      fetchAccountingPeriods();
    }
  }, [projectVuid]);

  useEffect(() => {
    if (projectVuid && selectedPeriod) {
      fetchBuyoutData();
    }
  }, [projectVuid, selectedPeriod]);

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`${baseURL}/api/projects/${projectVuid}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        setError('Failed to fetch project data');
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      setError('Error fetching project data');
    }
  };

  const fetchAccountingPeriods = async () => {
    try {
      const response = await fetch(`${baseURL}/api/accounting-periods`);
      if (response.ok) {
        const data = await response.json();
        setAccountingPeriods(data);
        // Set default to current open period
        const openPeriod = data.find(p => p.status === 'open');
        if (openPeriod) {
          setSelectedPeriod(openPeriod.vuid);
        }
      } else {
        setError('Failed to fetch accounting periods');
      }
    } catch (error) {
      console.error('Error fetching accounting periods:', error);
      setError('Error fetching accounting periods');
    }
  };

  const fetchBuyoutData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${baseURL}/api/projects/${projectVuid}/buyout-forecasting?accounting_period_vuid=${selectedPeriod}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBudgetLines(result.data.budget_lines);
        } else {
          setError(result.error || 'Failed to fetch buyout data');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch buyout data');
      }
    } catch (error) {
      console.error('Error fetching buyout data:', error);
      setError('Error fetching buyout data');
    } finally {
      setLoading(false);
    }
  };

  const updateBuyoutStatus = async (budgetLineVuid, isBoughtOut, buyoutDate = null, buyoutAmount = null, notes = '') => {
    setUpdating(prev => ({ ...prev, [budgetLineVuid]: true }));
    
    try {
      const response = await fetch(`${baseURL}/api/projects/${projectVuid}/buyout-forecasting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget_line_vuid: budgetLineVuid,
          accounting_period_vuid: selectedPeriod,
          is_bought_out: isBoughtOut,
          buyout_date: buyoutDate,
          buyout_amount: buyoutAmount,
          notes: notes,
          created_by: 'Current User' // In a real app, this would come from auth context
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh the data to show updated buyout status
          await fetchBuyoutData();
        } else {
          alert(`Error: ${result.error || 'Failed to update buyout status'}`);
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to update buyout status'}`);
      }
    } catch (error) {
      console.error('Error updating buyout status:', error);
      alert('Error updating buyout status');
    } finally {
      setUpdating(prev => ({ ...prev, [budgetLineVuid]: false }));
    }
  };

  const handleBuyoutToggle = (budgetLineVuid, isBoughtOut) => {
    // Update local state without saving to database
    setBudgetLines(prevLines => 
      prevLines.map(line => 
        line.budget_line_vuid === budgetLineVuid 
          ? { 
              ...line, 
              buyout: { 
                ...line.buyout, 
                is_bought_out: isBoughtOut,
                buyout_date: isBoughtOut ? new Date().toISOString().split('T')[0] : null
              }
            }
          : line
      )
    );
    
    // Track unsaved changes
    setUnsavedChanges(prev => ({
      ...prev,
      [budgetLineVuid]: {
        is_bought_out: isBoughtOut,
        buyout_date: isBoughtOut ? new Date().toISOString().split('T')[0] : null
      }
    }));
  };

  const saveAllBuyoutData = async () => {
    if (budgetLines.length === 0) {
      alert('No budget lines to save.');
      return;
    }

    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Save buyout and forecasting data for ALL budget lines (not just changed ones)
      for (const line of budgetLines) {
        try {
          const response = await fetch(`${baseURL}/api/projects/${projectVuid}/buyout-forecasting`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              budget_line_vuid: line.budget_line_vuid,
              accounting_period_vuid: selectedPeriod,
              is_bought_out: line.buyout.is_bought_out,
              buyout_date: line.buyout.buyout_date,
              buyout_amount: line.buyout.buyout_amount,
              notes: line.buyout.notes || '',
              created_by: 'Current User',
              // Include calculated values
              etc_amount: line.etc_amount,
              eac_amount: line.eac_amount,
              buyout_savings: line.buyout_savings,
              actuals_amount: line.actuals_amount,
              committed_amount: line.committed_amount,
              total_committed_amount: line.total_committed_amount
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error saving budget line ${line.budget_line_vuid}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        // Clear unsaved changes and refresh data
        setUnsavedChanges({});
        await fetchBuyoutData();
        
        if (errorCount === 0) {
          alert(`Successfully saved buyout and forecasting data for ${successCount} budget line(s)!`);
        } else {
          alert(`Saved ${successCount} record(s), but ${errorCount} failed. Please try again.`);
        }
      } else {
        alert('Failed to save any records. Please try again.');
      }
    } catch (error) {
      console.error('Error saving buyout data:', error);
      alert('Error saving buyout data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getSelectedPeriodName = () => {
    const period = accountingPeriods.find(p => p.vuid === selectedPeriod);
    return period ? `${period.month}/${period.year}` : 'Select Period';
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buyout and Forecasting</h1>
            <p className="mt-2 text-lg text-gray-600">
              {project.project_number} - {project.project_name}
            </p>
          </div>
          <button
            onClick={() => navigate(`/projects/${projectVuid}`)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md"
          >
            ← Back to Project
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <label htmlFor="period-select" className="text-sm font-medium text-gray-700">
              Accounting Period:
            </label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Period</option>
              {accountingPeriods.map((period) => (
                <option key={period.vuid} value={period.vuid}>
                  {period.month}/{period.year} ({period.status})
                </option>
              ))}
            </select>
            {selectedPeriod && (
              <span className="text-sm text-gray-500">
                Current Period: {getSelectedPeriodName()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading buyout data...</div>
        </div>
      )}

      {/* Budget Lines Table */}
      {!loading && !error && budgetLines.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Budget Lines</h2>
                <p className="text-sm text-gray-600">
                  Track buyout status for each budget line in {getSelectedPeriodName()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Refresh data to show current state
                    fetchBuyoutData();
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md text-sm"
                >
                  Refresh Data
                </button>
                <button
                  onClick={saveAllBuyoutData}
                  disabled={saving || budgetLines.length === 0}
                  className={`font-medium py-2 px-4 rounded-md text-sm ${
                    saving || budgetLines.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Buyout & Forecasting Data'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budgeted (w/ CO)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Committed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change Orders
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Committed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyout Savings
                  </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actuals
                    </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ETC
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EAC
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bought Out
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgetLines.map((line) => (
                  <tr key={line.budget_line_vuid} className={line.buyout.is_bought_out ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {line.cost_code?.code || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {line.cost_code?.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {line.cost_type?.cost_type || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {line.cost_type?.abbreviation || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(line.budget_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(line.budgeted_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(line.committed_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(line.commitment_change_orders_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(line.total_committed_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {line.buyout.is_bought_out ? (
                        <span className={line.buyout_savings > 0 ? 'text-green-600' : line.buyout_savings < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatCurrency(line.buyout_savings)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(line.actuals_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      <span className={line.etc_amount < 0 ? 'text-red-600' : 'text-gray-900'}>
                        {formatCurrency(line.etc_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(line.eac_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={line.buyout.is_bought_out}
                          onChange={(e) => handleBuyoutToggle(line.budget_line_vuid, e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {line.buyout.is_bought_out && (
                        <div className="text-xs text-green-600">
                          {line.buyout.buyout_date && (
                            <div>Date: {new Date(line.buyout.buyout_date).toLocaleDateString()}</div>
                          )}
                          {line.buyout.created_by && (
                            <div>By: {line.buyout.created_by}</div>
                          )}
                          {line.buyout.original_period && line.buyout.original_period !== selectedPeriod && (
                            <div className="text-blue-600">Originally bought out</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && budgetLines.length === 0 && selectedPeriod && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            No budget lines found for this project in {getSelectedPeriodName()}.
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && budgetLines.length > 0 && (
        <div className="mt-8">
          {/* Save Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Save Buyout & Forecasting Data</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Save all calculated ETC, EAC, and Buyout Savings data for this project and period. 
                  This data will be used in the WIP report for percentage complete calculations.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={saveAllBuyoutData}
                  disabled={saving || budgetLines.length === 0}
                  className={`font-medium py-2 px-6 rounded-md ${
                    saving || budgetLines.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save All Data'}
                </button>
                <button
                  onClick={() => {
                    fetchBuyoutData();
                    setUnsavedChanges({});
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-md"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total Budget (w/ CO)</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(budgetLines.reduce((sum, line) => sum + line.budgeted_amount, 0))}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total ETC</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(budgetLines.reduce((sum, line) => sum + line.etc_amount, 0))}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total EAC</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(budgetLines.reduce((sum, line) => sum + line.eac_amount, 0))}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total Committed</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(budgetLines.reduce((sum, line) => sum + line.total_committed_amount, 0))}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total Buyout Savings</div>
              <div className="text-2xl font-bold">
                <span className={budgetLines.reduce((sum, line) => sum + (line.buyout_savings || 0), 0) > 0 ? 'text-green-600' : budgetLines.reduce((sum, line) => sum + (line.buyout_savings || 0), 0) < 0 ? 'text-red-600' : 'text-gray-900'}>
                  {formatCurrency(budgetLines.reduce((sum, line) => sum + (line.buyout_savings || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyoutAndForecasting;
