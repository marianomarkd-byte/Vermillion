import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Extract project VUID from URL parameters or route parameters
  const getProjectVuid = () => {
    // Check if we're on a project detail page (route parameter)
    const projectDetailMatch = location.pathname.match(/^\/projects\/([^\/]+)(?:\/|$)/);
    if (projectDetailMatch) {
      console.log('ProjectBreadcrumb: Found project VUID from route:', projectDetailMatch[1]);
      return projectDetailMatch[1];
    }
    
    // Check for project parameter in query string
    const searchParams = new URLSearchParams(location.search);
    const projectVuid = searchParams.get('project');
    if (projectVuid) {
      console.log('ProjectBreadcrumb: Found project VUID from query param:', projectVuid);
      return projectVuid;
    }
    
    // Check for commitment parameter and derive project VUID
    const commitmentVuid = searchParams.get('commitment');
    if (commitmentVuid) {
      console.log('ProjectBreadcrumb: Found commitment VUID, will derive project VUID:', commitmentVuid);
      return commitmentVuid; // We'll handle this in the fetchProject function
    }
    
    console.log('ProjectBreadcrumb: No project VUID found');
    return null;
  };

  // Fetch project details when project VUID is available
  useEffect(() => {
    const projectVuid = getProjectVuid();
    
    if (projectVuid && projectVuid !== project?.vuid) {
      setLoading(true);
      fetchProject(projectVuid);
    } else if (!projectVuid) {
      setProject(null);
    }
  }, [location.pathname, location.search]);

  const fetchProject = async (vuid) => {
    try {
      // Check if this is a commitment VUID by looking at the URL
      const searchParams = new URLSearchParams(location.search);
      const commitmentVuid = searchParams.get('commitment');
      
      if (commitmentVuid && vuid === commitmentVuid) {
        // This is a commitment VUID, fetch the commitment first to get the project
        console.log('ProjectBreadcrumb: Fetching commitment to get project:', commitmentVuid);
        const commitmentResponse = await axios.get(`${baseURL}/api/project-commitments`);
        const commitment = commitmentResponse.data.find(c => c.vuid === commitmentVuid);
        
        if (commitment && commitment.project_vuid) {
          // Now fetch the project using the project_vuid from the commitment
          const projectResponse = await axios.get(`${baseURL}/api/projects/${commitment.project_vuid}`);
          if (projectResponse.data) {
            setProject(projectResponse.data);
          }
        }
      } else {
        // This is a direct project VUID
        const response = await axios.get(`${baseURL}/api/projects/${vuid}`);
        if (response.data) {
          setProject(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching project for breadcrumb:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToProject = () => {
    if (project?.vuid) {
      navigate(`/projects/${project.vuid}`);
    }
  };

  // Don't render if no project context
  const projectVuid = getProjectVuid();
  if (!projectVuid || loading) {
    console.log('ProjectBreadcrumb: Not rendering - no project VUID or loading');
    return null;
  }

  // Don't render if we're already on the project detail page
  if (location.pathname === `/projects/${project?.vuid}`) {
    console.log('ProjectBreadcrumb: Not rendering - already on project detail page');
    return null;
  }

  console.log('ProjectBreadcrumb: Rendering breadcrumb for project:', project?.project_name);

  return (
    <div className="bg-vermillion-50 border-b border-vermillion-200 py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={handleBackToProject}
            className="flex items-center space-x-2 text-vermillion-600 hover:text-vermillion-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Project</span>
          </button>
          
          <span className="text-gray-400">|</span>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Project:</span>
            <span className="font-semibold text-gray-900">
              {project?.project_name || 'Loading...'}
            </span>
            {project?.project_number && (
              <span className="text-gray-500">
                (#{project.project_number})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectBreadcrumb;
