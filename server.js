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
let suffix =1

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
app.get("/exercise-tracker", function (req, res) {
  res.sendFile(__dirname + '/views/exercise-tracker.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
 
  res.json({greeting: 'hello API'});
});

app.get("/api/",(req,res)=>{
  let timeNow = new Date()
  res.json({unix:timeNow.getTime(),utc:timeNow.toUTCString()})
})

//function exercise-tracker
/*var ExerciseFccB = mongoose.model("ExerciseFccB",new mongoose.Schema({
  description:String,
  duration:Number,
  date:String
}))

var UserFccB = mongoose.model("UserFccB",new mongoose.Schema({
  username:String,
  count:Number,
  log:[ExerciseFccB]
}))*/
let exerciseSchema = new mongoose.Schema({
  description:String,
  duration:Number,
  date:String
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  count:Number,
  log: [exerciseSchema]
})

let User = mongoose.model('User', userSchema)
let Exercise = mongoose.model('Exercise', exerciseSchema)

//app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
//create user
app.post("/api/users",(req,res)=>{
let user = req.body.username
 let newUserFccB = new User({
   username:user,
   count:suffix++
 })
 newUserFccB.save((err,doc)=>{
if(err) return console.error(err)

 })
 res.json({
   "username":newUserFccB.username,
   "_id":newUserFccB.id  
})
})

//get user

app.get("/api/users",(req,res)=>{
  User.find({}).exec((err,data)=>{
    if(err) return console.error(err)
    res.json(data)
  })
})
//Add exercises

app.post("/api/users/:_id/exercises",(req,res)=>{

  let reqId = req.params._id
  let rDescription = req.body.description
  let rDuration = req.body.duration
  let rDate = req.body.date
  if(rDate === ''){
    rDate = new Date().toDateString()
  }

let newExerciseFccB = new Exercise({
  description:rDescription,
  duration:rDuration,
  date:new Date(rDate).toDateString()
})

  User.findByIdAndUpdate(reqId,{  
    $push: {log: newExerciseFccB}
  },{new:true},(err,data)=>{
      if(err) return console.log(err)
      let obj = {}
      obj["_id"] = data.id
      obj["username"] = data.username
      obj["date"] = new Date(newExerciseFccB.date).toDateString()
      obj["duration"] = parseInt(newExerciseFccB.duration)
      obj["description"] = newExerciseFccB.description
      res.json(obj)
  })
})
//You can make a GET request to /api/users/:_id/logs to retrieve a full
// exercise log of any user.
app.get("/api/users/:_id/logs",async(req,res)=>{
  if(req.params._id){
    await User.findById(req.params._id,(err,result)=>{
    if(!err){
      let responseObj={}
      responseObj["_id"]=result._id
      responseObj["username"]=result.username
      responseObj["count"]=result.log.length
      
      if(req.query.limit){
        responseObj["log"]=result.log.slice(0,req.query.limit)
      }else{
        responseObj["log"]=result.log.map(log=>({
        description:log.description,
        duration:log.duration,
        date:new Date(log.date).toDateString()
      }))
      }
      if(req.query.from||req.query.to){
        let fromDate=new Date(0)
        let toDate=new Date()
        if(req.query.from){
          fromDate=new Date(req.query.from)
        }
        if(req.query.to){
          toDate=new Date(req.query.to)
        }
        fromDate=fromDate.getTime()
        toDate=toDate.getTime()
        responseObj["log"]=result.log.filter((session)=>{
          let sessionDate=new Date(session.date).getTime()

          return sessionDate>=fromDate&&sessionDate<=toDate
        })
      }
      res.json(responseObj)
    }else{
      res.json({err:err})
    }
  })
  }else{
    res.json({user:"user not found with this id"})
  }
})
/*
app.get("/api/users/:_id/logs",(req,res)=>{
  let reqId = req.params._id
  User.findById(reqId,(err,data)=>{
    if(!err){
      let resultData = data
    
    if(req.query.from||req.query.to){
      let fromDate = new Date(0)
      let toDate = new Date()

      if(req.query.from){
        fromDate=new Date(req.query.from)
      }
      if(req.query.to){
        toDate = new Date(req.query.to)
      }

      fromDate = fromDate.getTime()
      toDate = toDate.getTime()

      resultData.log = resultData.log.filter((dateFilter)=>{
        let sessionDateFilter = new Date(dateFilter.date).getTime()
        let resutlDate = sessionDateFilter >= fromDate && sessionDateFilter <= toDate
        return new Date(resutlDate).toDateString()
      })
    }
    if(req.query.limit){
      resultData.log = resultData.log.slice(0,req.query.limit)
    }


  
    /*const log= resultData.log.map((l)=>({
      description:l.description,
      duration:l.duration,
      date:new Date(l.date).toDateString()
    }))
  
    
 
 res.json({username:data.username,
              _id:reqId,
              count:resultData.count,
              log:log

            })
  }
  })


})

*/
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
    

    //console.log(req)
  
    let newUrl = new ShortUrl({
      shortUrl : suffix ++,
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

app.get("/api/shorturl/:short_url",(req,res)=>{
  let shortUrl = req.params.short_url
  ShortUrl.findOne({"shortUrl":shortUrl},(err,result)=>{
    if(! err && result !=undefined){
      res.redirect(result.originalUrl)
    }else{
      res.json({error: 'URL Does Not Exist'})
    }
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
