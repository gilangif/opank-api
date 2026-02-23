import { queue } from "../config/index.js"

import getTelegramProfile from "../utils/getTelegramProfile.js"

import path from "path"
import axios from "axios"

const request = axios.create({ timeout: 1 * 30 * 1000 })

class ParserController {
  static async unshortlink(req, res, next) {
    try {
      const { url } = req.body || {}

      if (!url) throw { message: "url is not provided", status: 400 }

      const ud = new URL(url)

      const special = ["tinyurl.com", "shorturl.at"]
      const blacklist = ["danakaget", "gopay", "shopee", "google", "github", "youtube", "youtu.be", "whatsapp", "shp.ee"]

      const file = ["apk", "exe", "sh", "deb", "tgz", "rar", "zip", "xz", "jpg", "jpeg", "mp4", "webm", "wav", "mp3", "flac", "aac", "amr"]

      const output = { url, text: "", status: "NOT_FOUND", cache: false }

      const search = await new Promise((resolve) => {
        const type = "FIND_LINK"
        const id = type + "_" + Date.now() + "_" + Math.ceil(Math.random() * 10000)

        queue.set(id, resolve)
        process.send({ id, type, url })
      })

      if (search.output) {
        const s = search.output

        output.text = s.text
        output.status = s.status + "_CACHE"
        output.cache = true
      } else if (blacklist.find((x) => url.includes(x))) {
        output.text = ""
        output.status = "BLACKLIST"
      } else if (file.find((x) => "." + x === path.extname(ud.pathname))) {
        output.status = "FILE"
      } else if (ud.hostname === "t.me") {
        const invite = ud.pathname.split("/")[1]

        const find = await new Promise((resolve) => {
          const type = "FIND_GROUP"
          const id = type + "_" + Date.now() + "_" + Math.ceil(Math.random() * 10000)

          queue.set(id, resolve)
          process.send({ id, type, url, invite })
        })

        if (find.detail) {
          const f = find.detail

          output.status = "TELEGRAM"
          output.text = `${f.title}\n\n${f.description}\n\n${f.dana.join("\n")}`
          output.cache = true
        } else {
          const detail = await getTelegramProfile(invite)

          const type = "SAVE_GROUP"
          const id = type + "_" + Date.now() + "_" + Math.ceil(Math.random() * 10000)

          output.status = "TELEGRAM"
          output.text = `${detail.title}\n\n${detail.description}\n\n${detail.dana.join("\n")}`

          process.send({ type, id, type, url, invite, detail })
        }
      } else if (special.find((x) => url.includes(x))) {
        const { data: result } = await request.post("https://unshorten.net/", new URLSearchParams({ url }))
        const { data } = result || {}

        output.status = "SHORLINK"

        output.text = data
          .filter((x) => x && x.url && x.url !== url)
          .map((x) => x.url)
          .join("\n")
      } else {
        const { data, status } = await request(url, { maxRedirects: 5, validateStatus: null, maxContentLength: 1 * 1024 * 1024, maxBodyLength: 1 * 1024 * 1024 })

        const code = [403, 404].find((x) => status !== x)

        if (code && data) {
          output.status = "HTML"
          output.text = data.trim()
        }
      }

      if (!search.output) {
        const type = "SAVE_LINK"
        const id = type + "_" + Date.now() + "_" + Math.ceil(Math.random() * 10000)

        process.send({ type, id, type, url, output })
      }

      res.status(200).json(output)
    } catch (error) {
      console.log("\x1b[36m")
      console.log(`# ERROR URL : ${req?.body?.url} (${error.message})`)
      console.log("\x1b[0m")

      next(error)
    }
  }
}

export default ParserController
