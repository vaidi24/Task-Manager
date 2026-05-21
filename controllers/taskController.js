const pool = require("../config/db");


// GET ALL TASKS

const getTasks = async (req, res) => {

    try {

        const userId = req.user.id;

        const result = await pool.query(
            `
            SELECT *
            FROM tasks
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [userId]
        );

        res.json(result.rows);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// GET SINGLE TASK

const getTaskById = async (req, res) => {

    try {

        const userId = req.user.id;

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM tasks
            WHERE id = $1
            AND user_id = $2
            `,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// CREATE TASK

const createTask = async (req, res) => {

    try {

        const userId = req.user.id;

        const {
            title,
            description
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO tasks
            (
                user_id,
                title,
                description
            )
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [
                userId,
                title,
                description
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// UPDATE TASK

const updateTask = async (req, res) => {

    try {

        const userId = req.user.id;

        const { id } = req.params;

        const {
            title,
            description,
            status
        } = req.body;

        const result = await pool.query(
            `
            UPDATE tasks
            SET
                title = $1,
                description = $2,
                status = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            AND user_id = $5
            RETURNING *
            `,
            [
                title,
                description,
                status,
                id,
                userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



// DELETE TASK

const deleteTask = async (req, res) => {

    try {

        const userId = req.user.id;

        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM tasks
            WHERE id = $1
            AND user_id = $2
            RETURNING *
            `,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task deleted"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};