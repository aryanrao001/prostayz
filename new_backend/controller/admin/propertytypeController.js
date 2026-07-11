import pool from "../../config/db.js";

/* =====================================================
   Create Property Type
===================================================== */

export const createPropertyType = async (req, res) => {
    try {

        const {
            name,
            status
        } = req.body;

        if (!name) {
            return res.status(422).json({
                success: false,
                message: "Property type name is required."
            });
        }

        const [exists] = await pool.execute(
            `SELECT id FROM property_types WHERE name=? LIMIT 1`,
            [name]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Property type already exists."
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO property_types
            (
                name,
                status,
                created_at,
                updated_at
            )
            VALUES
            (
                ?,?,NOW(),NOW()
            )
            `,
            [
                name,
                status ?? 1
            ]
        );

        const [rows] = await pool.execute(
            `SELECT * FROM property_types WHERE id=? LIMIT 1`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Property type created successfully.",
            propertyType: rows[0]
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

/* =====================================================
   Get All Property Types
===================================================== */

export const getPropertyTypes = async (req, res) => {

    try {

        const search = req.query.search || "";
        const status = req.query.status || "";

        let sql = `
            SELECT *
            FROM property_types
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
            propertyTypes: rows
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =====================================================
   Get Single Property Type
===================================================== */

export const getPropertyType = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            `
            SELECT *
            FROM property_types
            WHERE id=?
            LIMIT 1
            `,
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Property type not found."
            });
        }
        return res.json({
            success: true,
            propertyType: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/* =====================================================
   Update Property Type
===================================================== */

export const updatePropertyType = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            status
        } = req.body;

        const [exists] = await pool.execute(
            `
            SELECT id
            FROM property_types
            WHERE id=?
            LIMIT 1
            `,
            [id]
        );
        if (!exists.length) {
            return res.status(404).json({
                success: false,
                message: "Property type not found."
            });
        }

        // Build a partial update so a status-only (or name-only) request
        // doesn't wipe out fields that weren't sent.
        const fields = [];
        const params = [];

        if (name !== undefined) {
            const [duplicate] = await pool.execute(
                `
                SELECT id
                FROM property_types
                WHERE name=?
                AND id<>?
                LIMIT 1
                `,
                [name, id]
            );
            if (duplicate.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Property type already exists."
                });
            }
            fields.push("name=?");
            params.push(name);
        }

        if (status !== undefined) {
            fields.push("status=?");
            params.push(status ? 1 : 0);
        }

        if (!fields.length) {
            return res.status(422).json({
                success: false,
                message: "Nothing to update."
            });
        }

        fields.push("updated_at=NOW()");
        params.push(id);

        await pool.execute(
            `UPDATE property_types SET ${fields.join(", ")} WHERE id=?`,
            params
        );

        const [rows] = await pool.execute(
            `SELECT * FROM property_types WHERE id=? LIMIT 1`,
            [id]
        );

        return res.json({
            success: true,
            message: "Property type updated successfully.",
            propertyType: rows[0]
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
   Delete Property Type
===================================================== */

export const deletePropertyType = async (req, res) => {
    try {
        const { id } = req.params;

        const [used] = await pool.execute(
            `
            SELECT id
            FROM properties
            WHERE property_type_id=?
            LIMIT 1
            `,
            [id]
        );

        if (used.length > 0) {
            return res.status(400).json({
                success: false,
                message: "This property type is already assigned to properties and cannot be deleted."
            });
        }

        const [result] = await pool.execute(
            `
            DELETE FROM property_types
            WHERE id=?
            `,
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Property type not found."
            });
        }
        return res.json({
            success: true,
            message: "Property type deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
