import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import React from "react";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const ScatterChart = ({ data, title = "IoT Device Locations" }) => {
  const chartData = {
    labels: ["IoT Devices"],
    datasets: [
      {
        label: title,
        data: data,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      x: { title: { display: true, text: "X-coordinate" } },
      y: { title: { display: true, text: "Y-coordinate" }, beginAtZero: true },
    },
  };

  return <Scatter data={chartData} options={options} />;
};

export default ScatterChart;