const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');
const asyncHandler = require("express-async-handler");

const FruitInstanceSchema = new Schema({
    fruit: {type: Schema.Types.ObjectId, ref: "Fruit"},
    arrival: {type: Date, required: true, default: Date.now },
    quantitytype: { type: String, required: true, enum:["g", "Pcs"], default: "g"},
    size: {type: Number, required: true},
    purchaseprice: {type: Number, 
        get: v => (v/100).toFixed(2),
        set: v => v*100},
     stock: {
        quantityIn: {type: Number, required: true},
        spoilages: [{ type:Schema.Types.ObjectId, ref:"Spoilage" }],
        spoilagesQtt: [{type: Number}],
        sales: [{ type:Schema.Types.ObjectId, ref: "Sale"}],
        salesQtt: [{type: Number}],
        availableQtt: {type: Number, default: 0},
    }
}, { toJSON: { getters: true} });

FruitInstanceSchema.methods.calcAvQtt = function(salesQtt, spoilageQtt){
    let availableQtt = 0;
    if (this.quantitytype === 'g') {
        availableQtt = (this.size * 1000 * this.stock.quantityIn) - salesQtt - spoilageQtt;
    } else {
        availableQtt = (this.size * this.stock.quantityIn) - salesQtt - spoilageQtt;
    }
    return availableQtt
}

FruitInstanceSchema.pre("save", async function(next){
    try {
        let salesQuantity = 0
        let spoilagesQuantity = 0
    if(this.stock.sales.length !== 0) {
        this.stock.salesQtt.forEach(saleQ => {
            salesQuantity += saleQ
        })
    }  
    if(this.stock.spoilages.length !== 0) {
        this.stock.spoilagesQtt.forEach(spoilt => {
            spoilagesQuantity += spoilt
        })
    } 
    this.stock.availableQtt = this.calcAvQtt(salesQuantity, spoilagesQuantity)
    next()
    } catch (error) {
        console.error('Error in middleware:', error);
        next(error); // Pass error to the error handler middleware
    }
})


FruitInstanceSchema.methods.arrivalFormatted = function() {
    return DateTime.fromJSDate(this.arrival).toLocaleString(DateTime.DATE_MED);
};

FruitInstanceSchema.virtual("url").get(function() {
    return `/catalog/fruitinstance/${this._id}`;
});

FruitInstanceSchema.virtual("quantity_formatted").get(function() {
    if(this.quantitytype === "g"){
        return this.stock.availableQtt/1000 + " kg";
    } else {
        return this.stock.availableQtt + " pieces";
    }
});

FruitInstanceSchema.virtual("total_sales_spoilages").get(function() {
    // Not sure what this virtual property does, please adjust if needed
    return this.stock.spoilages;
});

module.exports = mongoose.model("FruitInstance", FruitInstanceSchema);
