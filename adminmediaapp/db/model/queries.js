const mongoose = require('mongoose');
const QuerySchema = new mongoose.Schema({
    email:String,
    query:String,
})

mongoose.model('Queries',QuerySchema);
module.exports = mongoose.model('Queries');