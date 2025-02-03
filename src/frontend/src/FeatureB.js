import React, { useState, useEffect } from 'react';
import Sidebar from './side_bar';
import LineChart from './line.js';
import axios from 'axios';
import './module1.css'; // Reusing styles

// API URL and Organization Key for Module2
const apiUrl = 'http://localhost:5000/api/module/comp2';
const org2 = '4bfc887b-0663-4652-a4fe-c512ecd3ef2b';

const Module2 = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: ' ',
        data: [],
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
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
            'X-Api-Key': org2,
          },
        });

        const testData = response.data;

        // Update chart data with IoT-related metrics
        setChartData({
          labels: testData.map((data, index) => `Attempt ${index + 1}`),
          datasets: [
            {
              label: 'Failed Login Attempts',
              data: testData.map((data) => data.failedAttempts),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
            },
            {
              label: 'Successful Login Attempts',
              data: testData.map((data) => data.successfulAttempts),
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

    const intervalId = setInterval(fetchData, 5000); // Refresh data every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div id="mod" className="dashboard no-scroll-required">
      <Sidebar />
      <div className="chart-container no-scroll-required">
        {loading ? (
          <p>Loading data...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="chart">
            <LineChart
              chartData={chartData}
              text="Login Attempts: Success vs. Failed"
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Login Attempts per Attempt',
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

export default Module2;
