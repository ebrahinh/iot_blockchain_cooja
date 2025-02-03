import React, { useState, useEffect } from 'react';
import Sidebar from './side_bar';
import BarChart from './bar.js';
import ScatterChart from './scatter.js';
import LineChart from './line.js';
import axios from 'axios';
import './module1.css';

const apiUrl = 'http://localhost:5000/api/module/comp4';
const org4 = '2239567a-35e5-48bf-9853-e7fac6e16e13';

const Module4 = () => {
  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Data Comparison',
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

  const [lineChartData, setLineChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Data Trend',
        data: [],
        backgroundColor: [
          'rgba(75,192,192,1)',
          '#ecf0f1',
          '#50AF95',
          '#f3ba2f',
          '#2a71d0',
        ],
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': org4,
          },
        });

        const data = response.data;
        console.log(data);

        setBarChartData({
          labels: data.map((entry) => `Attempt ${entry.attempt}`),
          datasets: [
            {
              label: 'Devices Secured per Attempt',
              data: data.map((entry) => entry.devicesSecured),
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

        setLineChartData({
          labels: data.map((entry) => `Attempt ${entry.attempt}`),
          datasets: [
            {
              label: 'Security Incidents per Attempt',
              data: data.map((entry) => entry.securityIncidents),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 2,
              tension: 0.4,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div id="mod" className="dashboard no-scroll-required">
      <Sidebar />
      <div className="chart-container">
        <div className="chart">
          <BarChart
            chartData={barChartData}
            text="Devices Secured per Attempt"
          />
        </div>
        <div className="chart">
          <LineChart
            chartData={lineChartData}
            text="Security Incidents per Attempt"
          />
        </div>
      </div>
    </div>
  );
};

export default Module4;
