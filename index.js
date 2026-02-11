import { err } from "./middleware/index.js"

import router from "./routes/index.js"

import express from "express"
import cors from "cors"

const app = express()
const port = process.env.PORT || 3003


app.use(cors())
app.use(express.json({ limit: "200mb" }))
app.use(express.urlencoded({ limit: "200mb", extended: true }))

app.use(router)
app.use(err)

app.listen(port, () => console.log(`# server listening on http://localhost:${port}`))
