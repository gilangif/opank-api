import { upload } from "../middleware/index.js"


import ImageController from "../controllers/ImageController.js"

import ParserController from "../controllers/ParserController.js"
import express from "express"

const router = express.Router()

router.post("/image/qr", upload.single("image"), ImageController.qr)
router.post("/image/ocr", upload.single("image"), ImageController.ocr)
router.post("/image/analyze", upload.single("image"), ImageController.analyze)


router.post("/parser/unshortlink", ParserController.unshortlink)

export default router
