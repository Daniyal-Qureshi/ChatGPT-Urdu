const express = require("express");
const bodyParser = require("body-parser");
const translate = require("@iamtraction/google-translate");
const cookieParser = require("cookie-parser");
const { Configuration, OpenAIApi } = require("openai");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 5000;
const expire_date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10);
const fs = require("fs").promises;
const expressLayouts = require("express-ejs-layouts");
const nodemailer = require("nodemailer");
const { error } = require("console");

require("ejs");
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "public")));
app.set("views", __dirname + "/views");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var openai = "";
var apiKey = "";
const RECIPIENT = "daniyalqureshi.cs@gmail.com";
const SUBJECT = "Urdu GPT Feedback";

const filePath = path.join(__dirname, "public", "keys.json");
var jsonData = [];

async function readJsonFile() {
  try {
    const d = await fs.readFile(filePath, "utf-8");
    jsonData = JSON.parse(d);
  } catch (err) {
    console.error(err);
  }
}

async function sendEmail(name, message, email, res) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "daniyalqureshi268@gmail.com",
      pass: "qtpniwlxhiujxnvv",
    },
  });
  transporter.sendMail(
    {
      from: email,
      to: RECIPIENT,
      subject: SUBJECT,
      text: message,
    },
    (error, info) => {
      if (error) {
        res.redirect("/contact?error=something went wrong");
      } else {
        res.redirect("/contact?notice=Your feedback has been received");
      }
    }
  );
}

readJsonFile();

function checkAPIKey(req, res, next) {
  const responses = req.cookies.responses ? req.cookies.responses : [];
  if (responses.length == 0) {
    res.cookie("responses", responses);
  }

  if (req.cookies.key) {
    apiKey = req.cookies.key;
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    openai = new OpenAIApi(configuration);
    next();
  } else {
    res.render("home", {
      responses: responses,
      error: "Please provide the API Key",
      data: jsonData,
    });
  }
}

app.get("/", checkAPIKey, async (req, res) => {
  res.render("home", {
    responses: req.cookies.responses,
    error: "",
    data: jsonData,
  });
});

app.get("/remove", (req, res) => {
  res.clearCookie("key");
  res.redirect("/");
});

app.get("/set/:key", (req, res) => {
  apiKey = req.params.key;
  const configuration = new Configuration({
    apiKey: apiKey,
  });
  openai = new OpenAIApi(configuration);
  res.cookie("key", req.params.key, { expires: expire_date, httpOnly: true });
  res.redirect("/");
});

app.post("/open", checkAPIKey, async (req, res) => {
  try {
    if ("prompt" in req.body) {
      const translated = await translate(req.body.prompt, { to: "en" });

      const prompt = translated.text + "{}";
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 4000,
        temperature: 0.0,
        top_p: 0.0,
        frequency_penalty: 0.0,
        presence_penalty: 1.0,
        stop: ["{}"],
      });

      const answer = await translate(response.data.choices[0].text, {
        to: "ur",
      });
      const responses = req.cookies.responses;

      responses.push({
        question: req.body.prompt,
        answer: answer.text.replace(/\n/g, "<br>"),
      });

      res.cookie("responses", responses, {
        expires: expire_date,
        httpOnly: true,
      });

      res.render("home", {
        responses: responses,
        error: "",
        data: jsonData,
      });
    }
  } catch (e) {
    const error = e.response.data.error.message || e.response.data.error.code;
    res.render("home", {
      responses: req.cookies.responses,
      error: error,
      data: jsonData,
    });
  }
});

app.get("/disclaimer", (req, res) => {
  res.render("disclaimer");
});

app.get("/privacy", (req, res) => {
  res.render("privacy");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact", { notice: req.query.notice, error: req.query.error });
});

app.post("/mailer", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (name && email && message) {
      sendEmail(name, message, email, res);
    } else {
      res.redirect("/contact?notice=Please provide all the fields");
    }
  } catch (e) {
    res.redirect("/contact?notice=Something went wrong");
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
