const User = require("../model/User")
const jwt = require("jsonwebtoken")

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.sendStatus(401) // unauthorized
  const refreshToken = cookies.jwt
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })

  // Detected refresh token reuse!
  const foundUser = await User.findOne({ refreshToken }).exec()
  if (!foundUser) {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.sendStatus(403) //Forbidden
        console.log("attempted refresh token reuse!!!")
        const hackedUser = await User.findOne({
          username: decoded.username,
        }).exec()
        hackedUser.refreshToken = []
        const result = await hackedUser.save()
        console.log(result)
      }
    )
    return res.sendStatus(403) // Forbidden
  }

  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rT) => rT !== refreshToken
  )

  // evaluate jwt
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        console.log("exprired refresh token")
        foundUser.refreshToken = [...newRefreshTokenArray]
        const result = await foundUser.save()
        console.log(result)
      }

      if (err || decoded.username !== foundUser.username)
        return res.sendStatus(403) // Forbidden

      const roles = Object.values(foundUser.roles)
      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles: roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1m" }
      )

      const newRefreshToken = jwt.sign(
        { username: foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      )

      // Saving refreshToken with current user
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken]
      const result = await foundUser.save()

      // Creates Secure Cookie with refresh token
      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
        secure: true,
      })

      res.json({ roles, accessToken })
    }
  )
}

module.exports = { handleRefreshToken }
