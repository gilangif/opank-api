import { upload } from "../middleware/index.js"

import ImageController from "../controllers/ImageController.js"
import GroupController from "../controllers/GroupController.js"
import ParserController from "../controllers/ParserController.js"
import MonitorController from "../controllers/MonitorController.js"

import express from "express"

const router = express.Router()

router.get("/test", (req, res) => res.send("API Work's !"))

router.post("/image/qr", upload.single("image"), ImageController.qr)
router.post("/image/ocr", upload.single("image"), ImageController.ocr)
router.post("/image/analyze", upload.single("image"), ImageController.analyze)

router.get("/groups/lists", GroupController.getLists)
router.post("/groups/edit", GroupController.edit)

router.post("/parser/unshortlink", ParserController.unshortlink)

router.get("/monitor/detail", MonitorController.detail)
router.post("/monitor/control", MonitorController.control)

export default router
