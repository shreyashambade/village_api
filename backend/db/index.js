const { Pool } = require("pg");

const pool = new Pool ({
    user : "postgres",
    host : "localhost",
    database : "villageDB",
    password : "Sradb@1",
    port : 5432
});

module.exports = pool;