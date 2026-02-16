import db from "../db/supabase.js"

class Group {
  static async lists(page, limit, offset, search) {
    let where = ""
    let index = 1
    let params = []

    if (search && search.trim() !== "") {
      where = `WHERE invite ILIKE $${index}
                OR link ILIKE $${index}
                OR title ILIKE $${index}
                OR description ILIKE $${index}`
      index++

      params.push(`%${search}%`)
    }

    const qd = `SELECT * FROM groups
                ${where}
                ORDER BY id ASC
                LIMIT $${index} OFFSET $${index + 1};`

    params.push(limit, offset)

    const qr = `SELECT COUNT(*) FROM groups ${where};`

    const { rows, rowCount: total_data } = await db.query(qd, params)
    const { rows: ttl } = await db.query(qr, search ? [`%${search}%`] : [])

    const total_rows = parseInt(ttl[0].count)
    const total_pages = Math.ceil(total_rows / limit)

    const prev_page = page <= 1 ? null : page - 1
    const next_page = page >= total_pages ? null : page + 1

    return { page, prev_page, next_page, total_pages, total_rows, total_data, rows }
  }
}

export default Group
