const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const apiRoutes = require("./routes/api.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const loggerMiddleware = require("./middlewares/logger.middleware");

// Constants
const CONFIG_PATH = "./config.env";
const DEFAULT_PORT = 5000;
const APP_RUNNING_MSG = (port) => `App running on port ${port}`;

// Load environment variables
dotenv.config({ path: CONFIG_PATH });

// Initialize Express app
const app = express();
initializeMiddleware(app);

// Default Route
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "Server is running!",
        timestamp: getCurrentTimestamp(),
    });
});

// API Routes
app.use("/api/", apiRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

// Server Configuration
const PORT = process.env.PORT || DEFAULT_PORT;
const httpServer = app.listen(PORT, () =>
    console.log(APP_RUNNING_MSG(PORT))
);

// Graceful Shutdown
setupGracefulShutdown(httpServer);

module.exports = app;

// Helper Functions
function initializeMiddleware(application) {
    application.use(loggerMiddleware);
    application.use(bodyParser.json());
    application.use(bodyParser.urlencoded({ extended: true }));
    application.use(cors());
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function setupGracefulShutdown(server) {
    const gracefulShutdown = (signal) => {
        console.log(`Received ${signal}. Shutting down server...`);
        server.close(() => {
            console.log("Server closed.");
            process.exit(0);
        });
    };
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}