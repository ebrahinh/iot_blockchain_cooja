const express = require("express");
const router = express.Router();

// Import the controller functions
const {
  getComp1,
  getComp2,
  getComp3,
  getComp4,
  getComp5,
  handleIntegrity,
  handleSecurity,
  handleMobility,
  handleAvailability,
  handleNetwork,
  handleTransactions,
  handleSimulationData,
  handleNetworkCreate,
  handleNetworkRead,
  handleNetworkUpdate,
  handleNetworkDelete,
  handleNetworkGetAll,
} = require("../controllers/controller");

// Define constants for component handlers
const AVAILABLE_COMPONENTS = [getComp1, getComp2, getComp3, getComp4, getComp5];

// Utility function for consistent request handling
const handleRequest = async (handler, req, res, errorMessage) => {
  try {
    await handler(req, res);
  } catch (error) {
    res.status(500).json({ error: errorMessage });
  }
};

// ---- Component Routes ----
AVAILABLE_COMPONENTS.forEach((componentHandler, index) => {
  router.get(`/components/comp${index + 1}`, (req, res) => {
    handleRequest(componentHandler, req, res, `Error handling Component ${index + 1}`);
  });
});

router.get("/components/comp/:id", (req, res) => {
  const { id } = req.params;
  const componentIndex = parseInt(id, 10) - 1;

  if (isNaN(componentIndex)) {
    return res
        .status(400)
        .json({ error: "Invalid component ID. Please provide a numeric value." });
  }

  if (componentIndex >= 0 && componentIndex < AVAILABLE_COMPONENTS.length) {
    handleRequest(
        AVAILABLE_COMPONENTS[componentIndex],
        req,
        res,
        `Error handling Component ID: ${id}`
    );
  } else {
    res.status(404).json({
      error: `Component with ID ${id} not found. Available components: 1-${AVAILABLE_COMPONENTS.length}.`,
    });
  }
});

// ---- Sensor Node Routes ----
router.get("/integrity", handleIntegrity);
router.get("/security", handleSecurity);
router.get("/mobility", handleMobility);
router.get("/availability", handleAvailability);
router.get("/network", handleNetwork);

// ---- Blockchain Transactions ----
router.get("/transactions", handleTransactions);

// ---- Simulation Data Handling ----
router.post("/simulation", handleSimulationData);

// ---- Network Contract Routes ----
router.post("/network/create", (req, res) => {
  handleRequest(handleNetworkCreate, req, res, "Error creating network record.");
});
router.get("/network/read/:RID", (req, res) => {
  handleRequest(
      handleNetworkRead,
      req,
      res,
      `Error reading network record with RID: ${req.params.RID}`
  );
});
router.put("/network/update", (req, res) => {
  handleRequest(handleNetworkUpdate, req, res, "Error updating network record.");
});
router.delete("/network/delete/:RID", (req, res) => {
  handleRequest(
      handleNetworkDelete,
      req,
      res,
      `Error deleting network record with RID: ${req.params.RID}`
  );
});
router.get("/network/getAll", (req, res) => {
  handleRequest(handleNetworkGetAll, req, res, "Error retrieving all network records.");
});

// ---- API Health Check ----
router.get("/api/health", (req, res) => {
  const componentEndpoints = AVAILABLE_COMPONENTS.map((_, index) => `/components/comp${index + 1}`);
  const networkEndpoints = [
    "/network/create",
    "/network/read/:RID",
    "/network/update",
    "/network/delete/:RID",
    "/network/getAll",
  ];
  const additionalEndpoints = [
    "/components/comp/:id",
    "/integrity",
    "/security",
    "/mobility",
    "/availability",
    "/network",
    "/transactions",
    "/simulation",
    "/api/health",
  ];

  const availableEndpoints = [
    ...componentEndpoints,
    ...networkEndpoints,
    ...additionalEndpoints,
  ];

  res.status(200).json({
    status: "success",
    message: "API is up and running!",
    timestamp: new Date().toISOString(),
    availableEndpoints,
  });
});

module.exports = router;