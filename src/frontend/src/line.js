import { Line } from "react-chartjs-2";
import PropTypes from "prop-types";

const LineChart = ({ chartData, text = "Line Chart", showLegend = false }) => {
  return (
    <div className="chart-container" style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", fontSize: "1.5rem", marginBottom: "20px" }}>
        {text}
      </h2>
      <Line
        data={chartData}
        options={{
          plugins: {
            title: {
              display: true,
              text: text,
              font: {
                size: 18,
              },
            },
            legend: {
              display: showLegend,
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
                  size: 14,
                },
              },
            },
            y: {
              grid: {
                color: "#e0e0e0",
              },
              title: {
                display: true,
                text: "Metrics",
                font: {
                  size: 14,
                },
              },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
};

LineChart.propTypes = {
  chartData: PropTypes.object.isRequired,
  text: PropTypes.string,
  showLegend: PropTypes.bool,
};

export default LineChart;
