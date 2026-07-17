import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import morgan from "morgan";
import vendorRoutes from "./routes/vendor/auth.route.js";
import locationRoute from "./routes/address/localtionRoute.js";
import propertyTypeRoute from "./routes/address/propertyTypeRoutes.js";
import listingRouter from "./routes/listing/listing.Router.js";
import { fileURLToPath } from 'url';
import path from 'path';
import adminRouter from "./routes/admin/adminRoute.js";
import userRoutes from "./routes/user/userRoutes.js";
import bookingRouter from "./routes/booking/bookinghandleRouter.js";
import reviewRouter from "./routes/reviewRouter/reviewRoutes.js";
import documentRouter from "./routes/vendor/documentRoutes.js";
import pool, { connectDB } from "./config/db.js";

// import vendorRoutes from "./routes/vendor/auth.route.js";

dotenv.config();
const app = express();
/* ============================================
   Database Connection
   (single shared pool from config/db.js — every controller and the
   session store below now use the exact same pool instead of two
   separate ones competing for connectionLimit against the same DB)
============================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This tells Express to serve files from the 'uploads' folder 
// when the URL starts with '/uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ============================================
   CORS
============================================ */

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);


/* ============================================
   Morgan Logger
============================================ */


morgan.token("date", () => {
    return new Date().toLocaleString();
});

app.use(
    morgan((tokens, req, res) => {
        return [
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            `📅 ${tokens.date(req, res)}`,
            `🌐 ${tokens.method(req, res)} ${tokens.url(req, res)}`,
            `📡 Status : ${tokens.status(req, res)}`,
            `⏱ Response : ${tokens["response-time"](req, res)} ms`,
            `💻 IP : ${tokens["remote-addr"](req, res)}`,
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ].join("\n");
    })
);
/* ============================================
   Body Parser
============================================ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ============================================
   Cookie Parser
============================================ */

app.use(cookieParser());

/* ============================================
   Session Store
============================================ */

const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({}, pool);

/* ============================================
   Session
============================================ */

app.use(
    session({
        key: "vendor.sid",
        secret: process.env.SESSION_SECRET || "hotel_secret",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        },
    })
);

/* ============================================
   Routes
============================================ */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Hotel Booking API Running 🚀",
    });
});

app.use("/api/vendor", vendorRoutes );
app.use("/api/location", locationRoute);
app.use("/api/property-types",propertyTypeRoute);
app.use("/api/listing",listingRouter);
app.use("/api/admin",adminRouter);
app.use("/api/user",userRoutes);
app.use("/api",bookingRouter);
app.use("/api/review", reviewRouter);
app.use("/api/vendor/documents", documentRouter);
/* ============================================
   404
============================================ */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
    });
});

/* ============================================
   Error Handler
============================================ */

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

/* ============================================
   Start Server
============================================ */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log("======================================");
        console.log(`🚀 Server Running`);
        console.log(`🌍 http://localhost:${PORT}`);
        console.log("======================================");
    });
};

startServer();