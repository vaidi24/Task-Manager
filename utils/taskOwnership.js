const pool = require("../config/db");

const verifyTaskOwnership = async (
    taskId,
    userId
) => {

    const result = await pool.query(
        `
        SELECT *
        FROM tasks
        WHERE id = $1
        AND user_id = $2
        `,
        [taskId, userId]
    );

    return result.rows[0];
};

module.exports = verifyTaskOwnership;