import React, { useState, useEffect } from 'react';
import Sidebar from './side_bar';
import BarChart from './bar';
import ScatterChart from './scatter';
import axios from 'axios';
import './module1.css'; // Import the consistent styles you already have

// Backend API configuration (assumes a single endpoint returning all sensor data categories)
const apiUrl = 'http://localhost:5000/api/sensors'; // Adjust if multiple endpoints are used
const apiKey = 'd163123d-5e7e-4ec6-972c-a9a7620c789b';

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({}); // Stores all sensor categories
  const [loading, setLoading] = useState(true); // Tracks loading state
  const [error, setError] = useState(null); // For error handling

  // Fetch Data for all sensors
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
        });

        const data = response.data;

        console.log('Fetched Sensor Data:', data);

        // Assuming `data` contains categories like: integrity, security, network, breaches
        setSensorData({
          integrity: {
            labels: data.integrity.map((entry) => `Attempt ${entry.attempt}`),
            datasets: [
              {
                label: 'Integrity Status',
                data: data.integrity.map((entry) => entry.metric),
                backgroundColor: '#50AF95',
                borderColor: '#24a148',
                borderWidth: 2,
              },
            ],
          },
          security: {
            labels: data.security.map((entry) => `Session ${entry.session}`),
            datasets: [
              {
                label: 'Security Breaches Prevented',
                data: data.security.map((entry) => entry.breachesPrevented),
                backgroundColor: '#f3ba2f',
                borderColor: '#d1a531',
                borderWidth: 2,
              },
            ],
          },
          network: {
            datasets: [
              {
                label: 'Network Metrics',
                data: data.network.map((entry) => ({
                  x: entry.latency,
                  y: entry.throughput,
                })),
                backgroundColor: '#2a71d0',
                borderWidth: 1,
              },
            ],
          },
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching sensor data:', err);
        setError('Unable to fetch sensor data. Please try again later.');
        setLoading(false);
      }
    };

    fetchSensorData();

    // Poll every 5 seconds for real-time updates
    const intervalId = setInterval(fetchSensorData, 5000);

    // Cleanup to prevent memory leaks
    return () => clearInterval(intervalId);
  }, []);

  return (
      <div id="mod" className="dashboard">
        {/* Sidebar for navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="chart-container">
          {loading ? (
              <div className="info-container">Loading sensor data...</div>
          ) : error ? (
              <div className="info-container">{error}</div>
          ) : (
              <>
                {/* Integrity Chart */}
                <div className="chart">
                  <BarChart
                      chartData={sensorData.integrity}
                      text="Integrity Metrics Over Time"
                  />
                </div>

                {/* Security Chart */}
                <div className="chart">
                  <BarChart
                      chartData={sensorData.security}
                      text="Security Breaches Prevented"
                  />
                </div>

                {/* Network Scatter Chart */}
                <div className="chart">
                  <ScatterChart
                      chartData={sensorData.network}
                      text="Network: Latency vs Throughput"
                  />
                </div>
              </>
          )}
        </div>
      </div>
  );
};

export default Dashboard;