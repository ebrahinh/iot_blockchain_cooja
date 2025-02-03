import React, { useState, useEffect } from 'react';
import Sidebar from './side_bar';
import BarChart from './bar.js';
import ScatterChart from './scatter.js';
import axios from 'axios';
import './module1.css';

const apiUrl = 'http://localhost:5000/api/module/comp5';
const org5 = 'd163123d-5e7e-4ec6-972c-a9a7620c789b';

const Module5 = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: ' ',
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
            'X-Api-Key': org5,
          },
        });

        const data = response.data;
        console.log(data);

        setChartData({
          labels: data.map((entry) => `Attempt ${entry.attempt}`),
          datasets: [
            {
              label: 'Breaches Prevented vs Security Incidents',
              data: data.map((entry) => entry.breachesPrevented),
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

    const intervalId = setInterval(fetchData, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div id="mod" className="dashboard no-scroll-required">
      <Sidebar />
      <div className="chart-container">
        <div className="chart">
          <BarChart
            chartData={chartData}
            text="Breaches Prevented vs Security Incidents"
          />
        </div>
      </div>
    </div>
  );
};

export default Module5;
