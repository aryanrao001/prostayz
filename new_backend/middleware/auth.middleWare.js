import pool from "../config/db.js";

export const authenticateUser = async (req, res, next) => {

    try {

        // Session not found
        if (!req.session || !req.session.vendorId) {

            return res.status(401).json({
                success: false,
                message: "Please login first."
            });

        }

        // Vendor lookup
        const [rows] = await pool.query(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                status
            FROM vendors
            WHERE id = ?
            LIMIT 1
            `,
            [req.session.vendorId]
        );

        if (!rows.length) {

            req.session.destroy(() => {});

            return res.status(401).json({
                success: false,
                message: "Vendor not found."
            });

        }

        const vendor = rows[0];

        if (vendor.status !== "active") {

            return res.status(403).json({
                success: false,
                message: "Vendor account is inactive."
            });

        }

        req.vendor = vendor;

        next();

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};