import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import PropTypes from "prop-types";

const GraphComponent = ({ dataUrl, chartTitle = "Graph Title", chartType = "bar" }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    let chartInstance;

    const fetchDataAndCreateChart = async () => {
      try {
        // Fetch the JSON data
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Extract labels and values from the JSON data
        const labels = data.map((entry) => entry.label);
        const values = data.map((entry) => entry.value);

        // Get the canvas context
        const ctx = chartRef.current.getContext("2d");

        // Create the chart
        chartInstance = new Chart(ctx, {
          type: chartType, // Dynamic chart type
          data: {
            labels: labels,
            datasets: [
              {
                label: chartTitle,
                data: values,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
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
                font: {
                  size: 18,
                },
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Categories",
                  font: {
                    size: 14,
                  },
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Values",
                  font: {
                    size: 14,
                  },
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

    // Cleanup to destroy the chart instance on component unmount
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [dataUrl, chartTitle, chartType]); // Dependencies for re-rendering

  return (
    <div style={{ position: "relative", height: "400px", width: "100%" }}>
      <canvas ref={chartRef} />
    </div>
  );
};

GraphComponent.propTypes = {
  dataUrl: PropTypes.string.isRequired,
  chartTitle: PropTypes.string,
  chartType: PropTypes.string,
};

export default GraphComponent;
