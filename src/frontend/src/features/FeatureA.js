import React, { useState, useEffect } from 'react';
import Sidebar from './side_bar';
import LineChart from './line';
import axios from 'axios';
import './module1.css';

const apiUrl = 'http://localhost:5000/api/module/comp1';
const org1 = 'ccd650ea-b2ba-4c37-ad05-9b3474992d3d';

const Module1 = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Security Incidents',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
      },
      {
        label: 'Devices Secured',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      },
    ],
  });

  const [error, setError] = useState(null); // Handle errors
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': org1,
          },
        });

        const testData = response.data;

        // Update chart data with IoT-related metrics
        setChartData({
          labels: testData.map((data, index) => `Attempt ${index + 1}`),
          datasets: [
            {
              label: 'Security Incidents',
              data: testData.map((data) => data.securityIncidents),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
            },
            {
              label: 'Devices Secured',
              data: testData.map((data) => data.devicesSecured),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
            },
          ],
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div id="mod" className="dashboard scroll-required">
      <Sidebar />
      <div className="chart-container">
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="chart">
            <LineChart
              chartData={chartData}
              text="IoT Security Metrics Per Attempt"
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'IoT Security Metrics: Incidents vs. Devices Secured',
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Attempts',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Counts',
                    },
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Module1;
