import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import PropTypes from "prop-types";

const GraphComponent = ({ dataUrl, chartTitle = "Graph Title", chartType = "bar" }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    let chartInstance;

    const fetchDataAndCreateChart = async () => {
      try {
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const data = await response.json();

        const labels = data.cor.map((entry) => entry.label); // Mapping `cor` array from JSON
        const successValues = data.cor.map((entry) => entry.success);
        const failureValues = data.cor.map((entry) => entry.failures);

        const ctx = chartRef.current.getContext("2d");

        chartInstance = new Chart(ctx, {
          type: chartType,
          data: {
            labels: labels,
            datasets: [
              {
                label: "Successful Connections",
                data: successValues,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
              {
                label: "Failed Connections",
                data: failureValues,
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: true,
                text: chartTitle,
                font: { size: 18 },
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Attempts",
                  font: { size: 14 },
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Counts",
                  font: { size: 14 },
                },
                beginAtZero: true,
              },
            },
          },
        });
      } catch (error) {
        console.error("Error fetching or parsing data:", error);
      }
    };

    fetchDataAndCreateChart();

    // Cleanup on unmount
    return () => {
      if (chartInstance) chartInstance.destroy();
    };
  }, [dataUrl, chartTitle, chartType]);

  return (
      <div style={{ position: "relative", height: "400px", width: "100%" }}>
        <canvas ref={chartRef} />
      </div>
  );
};

GraphComponent.propTypes = {
  dataUrl: PropTypes.string.isRequired,
  chartTitle: PropTypes.string,
  chartType: PropTypes.oneOf(["bar", "line", "scatter", "pie", "doughnut"]), // Supported chart types
};

export default GraphComponent;