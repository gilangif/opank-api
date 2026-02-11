import { Pool } from "pg"

const db = new Pool({ user: "cyborg", host: "localhost", database: "cyborg", password: "cyborg", port: 5432 })

async function test() {
  try {
    const res = await db.query("SELECT NOW()")
    
    console.log("\x1b[32m")
    console.log("# Database connected\x1b[0m")

    const query = `CREATE TABLE IF NOT EXISTS groups (
                      id SERIAL PRIMARY KEY,
                      invite VARCHAR(100) UNIQUE NOT NULL,
                      link VARCHAR(100) UNIQUE NOT NULL,
                      photo TEXT,
                      preview TEXT,
                      description TEXT,
                      subscribers VARCHAR(100),
                      photos VARCHAR(100),
                      videos VARCHAR(100),
                      files VARCHAR(100),
                      links VARCHAR(100),
                      dana TEXT[],
                      accounts TEXT[],
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );`

    const abc = await db.query(query)
  } catch (err) {
    console.log("Error:", err)
  }
}

test()

export default db
