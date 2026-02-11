import * as cheerio from "cheerio"
import axios from "axios"

const request = axios.create({ timeout: 1 * 30 * 1000 })

export default async function getTelegramProfile(invite) {
  const link = "https://t.me/" + invite

  const output = {
    invite,
    link,
    photo: "",
    preview: "",
    title: "",
    extra: "",
    description: "",
    subscribers: 0,
    photos: 0,
    videos: 0,
    files: 0,
    links: 0,
    dana: [],
  }

  try {
    const { data: html } = await request(link)
    const $ = cheerio.load(html)

    output.photo = $("img.tgme_page_photo_image")?.attr()?.src || ""
    output.preview = $("a.tgme_page_context_link")?.attr()?.href || ""
    output.title = $("div.tgme_page_title > span")?.text()?.trim() || ""
    output.extra = $("div.tgme_page_extra")?.text()?.trim() || ""
    output.description = $("div.tgme_page_description")?.text()?.trim() || ""

    if (output.title && output.extra !== `@${invite}` && !output.description.includes("If you have Telegram, you can contact")) {
      const { data } = await request(`https://t.me/s/${invite}?q=danakaget`)
      const $ = cheerio.load(data)

      const counter = $("span.counter_value")
        .map((_, el) => $(el).text().trim())
        .get()

      const type = $("span.counter_type")
        .map((_, el) => $(el).text().trim())
        .get()

      const info = Array.from({ length: counter.length }, (x, i) => [type[i], parseInt(counter[i] || 0)])

      const dana =
        $("div.tgme_widget_message_text.js-message_text")
          .map((_, el) => $(el).text().trim())
          .get() || []

      Object.assign(output, { dana, ...Object.fromEntries(info) })
    }

    return output
  } catch (error) {
    throw error
  }
}
