import pool from "../../config/db.js";

/*
  GET /api/admin/properties
  Search across vendor name/email/phone/business, property name, and location.
  Query params: page, limit, search, status
*/
// export const getPropertyList = async (req, res) => {
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
//                     p.property_name LIKE ?
//                     OR v.business_name LIKE ?
//                     OR CONCAT(v.first_name,' ',v.last_name) LIKE ?
//                     OR v.email LIKE ?
//                     OR v.phone LIKE ?
//                     OR pa.city LIKE ?
//                     OR pa.area LIKE ?
//                     OR pa.state LIKE ?
//                 )
//             `;
//             const q = `%${search}%`;
//             params.push(q, q, q, q, q, q, q, q);
//         }

//         if (status) {
//             where += " AND p.status=?";
//             params.push(status);
//         }

//         const [count] = await pool.execute(
//             `
//             SELECT COUNT(DISTINCT p.id) total
//             FROM properties p
//             LEFT JOIN vendors v ON v.id=p.vendor_id
//             LEFT JOIN property_addresses pa ON pa.property_id=p.id
//             ${where}
//             `,
//             params
//         );
//         const total = count[0].total;

//         params.push(limit, offset);
//         const [rows] = await pool.execute(
//             `
//             SELECT
//                 p.id,
//                 p.property_name,
//                 p.slug,
//                 p.star_rating,
//                 p.status,
//                 p.is_featured,
//                 p.total_rooms,
//                 p.min_price,
//                 p.max_price,
//                 p.created_at,
//                 pt.name AS property_type,
//                 v.id AS vendor_id,
//                 CONCAT(v.first_name,' ',v.last_name) AS vendor_name,
//                 v.business_name,
//                 v.email AS vendor_email,
//                 CONCAT(v.country_code,' ',v.phone) AS vendor_phone,
//                 pa.city,
//                 pa.state,
//                 pa.country,
//                 pa.area,
//                 cover.image AS cover_image
//             FROM properties p
//             LEFT JOIN vendors v ON v.id=p.vendor_id
//             LEFT JOIN property_types pt ON pt.id=p.property_type_id
//             LEFT JOIN property_addresses pa ON pa.property_id=p.id
//             LEFT JOIN property_images cover ON cover.property_id=p.id AND cover.is_cover=1
//             ${where}
//             GROUP BY p.id
//             ORDER BY p.id DESC
//             LIMIT ? OFFSET ?
//             `,
//             params
//         );

//         return res.json({
//             success: true,
//             total,
//             current_page: page,
//             total_pages: Math.ceil(total / limit),
//             properties: rows
//         });
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

export const getPropertyList = async (req, res) => {
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
                    p.property_name LIKE ?
                    OR v.business_name LIKE ?
                    OR CONCAT(v.first_name,' ',v.last_name) LIKE ?
                    OR v.email LIKE ?
                    OR v.phone LIKE ?
                    OR pa.city LIKE ?
                    OR pa.area LIKE ?
                    OR pa.state LIKE ?
                )
            `;
            const q = `%${search}%`;
            params.push(q, q, q, q, q, q, q, q);
        }

        if (status) {
            where += " AND p.status=?";
            params.push(status);
        }

        const [count] = await pool.execute(
            `
            SELECT COUNT(DISTINCT p.id) total
            FROM properties p
            LEFT JOIN vendors v ON v.id=p.vendor_id
            LEFT JOIN property_addresses pa ON pa.property_id=p.id
            ${where}
            `,
            params
        );
        const total = count[0].total;

        // limit/offset no longer pushed into params — interpolated directly below
        const [rows] = await pool.execute(
            `
            SELECT
                p.id,
                p.property_name,
                p.slug,
                p.star_rating,
                p.status,
                p.is_featured,
                p.total_rooms,
                p.min_price,
                p.max_price,
                p.created_at,
                pt.name AS property_type,
                v.id AS vendor_id,
                CONCAT(v.first_name,' ',v.last_name) AS vendor_name,
                v.business_name,
                v.email AS vendor_email,
                CONCAT(v.country_code,' ',v.phone) AS vendor_phone,
                pa.city,
                pa.state,
                pa.country,
                pa.area,
                (
                    SELECT pi.image
                    FROM property_images pi
                    WHERE pi.property_id = p.id AND pi.is_cover = 1
                    LIMIT 1
                ) AS cover_image
            FROM properties p
            LEFT JOIN vendors v ON v.id=p.vendor_id
            LEFT JOIN property_types pt ON pt.id=p.property_type_id
            LEFT JOIN property_addresses pa ON pa.property_id=p.id
            ${where}
            ORDER BY p.id DESC
            LIMIT ${limit} OFFSET ${offset}
            `,
            params
        );

        return res.json({
            success: true,
            total,
            current_page: page,
            total_pages: Math.ceil(total / limit),
            properties: rows
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/*
  GET /api/admin/properties/:id
  Full detail: property + vendor + address + policies + rules + listing
  progress, plus images, amenities, and rooms (each with beds/dorm beds/
  images/prices attached).
*/
export const getPropertyDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [propertyRows] = await pool.execute(
            `
            SELECT
                p.*,
                pt.name AS property_type,
                CONCAT(v.first_name,' ',v.last_name) AS vendor_name,
                v.business_name AS vendor_business_name,
                v.email AS vendor_email,
                CONCAT(v.country_code,' ',v.phone) AS vendor_phone,
                v.status AS vendor_status,
                pa.country, pa.state, pa.city, pa.area, pa.address, pa.pincode, pa.landmark,
                pp.cancellation_policy, pp.house_rules, pp.refund_policy,
                pr.smoking_allowed, pr.pets_allowed, pr.parties_allowed, pr.couples_allowed, pr.children_allowed,
                pl.current_step, pl.progress, pl.completed_percentage, pl.is_completed, pl.last_saved_at
            FROM properties p
            LEFT JOIN property_types pt ON pt.id=p.property_type_id
            LEFT JOIN vendors v ON v.id=p.vendor_id
            LEFT JOIN property_addresses pa ON pa.property_id=p.id
            LEFT JOIN property_policies pp ON pp.property_id=p.id
            LEFT JOIN property_rules pr ON pr.property_id=p.id
            LEFT JOIN property_listing_progress pl ON pl.property_id=p.id
            WHERE p.id=?
            `,
            [id]
        );

        if (!propertyRows.length) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const property = propertyRows[0];
        let progress = null;
        if (property.progress) {
            try {
                progress = JSON.parse(property.progress);
            } catch {
                progress = null;
            }
        }

        const [images] = await pool.execute(
            `SELECT id, image, is_cover, sort_order FROM property_images WHERE property_id=? ORDER BY sort_order ASC`,
            [id]
        );

        const [amenities] = await pool.execute(
            `
            SELECT a.id, a.name, a.icon
            FROM property_amenities pam
            JOIN amenities a ON a.id=pam.amenity_id
            WHERE pam.property_id=?
            `,
            [id]
        );

        const [rooms] = await pool.execute(
            `SELECT * FROM rooms WHERE property_id=? ORDER BY id ASC`,
            [id]
        );

        let roomsWithDetails = [];
        if (rooms.length) {
            const roomIds = rooms.map((r) => r.id);
            const placeholders = roomIds.map(() => "?").join(",");

            const [beds] = await pool.execute(
                `SELECT * FROM room_beds WHERE room_id IN (${placeholders})`,
                roomIds
            );
            const [dormBeds] = await pool.execute(
                `SELECT * FROM room_dorm_beds WHERE room_id IN (${placeholders})`,
                roomIds
            );
            const [roomImages] = await pool.execute(
                `SELECT * FROM room_images WHERE room_id IN (${placeholders}) ORDER BY sort_order ASC`,
                roomIds
            );
            const [prices] = await pool.execute(
                `SELECT * FROM room_prices WHERE room_id IN (${placeholders})`,
                roomIds
            );

            roomsWithDetails = rooms.map((room) => ({
                ...room,
                beds: beds.filter((b) => b.room_id === room.id),
                dorm_beds: dormBeds.filter((d) => d.room_id === room.id),
                images: roomImages.filter((ri) => ri.room_id === room.id),
                price: prices.find((pr) => pr.room_id === room.id) || null
            }));
        }

        return res.json({
            success: true,
            property: { ...property, progress },
            images,
            amenities,
            rooms: roomsWithDetails
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/*
  PUT /api/admin/properties/:id
  Partial update — status, star_rating, is_featured.
*/
export const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;

        const allowedFields = ["status", "star_rating", "is_featured"];
        const validStatuses = ["draft", "pending", "approved", "rejected"];

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

        if (updates.star_rating !== undefined) {
            const rating = Number(updates.star_rating);
            if (Number.isNaN(rating) || rating < 0 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: "Star rating must be between 0 and 5"
                });
            }
            updates.star_rating = rating;
        }

        if (updates.is_featured !== undefined) {
            updates.is_featured = updates.is_featured ? 1 : 0;
        }

        const setClause = Object.keys(updates)
            .map((field) => `${field}=?`)
            .join(", ");
        const values = Object.values(updates);
        values.push(id);

        const [result] = await pool.execute(
            `UPDATE properties SET ${setClause}, updated_at=NOW() WHERE id=?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        const [rows] = await pool.execute(
            `SELECT id, property_name, status, star_rating, is_featured, updated_at FROM properties WHERE id=?`,
            [id]
        );

        return res.json({
            success: true,
            message: "Property updated successfully",
            property: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
