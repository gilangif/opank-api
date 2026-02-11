import db from "../db/supabase.js"

export default async function saveGroup(group) {
  try {
    const { invite, link, photo, preview, title, extra, description, subscribers, photos, videos, files, links, dana } = group

    const query = `INSERT INTO groups 
                    (invite, link, photo, preview, description, subscribers, photos, videos, files, links, dana)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                  RETURNING *;`

    const values = [invite, link, photo, preview, description, subscribers, photos, videos, files, links, dana]

    const { rows } = await db.query(query, values)

    console.log(`\x1b[90m`)
    console.log(`# save group : ${group.link}\x1b[0m`)
  } catch (error) {
    if (error.code && error.code == 23505) {
      console.log(`\x1b[31m`)
      console.log(`# save group : ${group.link} (failed cause duplicate)\x1b[0m`)
    } else {
      console.log(`\x1b[31m`)
      console.error(error)
      console.log(`\x1b[0m`)
    }
  }
}
