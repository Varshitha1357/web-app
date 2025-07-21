const express = require('express')
const app = express()
const port = 3000
const request = require("request");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const bcrypt = require("bcrypt");
const saltRounds = 10;

var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

app.get('/weather', (req, res) => {
  res.render("signup_login");
})

app.get('/signupsubmit', (req, res) => {
  const name = req.query.name;
  const email = req.query.email;
  const pwd = req.query.pwd;

  bcrypt.hash(pwd, saltRounds, (err, hash) => {
    if (err) {
      console.error("Error hashing password:", err);
      res.status(500).send("Something went wrong!");
      return;
    }

    db.collection("users")
      .add({
        name: name,
        email: email,
        password: hash,
      })
      .then(() => {
        res.render("signup_login");
      });
  });
});


app.get('/locsubmit', (req, res) => {
  res.render("weather");
});

app.get('/logfail', (req, res) => {
  res.render("signup_login");
});


app.get('/signinsubmit', (req, res) => {
  const email = req.query.email;
  const password = req.query.pwd;
  db.collection("users")
     .where("email", "==", email)
.get()
.then((docs) => {
  if (docs.size > 0) {
    const user = docs.docs[0].data();
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        res.render("weather");
      } else {
        res.render("loginfail");
      }
    });
  } else {
    res.render("loginfail");
  }
});
   
});
app.get('/weathersubmit', (req, res) => {
  const location = req.query.location;
  const apiKey = "b0a92187735e44908ed55833251807";

  request(
    `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}&aqi=no`,
    function (error, response, body) {
      const data = JSON.parse(body);
      if (data.error) {
        return res.render("weather"); // show weather form again on error
      } else {
        const {
          region,
          country,
          localtime
        } = data.location;

        const {
          temp_c,
          temp_f,
          condition,
          wind_kph,
          humidity,
          feelslike_c,
          feelslike_f
        } = data.current;

        const icon = "https:" + condition.icon;

        res.render("location", {
          location,
          region,
          country,
          loctime: localtime,
          temp_c,
          temp_f,
          icon,
          wind_kph,
          humi: humidity,
          feels_c: feelslike_c,
          feels_f: feelslike_f,
          condition: condition.text,
        });
      }
    }
  );
});

   
app.get('/', (req, res) => {
  res.redirect('/weather');
});

app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

app.listen(port, () => {
  console.log(`know my weather app ${port}`);
});

