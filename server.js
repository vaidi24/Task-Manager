const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const pool = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");
const taskLogRoutes =require("./routes/taskLogRoutes");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use("/tasks", taskRoutes);
app.use("/tasks", taskLogRoutes);
// DB Connection
pool.connect()
    .then(() => {
        console.log("PostgreSQL Connected");
    })
    .catch((err) => {
        console.log(err.message);
    });


// Test Route
app.get("/", (req, res) => {
    res.json({
        message: "Task Management API Running"
    });
});


// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});