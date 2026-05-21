const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const upload =
    require("../middleware/uploadMiddleware");

const {uploadAttachments,getAttachments,deleteAttachment} = require("../controllers/attachmentController");


// Upload files
router.post("/:taskId",authMiddleware,upload.array("files", 10),uploadAttachments);

// Get attachments
router.get( "/:taskId", authMiddleware, getAttachments);

// Delete attachment
router.delete( "/:id",authMiddleware, deleteAttachment);

module.exports = router;