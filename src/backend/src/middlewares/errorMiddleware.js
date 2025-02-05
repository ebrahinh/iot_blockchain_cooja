const errorMiddleware = (err, req, res, next) => {
  console.error(`[Error - ${new Date().toISOString()}] ${err.message}`);
  
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorMiddleware;