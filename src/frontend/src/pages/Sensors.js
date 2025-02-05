import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import BarChart from "./BarChart";
import ScatterChart from "./ScatterChart";
import LineChart from "./LineChart";
import axios from "axios";
import "./sensor.module.css"; // Modular CSS for sensors layout

const apiUrl = "http://localhost:5000/api/sensors/data"; // Backend endpoint for sensors
const apiKey = "2239567a-35e5-48bf-9853-e7fac6e16e13"; // Ensure this matches your API configuration

const Sensors = () => {
  const [sensorsData, setSensorsData] = useState([]); // Complete raw sensor data
  const [barChartData, setBarChartData] = useState({ labels: [], datasets: [] });
  const [lineChartData, setLineChartData] = useState({ labels: [], datasets: [] });
  const [availabilityData, setAvailabilityData] = useState({ labels: [], datasets: [] }); // Mobility/Availability tracking

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Fetch data from the Cooja simulation backend
        const response = await axios.get(apiUrl, {
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
        });

        const data = response.data;
        console.log("Sensor Data:", data); // Debugging and validation

        // Process and map data for specific sensors
        const labels = data.map(({ sensorType }) => sensorType); // e.g., ["Integrity", "Network Security", "Availability", "Mobility", ...]
        const integrityMetrics = data.map(({ integrityLevel }) => integrityLevel); // Custom field for Integrity Sensor
        const networkSecurityMetrics = data.map(({ securityIncidents }) => securityIncidents); // Security incidents for each sensor
        const availabilityMetrics = data.map(({ availability }) => availability); // Availability metric percentages
        const mobilityMetrics = data.map(({ mobilityRate }) => mobilityRate); // Custom field for tracking mobility rates

        // Bar Chart: Integrity Levels vs. Sensor
        setBarChartData({
          labels,
          datasets: [
            {
              label: "Integrity Levels",
              data: integrityMetrics,
              backgroundColor: [
                "rgba(75,192,192,1)",
                "#e74c3c",
                "#8e44ad",
                "#3498db",
                "#2ecc71",
              ],
              borderColor: "black",
              borderWidth: 1,
            },
          ],
        });

        // Line Chart: Security Incidents vs. Sensor
        setLineChartData({
          labels,
          datasets: [
            {
              label: "Security Incidents",
              data: networkSecurityMetrics,
              borderColor: "rgba(255, 99, 132, 1)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderWidth: 2,
              tension: 0.4,
            },
          ],
        });

        // Mobility/Availability Chart: Dynamic tracking
        setAvailabilityData({
          labels,
          datasets: [
            {
              label: "Availability %",
              data: availabilityMetrics,
              backgroundColor: "rgba(75,192,192,0.6)",
              borderColor: "rgba(75,192,192,1)",
              borderWidth: 2,
            },
            {
              label: "Mobility Impact Rate",
              data: mobilityMetrics,
              backgroundColor: "rgba(255,206,86,0.6)",
              borderColor: "rgba(255,206,86,1)",
              borderWidth: 2,
            },
          ],
        });

        // Store raw sensor data
        setSensorsData(data);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    // Initial fetch
    fetchSensorData();

    // Real-time updates every 5 seconds (Polling interval)
    const intervalId = setInterval(fetchSensorData, 5000);

    return () => clearInterval(intervalId); // Cleanup interval
  }, []);

  return (
      <div className="dashboard">
        <Sidebar /> {/* Sidebar for navigation */}
        <div className="chart-container">
          <div className="chart">
            <BarChart
                dataset={barChartData.datasets[0]?.data}
                title="Integrity Levels by Sensor"
            />
          </div>
          <div className="chart">
            <LineChart
                dataset={lineChartData.datasets[0]?.data}
                title="Security Incidents by Sensor"
            />
          </div>
          <div className="chart">
            <ScatterChart
                data={sensorsData.map(({ location }) => ({ x: location.x, y: location.y }))}
                title="Sensor Locations and Mobility"
            />
          </div>
          <div className="chart">
            <LineChart
                dataset={availabilityData.datasets}
                title="Availability & Mobility Impact"
            />
          </div>
        </div>
      </div>
  );
};

export default Sensors;