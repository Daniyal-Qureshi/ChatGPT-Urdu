const express = require("express");
const bodyParser = require("body-parser");
const translate = require("@iamtraction/google-translate");
const cookieParser = require("cookie-parser");
const { Configuration, OpenAIApi } = require("openai");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 5000;
const expire_date = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10);
const fs = require("fs");


require("ejs");
require("dotenv").config();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.set("views", __dirname + "/views");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


var openai = "";
var apiKey = "";

const filePath = path.join(__dirname, "public", "keys.json");
var jsonData = [];
fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  jsonData = JSON.parse(data);
});

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
    res.render("response", {
      responses: responses,
      error: "Please provide the API Key",
      data: jsonData,
    });
  }
}

app.get("/", checkAPIKey, async (req, res) => {
  res.render("response", {
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
  configuration = new Configuration({
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

      res.render("response", {
        responses: responses,
        error: "",
        data: jsonData,
      });
    }
  } catch (e) {
    const error = e.response.data.error.message || e.response.data.error.code;
    res.render("response", {
      responses: req.cookies.responses,
      error:error,
      data: jsonData,
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

app.get("/reset", (req, res) => {
  res.render("response");
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
