import db from "../db/supabase.js"

class Group {
  static async findByInvite(invite) {
    const query = "SELECT * FROM groups WHERE invite = $1"

    const { rows, rowCount: total_rows } = await db.query(query, [invite])

    return { rows, total_rows, invite }
  }

  static async updateMarkByInvite(invite, mark) {
    const query = "UPDATE groups set mark = $1 WHERE invite = $2"

    const data = await db.query(query, [mark, invite])

    return data
  }

  static async lists(page, limit, offset, search, sort, order, filter) {
    let where = ""
    let index = 1
    let params = []

    let orders = `ORDER BY id ${order === "ASC" ? "ASC" : "DESC"}`

    if (sort === "mark") orders = `ORDER BY mark DESC`
    if (sort === "unmark") orders = `ORDER BY mark ASC`
    if (sort === "dana") orders = `ORDER BY dana DESC`

    if (filter === "restrict") {
      where = `WHERE extra NOT ILIKE '%@%'
                AND title NOT ILIKE '%bokep%'
                AND description NOT ILIKE '%bokep%'
                AND title NOT ILIKE '%xiaomi%'
                AND description NOT ILIKE '%xiaomi%'
                AND (member::int > 30 OR cardinality(dana) > 0)`
    }

    if (search && search.trim() !== "") {
      where = `WHERE invite ILIKE $${index}
                OR link ILIKE $${index}
                OR title ILIKE $${index}
                OR description ILIKE $${index}
                OR EXISTS (
                    SELECT 1 FROM unnest(dana) d
                    WHERE d ILIKE $${index}
                )`

      index++

      params.push(`%${search}%`)
    }

    const qd = `SELECT * FROM groups
                ${where}
                ${orders}
                LIMIT $${index} OFFSET $${index + 1};`

    params.push(limit, offset)

    const qr = `SELECT COUNT(*) FROM groups ${where};`

    const { rows, rowCount: total_data } = await db.query(qd, params)
    const { rows: ttl } = await db.query(qr, search ? [`%${search}%`] : [])

    const total_rows = parseInt(ttl[0].count)
    const total_pages = Math.ceil(total_rows / limit)

    const prev_page = page <= 1 ? null : page - 1
    const next_page = page >= total_pages ? null : page + 1

    const obj = { page, prev_page, next_page, total_pages, total_rows, total_data, rows }

    if (sort) obj.sort = sort
    if (order) obj.order = order
    if (search) obj.search = search

    return obj
  }
}

export default Group
