import { Bar } from "react-chartjs-2";
import PropTypes from "prop-types";

const BarChart = ({ data }) => {
  const chartData = {
    labels: data.map((entry) => `Attempt ${entry.attempt}`), // Use attempts as X-axis labels
    datasets: [
      {
        label: 'Devices Secured',
        data: data.map((entry) => entry.devicesSecured),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Data Breaches Prevented',
        data: data.map((entry) => entry.dataBreachesPrevented),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: "IoT Security Metrics by Attempt",
        font: {
          size: 20,
          weight: "bold",
        },
        color: "#4a4a4a",
      },
      legend: {
        display: true,
        position: "top",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Attempts",
          font: {
            size: 16,
            weight: "bold",
          },
          color: "#4a4a4a",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#333",
        },
      },
      y: {
        grid: {
          color: "#d3d3d3",
          borderDash: [5, 5],
        },
        title: {
          display: true,
          text: "Counts",
          font: {
            size: 16,
            weight: "bold",
          },
          color: "#4a4a4a",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#333",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="chart-container" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      attempt: PropTypes.number.isRequired,
      devicesSecured: PropTypes.number.isRequired,
      securityIncidents: PropTypes.number,
      dataBreachesPrevented: PropTypes.number,
    })
  ).isRequired,
};

export default BarChart;
