const User = require("../model/User")

const handleLogout = async (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.sendStatus(204) // No content

  const refreshToken = cookies.jwt

  // Is refresh token in db?
  const foundUser = await User.findOne({ refreshToken }).exec()
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })
    return res.sendStatus(204) // No content
  }

  // Delete refresh token from database
  foundUser.refreshToken = foundUser.refreshToken.filter(
    (rT) => rT !== refreshToken
  )
  const result = await foundUser.save()

  console.log(result)

  // all the options are required except maxAge and expiresIn
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true }) // secure: true - only serves on https
  res.sendStatus(204)
}

module.exports = { handleLogout }
