const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./swagger")
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();


const { requestLogger } = require("./middleware/logger");
const locationRoutes = require("./routes/locationRoutes");
const authRoutes = require("./routes/authRoutes");
const {requireApiKey} = require("./middleware/auth");
const {dailyLimiter, burstLimiter, authLimiter} = require("./middleware/rateLimiter");


const app = express();


app.use(helmet());
app.use(cors());
app.use(express.json());


//auth route    
app.use("/api/auth", authLimiter, authRoutes);

// location route  -  api key auth + rate limiting
app.use("/api/v1", requireApiKey, requestLogger, dailyLimiter, burstLimiter, locationRoutes);

//swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// add render route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Village Location API is running 🚀",
        documentation: "https://village-location-api.onrender.com/api-docs"
    });
});



//404 error handler
app.use((req, res) => {
    res.status(404).json({
        success : false,
        errorCode : "NOT_FOUND",
        message : `Route ${req.method} ${req.path} does not exist`

    });
});


//global error handler
app.use((err ,req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({
        success : false,
        errorCode : "INTERNAL_ERROR",
        message : "An unexpected error occured"

    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ( )=> {
    console.log(`🚀 Server running on port ${PORT}`)
});