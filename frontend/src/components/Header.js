import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  
  // Project search state
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Fetch projects for search
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Error fetching projects for search:', error);
      }
    };

    fetchProjects();
  }, []);

  // Fuzzy search function
  const fuzzySearch = (query, projects) => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return projects.filter(project => {
      const projectName = (project.project_name || '').toLowerCase();
      const projectNumber = (project.project_number || '').toLowerCase();
      
      // Check if query matches project name or number
      return projectName.includes(searchTerm) || projectNumber.includes(searchTerm);
    }).slice(0, 8); // Limit to 8 results
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const results = fuzzySearch(query, projects);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle project selection
  const handleProjectSelect = (project) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/projects/${project.vuid}`);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  // Handle search input blur
  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const menuItems = {
    setup: {
      name: 'Setup',
      items: [
        { name: 'Integrations', path: '/integrations' },
        { name: 'GL Settings', path: '/gl-settings' },
        { name: 'WIP Settings', path: '/wip-settings' }
      ]
    },
    masterData: {
      name: 'Master Data',
      items: [
        { name: 'Cost Codes', path: '/costcodes' },
        { name: 'Cost Types', path: '/costtypes' },
        { name: 'Vendors', path: '/vendors' },
        { name: 'Customers', path: '/customers' },
        { name: 'Employees', path: '/employees' },
        { name: 'Chart of Accounts', path: '/chartofaccounts' },
        { name: 'Accounting Periods', path: '/accounting-periods' }
      ]
    },
    projects: {
      name: 'Projects',
      items: [
        { name: 'Projects', path: '/projects' },
        { name: 'Commitments', path: '/commitments' },
        { name: 'AP Invoices', path: '/ap-invoices' },
        { name: 'Labor Costs', path: '/labor-costs' },
        { name: 'Project Expenses', path: '/project-expenses' },
        { name: 'Project Billing', path: '/project-billing' },
        { name: 'Project Budgets', path: '/project-budgets' },
        { name: 'Project Contracts', path: '/project-contracts' },
        { 
          name: 'Change Orders', 
          submenu: [
            { name: 'Internal Change Orders', path: '/internal-change-orders' },
            { name: 'External Change Orders', path: '/external-change-orders' },
            { name: 'Commitment Change Orders', path: '/commitment-change-orders' }
          ]
        }
      ]
    },
    reports: {
      name: 'Reports',
      items: [
        { name: 'WIP Report', path: '/wip' },
        { name: 'Journal Entries', path: '/journal-entries' },
        { name: 'Commitments Report', path: '/commitments-report' }
      ]
    }
  };

  const handleMouseEnter = (menuKey) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setActiveDropdown(menuKey);
  };

  const handleMouseLeave = (menuKey) => {
    // Set a much longer delay before closing to make navigation very easy
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 800); // Increased from 300ms to 800ms - much more forgiving
    setHoverTimeout(timeout);
  };

  const handleDropdownMouseEnter = (menuKey) => {
    // Clear timeout when hovering over dropdown
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setActiveDropdown(menuKey);
  };

  const handleDropdownMouseLeave = () => {
    // Set much longer delay when leaving dropdown
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 800); // Increased from 300ms to 800ms - much more forgiving
    setHoverTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-vermillion-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Vermillion</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8 ml-12">
            {/* Setup Menu */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('setup')}
              onMouseLeave={() => handleMouseLeave('setup')}
            >
              <button className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/integrations') || isActive('/gl-settings') || isActive('/wip-settings')
                  ? 'text-vermillion-600 bg-vermillion-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
                {menuItems.setup.name}
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'setup' && (
                <div 
                  className="absolute top-full left-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                  onMouseEnter={() => handleDropdownMouseEnter('setup')}
                  onMouseLeave={handleDropdownMouseLeave}
                  style={{ marginTop: '-1px' }} // Eliminate gap
                >
                  {/* Larger invisible bridge to prevent accidental closing */}
                  <div className="h-4 -mt-4 bg-transparent"></div>
                  <div className="py-1">
                    {menuItems.setup.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                          isActive(item.path) ? 'bg-vermillion-50 text-vermillion-600' : ''
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Master Data Menu */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('masterData')}
              onMouseLeave={() => handleMouseLeave('masterData')}
            >
              <button className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/costcodes') || isActive('/costtypes') || isActive('/vendors') || isActive('/customers') || isActive('/employees') || isActive('/chartofaccounts') || isActive('/accounting-periods')
                  ? 'text-vermillion-600 bg-vermillion-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
                {menuItems.masterData.name}
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'masterData' && (
                <div 
                  className="absolute top-full left-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                  onMouseEnter={() => handleDropdownMouseEnter('masterData')}
                  onMouseLeave={handleDropdownMouseLeave}
                  style={{ marginTop: '-1px' }} // Eliminate gap
                >
                  {/* Larger invisible bridge to prevent accidental closing */}
                  <div className="h-4 -mt-4 bg-transparent"></div>
                  <div className="py-1">
                    {menuItems.masterData.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                          isActive(item.path) ? 'bg-vermillion-50 text-vermillion-600' : ''
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Projects Menu */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('projects')}
              onMouseLeave={() => handleMouseLeave('projects')}
            >
              <button className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/projects') || isActive('/commitments') || isActive('/ap-invoices') || isActive('/project-billing') || isActive('/project-budgets') || isActive('/project-contracts')
                  ? 'text-vermillion-600 bg-vermillion-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
                {menuItems.projects.name}
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'projects' && (
                <div 
                  className="absolute top-full left-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                  onMouseEnter={() => handleDropdownMouseEnter('projects')}
                  onMouseLeave={handleDropdownMouseLeave}
                  style={{ marginTop: '-1px' }} // Eliminate gap
                >
                  {/* Larger invisible bridge to prevent accidental closing */}
                  <div className="h-4 -mt-4 bg-transparent"></div>
                  <div className="py-1">
                    {menuItems.projects.items.map((item) => (
                      <div key={item.path || item.name} className="relative group">
                        {item.submenu ? (
                          // Item with submenu
                          <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer">
                            <span>{item.name}</span>
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            
                            {/* Submenu */}
                            <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <div className="py-1">
                                {item.submenu.map((subItem) => (
                                  <Link
                                    key={subItem.path}
                                    to={subItem.path}
                                    className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                                      isActive(subItem.path) ? 'bg-vermillion-50 text-vermillion-600' : ''
                                    }`}
                                  >
                                    {subItem.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Regular menu item
                          <Link
                            to={item.path}
                            className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                              isActive(item.path) ? 'bg-vermillion-50 text-vermillion-600' : ''
                            }`}
                          >
                            {item.name}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reports Menu */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('reports')}
              onMouseLeave={() => handleMouseLeave('reports')}
            >
              <button className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/wip')
                  ? 'text-vermillion-600 bg-vermillion-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
                {menuItems.reports.name}
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {activeDropdown === 'reports' && (
                <div 
                  className="absolute top-full left-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                  onMouseEnter={() => handleDropdownMouseEnter('reports')}
                  onMouseLeave={handleDropdownMouseLeave}
                  style={{ marginTop: '-1px' }} // Eliminate gap
                >
                  {/* Larger invisible bridge to prevent accidental closing */}
                  <div className="h-4 -mt-4 bg-transparent"></div>
                  <div className="py-1">
                    {menuItems.reports.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                          isActive(item.path) ? 'bg-vermillion-50 text-vermillion-600' : ''
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Project Search */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onKeyDown={handleSearchKeyDown}
                className="w-64 px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vermillion-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="py-1">
                  {searchResults.map((project) => (
                    <button
                      key={project.vuid}
                      onClick={() => handleProjectSelect(project)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <div className="font-medium">{project.project_name}</div>
                      <div className="text-xs text-gray-500">Project #{project.project_number}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 text-sm text-gray-500">
                  No projects found matching "{searchQuery}"
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
