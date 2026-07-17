import pool from "../../config/db.js";

/* =====================================================
   Create Amenity
===================================================== */

export const createAmenity = async (req, res) => {
    try {

        const {
            name,
            icon,
            status
        } = req.body;

        if (!name) {
            return res.status(422).json({
                success: false,
                message: "Amenity name is required."
            });
        }

        const [exists] = await pool.execute(
            `SELECT id FROM amenities WHERE name=? LIMIT 1`,
            [name]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Amenity already exists."
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO amenities
            (
                name,
                icon,
                status
            )
            VALUES
            (
                ?,?,?
            )
            `,
            [
                name,
                icon || null,
                status ?? 1
            ]
        );

        const [rows] = await pool.execute(
            `SELECT * FROM amenities WHERE id=? LIMIT 1`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Amenity created successfully.",
            amenity: rows[0]   // <-- was missing
        });

        return res.status(201).json({
            success: true,
            message: "Amenity created successfully.",
            id: result.insertId
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

/* =====================================================
   Get All Amenities
===================================================== */

export const getAmenities = async (req, res) => {

    try {

        const search = req.query.search || "";
        const status = req.query.status || "";

        let sql = `
            SELECT *
            FROM amenities
            WHERE 1=1
        `;

        let params = [];

        if (search) {
            sql += ` AND name LIKE ?`;
            params.push(`%${search}%`);
        }

        if (status !== "") {
            sql += ` AND status=?`;
            params.push(status);
        }

        sql += ` ORDER BY name ASC`;

        const [rows] = await pool.execute(sql, params);

        return res.json({
            success: true,
            total: rows.length,
            amenities: rows
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =====================================================
   Get Single Amenit
===================================================== */
export const getAmenity = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            `
            SELECT *
            FROM amenities
            WHERE id=?
            LIMIT 1
            `,
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Amenity not found."
            });
        }
        return res.json({
            success: true,
            amenity: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =====================================================
   Update Amenity
===================================================== */

export const updateAmenity = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            icon,
            status
        } = req.body;
        const [exists] = await pool.execute(
            `
            SELECT id
            FROM amenities
            WHERE id=?
            LIMIT 1
            `,
            [id]
        );
        if (!exists.length) {
            return res.status(404).json({
                success: false,
                message: "Amenity not found."
            });
        }
        const [duplicate] = await pool.execute(
            `
            SELECT id
            FROM amenities
            WHERE name=?
            AND id<>?
            LIMIT 1
            `,
            [
                name,
                id
            ]
        );
        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Amenity already exists."
            });
        }
        await pool.execute(
            `UPDATE amenities SET name=?, icon=?, status=? WHERE id=?`,
            [name, icon, status, id]
        );

        const [rows] = await pool.execute(
            `SELECT * FROM amenities WHERE id=? LIMIT 1`,
            [id]
        );

        return res.json({
            success: true,
            message: "Amenity updated successfully.",
            amenity: rows[0]   // <-- was missing
        });
        return res.json({
            success: true,
            message: "Amenity updated successfully."
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =====================================================
   Delete Amenity
===================================================== */

export const deleteAmenity = async (req, res) => {
    try {
        const { id } = req.params;
        const [used] = await pool.execute(
            `
            SELECT id
            FROM property_amenities
            WHERE amenity_id=?
            LIMIT 1
            `,
            [id]
        );

        if (used.length > 0) {
            return res.status(400).json({
                success: false,
                message: "This amenity is already assigned to properties and cannot be deleted."
            });
        }
        const [result] = await pool.execute(
            `
            DELETE FROM amenities
            WHERE id=?
            `,
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Amenity not found."
            });
        }
        return res.json({
            success: true,
            message: "Amenity deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};