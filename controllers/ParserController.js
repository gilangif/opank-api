import { groups, links } from "../config/index.js"

import getTelegramProfile from "../utils/getTelegramProfile.js"

import path from "path"
import axios from "axios"
import saveGroup from "../utils/saveGroup.js"

const request = axios.create({ timeout: 1 * 30 * 1000 })

class ParserController {
  static async unshortlink(req, res, next) {
    try {
      const { url } = req.body || {}

      if (!url) throw { message: "url is not provided", status: 400 }

      const ud = new URL(url)

      const special = ["tinyurl.com", "shorturl.at"]
      const file = ["apk", "exe", "sh", "deb", "tgz", "rar", "zip", "xz", "jpg", "jpeg", "mp4", "webm", "wav", "mp3", "flac", "aac", "amr"]

      const output = { url, text: "", status: "NOT_FOUND", cache: false }

      const search = links.find((x) => x.url === url)

      if (search) {
        output.text = search.text
        output.status = search.status + "_CACHE"
        output.cache = true
      } else if (file.find((x) => "." + x === path.extname(ud.pathname))) {
        output.status = "FILE"
      } else if (ud.hostname === "t.me") {
        const invite = ud.pathname.split("/")[1]
        const find = groups.find((x) => x.invite === invite)

        output.status = "TELEGRAM"

        if (groups.length > 1000) groups.pop()

        if (find) {
          output.text = find.dana.join("\n")
          output.cache = true
        } else {
          const detail = await getTelegramProfile(invite)

          if (detail.title) saveGroup(detail)

          output.text = detail.dana.join("\n")
          groups.unshift(detail)
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

      if (!search) links.unshift(output)
      if (links.length > 1000) links.pop()

      console.log("\x1b[90m")
      console.log(`# link : ${url} (${output.status})\x1b[0m`)

      res.status(200).json(output)
    } catch (error) {
      next(error)
    }
  }
}

export default ParserController
