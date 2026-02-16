import db from "../db/supabase.js"

export default async function saveGroup(group) {
  try {
    const { invite, link, thumb, preview, title, extra, description, subscribers, photos, videos, files, links, dana } = group

    const query = `INSERT INTO groups 
                    (invite, link, title, thumb, preview, extra, description, subscribers, photos, videos, files, links, dana, accounts, mark)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                  RETURNING *;`

    const accounts = []
    const mark = false

    const values = [invite, link, title, thumb, preview, extra, description, subscribers, photos, videos, files, links, dana, accounts, mark]

    const { rows } = await db.query(query, values)

    console.log(`\x1b[90m`)
    console.log(`# save group : ${group.link}\x1b[0m`)
  } catch (error) {
    if (error.code && error.code == 23505) {
      console.log(`\x1b[31m`)
      console.log(`# save group : ${group.link} (duplicate)\x1b[0m`)
    } else {
      console.log(`\x1b[31m`)
      console.error(error)
      console.log(`\x1b[0m`)
    }
  }
}
