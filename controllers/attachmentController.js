const pool = require("../config/db");

const verifyTaskOwnership =
    require("../utils/taskOwnership");

// UPLOAD ATTACHMENTS

const uploadAttachments = async (req, res) => {

    try {

        const { taskId } = req.params;

        const userId = req.user.id;


        // Verify ownership
        const task = await verifyTaskOwnership(
            taskId,
            userId
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        if (!req.files || req.files.length === 0) {

            return res.status(400).json({
                message: "No files uploaded"
            });
        }


        const uploadedFiles = [];


        for (const file of req.files) {

            const fileUrl =
                `http://localhost:5000/uploads/${file.filename}`;

            const result = await pool.query(
                `
                INSERT INTO attachments
                (
                    task_id,
                    file_name,
                    file_url,
                    file_type
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *
                `,
                [
                    taskId,
                    file.originalname,
                    fileUrl,
                    file.mimetype
                ]
            );

            uploadedFiles.push(result.rows[0]);
        }


        res.status(201).json(uploadedFiles);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};


// GET ATTACHMENTS

const getAttachments = async (req, res) => {

    try {

        const { taskId } = req.params;

        const userId = req.user.id;


        // Verify ownership
        const task = await verifyTaskOwnership(
            taskId,
            userId
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        const result = await pool.query(
            `
            SELECT *
            FROM attachments
            WHERE task_id = $1
            ORDER BY uploaded_at DESC
            `,
            [taskId]
        );


        res.json(result.rows);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE ATTACHMENT

const deleteAttachment = async (req, res) => {

    try {

        const { id } = req.params;

        const userId = req.user.id;


        // Find attachment
        const attachmentResult = await pool.query(
            `
            SELECT
                attachments.*,
                tasks.user_id
            FROM attachments
            JOIN tasks
            ON attachments.task_id = tasks.id
            WHERE attachments.id = $1
            `,
            [id]
        );


        if (attachmentResult.rows.length === 0) {

            return res.status(404).json({
                message: "Attachment not found"
            });
        }


        const attachment =
            attachmentResult.rows[0];


        // Ownership check
        if (attachment.user_id !== userId) {

            return res.status(403).json({
                message: "Unauthorized"
            });
        }


        await pool.query(
            `
            DELETE FROM attachments
            WHERE id = $1
            `,
            [id]
        );


        res.json({
            message: "Attachment deleted"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};



module.exports = {
    uploadAttachments,
    getAttachments,
    deleteAttachment
};