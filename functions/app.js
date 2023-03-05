const express = require('express')
const bodyParser = require('body-parser');
const translate = require('@iamtraction/google-translate');
require('ejs')
require('dotenv').config();
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http')
const router = express.Router()


const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/store', { useNewUrlParser: true })
mongoose.set('strictQuery', true)

const {Configuration, OpenAIApi} = require('openai');
const app = express()


app.set('view engine', 'ejs')
app.use(express.static('public'))
app.set('views', __dirname + '/views')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());

const PORT = process.env.PORT || 5000
var KEY = ""

const responses = []

app.listen(PORT, ()=> "Listening")


var configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY

})

var openai = new OpenAIApi(configuration)

app.get("/",async(req,res)=>{

  res.render('index' , {responses: responses, set: req.cookies.key ? true : false })


})


app.get("/set/:key", (req,res) => {

  process.env.OPEN_AI_KEY = req.params.key;
  configuration = new Configuration({
    apiKey: process.env.OPEN_AI_KEY

  })

  console.log(configuration)
  openai = new OpenAIApi(configuration)

  res.cookie('key', req.params.key);
  res.send("Done")
})


app.post("/open", async (req,res)=> {


  try {
    if("prompt" in req.body){
      const translated = await translate(req.body.prompt, { to: 'en' })

      const prompt = translated.text+"{}"
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

      const answer =await (await translate(response.data.choices[0].text, { to: 'ur' }))
      responses.push( {
        question: req.body.prompt,
        answer:answer.text.replace(/\n/g, "<br>")

      })

      console.log(answer.text)

      res.render('index' , {responses: responses, set: req.cookies.key ? true : false })
    }
  }

  catch(e) {
    console.error(e.message)

  }

})



app.use('./netlify/functions/api',router);
module.exports.handler = serverless(app)

