const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const { sendConnectionRequest, acceptConnectionRequest,rejectConnectionRequest,cancelConnectionRequest,removeConnection,getMyConnections,getPendingRequests, getAllConnectionStatuses} = require("../controllers/connectionController");

router.get("/statuses", authMiddleware, getAllConnectionStatuses);
router.get("/requests", authMiddleware, getPendingRequests);
router.get("/", authMiddleware, getMyConnections);
router.post("/:userId", authMiddleware, sendConnectionRequest);
router.put("/:connectionId/accept", authMiddleware, acceptConnectionRequest);
router.put("/:connectionId/reject", authMiddleware, rejectConnectionRequest);
router.delete("/:connectionId/cancel", authMiddleware, cancelConnectionRequest);
router.delete("/:connectionId", authMiddleware, removeConnection);



module.exports = router;