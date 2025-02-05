import React from "react";
import { Line } from "react-chartjs-2";
import PropTypes from "prop-types";

const LineChart = ({ dataset, title = "IoT Performance" }) => {
  const chartData = {
    labels: dataset.map((entry) => entry.label),
    datasets: [
      {
        label: "Successful Connections",
        data: dataset.map((entry) => entry.success),
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.2,
      },
      {
        label: "Failed Connections",
        data: dataset.map((entry) => entry.failures),
        borderColor: "rgba(255, 99, 132, 1)",
        tension: 0.2,
      },
    ],
  };

  const options = {
    plugins: {
      title: { display: !!title, text: title },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: "Attempts" } },
      y: { beginAtZero: true, title: { display: true, text: "Values" } },
    },
  };

  return (
      <div style={{ maxWidth: "800px", margin: "20px auto" }}>
        <Line data={chartData} options={options} />
      </div>
  );
};

LineChart.propTypes = {
  dataset: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        success: PropTypes.number.isRequired,
        failures: PropTypes.number.isRequired,
      })
  ),
  title: PropTypes.string,
};

export default LineChart;