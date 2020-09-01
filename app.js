//jshint esversion:6

const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");

const app = express();

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

// create new item schema
const itemSchema = new mongoose.Schema({
  name: String
});

// create the Item model based on the item schema
const Item = mongoose.model("Item", itemSchema);

// create new documents based on Item model
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

// create new list schema
const listSchema = {
  name: String,
  items: [itemSchema]
};

// create the List model based off the listSchema
const List = mongoose.model("List", listSchema);


app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, async function(err, found) {

    if (!err) {
      if (!found) {

        console.log("Does not exist.");

        const list = new List({
          name: customListName,
          items: defaultItems
        });

        await list.save();
        res.redirect("/" + customListName);

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

  defaultTitle = "Today";

  // const day = date.getDate();

  // get item records from database, use callback by
  // using the result inside the asynchronous function
  Item.find({}, async function(err, found) {

    if (found.length === 0) {

      // insert default records to database
      // if database is empty
      Item.insertMany(defaultItems, function(err) {

        if (err) {

          console.log(err);

        } else {

          console.log("Successfully added items to database.");

        }
      });

      await res.redirect("/");

    } else {

      if (err) {

        console.log(err);

      } else {

        res.render("list", {

          listTitle: defaultTitle,
          newListItems: found
        });
      }
    }
  });
});


app.post("/", async function(req, res) {

  const itemName = _.capitalize(req.body.newItem);
  const listName = _.capitalize(req.body.list);

  // save entered item into database
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {

    List.findOne({
      name: listName
    }, async function(err, found) {
      found.items.push(item);
      await found.save();

    });

    res.redirect("/" + listName);

  }
});


app.post("/delete", function(req, res) {

  console.log(req.body.checkbox);
  console.log(req.body.listName);
  const itemID = req.body.checkbox;
  const listName = req.body.listName;

  /**
    Finds the List collection by name, then removes the item
    from the list by id, then saves the changes.
    async/await is used to wait for the changes to save
    before the redirect back to see the changes.
  */

  if (listName === "Today") {

    Item.findByIdAndRemove(itemID, function(err) {

      if (!err) {
        console.log("Successfully deleted item.");
        res.redirect("/");
      }
    });

  } else {

    List.findOne({
      name: listName
    }, async function(err, res) {
      res.items.pull(itemID);
      await res.save();
    });

    res.redirect("/" + listName);

  }
});


app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
