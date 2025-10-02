import React, { useState, useEffect } from 'react';

const WIPSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wip-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setError('Failed to fetch WIP settings');
      }
    } catch (err) {
      setError('Error fetching WIP settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingName, newValue) => {
    try {
      setSaving(true);
      setMessage('');
      
      const response = await fetch('/api/wip-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_name: settingName,
          setting_value: newValue,
          description: getSettingDescription(settingName)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage('Setting updated successfully');
        
        // Update local state
        setSettings(prev => 
          prev.map(setting => 
            setting.setting_name === settingName 
              ? { ...setting, setting_value: newValue }
              : setting
          )
        );
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError('Failed to update setting');
      }
    } catch (err) {
      setError('Error updating setting: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getSettingDescription = (settingName) => {
    const descriptions = {
      'use_eac_reporting': 'Enable EAC (Estimated At Completion) based reporting in WIP reports. When enabled, percent complete is calculated using EAC instead of current budget.'
    };
    return descriptions[settingName] || '';
  };

  const getSettingLabel = (settingName) => {
    const labels = {
      'use_eac_reporting': 'Use EAC for WIP Reporting'
    };
    return labels[settingName] || settingName;
  };

  const getSettingHelpText = (settingName) => {
    const helpTexts = {
      'use_eac_reporting': 'When enabled, the WIP report will use Estimated At Completion (EAC) values from buyout and forecasting data instead of current budget amounts for calculating percent complete.'
    };
    return helpTexts[settingName] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <h2 className="text-lg font-semibold mb-2">Error</h2>
              <p>{error}</p>
            </div>
            <button
              onClick={fetchSettings}
              className="px-4 py-2 bg-vermillion-600 text-white rounded-md hover:bg-vermillion-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WIP Report Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure settings for Work in Progress (WIP) reporting.
          </p>
        </div>

        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{message}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Report Configuration</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure how WIP reports calculate project completion percentages.
            </p>
          </div>

          <div className="px-6 py-4">
            <div className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.setting_name} className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">
                        {getSettingLabel(setting.setting_name)}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {getSettingHelpText(setting.setting_name)}
                    </p>
                    {setting.description && (
                      <p className="mt-2 text-xs text-gray-400">
                        {setting.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-6 flex-shrink-0">
                    <button
                      onClick={() => updateSetting(setting.setting_name, setting.setting_value === 'true' ? 'false' : 'true')}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:ring-offset-2 ${
                        setting.setting_value === 'true' ? 'bg-vermillion-600' : 'bg-gray-200'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          setting.setting_value === 'true' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How EAC Reporting Works</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>When <strong>enabled</strong>: Percent complete is calculated using Estimated At Completion (EAC) values from buyout and forecasting data</li>
                  <li>When <strong>disabled</strong>: Percent complete is calculated using current budget amounts</li>
                  <li>EAC values are automatically calculated from actual costs, commitments, and buyout status</li>
                  <li>For closed periods, EAC data is locked and cannot be modified</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WIPSettings;




