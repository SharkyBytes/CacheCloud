import { useState } from 'react';
import Dashboard from './components/Dashboard';
import JobsPage from './components/JobsPage';
import AdminPage from './components/AdminPage';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('jobs');
  
  // Navigation handler
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };
  
  // Render content based on current page
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'jobs':
        return <JobsPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <JobsPage />;
    }
  };
  
  return (
    <div className="App">
      <header className="app-header">
        <h1>E6Data Execution Platform</h1>
        <nav className="main-nav">
          <ul>
            <li>
              <button 
                className={currentPage === 'jobs' ? 'active' : ''}
                onClick={() => handleNavigation('jobs')}
              >
                Jobs
              </button>
            </li>
            <li>
              <button 
                className={currentPage === 'dashboard' ? 'active' : ''}
                onClick={() => handleNavigation('dashboard')}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={currentPage === 'admin' ? 'active' : ''}
                onClick={() => handleNavigation('admin')}
              >
                Admin
              </button>
            </li>
          </ul>
        </nav>
      </header>
      
      <main className="app-content">
        {renderContent()}
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 E6Data Platform</p>
      </footer>
    </div>
  );
}