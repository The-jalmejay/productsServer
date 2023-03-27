let express = require("express");
let passport = require("passport");
let jwt = require("jsonwebtoken");
let JWTStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;
let app = express();
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS,PUT,PATCH, DELETE ,HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization"
  );
  res.header("Access-Control-Expose-Headers", "X-Auth-Token");

  next();
});
const port = process.env.PORT||2410;
app.use(passport.initialize());
app.listen(port, () => console.log(`Node app listeing on port ${port}`));

const { data, orders } = require("./data");

const loginData = [
  { email: "abc@gmail.com", password: "abc" },
  { email: "abcd@gmail.com", password: "abcd" },
];

const params = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: "jwtsecret23456789",
};

const jwtExpirySeconds = 30000;

let strategyAll = new JWTStrategy(params, function (token, done) {
  console.log("IN JWTStrategy", token);
  console.log(token.email);
  let user = loginData.find((e) => e.email === token.email);
  if (!user) {
    return done(null, false, { message: "Incorrect username and password" });
  } else return done(null, user);
});

passport.use(strategyAll);

app.post("/login", function (req, res) {
  let { email, password } = req.body;
  // console.log(email, password);
  let log = loginData.find((e) => e.email === email && e.password === password);
  // console.log(log);
  if (!log) {
    res.sendStatus(401);
  } else {
    let payload = { email: log.email };
    let token = jwt.sign(payload, params.secretOrKey, {
      algorithm: "HS256",
      expiresIn: jwtExpirySeconds,
    });
    res.setHeader("X-Auth-Token", token);
    let it={token:token,email:email};
    res.send(log.email);
  }
});

app.post("/register", function (req, res) {
  let { email } = req.body;
  let log = loginData.find((e) => e.email === email);
  if (!log) {
    res.status(401).send("user available ! ");
  } else {
    loginData.push(req.body);
    res.send(email);
  }
});

app.get(
  "/orders",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    console.log("In Orders");
    console.log(req.user);
    let fil = orders.filter((e) => e.email === req.user.email);
    res.send(fil);
  }
);

app.post(
  "/orders",
  passport.authenticate("jwt", { session: false }), function (req, res) {
    console.log("Post In Orders");
    console.log(req);
    let body = req.body;
    console.log(req.user);
    console.log(body);
    let maxid = orders.reduce((a, c) => (a > c.id ? a : c.id), 0);
    let neworder = { id: maxid + 1, ...body };
    orders.push(neworder);
    res.send(neworder);
  }
);

app.post("/products", function (req, res) {
  let body = req.body;
  //   console.log(req)
  console.log(body);
  let maxId = data.reduce((a, c) => (a > c.id ? a : c.id), 0);
  let newProduct = { id: maxId + 1, ...body };
  data.push(newProduct);
  res.send(newProduct);
});
app.get("/products", function (req, res) {
  let category = req.query.category;
  let arr = data;
  if (category) {
    arr = arr.filter((e) => e.category === category);
  }
  res.send(arr);
});
app.get("/products/category/:category", function (req, res) {
  let category = req.params.category;
  console.log("cat", category);
  let arr = data.filter((e) => e.category === category);
  console.log(arr);
  res.send(arr);
});

app.get("/products/:id", function (req, res) {
  let id = +req.params.id;
  let arr = data.find((e) => e.id === id);
  console.log(arr);
  res.send(arr);
});

app.put("/products/:id", function (req, res) {
  let id = +req.params.id;
  let body = req.body;
  console.log(body);
  let index = data.findIndex((e) => e.id === id);
  if (index >= 0) {
    let updatedProduct = { id: id, ...body };
    data[index] = updatedProduct;
    res.send(updatedProduct);
  } else {
    res.status(401).send("Not Found");
  }
});

app.delete("/products/:id", function (req, res) {
  let id = +req.params.id;
  console.log(id);
  let index = data.findIndex((e) => e.id === id);
  let deletedProduct = data.find((e) => e.id === id);
  if (index >= 0) {
    data.splice(index, 1);
    res.send(deletedProduct);
  } else {
    res.status(401).send("Not Found");
  }
});
