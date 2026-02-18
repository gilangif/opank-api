import cluster from "cluster"

export default function shutdown(message, data) {
  console.log(`\x1b[90m# WORKER ${cluster.worker?.id || "PRIMARY"} ${message}\x1b[0m`)

  if (data) {
    console.log("\x1b[31m")
    console.error(data)
    console.log("\x1b[0m")
  }

  if (cluster.isPrimary) {
    for (const id in cluster.workers) {
      cluster.workers[id].kill()
    }
  }

  process.exit(0)
}
