import pm2 from "pm2"
import os from "os"
import fs from "fs"

async function getSwapInfo() {
  if (os.platform() !== "linux") return { total: 0, free: 0, used: 0, percentage: 0 }

  const meminfo = await fs.promises.readFile("/proc/meminfo", "utf8")
  const lines = meminfo.split("\n")

  let total = 0
  let free = 0

  for (const line of lines) {
    if (line.startsWith("SwapTotal:")) {
      total = parseInt(line.replace(/\D+/g, "")) / 1024
    } else if (line.startsWith("SwapFree:")) {
      free = parseInt(line.replace(/\D+/g, "")) / 1024
    }
  }

  const used = total - free
  const percentage = (used / total) * 100

  return { total, free, used, percentage }
}

function getCPUS() {
  return os.cpus().map(({ model, speed, times }) => {
    const { user, nice, sys, idle, irq } = times

    return { model, speed, idle, total: Object.values(times).reduce((a, b) => a + b, 0) }
  })
}

function getCPUSCore() {
  return new Promise((resolve) => {
    const s = getCPUS()

    setTimeout(() => {
      const e = getCPUS()

      const coreUsed = e.map((end, i) => {
        const start = s[i]

        const idle = end.idle - start.idle
        const total = end.total - start.total
        const used = (1 - idle / total) * 100

        return { model: end.model, speed: end.speed, used }
      })

      resolve(coreUsed)
    }, 1000)
  })
}

function usedMem() {
  const totalmem = os.totalmem()
  const freemem = os.freemem()

  const usage = totalmem - freemem

  const percentage = (usage / totalmem) * 100
  const used = usage / 1024 / 1024
  const total = totalmem / 1024 / 1024

  return { percentage, used, total }
}

class MonitorController {
  static async control(req, res, next) {
    try {
      const { id, action } = req.body || {}

      const actions = ["restart", "stop", "delete"]

      if (!id) throw { message: "id is not provided", status: 400 }
      if (!action) throw { message: "action is not provided", status: 400 }

      if (!actions.includes(action)) throw { message: `invalid action type`, status: 400 }

      pm2.connect((err) => {
        if (err) return next({ status: 400, message: "failed connect pm2" })

        pm2.list((err, list) => {
          if (err) {
            pm2.disconnect()
            return next({ status: 400, message: `failed getting pm2 lists` })
          }

          const pm2lists = list.map((proc) => ({ id: proc.pm_id, pid: proc.pid, name: proc.name, status: proc.pm2_env.status, used: proc.monit.memory / 1024 / 1024 }))
          const find = list.find((proc) => proc.pm_id == id)

          if (!find) {
            pm2.disconnect()
            return next({ status: 400, message: `pm2 process with id ${id} not exists` })
          }

          if (action === "restart") {
            pm2.restart(id, (err, proc) => {
              pm2.disconnect()

              if (err) return next({ status: 400, message: `failed restart pm2 process with id ${id}` })

              const lists = pm2lists.map((x) => (x.id == id ? { ...x, status: "online" } : x))

              const data = {
                id: proc[0].pm_id,
                pid: proc[0].pid,
                name: proc[0].name,
                status: proc[0].pm2_env.status,
                message: `success restart pm2 process with id ${id}`,
                lists,
              }

              res.status(200).json(data)
            })
          }

          if (action === "stop") {
            pm2.stop(id, (err, proc) => {
              pm2.disconnect()

              if (err) return next({ status: 400, message: `failed stop pm2 process with id ${id}` })

              const lists = pm2lists.map((x) => (x.id == id ? { ...x, status: "stopped" } : x))

              const data = {
                id: proc[0].pm_id,
                pid: proc[0].pid,
                name: proc[0].name,
                status: proc[0].pm2_env.status,
                message: `success stop pm2 process with id ${id}`,
                lists,
              }

              res.status(200).json(data)
            })
          }

          if (action === "delete") {
            const lists = pm2lists.filter((x) => x.id != id)

            pm2.stop(id, (err, proc) => {
              pm2.disconnect()

              if (err) return next({ status: 400, message: `failed delete pm2 process with id ${id}` })

              res.status(200).json({ message: `pm2 process with id ${id} deleted`, lists })
            })
          }
        })
      })
    } catch (error) {
      next(error)
    }
  }

  static async detail(req, res, next) {
    try {
      const memory = usedMem()
      const cpus = await getCPUSCore()

      const lists = await new Promise((resolve) => {
        pm2.connect((err) => {
          if (err) return resolve([])

          pm2.list((err, list) => {
            if (err) {
              pm2.disconnect()
              return resolve([])
            }

            const result = list.map((proc) => ({
              id: proc.pm_id,
              pid: proc.pid,
              name: proc.name,
              status: proc.pm2_env.status,
              used: proc.monit.memory / 1024 / 1024,
            }))

            pm2.disconnect()
            return resolve(result)
          })
        })
      })

      const swap = await getSwapInfo()
      const platform = os.platform()

      res.status(200).json({ platform, memory, cpus, swap, lists })
    } catch (error) {
      next(error)
    }
  }
}

export default MonitorController
