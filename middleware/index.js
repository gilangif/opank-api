import multer from "multer"

export const err = (err, req, res, next) => {
  try {
    console.error("ERROR:", err?.message || err)

    if (err?.stack) {
      console.error(err.stack)
    }

    res.status(500).json({
      message: err?.message || "Internal Server Error",
    })
  } catch (error) {
    console.log("📢[:68]: ", error)

    return res.send("error")
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Image format only !"))),
})
