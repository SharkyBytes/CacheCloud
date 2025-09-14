export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Fetch dashboard data
 * @returns {Promise<Object>} Dashboard data
 */
export async function fetchDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/dashboard`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch dashboard data');
    }
    
    return data.dashboard;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

/**
 * Fetch system metrics
 * @returns {Promise<Object>} System metrics
 */
export async function fetchSystemMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/system`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch system metrics');
    }
    
    return data.metrics;
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    throw error;
  }
}

/**
 * Fetch job statistics
 * @returns {Promise<Object>} Job statistics
 */
export async function fetchJobStatistics() {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/jobs`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch job statistics');
    }
    
    return data.statistics;
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    throw error;
  }
}

/**
 * Fetch active jobs
 * @returns {Promise<Array>} Active jobs
 */
export async function fetchActiveJobs() {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs?status=active`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch active jobs');
    }
    
    return data.jobs || [];
  } catch (error) {
    console.error('Error fetching active jobs:', error);
    throw error;
  }
}

/**
 * Fetch job details
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job details
 */
export async function fetchJobDetails(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch job details');
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching job ${jobId} details:`, error);
    throw error;
  }
}

/**
 * Submit a job
 * @param {Object} jobData - Job data
 * @returns {Promise<Object>} Job submission response
 */
export async function submitJob(jobData) {
  try {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to submit job');
    }
    
    return data;
  } catch (error) {
    console.error('Error submitting job:', error);
    throw error;
  }
}
