const mongoose = require ("mongoose")
const Schema = mongoose.Schema

const minLength = 3
const CategorySchema = new Schema({
    name: {type: String,
    minLength: minLength,
    required: true,
    }
})

CategorySchema.virtual("url").get(function(){
    return `/catalog/category/${this._id}`
})


module.exports = mongoose.model("Category", CategorySchema)