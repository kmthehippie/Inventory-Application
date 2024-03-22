#! /usr/bin/env node

// Get arguments passed on command line
const userArgs = process.argv.slice(2);

const Fruit = require("./models/fruit");
const Category = require("./models/category");
const FruitInstance = require("./models/fruitinstance");
const Sale = require("./models/sale");
const Spoilage = require("./models/spoilage");

const fruits = [];
const categories = [];
const fruitinstances = [];
const sales = [];
const spoilages = [];

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));
async function main() {
  console.log("Debug: About to connect");
  await mongoose.connect(mongoDB);
  console.log("Debug: Should be connected?");
  await createCategories();
  await createFruits();
  await createFruitInstances();
  await createSales();
  await createSpoilages();
  console.log("Debug: Closing mongoose");
  mongoose.connection.close();
}

// We pass the index to the ...Create functions so that, for example,
// genre[0] will always be the Fantasy genre, regardless of the order
// in which the elements of promise.all's argument complete.
async function categoryCreate(index, name) {
  const category = new Category({ name: name });
  await category.save();
  categories[index] = category;
  console.log(`Added category: ${name}`);
}

async function fruitCreate(index, name, origin, desc, category) {
  const fruitdetail = { name: name, origin: origin,};
  if (desc != false) fruitdetail.description = desc;
  if (category != false) fruitdetail.category = category;
  const fruit = new Fruit(fruitdetail);
  await fruit.save();
  fruits[index] = fruit;
  console.log(`Added fruit: ${name} ${origin}`);
}

async function fruitInstanceCreate(index, fruitId, arrival, quantitytype, size, purchaseprice, quantityIn, spoilages, sales) {
  try{
    const fruitinstancedetail = { 
      fruit: fruitId,
      quantitytype: quantitytype,
      size: size,
      arrival: arrival,
      stock: {quantityIn: quantityIn}
    };
 

  if (purchaseprice != false) fruitinstancedetail.purchaseprice = purchaseprice;
  if (spoilages != false) fruitinstancedetail.spoilages = spoilages;
  if (sales != false) fruitinstancedetail.sales = sales;
  const fruitinstance = new FruitInstance(fruitinstancedetail);

  await fruitinstance.save();
  fruitinstances[index] = fruitinstance;

  console.log(`Added fruitinstance: ${size}${quantitytype}`);

  } catch (e) {
    console.error("Error creating sale:", e)
    throw e
  }
}

async function saleCreate(index, fruitInstance, amount, date, price) {
  try {
    const saleData = {
      fruitInstance: fruitInstance,
      amount: amount,
      date: new Date(date),
      price: price
    }; 
    const sale = new Sale(saleData);
    fruitInstance.stock.sales.push(sale._id); // Add sale ID to stock.sales array
    fruitInstance.stock.salesQtt.push(sale.amount); // Add sale amount to stock.sales array
    // Save the sale and fruitInstance documents
    await Promise.all([sale.save(), fruitInstance.save()]);

  } catch (err) {
    console.error("Error creating sale:", err);
    throw err;
  }
}

async function spoilageCreate(index, fruitInstance, amount, date, imgurls) {
  try {
    const spoilageData = {
      fruitInstance: fruitInstance,
      amount: amount,
      date: new Date(date),
    }; 
    if (imgurls && imgurls.length > 0) spoilageData.imgurls = imgurls;

    const spoilage = new Spoilage(spoilageData)
    fruitInstance.stock.spoilages.push(spoilage._id); // Add spoilage ID to stock.spoilages array
    fruitInstance.stock.spoilagesQtt.push(spoilage.amount); // Add spoilage amount to stock.sales array


   // Save the sale and fruitInstance documents
   await Promise.all([spoilage.save(), fruitInstance.save()]);

  } catch (err) {
    console.error("Error creating spoilage:", err);
    throw err;
  }
}

async function createCategories() {
  console.log("Adding categories");
  await Promise.all([
    categoryCreate(0, "Red Apple"),
    categoryCreate(1, "Green Apple"),
    categoryCreate(2, "Green Grape"),
    categoryCreate(3, "Red Grape"),
    categoryCreate(4, "Black Grape"),
    categoryCreate(5, "Orange"),
  ]);
}

// index, name, origin, desc, categor
async function createFruits() {
  console.log("Adding fruits");
  await Promise.all([
    fruitCreate(0, "Envy Apple", "USA", "Crisp and sweet red apples that has a small kick of tartness at the end.", categories[0]),
    fruitCreate(1, "Naval Orange","USA", "Sweet, meaty eating oranges.", categories[5]),
    fruitCreate(2, "Autumn Crisp Green Grapes", "USA", "Crispy, seedless and super sweet green grapes.", categories[2]),
    fruitCreate(3, "Granny Smith Green Apples", "South Africa", "Fragrant and crisp green apples. Great for juicing and eating in your favorite rojak.", categories[1]),
    fruitCreate(4, "Crimson Red Seedless", "USA", "Sweet and plump seedless grapes.", categories[3]),
  ]);
}
//function fruitInstanceCreate(index, fruit, arrival, quantitytype, size, purchaseprice, quantityIn, spoilages, sales)
async function createFruitInstances() {
  console.log("Adding Fruit Instance");
  await Promise.all([
    fruitInstanceCreate(0,
      fruits[0]._id,
      "2024-02-02",
      "Pcs",
      24,
      300.00,
      30, spoilages[0], sales[0]
    ),
    fruitInstanceCreate(1,
        fruits[1]._id,
        "2024-02-03",
        "Pcs",
        64,
        180.00, 
        20, spoilages[1], sales[1]
    ),
    fruitInstanceCreate(2,
        fruits[2]._id,
        "2024-02-04",
        "g",
        10,
        280.00,
        30, spoilages[2], false
    ),
    fruitInstanceCreate(3,
        fruits[3]._id,
        "2024-02-05",
        "Pcs",
        120,
        130.00,
        40, false, false
    ),
    fruitInstanceCreate(4,
        fruits[4]._id,
        "2024-02-06",
        "g",
        10,
        230.00,
        30, false, false
    ),
    fruitInstanceCreate(5,
        fruits[0]._id,
        "2024-02-07",
        "Pcs",
        48,
        280.00,
        20, spoilages[3], false
    ),
    fruitInstanceCreate(6,
        fruits[1]._id,
        "2024-02-08",
        "Pcs",
        120,
        150.00,
        30, false, sales[2]
    ),
  ]);
}

//saleCreate(index, amount, date, price)
async function createSales() {
    console.log("Creating sale");
    await Promise.all([
      saleCreate(0, fruitinstances[0], 1, "2024-03-03", 20),
      saleCreate(1, fruitinstances[1], 1, "2024-03-03", 30),
      saleCreate(2, fruitinstances[6], 232, "2024-03-03", 40),
    ]);
}

//spoilageCreate(index, amount, date, imgurl)
async function createSpoilages() {
  console.log("Creating Spoilage");
  await Promise.all([
      spoilageCreate(0, fruitinstances[0], 2, "2024-03-03", ["https://placehold.co/600x400", "https://placehold.co/600x400", "https://placehold.co/600x400"]),
      spoilageCreate(1, fruitinstances[1], 2, "2024-03-03", ["https://placehold.co/600x400","https://placehold.co/600x400"]),
      spoilageCreate(2, fruitinstances[2], 300, "2024-03-03", ["https://placehold.co/600x400", "https://placehold.co/600x400", "https://placehold.co/600x400"]),
      spoilageCreate(3, fruitinstances[5], 422, "2024-03-03", ["https://placehold.co/600x400"]),
  ]);

  // Introduce a delay before creating the next spoilage
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create the next spoilage
  await spoilageCreate(4, fruitinstances[5], 222, "2024-03-04", false);
}