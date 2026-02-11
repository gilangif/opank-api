import Image from "../models/Image.js"

let method = 0

class ImageController {
  static async qr(req, res, next) {
    try {
      const { fieldname, originalname, encoding, mimetype, buffer, size } = req.file || {}
      const { scale } = req.body || {}

      if (!buffer) throw { message: "buffer file is not provided", status: 400 }

      const resize = scale === "true" ? true : false

      const image = new Image(buffer)
      const result = await image.qr(resize)

      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  static async ocr(req, res, next) {
    try {
      const { fieldname, originalname, encoding, mimetype, buffer, size } = req.file || {}
      const { scale, flip, method } = req.body || {}

      if (!buffer) throw { message: "buffer file is not provided", status: 400 }

      const resize = scale === "true" ? true : false
      const flop = flip === "true" ? true : false
      const num = parseInt(method)

      if (num < 0 || num > 4) throw { message: `ocr with method ${method} not exists`, status: 400 }

      const image = new Image(buffer)
      const result = await image.ocr(resize, flop, num)

      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  static async analyze(req, res, next) {
    try {
      const { fieldname, originalname, encoding, mimetype, buffer, size } = req.file || {}
      const { scale, flip } = req.body || {}

      if (!buffer) throw { message: "buffer file is not provided", status: 400 }

      const resize = scale === "true" ? true : false
      const flop = flip === "true" ? true : false

      method = (method + 1) % 5

      const image = new Image(buffer)
      const result = await image.analyze(resize, flop, method)

      res.json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default ImageController
