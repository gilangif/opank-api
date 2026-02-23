import { Pool } from "pg"

const db = new Pool({ user: "cyborg", host: "159.89.202.146", database: "cyborg", password: "cyborg", port: 5432 })
// const db = new Pool({ user: "cyborg", host: "localhost", database: "cyborg", password: "cyborg", port: 5432 })

export default db
