//jshint esversion:6

const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");

const app = express();
var gListTitle;

// this is required for lodash
app.locals._ = _;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({

  extended: true
}));

app.use(express.static("public"));

// create and/or connect to todolistDB
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// create new list schema
const itemSchema = new mongoose.Schema({
  name: String
});

// create a model based on schema
const Item = mongoose.model("Item", itemSchema);

// create new documents based on model
const item1 = new Item({
  name: "Welcome to TodoList."
});

const item2 = new Item({
  name: "Click the + button to add an item."
});

const item3 = new Item({
  name: "<-- Click this to delete an item."
});

// group the items into an array
const defaultItems = [item1, item2, item3];


// update one record
// Item.updateOne({_id: "5f49075b64f624163cae8088"}, {name: "<-- Click this to delete an item."}, function(err){
//   if(err){
//     console.log(err);
//   } else {
//     console.log("Successfully updated record.");
//   }
// });


const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/:customListName", function(req, res) {

  const customListName = req.params.customListName;

  List.findOne({name: customListName}, async function(err, found) {

    if(!err) {
      if(!found) {

        console.log("Does not exist.");

        const list = new List({
          name: customListName,
          items: defaultItems
        });

        await list.save();
        await res.redirect("/" + customListName);

      } else {

        console.log("Record exist.");

        res.render("list", {
          listTitle: found.name,
          newListItems: found.items
        });
      }
    }
  });
});


app.get("/", function(req, res) {

  gListTitle = "Today";

  // const day = date.getDate();

  // get item records from database, use callback by
  // using the result inside the asynchronous function
  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {

      // insert default records to database
      // if database is empty
      Item.insertMany(defaultItems, function(err) {

        if (err) {

          console.log(err);

        } else {

          console.log("Successfully added items to database.");

        }
      });

      res.redirect("/");

    } else {

      if (err) {

        console.log(err);

      } else {

        res.render("list", {

          listTitle: gListTitle,
          newListItems: foundItems

        });
      }
    }
  });
});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // save entered item into database
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {

    List.findOne({name: listName}, async function(err, found) {
      await found.items.push(item);
      await found.save();
      await res.redirect("/" + listName);
    });
  }
});


// app.post("/work", function(req, res) {
//
//   const item = req.body.newItem;
//
//   const workItem = new Work({
//     name: item
//   });
//
//   workItem.save();
//   res.redirect("/work");
// });


app.post("/delete", function(req, res) {


  console.log(req.body.checkbox);
  console.log(req.body.listName);

  const listTitle = req.body.listName;

  List.findOne({name: req.body.listName}, async function(err, res) {
    console.log(err);
    console.log(res);
    res.items.pull(req.body.checkbox);
    await res.save();
  });

  res.redirect("/" + listTitle);

});


app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
