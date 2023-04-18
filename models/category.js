const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const categorySchema= new Schema({
    categoryName:String,
    image: {
        type: Array,
      },
});
const category=mongoose.model('category',categorySchema)
module.exports=category