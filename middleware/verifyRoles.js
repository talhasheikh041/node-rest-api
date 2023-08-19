const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req?.roles) return res.sendStatus(401) // unauthorized

    console.log(allowedRoles)
    console.log(req.roles)

    const result = req.roles.some((role) => allowedRoles.includes(role))
    if (!result) return res.sendStatus(401) // unauthorized

    next()
  }
}

module.exports = verifyRoles
