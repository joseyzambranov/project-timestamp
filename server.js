// server.js
// where your node app starts

// init project
require('dotenv').config();
const shortid = require('shortid');
var bodyParser = require("body-parser")
var express = require('express');
var mongo = require("mongodb")
var mongoose = require("mongoose")
var app = express();
var port = process.env.PORT || 3000
var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
var regex = new RegExp(expression)

mongoose.connect(process.env.MONGO_URI)


// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/parser-header", function (req, res) {
  res.sendFile(__dirname + '/views/parser-header.html');
});
app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + '/views/timestamp.html');
});

app.get("/urlshortener", function (req, res) {
  res.sendFile(__dirname + '/views/urlshortener.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
 
  res.json({greeting: 'hello API'});
});

app.get("/api/",(req,res)=>{
  let timeNow = new Date()
  res.json({unix:timeNow.getTime(),utc:timeNow.toUTCString()})
})

//function urlshortener
var ShortUrl = mongoose.model("ShortUrl",new mongoose.Schema({
  shortUrl : Number,
  originalUrl : String,
  
}))
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.post("/api/shorturl",(req,res)=>{
  let urlRequest = req.body.url
  if(!urlRequest.match(regex)){
    res.json({ error: 'invalid url' })
  }else{
    let suffix =0

    //console.log(req)
  
    let newUrl = new ShortUrl({
      shortUrl : suffix +1,
    originalUrl : urlRequest,
    
    })
    newUrl.save((err,doc)=>{
  if(err) return console.error(err)
  //console.log("document inserted sucussfully!")
  
  res.json({
    
    "original_url": newUrl.originalUrl,
    "short_url": newUrl.shortUrl,
    
    })
    })
  
  
  }

})

app.get("/api/shorturl/:shortUrl",(req,res)=>{
let generateSuffix = req.params.shortUrl
ShortUrl.find({suffix:generateSuffix}).then((foundUrl)=>{
  let urlRedirect =  foundUrl[0]
  console.log(urlRedirect)
  res.redirect(urlRedirect.originalUrl)
})
  
})
// function parser header
app.get("/api/whoami",(req,res)=>{
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  res.json({
    ipaddress:ip,
    language:req.headers["accept-language"],
    software:req.headers["user-agent"]
  })
})

//funciton timestamp
app.get("/api/:date_string", function (req, res) {
  
  let dateString = req.params.date_string
  let passInValue = new Date(dateString)
  let unix = passInValue.getTime()
  let utc = passInValue.toUTCString()

  if(parseInt(dateString)>10000){
    dateInt = new Date(parseInt(dateString))

    res.json({unix:dateInt.getTime(),utc:dateInt.toUTCString()})
  }

  if(passInValue == "Invalid Date"){
    res.json({error : "Invalid Date"});
  }else{
    res.json({unix , utc});
  }
})

// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
