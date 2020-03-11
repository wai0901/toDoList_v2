//jshint esversion:6

const express = require("express"),
      bodyParser = require("body-parser"),
      _ = require("lodash"),
      // date = require(__dirname + "/date.js"),
      mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});
mongoose.connect("mongodb+srv://wai0901:test-123@cluster0-mj4xs.mongodb.net/todolistDB", {useNewUrlParser: true});


// Item Schema

const itemsSchema = new mongoose.Schema ({
  name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist"
})
const item2 = new Item ({
  name: "Hit the  + button to add a new item"
})
const item3 = new Item ({
  name: "Hit this to delete an item"
})

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

//To check if the ToDoList is empty, if empt will add the default items.

app.get("/", function(req, res) {
  // const day = date.getDate();

  Item.find({}, (err, foundItem) => {

    foundItem.length === 0? 
    Item.insertMany(defaultItems, err => {
      err? console.log(err): console.log("Successfully added"),
      res.redirect("/");
    }):
    res.render("list", {listTitle: "Today", newListItems: foundItem});
  })
});


app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      //Create a new list
      if(!foundList){
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else { 
        //Show an exisiting list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }     
    }
  });
})

//Add

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });
  
  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
      
  }
});

//Delete

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
      Item.deleteOne({_id: checkedItemId}, err => {
        err? console.log(err): console.log("Successfully deleted one item");
        res.redirect("/");
      })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }
})


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
