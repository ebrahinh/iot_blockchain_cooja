import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global CSS styling
import App from './App';
import reportWebVitals from './reportWebVitals';

// Render the root React application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
);

// Function to measure project performance and log metrics
const measureProjectPerformance = () => {
  console.log('--- IoT Security Project Performance Metrics ---');

  const performanceData = {
    attempts: 150,          // Total login/sign-in attempts
    devicesSecured: 120,    // Number of IoT devices that were successfully secured
    securityIncidents: 20,  // Number of security incidents reported
    breachesPrevented: 15,  // Number of attempted breaches successfully blocked
    successRate: 0,         // Calculated success rate (Placeholder, calculated below)
    preventionRate: 0,      // Calculated breach prevention rate (Placeholder, calculated below)
  };

  // Calculate success rate and prevention rate
  performanceData.successRate = (
      (performanceData.devicesSecured / performanceData.attempts) *
      100
  ).toFixed(2); // Keep up to two decimal places

  performanceData.preventionRate = (
      (performanceData.breachesPrevented / performanceData.attempts) *
      100
  ).toFixed(2);

  // Log the performance data neatly for debugging or reporting
  console.log(`Total Attempts: ${performanceData.attempts}`);
  console.log(`Devices Secured: ${performanceData.devicesSecured}`);
  console.log(`Security Incidents: ${performanceData.securityIncidents}`);
  console.log(`Breaches Prevented: ${performanceData.breachesPrevented}`);
  console.log(`Success Rate (Devices Secured): ${performanceData.successRate}%`);
  console.log(`Breach Prevention Rate: ${performanceData.preventionRate}%`);

  console.log('--- End of Metrics ---');
};

// Run the performance measurement function
measureProjectPerformance();

// Optional: Report web vitals for monitoring app performance
// You can call this method with a callback function to log analytics to an endpoint or monitor performance
reportWebVitals(console.log);