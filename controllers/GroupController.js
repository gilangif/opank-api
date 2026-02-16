import Group from "../models/Group.js"

class GroupController {
  static async getLists(req, res, next) {
    try {
      const { page = 1, limit = 50, search = "", order, sort } = req.query

      const p = parseInt(page)
      const l = parseInt(limit)
      const o = (page - 1) * limit

      const data = await Group.lists(p, l, o, search)

      res.json(data)
    } catch (error) {
      next(error)
    }
  }
}

export default GroupController
