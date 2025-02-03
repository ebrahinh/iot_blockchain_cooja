const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const Module = require("../routes/modules"); // Adjust based on your project structure

// Load environment variables
dotenv.config({ path: "../config/config.env" });

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use("/api/module/", Module);

// Server Configuration
const PORT = process.env.PORT || 5000;
app.listen(
  PORT,
  console.log(`App running on port ${PORT}`)
);
