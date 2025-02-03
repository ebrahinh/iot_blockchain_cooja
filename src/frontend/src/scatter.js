import React from "react";
import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from "chart.js";

// Register required components
ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const ScatterChart = () => {
  const someData = {
    datasets: [
      {
        label: "IoT Devices",
        data: [
          { x: 10, y: 20 },
          { x: 15, y: 25 },
          { x: 20, y: 30 },
        ],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
      },
    },
  };

  return (
    <div>
      <h2>Device Location Scatter Chart</h2>
      <Scatter data={someData} options={options} />
    </div>
  );
};

export default ScatterChart;
