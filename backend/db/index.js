const { Pool } = require("pg");

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
              password: "Sradb@1",
              port: 5432,
          }
);

module.exports = pool;