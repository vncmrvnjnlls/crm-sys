const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getConversations,
  getConversationWithUser,
  sendCommunication,
  updateCommunication, 
  deleteCommunication,
  markCommunicationRead,
  markCommunicationsReadFromUser,
  archiveConversation,
  deleteConversation,
} = require("../controllers/communicationController");

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/communications/images"); // Ensure an "uploads" folder exists at your backend root
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.use(authMiddleware);

// Allow any authenticated user to access communication endpoints
router.get("/", getConversations);
router.get("/user/:userId", getConversationWithUser);

// 🌟 Added upload.single("file") to parse incoming FormData and populate req.file
router.post("/", upload.single("file"), sendCommunication);

// Edit and Delete Message Endpoints
router.patch("/:id", updateCommunication); // Edit message body
router.delete("/:id", deleteCommunication); // Delete message

router.patch("/user/:userId/read", markCommunicationsReadFromUser);
router.patch("/user/:userId/archive", archiveConversation);
router.delete("/user/:userId", deleteConversation);
router.patch("/:id/read", markCommunicationRead);

module.exports = router;
