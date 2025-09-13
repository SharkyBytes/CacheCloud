import { useState } from 'react';
import SubmissionForm from './components/submission_form';
import JobStatus from './components/job_status';
import './App.css';

export default function App() {
  const [currentJobId, setCurrentJobId] = useState(null);
  
  // Simple routing based on state
  const renderContent = () => {
    if (currentJobId) {
      return (
        <>
          <JobStatus jobId={currentJobId} />
          <button 
            className="back-button"
            onClick={() => setCurrentJobId(null)}
          >
            Back to Submission Form
          </button>
        </>
      );
    }
    
    return (
      <SubmissionForm 
        onJobSubmitted={(jobId) => setCurrentJobId(jobId)} 
      />
    );
  };
  
  return (
    <div className="App">
      <header className="app-header">
        <h1>E6Data Execution Platform</h1>
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