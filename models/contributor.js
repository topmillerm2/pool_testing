const mongoose = require('mongoose');
const { Schema } = mongoose;

const contributorSchema = new Schema({
	user: { type: String, required: true },
	name: {type: String, required: true},
	position: { type: Number, required: true }
});

module.exports = contributorSchema;