const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name:{type:String},
    email:{type:String},
    password:{type:String},
    photo:{type:String},
    createdAt:{type: Date, default:new Date()},
    updatedAt:{type: Date, default:new Date()}
})

module.exports = mongoose.model("user",userSchema)