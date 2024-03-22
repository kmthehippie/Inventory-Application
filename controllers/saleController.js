const Sale = require("../models/sale");
const FruitInstance = require("../models/fruitinstance");
const Fruit = require("../models/fruit")
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");


// Display list of all sale.
exports.sale_list = asyncHandler(async (req, res, next) => {
  const allSale = await Sale.find().sort({ date: -1 }).exec()
  
 
  if(allSale === null){
    const err = new Error("Sale not found");
    err.status = 404;
    return next(err)
  }
  res.render("sale_list", {
    title: "Sales List", 
    sale_list: allSale,
  });
});

exports.sale_detail = asyncHandler(async (req, res, next) => {
  const sale = await Sale.findById(req.params.id).exec();
  const fruitInstanceId = sale.fruitInstance;
  const fruitInstance = await FruitInstance.findById(fruitInstanceId).exec();

  if (!fruitInstance) {
    const err = new Error('Fruit instance not found');
    err.status = 404;
    return next(err);
  }

  const fruitId = fruitInstance.fruit;
  const fruit = await Fruit.findById(fruitId).exec();

  if (!fruit) {
    const err = new Error('Fruit not found');
    err.status = 404;
    return next(err);
  }

  res.render('sale_detail', {
    title: sale._id,
    sale: sale,
    fruit_instance: fruitInstance,
    fruit: fruit,
  });
  
});

// Display sale create form on GET.
exports.sale_create_get = asyncHandler(async (req, res, next) => {
  const fruitInstance = await FruitInstance.findById(req.params.id).exec()
  const fruitId = fruitInstance.fruit
  const fruit = await Fruit.findById(fruitId).exec()

   
  res.render("sale_form", {title: "Create Sale", fruit: fruit, fruit_instance: fruitInstance, sale: undefined, errors: []})
});

exports.sale_create_post = [
  // Validate id
  param("id").isMongoId().withMessage("Invalid Fruit Instance ID"),

  // Validate and sanitize fields
  body("date").isISO8601().toDate().escape(),
  body("amount")
  .isNumeric()
  .toInt()
  .custom(async (value, { req }) => {
      // Ensure amount is not greater than available quantity
      const fruitInstance = await FruitInstance.findById(req.params.id).exec();
      if (!fruitInstance) {
          throw new Error("Fruit instance not found");
      }
      if (value > fruitInstance.stock.availableQtt) {
          throw new Error("Amount cannot exceed available quantity");
      }
      return true;
  }),
  body("price").trim().escape(),

  asyncHandler(async (req, res, next) => {
      // Check for validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const fruitInstance = await FruitInstance.findById(req.params.id).exec()
        const fruitId = fruitInstance.fruit
        const fruit = await Fruit.findById(fruitId).exec()
    
        res.render("sale_form", {title: "Create Sale", fruit: fruit, fruit_instance: fruitInstance, sale: undefined, errors: errors.array()})
      } else {
          // No validation errors, proceed with saving the sale
          const fruitInstanceId = req.params.id.toString();
          const sale = new Sale({
              fruitInstance: fruitInstanceId,
              date: req.body.date,
              amount: req.body.amount,
              price: req.body.price,
      });

      try {
          // Save the sale document
          await sale.save();
          // Update FruitInstance's stock.sales array
          const fruitInstance = await FruitInstance.findById(fruitInstanceId).exec();
          if (!fruitInstance) {
              throw new Error("Fruit instance not found");
          }
          console.log("We pushed the sale id onto sales")
          fruitInstance.stock.sales.push(sale._id); // Add sale ID to stock.sales array
          fruitInstance.stock.salesQtt.push(sale.amount); // Add sale ID to stock.sales array

          await fruitInstance.save();

          // Redirect to the sale URL
          res.redirect(sale.url);
      } catch (error) {
          // Handle errors
          next(error);
      }
      }
  }),
];

// Display sale delete form on GET.
exports.sale_delete_get = asyncHandler(async (req, res, next) => {
  const sale = await Sale.findById(req.params.id).exec()
  res.render("sale_delete", { 
    title: "Delete Sale",
    sale: sale,
    })
});

// Handle sale delete on POST.
exports.sale_delete_post = asyncHandler(async (req, res, next) => {
  const fruitinstance = await FruitInstance.find({"stock.sales": req.params.id}).exec()
  await Sale.findByIdAndDelete(req.body.saleid)
  res.redirect("/catalog/fruitinstance/"+fruitinstance[0]._id)
});

// Display sale update form on GET.
exports.sale_update_get = asyncHandler(async (req, res, next) => {
  const sale = await Sale.findById(req.params.id).exec()
  const fi = await FruitInstance.find({"stock.sales": sale._id}).exec()
  const fruitInstance = fi[0]
  const fruitId = fruitInstance.fruit
  const fruit = await Fruit.findById(fruitId).exec()
  
  res.render("sale_form", {title: "Update Sale", fruit: fruit, fruit_instance: fruitInstance, sale: sale, errors: []})
});

// Handle sale update on POST.
exports.sale_update_post = [
  // Validate id
  param("id").isMongoId().withMessage("Invalid Fruit Instance ID"),

  // Validate and sanitize fields
  body("date").isISO8601().toDate().escape(),
  body("amount")
  .isNumeric()
  .toInt(),
  body("price").trim().escape(),

  asyncHandler(async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const sale = await Sale.findById(req.params.id).exec();
        const fruitInstance = await FruitInstance.findOne({"stock.sales": req.params.id}).exec();
        const fruitId = fruitInstance.fruit;
        const fruit = await Fruit.findById(fruitId).exec();

        res.render("sale_form", { title: "Update Sale", fruit: fruit, fruit_instance: fruitInstance, sale: sale, errors: errors.array() });
      } else {
        const sale = {
          fruitInstance: req.body.fruitInstanceId,
          date: req.body.date,
          amount: req.body.amount,
          price: req.body.price,
          _id: req.params.id
        };

        const updatedSale = await Sale.findByIdAndUpdate(req.params.id, sale, { new: true });

        if (!updatedSale) {
          const error = new Error("Sale not found");
          error.status = 404;
          throw error;
        }

        res.redirect(updatedSale.url);
      }
    } catch (error) {
      next(error);
    }
  })
]