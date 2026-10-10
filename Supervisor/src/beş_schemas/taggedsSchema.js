const { Schema, model } = require("mongoose");
const client = global.client;
const schema = Schema({guildId: { type: String, default: "" },userId: { type: String, default: "" },Data:{type: Array,default:[]}});
module.exports = model("taggedsData", schema);
