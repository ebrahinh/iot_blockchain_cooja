import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Sidebar and Components
import Sidebar from "./side_bar";
import BarChart from "./bar";
import LineChart from "./line";
import ChartComponent from "./chart";
import ScatterChart from "./scatter"; // ✅ Added ScatterChart Import

// Modules
import Module1 from "./module1";
import Module2 from "./module2";
import Module3 from "./module3";
import Module4 from "./module4";
import Module5 from "./module5";

// Data source
import Data from "./data";

function App() {
  // ✅ Bar Chart Data
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

  // ✅ Line Chart Data
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
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* App Routes */}
        <Routes>
          {/* Default Dashboard Route */}
          <Route
            path="/"
            element={
              <div>
                <h1>IoT Security Dashboard</h1>
                <ChartComponent />
              </div>
            }
          />
          {/* Bar Chart Route */}
          <Route
            path="/bar"
            element={
              <div>
                <h1>Bar Chart: Devices Secured</h1>
                <BarChart chartData={barChartData} title="Devices Secured Per Attempt" />
              </div>
            }
          />
          {/* Line Chart Route */}
          <Route
            path="/line"
            element={
              <div>
                <h1>Line Chart: Security Incidents</h1>
                <LineChart chartData={lineChartData} title="Security Incidents Per Attempt" />
              </div>
            }
          />
          {/* Scatter Chart Route ✅ Added */}
          <Route
            path="/scatter"
            element={
              <div>
                <h1>Scatter Chart: IoT Device Locations</h1>
                <ScatterChart />
              </div>
            }
          />
          {/* Module Routes */}
          <Route path="/module1" element={<Module1 />} />
          <Route path="/module2" element={<Module2 />} />
          <Route path="/module3" element={<Module3 />} />
          <Route path="/module4" element={<Module4 />} />
          <Route path="/module5" element={<Module5 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
