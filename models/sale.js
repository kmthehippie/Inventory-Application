const mongoose = require ("mongoose")
const Schema = mongoose.Schema
const { DateTime } = require('luxon')

const SaleSchema = new Schema({
    fruitInstance: { type: Schema.Types.ObjectId, ref: "FruitInstance"},
    amount: {type: Number, required:true},
    date: {type: Date, required: true, default: Date.now},
    price: {type: Number, required: true,
        get: v => (v/100).toFixed(2),
        set: v => v*100}
}, { toJSON: {getters: true} })


SaleSchema.virtual("url").get(function(){
    return `/catalog/sale/${this._id}`
})

SaleSchema.virtual("sale_date_formatted").get(function(){
    return DateTime.fromJSDate(this.date).toLocaleString(DateTime.DATE_MED)
})

SaleSchema.virtual("amount_formatted").get(function(){

})

module.exports = mongoose.model("Sale", SaleSchema)