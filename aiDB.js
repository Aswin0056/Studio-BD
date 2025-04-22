const { Pool } = require("pg");
require("dotenv").config();

const aiDb = new Pool({
  connectionString: process.env.AI_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


module.exports = aiDb;
