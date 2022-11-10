const express = require("express")
const mongoose = require("mongoose")
require('dotenv').config()
const bodyParser = require('body-parser')
const routes = require("./router.js")
const app = express()

app.use(express.json())
app.use('/api',routes)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.listen(3000,()=>{
    console.log(`Server started at port ${3000}`)
})

const mongoString = process.env.DATABASE

mongoose.connect(mongoString)
const database = mongoose.connection

database.on('error',(error)=>{
    console.log(error)
})

database.once('connected',()=>{
    console.log("database connected")
})