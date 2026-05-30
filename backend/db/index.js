const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool(
    isProduction
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: {
                  rejectUnauthorized: false,
              },
          }
        : {
              user: "postgres",
              host: "localhost",
              database: "villageDB",
              password: process.env.DB_PASSWORD,
              port: 5432,
          }
);

module.exports = pool;