import React, { useState, useEffect, memo } from "react";
import PropTypes from "prop-types";
import BarChart from "../components/Charts/BarChart";
import LineChart from "../components/Charts/LineChart";
import ScatterChart from "../components/Charts/ScatterChart";
import { fetchSensorData } from "../api/api"; // Centralized API utilities

// Define the 5 sensors and their respective configurations
const SENSOR_ENDPOINTS = [
  { key: "integrity", endpoint: "/integrity", title: "System Integrity Over Time", chartType: BarChart },
  { key: "security", endpoint: "/security", title: "Security Metrics", chartType: LineChart },
  { key: "mobility", endpoint: "/mobility", title: "Mobility Patterns", chartType: BarChart },
  { key: "availability", endpoint: "/availability", title: "System Availability", chartType: LineChart },
  { key: "network", endpoint: "/network", title: "Network Performance", chartType: ScatterChart },
];

// Memoized Chart Components for better performance
const ChartComponents = {
  BarChart: memo(BarChart),
  LineChart: memo(LineChart),
  ScatterChart: memo(ScatterChart),
};

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all 5 sensors' data from the backend
  useEffect(() => {
    const fetchAllSensorData = async () => {
      try {
        setLoading(true);
        const fetchedData = {};
        await Promise.all(
            SENSOR_ENDPOINTS.map(async ({ key, endpoint }) => {
              const data = await fetchSensorData(endpoint);
              fetchedData[key] = data; // Store data using the key (e.g., 'integrity')
            })
        );
        setSensorData(fetchedData); // Save the data for rendering
      } catch (err) {
        console.error("Failed to load sensor data:", err.message);
        setError("Failed to load sensor data. Please check your backend or connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllSensorData();
  }, []);

  // If loading or error, display appropriate messages
  if (loading) return <div>Loading sensor data...</div>;
  if (error) return <div>{error}</div>;

  return (
      <div className="dashboard">
        <h1>IoT Dashboard</h1>
        <div className="dashboard-charts">
          {SENSOR_ENDPOINTS.map(({ key, title, chartType }, index) => {
            const ChartComponent = ChartComponents[chartType.name];
            return (
                <div key={index} className="chart-container">
                  <h2>{title}</h2>
                  <ChartComponent data={sensorData[key]} />
                </div>
            );
          })}
        </div>
      </div>
  );
};

// PropTypes for the chart components
BarChart.propTypes = {
  data: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
      })
  ).isRequired,
};

LineChart.propTypes = {
  data: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
      })
  ).isRequired,
};

ScatterChart.propTypes = {
  data: PropTypes.arrayOf(
      PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
      })
  ).isRequired,
};

export default Dashboard;