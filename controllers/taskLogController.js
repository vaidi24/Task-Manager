const pool = require("../config/db");

const verifyTaskOwnership =
    require("../utils/taskOwnership");



// START TASK

const startTask = async (req, res) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;


        // Verify ownership
        const task = await verifyTaskOwnership(
            id,
            userId
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        // Prevent invalid state
        if (task.status !== "pending") {
            return res.status(400).json({
                message: "Task already started"
            });
        }


        // Prevent duplicate active timer
        const activeLog = await pool.query(
            `
            SELECT *
            FROM task_logs
            WHERE task_id = $1
            AND ended_at IS NULL
            `,
            [id]
        );

        if (activeLog.rows.length > 0) {
            return res.status(400).json({
                message: "Task already running"
            });
        }


        // Create timer log
        await pool.query(
            `
            INSERT INTO task_logs
            (
                task_id,
                action,
                started_at
            )
            VALUES ($1, 'start', NOW())
            `,
            [id]
        );


        // Update task status
        await pool.query(
            `
            UPDATE tasks
            SET
                status = 'running',
                updated_at = NOW()
            WHERE id = $1
            `,
            [id]
        );


        res.json({
            message: "Task started"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// PAUSE TASK

const pauseTask = async (req, res) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;


        // Verify ownership
        const task = await verifyTaskOwnership(
            id,
            userId
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        // Validate state
        if (task.status !== "running") {
            return res.status(400).json({
                message: "Task is not running"
            });
        }


        // Find active timer
        const activeLog = await pool.query(
            `
            SELECT *
            FROM task_logs
            WHERE task_id = $1
            AND ended_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [id]
        );

        if (activeLog.rows.length === 0) {
            return res.status(400).json({
                message: "No active timer found"
            });
        }


        const log = activeLog.rows[0];


        // Calculate duration
        const durationResult = await pool.query(
            `
            SELECT
                EXTRACT(
                    EPOCH FROM (
                        NOW() - $1::timestamp
                    )
                ) AS seconds
            `,
            [log.started_at]
        );

        const duration =
            Math.floor(durationResult.rows[0].seconds);


        // Update timer log
        await pool.query(
            `
            UPDATE task_logs
            SET
                ended_at = NOW(),
                duration = $1,
                action = 'pause'
            WHERE id = $2
            `,
            [duration, log.id]
        );


        // Update task
        await pool.query(
            `
            UPDATE tasks
            SET
                total_time = total_time + $1,
                status = 'paused',
                updated_at = NOW()
            WHERE id = $2
            `,
            [duration, id]
        );


        res.json({
            message: "Task paused",
            duration
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// RESUME TASK

const resumeTask = async (req, res) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;


        // Verify ownership
        const task = await verifyTaskOwnership(
            id,
            userId
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        // Validate state
        if (task.status !== "paused") {
            return res.status(400).json({
                message: "Task is not paused"
            });
        }


        // Prevent duplicate timer
        const activeLog = await pool.query(
            `
            SELECT *
            FROM task_logs
            WHERE task_id = $1
            AND ended_at IS NULL
            `,
            [id]
        );

        if (activeLog.rows.length > 0) {
            return res.status(400).json({
                message: "Task already running"
            });
        }


        // Create new log
        await pool.query(
            `
            INSERT INTO task_logs
            (
                task_id,
                action,
                started_at
            )
            VALUES ($1, 'resume', NOW())
            `,
            [id]
        );


        // Update task
        await pool.query(
            `
            UPDATE tasks
            SET
                status = 'running',
                updated_at = NOW()
            WHERE id = $1
            `,
            [id]
        );


        res.json({
            message: "Task resumed"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// COMPLETE TASK

const completeTask = async (req, res) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;


        // Verify ownership
        const task = await verifyTaskOwnership(
            id,
            userId
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        // Validate state
        if (
            task.status !== "running" &&
            task.status !== "paused"
        ) {
            return res.status(400).json({
                message: "Task cannot be completed"
            });
        }


        // Find active timer
        const activeLog = await pool.query(
            `
            SELECT *
            FROM task_logs
            WHERE task_id = $1
            AND ended_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [id]
        );


        // If running, close active log
        if (activeLog.rows.length > 0) {

            const log = activeLog.rows[0];


            // Calculate duration
            const durationResult = await pool.query(
                `
                SELECT
                    EXTRACT(
                        EPOCH FROM (
                            NOW() - $1::timestamp
                        )
                    ) AS seconds
                `,
                [log.started_at]
            );

            const duration =
                Math.floor(durationResult.rows[0].seconds);


            // Update log
            await pool.query(
                `
                UPDATE task_logs
                SET
                    ended_at = NOW(),
                    duration = $1,
                    action = 'done'
                WHERE id = $2
                `,
                [duration, log.id]
            );


            // Update task time
            await pool.query(
                `
                UPDATE tasks
                SET
                    total_time = total_time + $1
                WHERE id = $2
                `,
                [duration, id]
            );
        }


        // Mark task complete
        await pool.query(
            `
            UPDATE tasks
            SET
                status = 'done',
                updated_at = NOW()
            WHERE id = $1
            `,
            [id]
        );


        res.json({
            message: "Task completed"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// GET TASK LOGS

const getTaskLogs = async (req, res) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;


        // Verify ownership
        const task = await verifyTaskOwnership(
            id,
            userId
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        const logs = await pool.query(
            `
            SELECT *
            FROM task_logs
            WHERE task_id = $1
            ORDER BY created_at DESC
            `,
            [id]
        );


        res.json(logs.rows);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



module.exports = {
    startTask,
    pauseTask,
    resumeTask,
    completeTask,
    getTaskLogs
};