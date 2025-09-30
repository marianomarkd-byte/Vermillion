import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CommitmentsReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  const baseURL = 'http://localhost:5001';

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Check for project parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const projectVuid = searchParams.get('project');
    
    if (projectVuid && projects.length > 0) {
      const project = projects.find(p => p.vuid === projectVuid);
      if (project) {
        setSelectedProject(project);
        fetchCommitmentsReport(projectVuid);
      }
    }
  }, [location.search, projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${baseURL}/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      setError('Error fetching projects: ' + error.message);
    }
  };

  const fetchCommitmentsReport = async (projectVuid = null) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `${baseURL}/api/commitments-report`;
      if (projectVuid) {
        url += `?project_vuid=${projectVuid}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch commitments report (${response.status})`);
      }
      
      const data = await response.json();
      setCommitments(data);
    } catch (error) {
      setError('Error fetching commitments report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (project) => {
    setSelectedProject(project);
    setCurrentPage(1);
    
    if (project) {
      // Update URL with project parameter
      const searchParams = new URLSearchParams();
      searchParams.set('project', project.vuid);
      navigate(`/commitments-report?${searchParams.toString()}`);
      fetchCommitmentsReport(project.vuid);
    } else {
      // Clear URL parameter and fetch all commitments
      navigate('/commitments-report');
      fetchCommitmentsReport();
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  // CSV Export functionality
  const downloadCsvFile = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCsvExport = () => {
    const headers = [
      'Project Number',
      'Project Name',
      'Commitment Number',
      'Vendor',
      'Description',
      'Original Amount',
      'Change Orders Amount',
      'Current Amount',
      'Invoiced Amount',
      'Remaining Amount',
      'Status',
      'Date Created',
      'AP Invoices Count',
      'Last Invoice Date'
    ];

    const rows = commitments.map(commitment => [
      commitment.project?.project_number || '',
      commitment.project?.project_name || '',
      commitment.commitment_number || '',
      commitment.vendor?.vendor_name || '',
      commitment.description || '',
      commitment.original_amount || 0,
      commitment.change_orders_amount || 0,
      commitment.current_amount || 0,
      commitment.invoiced_amount || 0,
      commitment.remaining_amount || 0,
      commitment.status || '',
      formatDate(commitment.created_at),
      commitment.ap_invoices_count || 0,
      formatDate(commitment.last_invoice_date)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const filename = selectedProject 
      ? `commitments_report_${selectedProject.project_number}_${new Date().toISOString().split('T')[0]}.csv`
      : `commitments_report_${new Date().toISOString().split('T')[0]}.csv`;

    downloadCsvFile(csvContent, filename);
  };

  // Pagination
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return commitments.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(commitments.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => paginate(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          First
        </button>
        
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              currentPage === number
                ? 'text-white bg-blue-600 border border-blue-600'
                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {number}
          </button>
        ))}

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>

        <button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Commitments Report</h1>
              <p className="mt-2 text-gray-600">
                View commitment summaries with AP invoices and change orders
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleCsvExport}
                disabled={commitments.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Project Filter */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Project:</label>
              <select
                value={selectedProject?.vuid || ''}
                onChange={(e) => {
                  const project = e.target.value ? projects.find(p => p.vuid === e.target.value) : null;
                  handleProjectChange(project);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.vuid} value={project.vuid}>
                    {project.project_number} - {project.project_name}
                  </option>
                ))}
              </select>
              
              {selectedProject && (
                <span className="text-sm text-gray-500">
                  Showing commitments for {selectedProject.project_name}
                </span>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{commitments.length}</div>
                <div className="text-sm text-gray-500">Total Commitments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(commitments.reduce((sum, c) => sum + (c.current_amount || 0), 0))}
                </div>
                <div className="text-sm text-gray-500">Total Commitment Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(commitments.reduce((sum, c) => sum + (c.invoiced_amount || 0), 0))}
                </div>
                <div className="text-sm text-gray-500">Total Invoiced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(commitments.reduce((sum, c) => sum + (c.remaining_amount || 0), 0))}
                </div>
                <div className="text-sm text-gray-500">Total Remaining</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white shadow rounded-lg p-8">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading commitments...</span>
              </div>
            </div>
          )}

          {/* Commitments Table */}
          {!loading && commitments.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commitment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Original Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoiced
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AP Invoices
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCurrentPageData().map((commitment) => (
                      <tr key={commitment.vuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {commitment.commitment_number}
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {commitment.description}
                            </div>
                            {!selectedProject && (
                              <div className="text-xs text-gray-400">
                                {commitment.project?.project_number} - {commitment.project?.project_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {commitment.vendor?.vendor_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(commitment.original_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(commitment.change_orders_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(commitment.current_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          {formatCurrency(commitment.invoiced_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                          {formatCurrency(commitment.remaining_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {commitment.ap_invoices_count || 0} invoices
                          </div>
                          {commitment.last_invoice_date && (
                            <div className="text-xs text-gray-500">
                              Last: {formatDate(commitment.last_invoice_date)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            commitment.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : commitment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {commitment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {renderPagination()}
            </div>
          )}

          {/* No Data Message */}
          {!loading && commitments.length === 0 && (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-500 text-lg">
                {selectedProject 
                  ? `No commitments found for ${selectedProject.project_name}`
                  : 'No commitments found'
                }
              </div>
              <p className="text-gray-400 mt-2">
                Commitments will appear here once they are created.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitmentsReport;
