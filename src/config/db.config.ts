import mysql, { PoolConnection } from "mysql";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_URL,
  user: process.env.MYSQL_ID,
  password: process.env.MYSQL_PW,
  database: process.env.MYSQL_DB_NAME,
  port: parseInt(process.env.MYSQL_PORT || "", 10),
  connectionLimit: 30,
  dateStrings: ["DATETIME"],
});

export const getConnection = (callback: (connection: PoolConnection) => void) => {
  pool.getConnection((error, connection) => {
    if (!error) {
      callback(connection);
    }
  });
};

export default pool;
