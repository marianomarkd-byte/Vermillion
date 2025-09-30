import React, { useState, useEffect } from 'react';
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const IntegrationIndicator = ({ objectVuid, objectType, className = '' }) => {
  const [externalIds, setExternalIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [activeModalId, setActiveModalId] = useState(null);

  useEffect(() => {
    if (objectVuid && objectType) {
      fetchExternalIds();
    }
  }, [objectVuid, objectType]);

  const fetchExternalIds = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching external IDs for:', { objectVuid, objectType });
      const response = await axios.get(`${baseURL}/api/external-system-ids/by-object`, {
        params: {
          object_vuid: objectVuid,
          object_type: objectType
        }
      });
      console.log('📡 API Response:', response.data);
      setExternalIds(response.data);
    } catch (error) {
      console.error('❌ Error fetching external IDs:', error);
      setExternalIds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = (event, externalId) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Calculate position relative to viewport, not document
    const position = {
      top: rect.bottom + 5,  // Remove window.scrollY - use viewport coordinates
      left: rect.left        // Remove window.scrollX - use viewport coordinates
    };
    
    // Ensure modal stays within viewport bounds
    const modalWidth = 256; // min-w-64 = 16rem = 256px
    const modalHeight = 200; // Estimated modal height
    
    // Adjust horizontal position if modal would go off-screen
    if (position.left + modalWidth > window.innerWidth) {
      position.left = window.innerWidth - modalWidth - 10;
    }
    if (position.left < 10) {
      position.left = 10;
    }
    
    // Adjust vertical position if modal would go off-screen
    if (position.top + modalHeight > window.innerHeight) {
      position.top = rect.top - modalHeight - 5; // Show above button instead
    }
    
    console.log('🎯 Modal positioning:', {
      buttonRect: rect,
      calculatedPosition: position,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });
    
    setModalPosition(position);
    
    if (activeModalId === externalId.vuid) {
      setActiveModalId(null);
      setShowDetails(false);
    } else {
      setActiveModalId(externalId.vuid);
      setShowDetails(true);
    }
  };

  if (loading) {
    console.log('⏳ IntegrationIndicator: Loading...');
    return null; // Don't show anything while loading
  }

  console.log('🔍 IntegrationIndicator: externalIds =', externalIds);
  
  if (externalIds.length === 0) {
    console.log('❌ IntegrationIndicator: No external IDs found, returning null');
    return (
      <div className={`inline-block ${className}`}>
        <button
          onClick={fetchExternalIds}
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title="Refresh integration status"
        >
          🔄 Refresh
        </button>
      </div>
    );
  }

  const getIntegrationIcon = (integrationType) => {
    switch (integrationType?.toLowerCase()) {
      case 'procore':
        return '🏗️';
      case 'quickbooks':
      case 'quickbooks online':
      case 'quickbooks_online':
        return '💰';
      case 'sage':
        return '📊';
      case 'adp':
        return '👥';
      case 'sap_concur':
        return '✈️';
      default:
        return '🔗';
    }
  };

  const getIntegrationColor = (integrationType) => {
    switch (integrationType?.toLowerCase()) {
      case 'procore':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'quickbooks':
      case 'quickbooks online':
      case 'quickbooks_online':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sage':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'adp':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sap_concur':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      {externalIds.map((externalId, index) => (
        <div key={externalId.vuid} className="relative inline-block">
          <button
            onClick={(event) => handleShowDetails(event, externalId)}
            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getIntegrationColor(externalId.integration_type)} hover:opacity-80 transition-opacity`}
            title={`Synced from ${externalId.integration_name}`}
          >
            <span className="mr-1">{getIntegrationIcon(externalId.integration_type)}</span>
            <span className="font-semibold">
              {externalId.integration_type || 'Integration'}
            </span>
          </button>
          
          {/* Details Popup */}
          {showDetails && activeModalId === externalId.vuid && (
            <div className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-64" style={{
              position: 'fixed',
              top: `${modalPosition.top}px`,
              left: `${modalPosition.left}px`,
              zIndex: 9999,
              minWidth: '16rem'
            }}>
              <div className="text-sm">
                <div className="font-semibold text-gray-900 mb-2">
                  Integration Details
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="font-medium">{externalId.integration_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{externalId.integration_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">External ID:</span>
                    <span className="font-medium font-mono text-sm bg-gray-100 px-1 rounded">
                      {externalId.external_id}
                    </span>
                  </div>
                  {externalId.last_synced_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Synced:</span>
                      <span className="font-medium">
                        {new Date(externalId.last_synced_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {externalId.external_status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        externalId.external_status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {externalId.external_status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={() => {
                  setShowDetails(false);
                  setActiveModalId(null);
                }}
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}
      
      {/* Backdrop to close details */}
      {showDetails && (
        <div 
          className="fixed inset-0 z-[9998]"
          onClick={() => {
            setShowDetails(false);
            setActiveModalId(null);
          }}
        />
      )}
    </div>
  );
};

export default IntegrationIndicator;
