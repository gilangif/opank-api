import { createScheduler, createWorker } from "tesseract.js"
import { Jimp } from "jimp"

import sharp from "sharp"
import jsqr from "jsqr"
import axios from "axios"

import FormData from "form-data"

const request = axios.create({ timeout: 1 * 60 * 1000 })

class Image {
  constructor(buffer) {
    this.buffer = Buffer.from(buffer)
  }

  async qr(resize) {
    const { buffer } = this

    let image = sharp(buffer)

    if (resize) {
      const metadata = await image.metadata()

      const width = metadata.width * 2
      const height = metadata.height * 2

      image = image.resize(width, height)
    }

    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width, height } = info

    const { data: text } = jsqr(data, width, height) || {}

    return { type: "QR", text }
  }

  async ocr(resize, flip, method) {
    const { buffer } = this

    const form = new FormData()
    const filename = `${Date.now()}.jpeg`

    let ocr = ""

    const image = await Jimp.read(buffer)

    const { bitmap } = image

    if (resize) {
      const width = bitmap.width * 2
      const height = bitmap.height * 2

      image.resize({ width, height })
    }

    if (flip) image.flip({ horizontal: true, vertical: false })

    const buff = await image.getBuffer("image/png")

    if (method === 0) {
      const worker = await createWorker("eng")

      const { data } = await worker.recognize(buff)
      const { text } = data || {}

      await worker.terminate()

      ocr = text.replace(/\s/g, " ") || ""
    }

    if (method === 1) {
      try {
        form.append("file", buff, { name: "file", filename, contentType: "image/jpeg" })

        const { data } = await request.post("https://portal.vision.cognitive.azure.com/api/demo/analyze?features=read", form)
        const { readResult } = data || {}

        ocr = readResult?.blocks[0]?.lines?.map((x) => x.text).join(" ") || ""
      } catch (error) {
        console.log("\x1b[90m")
        console.log(`# Fallback : method ${method} error (${error.message || "unknown"})\x1b[0m`)

        return this.ocr(resize, flip, 0)
      }
    }

    if (method === 2) {
      try {
        const body = { imageBase64: `data:image/jpeg;base64,${buff.toString("base64")}`, languageIndex: "ENG" }

        const { data: result } = await request.post("https://app.easyscreenocr.com/api/ocr/GetBaiduOcrTextNew", body)
        const { data } = result || {}
        const { text = "" } = data || {}

        if (text.includes("You have exceeded the upload rate limit")) {
          console.log("\x1b[90m")
          console.log(`# Fallback : method ${method} exceeded rate limit\x1b[0m`)

          return this.ocr(resize, flip, 0)
        }

        ocr = text.replace(/\s/g, " ")
      } catch (error) {
        console.log("\x1b[90m")
        console.log(`# Fallback : method ${method} error (${error.message || "unknown"})\x1b[0m`)

        return this.ocr(resize, flip, 0)
      }
    }

    if (method === 3) {
      try {
        form.append("file", buff, { name: "file", filename: "blob", contentType: "image/jpeg" })

        const url = "https://translate.yandex.net/ocr/v1.1/recognize?srv=tr-image&sid=e59c3c10.67807267.f2234866.74722d696d616765&lang=*&rotate=auto&yu=9967269191736471143&yum=1736471147884554480"
        const headers = { headers: { ...form.getHeaders() } }

        const { data: result } = await request.post(url, form, headers)
        const { data } = result || {}
        const { blocks = [] } = data || {}

        ocr = blocks.map((x) => x?.boxes?.map((x) => x?.text).join(" ")).join(" ") || ""
      } catch (error) {
        console.log("\x1b[90m")
        console.log(`# Fallback : method ${method} error (${error.message || "unknown"})\x1b[0m`)

        return this.ocr(resize, flip, 0)
      }
    }

    if (method === 4) {
      try {
        form.append("image", buff, { name: "file", filename, contentType: "image/jpeg" })
        form.append("user", "d9dbf700-7f57-4767-a334-f486d65c8ab7")

        const url = "http://158.160.66.115:40000/image_to_text"
        const headers = { headers: { ...form.getHeaders() } }

        const { data } = await request.post(url, form, headers)

        ocr = data?.text?.replace(/\s/g, " ") || ""
      } catch (error) {
        console.log("\x1b[90m")
        console.log(`# Fallback : method ${method} error (${error.message || "unknown"})\x1b[0m`)

        return this.ocr(resize, flip, 0)
      }
    }

    return { type: "OCR", text: ocr.trim() }
  }

  async analyze(resize, flip, method, format) {
    const qr = await this.qr(resize, flip, method)
    if (format === "webp" || qr.text) return qr

    const ocr = await this.ocr(resize, flip, method)
    if (ocr.text) return ocr
  }
}

export default Image
