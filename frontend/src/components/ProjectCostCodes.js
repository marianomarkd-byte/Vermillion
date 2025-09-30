import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProjectCostCodes = ({ projectVuid, onCostCodeChange }) => {
  const [costCodes, setCostCodes] = useState([]);
  const [projectCostCodes, setProjectCostCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCostCode, setEditingCostCode] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (projectVuid) {
      fetchCostCodes();
    }
  }, [projectVuid]);

  const fetchCostCodes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${projectVuid}/cost-codes`);
      setCostCodes(response.data);
      
      // Separate project-specific cost codes
      const projectSpecific = response.data.filter(cc => cc.is_project_specific);
      setProjectCostCodes(projectSpecific);
    } catch (error) {
      console.error('Error fetching cost codes:', error);
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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Cost code is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload = {
        ...formData,
        project_vuid: projectVuid
      };
      
      if (editingCostCode) {
        await axios.put(`/api/project-cost-codes/${editingCostCode.vuid}`, payload);
      } else {
        await axios.post('/api/project-cost-codes', payload);
      }
      
      // Refresh cost codes
      await fetchCostCodes();
      
      // Reset form
      setFormData({
        code: '',
        description: '',
        status: 'active'
      });
      setShowCreateForm(false);
      setEditingCostCode(null);
      setErrors({});
      
      // Notify parent component
      if (onCostCodeChange) {
        onCostCodeChange();
      }
      
    } catch (error) {
      console.error('Error saving cost code:', error);
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      } else {
        setErrors({ submit: 'Error saving cost code' });
      }
    }
  };

  const handleEdit = (costCode) => {
    setEditingCostCode(costCode);
    setFormData({
      code: costCode.code,
      description: costCode.description,
      status: costCode.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (vuid) => {
    if (!window.confirm('Are you sure you want to delete this cost code?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/project-cost-codes/${vuid}`);
      await fetchCostCodes();
      
      // Notify parent component
      if (onCostCodeChange) {
        onCostCodeChange();
      }
    } catch (error) {
      console.error('Error deleting cost code:', error);
      alert('Error deleting cost code');
    }
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      description: '',
      status: 'active'
    });
    setShowCreateForm(false);
    setEditingCostCode(null);
    setErrors({});
  };

  if (loading) {
    return <div className="text-center py-4">Loading cost codes...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Project Cost Codes
        </h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-vermillion-600 text-white px-4 py-2 rounded-md hover:bg-vermillion-700 transition-colors"
        >
          Add Cost Code
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-md font-medium mb-4">
            {editingCostCode ? 'Edit Cost Code' : 'Create New Cost Code'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter cost code"
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter description"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
            
            {errors.submit && (
              <p className="text-red-500 text-sm">{errors.submit}</p>
            )}
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-vermillion-600 text-white px-4 py-2 rounded-md hover:bg-vermillion-700 transition-colors"
              >
                {editingCostCode ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Cost Codes Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
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
            {projectCostCodes.map((costCode) => (
              <tr key={costCode.vuid} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {costCode.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {costCode.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    costCode.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {costCode.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(costCode)}
                    className="text-vermillion-600 hover:text-vermillion-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(costCode.vuid)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            
            {projectCostCodes.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                  No project-specific cost codes found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Global Cost Codes Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-md font-medium text-blue-900 mb-2">
          Global Cost Codes
        </h4>
        <p className="text-sm text-blue-700">
          This project also has access to {costCodes.filter(cc => !cc.is_project_specific).length} global cost codes 
          from the master data. Project-specific cost codes are shown above and will appear in dropdowns 
          throughout this project.
        </p>
      </div>
    </div>
  );
};

export default ProjectCostCodes;

