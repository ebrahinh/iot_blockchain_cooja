import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

// Function to measure project performance based on attempts
const measureProjectPerformance = () => {
  console.log('--- IoT Security Project Performance Metrics ---');

  const performanceData = {
    attempts: 150, // Total attempts made
    devicesSecured: 120, // Number of devices secured
    securityIncidents: 20, // Security incidents that occurred
    breachesPrevented: 15, // Breaches that were successfully prevented
    successRate: null, // Success rate of securing devices
    preventionRate: null, // Rate of breach prevention
  };

  // Calculate success and prevention rates
  performanceData.successRate = (
    (performanceData.devicesSecured / performanceData.attempts) *
    100
  ).toFixed(2);

  performanceData.preventionRate = (
    (performanceData.breachesPrevented / performanceData.attempts) *
    100
  ).toFixed(2);

  // Log metrics to the console
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

// Pass a function to log results or send to an analytics endpoint
reportWebVitals(console.log);
