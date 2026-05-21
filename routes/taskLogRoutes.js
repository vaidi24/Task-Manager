const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    startTask,
    pauseTask,
    resumeTask,
    completeTask,
    getTaskLogs
} = require("../controllers/taskLogController");



router.post(
    "/:id/start",
    authMiddleware,
    startTask
);

router.post(
    "/:id/pause",
    authMiddleware,
    pauseTask
);

router.post(
    "/:id/resume",
    authMiddleware,
    resumeTask
);

router.post(
    "/:id/done",
    authMiddleware,
    completeTask
);

router.get(
    "/:id/logs",
    authMiddleware,
    getTaskLogs
);



module.exports = router;