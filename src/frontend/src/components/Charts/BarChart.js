import React from "react";
import { Bar } from "react-chartjs-2";
import PropTypes from "prop-types";

const BarChart = ({ dataset, title = "IoT Security Metrics" }) => {
  const chartData = {
    labels: dataset.map((entry) => entry.label),
    datasets: [
      {
        label: "Successful Connections",
        data: dataset.map((entry) => entry.success),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
      },
      {
        label: "Failed Connections",
        data: dataset.map((entry) => entry.failures),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
      },
    ],
  };

  const options = {
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: { size: 20 },
      },
      legend: { position: "top" },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Attempts",
        },
      },
      y: {
        title: {
          display: true,
          text: "Count",
        },
        beginAtZero: true,
      },
    },
  };

  return (
      <div style={{ maxWidth: "800px", margin: "20px auto" }}>
        <Bar data={chartData} options={options} />
      </div>
  );
};

BarChart.propTypes = {
  dataset: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        success: PropTypes.number.isRequired,
        failures: PropTypes.number.isRequired,
      })
  ).isRequired,
  title: PropTypes.string,
};

export default BarChart;