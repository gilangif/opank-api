import Group from "../models/Group.js"

class GroupController {
  static async getLists(req, res, next) {
    try {
      const { page = 1, limit = 50, search = "", sort, order = "DESC", filter = "all" } = req.query

      const p = parseInt(page)
      const l = parseInt(limit)

      const data = await Group.lists(p, l, search, sort, order, filter)

      res.json(data)
    } catch (error) {
      next(error)
    }
  }

  static async edit(req, res, next) {
    try {
      const { invite, mark } = req.body

      if (mark === null || mark === undefined) throw { message: "mark is not provided", status: 400 }
      if (typeof mark !== "boolean") throw { message: "type of mark must be boolean", status: 400 }
      if (!invite) throw { message: "invite is not provided", status: 400 }

      const data = await Group.findByInvite(invite)

      const { title, mark: marker } = data.rows[0]

      if (data.total_rows < 1) throw { message: `group with invite code '${invite}' not exists`, status: 400 }
      if (marker === mark) throw { message: `group '${title}' already ${mark ? "marked" : "unmark"}`, status: 400 }

      await Group.updateMarkByInvite(invite, mark)

      const message = `group '${title}' ${mark ? "marked" : "unmarked"}`

      res.json({ ...data, mark, message })
    } catch (error) {
      next(error)
    }
  }
}

export default GroupController
