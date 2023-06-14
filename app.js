var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var flash = require("connect-flash");
var adminRouter = require("./routes/admin");
var usersRouter = require("./routes/users");
var bodyParser = require("body-parser");
var hbs = require("express-handlebars");
var app = express();

var db = require("./config/connection");
var session = require("express-session");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout",
    partialsDir: __dirname + "/views/partials/",
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "secretkey",
    cookie: { maxAge: 600000 },
  })
);
app.use(flash());

// Routes
app.use("/", usersRouter);
app.use("/admin", adminRouter);

// Handle User Error
app.use(function (req, res, next) {
  next(createError(404, "User Not Found"));
});

// Handle Admin Error
app.use("/admin", function (req, res, next) {
  next(createError(404, "Admin Not Found"));
});

// Error Handlers
app.use(function (err, req, res, next) {
  if (err.status === 404) {
    if (req.originalUrl.includes("/admin")) {
      // Admin Error
      return res.render("adminerror", { layout: false, error: err.message });
    } else {
      // User Error
      return res.render("usererror", { error: err.message });
    }
  }

  // Other errors
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
