import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export const connectDB = async () => {
    try {
        const connection = await pool.getConnection();

        console.log("✅ MySQL Database Connected Successfully");
        console.log(`📦 Database : ${process.env.DB_NAME}`);
        console.log(`🌐 Host     : ${process.env.DB_HOST}`);
        console.log(`👤 User     : ${process.env.DB_USER}`);

        connection.release();
    } catch (error) {
        console.error("❌ Database Connection Failed");
        console.error(error.message);

        process.exit(1);
    }
};

export default pool;