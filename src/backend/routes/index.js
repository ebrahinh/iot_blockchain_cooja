const express = require("express");
const router = express.Router();

// Import the controller functions
const {
  getComp1,
  getComp2,
  getComp3,
  getComp4,
  getComp5,
} = require("../controller/module");

// Define routes for each component
router.get("/comp1", getComp1);
router.get("/comp2", getComp2);
router.get("/comp3", getComp3);
router.get("/comp4", getComp4);
router.get("/comp5", getComp5);

// Example: Add a dynamic route for specific components
router.get("/comp/:id", async (req, res) => {
  const { id } = req.params;
  try {
    switch (id) {
      case "1":
        await getComp1(req, res);
        break;
      case "2":
        await getComp2(req, res);
        break;
      case "3":
        await getComp3(req, res);
        break;
      case "4":
        await getComp4(req, res);
        break;
      case "5":
        await getComp5(req, res);
        break;
      default:
        res.status(404).json({ error: "Component not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add route for checking API health (optional)
router.get("/health", (req, res) => {
  res.status(200).json({ status: "API is up and running!" });
});

// Export the router module
module.exports = router;
