import React, { useState, useEffect } from 'react';
import Sidebar from './side_bar';
import BarChart from './bar.js';
import LineChart from './line.js';
import axios from 'axios';
import './module1.css';

const apiUrl = 'http://localhost:5000/api/module/comp3';
const org3 = '67e3cb4a-e7fa-4ecd-bc84-36347aca1e6e';

const Module3 = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Security Incidents per Attempt',
        data: [],
        backgroundColor: [
          'rgba(75,192,192,1)',
          '#ecf0f1',
          '#50AF95',
          '#f3ba2f',
          '#2a71d0',
        ],
        borderColor: 'black',
        borderWidth: 2,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': org3,
          },
        });
        const testData = response.data;
        console.log(testData);

        setChartData({
          labels: testData.map((data) => `Attempt ${data.attempt}`),
          datasets: [
            {
              label: 'Security Incidents per Attempt',
              data: testData.map((data) => data.securityIncidents),
              backgroundColor: [
                'rgba(75,192,192,1)',
                '#ecf0f1',
                '#50AF95',
                '#f3ba2f',
                '#2a71d0',
              ],
              borderColor: 'black',
              borderWidth: 2,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 5000); // Refresh data every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div id="mod" className="dashboard scroll-required">
      <Sidebar />
      <div className="chart-container">
        <div className="chart">
          <BarChart
            chartData={chartData}
            text="Security Incidents per Attempt"
            options={{ maintainAspectRatio: false }}
          />
        </div>
      </div>
    </div>
  );
};

export default Module3;
