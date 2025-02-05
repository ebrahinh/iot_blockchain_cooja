import axios from "axios";

/**
 * API base URL (retrieved from environment variables, with a fallback to localhost)
 */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

/**
 * Create an Axios instance with default configuration
 */
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json", // Default content type
    },
});

/**
 * Utility function to handle API GET requests
 * @param {string} endpoint - The API endpoint to request
 * @returns {Promise} - Resolves with response data or throws an error
 */
const fetchData = async (endpoint) => {
    try {
        const response = await apiClient.get(endpoint);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error.message);
        throw new Error(`Failed to fetch data from ${endpoint}`);
    }
};

/**
 * Utility function to handle API POST requests
 * @param {string} endpoint - The API endpoint
 * @param {object} payload - The data to send in the POST request
 * @returns {Promise} - Resolves with response data or throws an error
 */
const postData = async (endpoint, payload) => {
    try {
        const response = await apiClient.post(endpoint, payload);
        return response.data;
    } catch (error) {
        console.error(`Error posting data to ${endpoint}:`, error.message);
        throw new Error(`Failed to post data to ${endpoint}`);
    }
};

/**
 * Fetch data for all 5 IoT Sensors
 */
export const fetchIntegrityData = () => fetchData("/integrity");
export const fetchSecurityData = () => fetchData("/security");
export const fetchMobilityData = () => fetchData("/mobility");
export const fetchAvailabilityData = () => fetchData("/availability");
export const fetchNetworkData = () => fetchData("/network");

/**
 * Retrieve all blockchain transactions
 */
export const getBlockchainTransactions = () => fetchData("/transactions");

/**
 * Post Simulation Data (e.g., results for simulations, interactions)
 * @param {string} simulationId - The simulation's unique identifier
 * @param {object} data - The simulation data to be posted
 */
export const postSimulationData = (simulationId, data) =>
    postData("/simulation", { simulationId, data });

export default apiClient;