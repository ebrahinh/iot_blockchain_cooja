/**
 * This file measures and logs web performance metrics.
 * It also supports logging custom latency metrics, such as blockchain latency,
 * API response times, and other IoT-specific metrics for this project.
 */

const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Web Vitals Metrics
      getCLS(onPerfEntry); // Measures visual stability
      getFID(onPerfEntry); // Measures input latency
      getFCP(onPerfEntry); // Measures when content first appears
      getLCP(onPerfEntry); // Measures largest visible content
      getTTFB(onPerfEntry); // Measures server response time
    });

    // Custom metrics: Blockchain and API latencies
    recordCustomMetrics(onPerfEntry);
  }
};

/**
 * Records project-specific custom metrics.
 * Example: Blockchain transaction time, API latency, or other IoT-related data.
 */
const recordCustomMetrics = async (onPerfEntry) => {
  try {
    // Simulating blockchain or API latency recording
    const blockchainLatency = await measureBlockchainLatency();
    const apiLatency = await measureApiLatency();

    // Pass custom metrics to the callback
    onPerfEntry({
      name: "blockchain-latency",
      value: blockchainLatency,
    });
    onPerfEntry({
      name: "api-latency",
      value: apiLatency,
    });
  } catch (error) {
    console.error("Error recording custom metrics:", error);
  }
};

/**
 * Mock function to simulate measuring blockchain transaction latency.
 * Replace this with the actual implementation for blockchain latency tracking.
 */
const measureBlockchainLatency = async () => {
  const start = performance.now();
  // Simulated delay (replace with actual blockchain transaction code)
  await new Promise((resolve) => setTimeout(resolve, 500));
  const end = performance.now();
  return end - start; // Return latency in milliseconds
};

/**
 * Mock function to simulate measuring API response latency.
 * Replace this with the actual implementation for API latency tracking.
 */
const measureApiLatency = async () => {
  const start = performance.now();
  // Example: Replace with an actual API request
  await fetch("https://jsonplaceholder.typicode.com/posts/1");
  const end = performance.now();
  return end - start; // Return latency in milliseconds
};

/**
 * Usage:
 * Pass a callback function to log or process performance metrics.
 * Example: 
 * 
 * import reportWebVitals from './reportWebVitals';
 * 
 * reportWebVitals(console.log);
 */

export default reportWebVitals;
