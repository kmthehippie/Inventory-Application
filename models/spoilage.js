const mongoose = require ("mongoose")
const Schema = mongoose.Schema
const { DateTime } = require('luxon')


const SpoilageSchema = new Schema({
    fruitInstance: { type: Schema.Types.ObjectId, ref: "FruitInstance"},
    amount: {type: Number, required:true},
    date: {type: Date, required: true, default: Date.now},
    imgurls: {type: [String] }
})

SpoilageSchema.virtual("url").get(function(){
    return `/catalog/spoilage/${this._id}`
})

SpoilageSchema.virtual("spoilage_date_formatted").get(function(){
    return DateTime.fromJSDate(this.date).toLocaleString(DateTime.DATE_MED)
})

module.exports = mongoose.model("Spoilage", SpoilageSchema)