import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Sidebar Component
import Sidebar from "./components/Sidebar/Sidebar";

// Charts & Modules
import BarChart from "./components/Charts/BarChart";
import LineChart from "./components/Charts/LineChart";
import ScatterChart from "./components/Charts/ScatterChart";

// Pages/Modules
import Dashboard from "./pages/Dashboard";
import Sensors from "./pages/Sensors";
import Blockchain from "./pages/Blockchain";

// Data for Charts
import Data from "./data/data";

function App() {
  // Bar Chart Data Placeholder
  const barChartData = {
    labels: Data.map((entry) => `Attempt ${entry.attempt}`),
    datasets: [
      {
        label: "Devices Secured",
        data: Data.map((entry) => entry.devicesSecured),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Line Chart Data Placeholder
  const lineChartData = {
    labels: Data.map((entry) => `Attempt ${entry.attempt}`),
    datasets: [
      {
        label: "Security Incidents",
        data: Data.map((entry) => entry.securityIncidents),
        borderColor: "rgba(255, 99, 132, 1)",
        fill: false,
        tension: 0.2,
      },
    ],
  };

  return (
      <Router>
        <div className="App">
          {/* Sidebar for Navigation */}
          <Sidebar />

          {/* Main App Routes */}
          <Routes>
            {/* Default Route */}
            <Route
                path="/"
                element={
                  <Dashboard />
                }
            />

            {/* Bar Chart Route */}
            <Route
                path="/bar"
                element={
                  <div className="content-wrapper">
                    <h1>Bar Chart: Devices Secured</h1>
                    <BarChart chartData={barChartData} title="Devices Secured Per Attempt" />
                  </div>
                }
            />

            {/* Line Chart Route */}
            <Route
                path="/line"
                element={
                  <div className="content-wrapper">
                    <h1>Line Chart: Security Incidents</h1>
                    <LineChart chartData={lineChartData} title="Security Incidents Per Attempt" />
                  </div>
                }
            />

            {/* Scatter Chart Route */}
            <Route
                path="/scatter"
                element={
                  <div className="content-wrapper">
                    <h1>Scatter Chart: IoT Device Locations</h1>
                    <ScatterChart />
                  </div>
                }
            />

            {/* Sensors Module */}
            <Route
                path="/sensors"
                element={
                  <Sensors />
                }
            />

            {/* Blockchain Module */}
            <Route
                path="/blockchain"
                element={
                  <Blockchain />
                }
            />

            {/* Add more dynamic routes as needed */}
          </Routes>
        </div>
      </Router>
  );
}

export default App;