import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const GraphComponent = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchDataAndCreateChart = async () => {
      try {
        const response = await fetch("/data.json"); // Ensure data.json is in the public folder
        const data = await response.json();

        const labels = data.cor.map((entry) => entry.label);
        const devicesSecured = data.cor.map((entry) => entry.devicesSecured);
        const dataBreaches = data.cor.map((entry) => entry.dataBreachesPrevented);
        const incidents = data.cor.map((entry) => entry.securityIncidents);

        const ctx = chartRef.current.getContext("2d");

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Devices Secured",
                data: devicesSecured,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
              {
                label: "Data Breaches Prevented",
                data: dataBreaches,
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
              },
              {
                label: "Security Incidents",
                data: incidents,
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: "top" },
              title: { display: true, text: "IoT Security Metrics by Month" },
            },
          },
        });
      } catch (error) {
        console.error("Error fetching or parsing data", error);
      }
    };

    fetchDataAndCreateChart();
  }, []);

  return <canvas ref={chartRef} width="400" height="200"></canvas>;
};

export default GraphComponent;
