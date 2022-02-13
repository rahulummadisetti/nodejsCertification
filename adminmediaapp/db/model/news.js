const mongoose = require('mongoose');
const NewsSchema = new mongoose.Schema({
    title:String,
    description:String,
    url:String,
    urlToImage : String,
    publishedAt : { type:Date,default:Date.now,required:"published at cannot be blank"}
})

mongoose.model('News',NewsSchema);
module.exports = mongoose.model('News');