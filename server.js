require("dotenv").config()
const express = require("express")
const path = require("path")
const cors = require("cors")
const corsOptions = require("./config/corsOptions")
const { logger } = require("./middleware/logEvents")
const errorLogger = require("./middleware/errorHandler")
const verifyJWT = require("./middleware/verifyJWT")
const credentials = require("./middleware/credentials")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const connectDB = require("./config/dbConn")

const app = express()
const PORT = process.env.PORT || 3500

// Connect to MongoDB
connectDB()

// custom middleware
app.use(logger)

// Handle options credentials check - before CORS!
// and fetch cookies cerdentials requirement
app.use(credentials)

// cross origin resource sharing
// without corsOptions everyone can access it.
app.use(cors(corsOptions))

// built-in middleware to handle urlencoded data
// in other words, form data:
// 'content-type: application/x-www-form-urlencoded'
app.use(express.urlencoded({ extended: false }))

// built-in middleware for json
app.use(express.json())

// middleware for cookies
app.use(cookieParser())

// serve static files
app.use(express.static(path.join(__dirname, "/public")))

// routes
app.use("/", require("./routes/root"))
app.use("/register", require("./routes/register"))
app.use("/auth", require("./routes/auth"))
app.use("/refresh", require("./routes/refresh"))
app.use("/logout", require("./routes/logout"))

app.use(verifyJWT)
app.use("/employees", require("./routes/api/employees"))
app.use("/users", require("./routes/api/users"))

// default route for handling 404
app.all("*", (req, res) => {
  res.status(404)
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"))
  } else if (req.accepts("json")) {
    res.json({ error: "404 not found" })
  } else {
    res.type("txt").send("404 not found")
  }
})

app.use(errorLogger)

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB")
  app.listen(PORT, () => console.log(`Server running on ${PORT}`))
})
