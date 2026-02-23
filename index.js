import { queue } from "./config/index.js"
import { err } from "./middleware/index.js"

import saveGroup from "./utils/saveGroup.js"
import shutdown from "./utils/shutdown.js"
import router from "./routes/index.js"
import db from "./db/supabase.js"

import express from "express"
import cluster from "cluster"
import cors from "cors"
import os from "os"

const cpus = os.cpus()

async function main() {
  try {
    const res = await db.query("SELECT NOW()")

    console.log("\x1b[32m")
    console.log("# Database connected")
    console.log(`  ${res?.rows[0]?.now}`)
    console.log("\x1b[0m")

    const query = `CREATE TABLE IF NOT EXISTS groups (
                      id SERIAL PRIMARY KEY,
                      invite VARCHAR(100) UNIQUE NOT NULL,
                      link VARCHAR(100) UNIQUE NOT NULL,
                      title TEXT,
                      thumb TEXT,
                      preview TEXT,
                      extra TEXT,
                      description TEXT, 
                      member INTEGER NOT NULL DEFAULT 0,
                      subscribers VARCHAR(100),
                      photos VARCHAR(100),
                      videos VARCHAR(100),
                      files VARCHAR(100),
                      links VARCHAR(100),
                      dana TEXT[],
                      accounts TEXT[],
                      mark BOOLEAN NOT NULL DEFAULT false, 
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );`

    const abc = await db.query(query)
  } catch (err) {
    console.log("Error:", err)
  }
}

if (cluster.isPrimary) {
  const groups = []
  const links = []

  for (let i = 0; i < cpus.length; i++) {
    const worker = cluster.fork()
    const worker_id = worker.id

    worker.on("message", (msg) => {
      const { id, type, url, output, invite, detail } = msg

      if (type === "FIND_LINK") {
        const output = links.find((x) => x.url === url) || null

        worker.send({ worker_id, type, id, url, output })
      }

      if (type === "SAVE_LINK") {
        if (links.length > 500) links.pop()

        console.log("\x1b[90m")
        console.log(`# SAVE LINK : ${url}`)
        console.log("\x1b[0m")

        links.unshift(output)
      }

      if (type === "FIND_GROUP") {
        const detail = groups.find((x) => x.invite === invite) || null

        worker.send({ worker_id, type, id, url, detail })
      }

      if (type === "SAVE_GROUP") {
        if (groups.length > 500) groups.pop()
        if (detail.title) saveGroup(detail)

        console.log("\x1b[90m")
        console.log(`# SAVE GROUP : ${detail.title}\x1b[0m`)

        groups.unshift(detail)
      }
    })
  }

  main()
} else {
  process.on("message", (msg) => {
    const { id, type, url, result } = msg

    const resolve = queue.get(id)

    if (resolve) {
      queue.delete(id)
      resolve(msg)
    }
  })

  const app = express()
  const port = process.env.PORT || 3003

  // app.use(cors())

  app.use(cors({ origin: true, credentials: true }))

  app.use(express.json({ limit: "200mb" }))
  app.use(express.urlencoded({ limit: "200mb", extended: true }))

  app.use(router)
  app.use(err)

  app.listen(port, () => console.log(`\x1b[36m# server listening on http://localhost:${port} (worker ${cluster.worker.id})\x1b[0m`))
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("uncaughtException", (err) => shutdown("UNCAUGHT EXCEPTION", err))
