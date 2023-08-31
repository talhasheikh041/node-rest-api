const User = require("../model/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const handleLogin = async (req, res) => {
  const cookies = req.cookies
  console.log(`cookie avaliable at login: ${JSON.stringify(cookies)}`)
  const { user, pwd } = req.body

  if (!user || !pwd)
    return res
      .status(400)
      .json({ message: "Username and password are required" })

  const foundUser = await User.findOne({ username: user }).exec()

  if (!foundUser) return res.sendStatus(401) // Unauthorized

  const match = await bcrypt.compare(pwd, foundUser.password)

  if (match) {
    const roles = Object.values(foundUser.roles).filter(Boolean)
    // create JWTs
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10s" }
    )
    const newRefreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    )

    let newRefreshTokenArray = !cookies.jwt
      ? foundUser.refreshToken
      : foundUser.refreshToken.filter((rT) => rT !== cookies.jwt)

    if (cookies?.jwt) {
      /*
        Scenario added here:
          1) User logs in but never uses the refresh token and logs out
          2) RT is stolen
          3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in.
      */
      const refreshToken = cookies.jwt
      const foundToken = await User.findOne({ refreshToken }).exec()

      if (!foundToken) {
        console.log("attempted refresh token reuse at login!")
        newRefreshTokenArray = []
      }

      res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true }) // secure: true - only serves on https
    }

    // Saving refreshToken with current user
    foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken]
    const result = await foundUser.save()

    console.log(result)

    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
    }) // secure: true - serves in https not on thunder client
    res.json({ roles, accessToken })
  } else {
    res.sendStatus(401)
  }
}

module.exports = { handleLogin }
