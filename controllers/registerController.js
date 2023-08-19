const bcrypt = require("bcrypt")
const User = require("../model/User")

const handleNewUser = async (req, res) => {
  const { user, pwd } = req.body

  if (!user || !pwd)
    return res
      .status(400)
      .json({ message: "Username and password are required" })

  // check for duplicate usernames in usersDB
  const duplicate = await User.findOne({ username: user }).exec()
  if (duplicate) return res.sendStatus(409) // Conflict status code

  try {
    // encrypt the password
    const hashedPwd = await bcrypt.hash(pwd, 10)
    // create and store the new user
    const newUser = await User.create({
      username: user,
      password: hashedPwd,
    })

    console.log(newUser)

    res.status(201).json({ success: `New user ${user} created!` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  handleNewUser,
}
