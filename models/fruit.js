const mongoose = require("mongoose")
const Schema = mongoose.Schema
const Category = require("../models/category")

const FruitSchema = new Schema({
    name: {type:String, required: true , maxLength:100},
    origin: {type:String, required: true, maxLength: 100},
    description: {type:String},
    category: {type: Schema.Types.ObjectId, ref: "Category"}
})

FruitSchema.virtual("url").get(function(){
    return `/catalog/fruit/${this._id}`
})

module.exports = mongoose.model("Fruit", FruitSchema)