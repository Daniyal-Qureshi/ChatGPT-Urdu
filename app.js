const express = require("express");
const bodyParser = require("body-parser");
const translate = require("@iamtraction/google-translate");
require("ejs");
require("dotenv").config();
const cookieParser = require("cookie-parser");

// const mongoose = require('mongoose')
// mongoose.connect('mongodb://127.0.0.1:27017/store', { useNewUrlParser: true })
// mongoose.set('strictQuery', true)

const { Configuration, OpenAIApi } = require("openai");
const app = express();
app.set("view engine", "ejs");

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.set("views", __dirname + "/views");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

var openai = "";
var apiKey = "";

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
    res.render("index", {
      responses: responses,
      error: "Please provide the API Key",
    });
  }
}

app.get("/", checkAPIKey, async (req, res) => {
  res.render("index", {
    responses: req.cookies.responses,
    error: "",
  });
});

app.get("/remove", (req, res) => {
  res.clearCookie("key");
  res.redirect("/");
});

app.get("/set/:key", (req, res) => {
  apiKey = req.params.key;
  configuration = new Configuration({
    apiKey: apiKey,
  });
  openai = new OpenAIApi(configuration);
  res.cookie("key", req.params.key);
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

      res.cookie("responses", responses);

      res.render("index", {
        responses: responses,
        error: "",
      });
    }
  } catch (e) {
    console.log(e);
    res.render("index", {
      responses: req.cookies.responses,
      error: e.response.data.error.message,
    });
  }
});

app.get("/test/:text", async (req, res) => {
  const prompt = req.params.text + "{}";
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
  res.send(response.data.choices[0].text);
});
app.listen(PORT, () => console.log(`Listening on ${PORT}`));