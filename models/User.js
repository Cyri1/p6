const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true},
});

//vérification que l'email est unique
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);