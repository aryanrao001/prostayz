import pool from "../../config/db.js";

// export const getVendorList = async (req, res) => {

//     try {
//         const page = Number(req.query.page || 1);
//         const limit = Number(req.query.limit || 10);
//         const offset = (page - 1) * limit;
//         const search = req.query.search || "";
//         const status = req.query.status || "";
//         let where = "WHERE 1=1";
//         const params = [];
//         if (search) {
//             where += `
//                 AND (
//                     CONCAT(v.first_name,' ',v.last_name) LIKE ?
//                     OR v.email LIKE ?
//                     OR v.phone LIKE ?
//                     OR v.business_name LIKE ?
//                 )
//             `;
//             const q = `%${search}%`;
//             params.push(q, q, q, q);
//         }
//         if (status) {
//             where += " AND v.status=?";
//             params.push(status);
//         }
//         const [count] = await pool.execute(
//             `
//             SELECT COUNT(*) total
//             FROM vendors v
//             ${where}
//             `,
//             params
//         );
//         const total = count[0].total;
//         params.push(limit, offset);
//         const [vendors] = await pool.execute(
//             `
//             SELECT
//                 v.id,
//                 CONCAT(v.first_name,' ',v.last_name) AS vendor_name,
//                 v.business_name,
//                 v.email,
//                 CONCAT(v.country_code,' ',v.phone) AS phone,
//                 v.profile_image,
//                 v.status,
//                 v.created_at,
//                 c.name AS country,
//                 s.name AS state,
//                 ci.name AS city,
//                 COUNT(DISTINCT p.id) AS total_properties,
//                 SUM(CASE WHEN p.status='draft' THEN 1 ELSE 0 END) AS draft_properties,
//                 SUM(CASE WHEN p.status='pending' THEN 1 ELSE 0 END) AS pending_properties,
//                 SUM(CASE WHEN p.status='approved' THEN 1 ELSE 0 END) AS approved_properties,
//                 SUM(CASE WHEN pl.is_completed=1 THEN 1 ELSE 0 END) AS completed_listings,
//                 COALESCE(SUM(p.total_rooms),0) AS total_rooms
//             FROM vendors v
//             LEFT JOIN vendor_addresses va
//                 ON va.vendor_id=v.id
//                 AND va.is_default=1
//             LEFT JOIN countries c
//                 ON c.id=va.country_id
//             LEFT JOIN states s
//                 ON s.id=va.state_id
//             LEFT JOIN cities ci
//                 ON ci.id=va.city_id
//             LEFT JOIN properties p
//                 ON p.vendor_id=v.id
//             LEFT JOIN property_listing_progress pl
//                 ON pl.property_id=p.id
//             ${where}
//             GROUP BY v.id
//             ORDER BY v.id DESC
//             LIMIT ?
//             OFFSET ?
//             `,
//             params
//         );
//         return res.json({
//             success:true,
//             total,
//             current_page:page,
//             total_pages:Math.ceil(total/limit),
//             vendors
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message
//         });
//     }
// };

export const getVendorList = async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);
        const offset = (page - 1) * limit;
        const search = req.query.search || "";
        const status = req.query.status || "";
        let where = "WHERE 1=1";
        const params = [];
        if (search) {
            where += `
                AND (
                    CONCAT(v.first_name,' ',v.last_name) LIKE ?
                    OR v.email LIKE ?
                    OR v.phone LIKE ?
                    OR v.business_name LIKE ?
                )
            `;
            const q = `%${search}%`;
            params.push(q, q, q, q);
        }
        if (status) {
            where += " AND v.status=?";
            params.push(status);
        }

        const [count] = await pool.execute(
            `SELECT COUNT(*) total FROM vendors v ${where}`,
            params
        );
        const total = count[0].total;

        // NOTE: limit/offset removed from params, interpolated directly below
        const [vendors] = await pool.execute(
            `
            SELECT
                v.id,
                CONCAT(v.first_name,' ',v.last_name) AS vendor_name,
                v.business_name,
                v.email,
                CONCAT(v.country_code,' ',v.phone) AS phone,
                v.profile_image,
                v.status,
                v.created_at,
                c.name AS country,
                s.name AS state,
                ci.name AS city,
                COUNT(DISTINCT p.id) AS total_properties,
                SUM(CASE WHEN p.status='draft' THEN 1 ELSE 0 END) AS draft_properties,
                SUM(CASE WHEN p.status='pending' THEN 1 ELSE 0 END) AS pending_properties,
                SUM(CASE WHEN p.status='approved' THEN 1 ELSE 0 END) AS approved_properties,
                SUM(CASE WHEN pl.is_completed=1 THEN 1 ELSE 0 END) AS completed_listings,
                COALESCE(SUM(p.total_rooms),0) AS total_rooms
            FROM vendors v
            LEFT JOIN vendor_addresses va ON va.vendor_id=v.id AND va.is_default=1
            LEFT JOIN countries c ON c.id=va.country_id
            LEFT JOIN states s ON s.id=va.state_id
            LEFT JOIN cities ci ON ci.id=va.city_id
            LEFT JOIN properties p ON p.vendor_id=v.id
            LEFT JOIN property_listing_progress pl ON pl.property_id=p.id
            ${where}
            GROUP BY v.id
            ORDER BY v.id DESC
            LIMIT ${limit}
            OFFSET ${offset}
            `,
            params
        );

        return res.json({
            success: true,
            total,
            current_page: page,
            total_pages: Math.ceil(total / limit),
            vendors
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getVendorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                country_code,
                business_name,
                gst_number,
                pan_number,
                status,
                profile_image,
                created_at
            FROM vendors
            WHERE id=?
            `,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        return res.json({
            success: true,
            vendor: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};




export const updateVendor = async (req, res) => {
    try {
        const { id } = req.params;

        const allowedFields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "country_code",
            "business_name",
            "gst_number",
            "pan_number",
            "status",
        ];
        const validStatuses = ["pending", "active", "blocked"];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided to update"
            });
        }

        if (updates.status && !validStatuses.includes(updates.status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(", ")}`
            });
        }

        if (updates.first_name !== undefined && !updates.first_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "First name cannot be empty"
            });
        }

        if (updates.email) {
            const [existing] = await pool.execute(
                `SELECT id FROM vendors WHERE email=? AND id<>? LIMIT 1`,
                [updates.email, id]
            );
            if (existing.length) {
                return res.status(409).json({
                    success: false,
                    message: "That email is already used by another vendor"
                });
            }
        }
        const setClause = Object.keys(updates)
            .map((field) => `${field}=?`)
            .join(", ");
        const values = Object.values(updates);
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE vendors SET ${setClause}, updated_at=NOW() WHERE id=?`,
            values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }
        const [rows] = await pool.execute(
            `
            SELECT
                id,
                first_name,
                last_name,
                CONCAT(first_name,' ',last_name) AS vendor_name,
                email,
                phone,
                country_code,
                business_name,
                gst_number,
                pan_number,
                status,
                profile_image,
                created_at,
                updated_at
            FROM vendors
            WHERE id=?
            `,
            [id]
        );
        return res.json({
            success: true,
            message: "Vendor updated successfully",
            vendor: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
