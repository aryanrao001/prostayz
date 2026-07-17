import pool from "../config/db.js";

class PropertyType {

    static async create(data) {
        const sql = `
            INSERT INTO property_types
            (name, status, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
        `;

        const [result] = await pool.execute(sql, [
            data.name,
            data.icon,
            data.status
        ]);

        return result;
    }

    static async findAll() {

        const [rows] = await pool.execute(`
            SELECT *
            FROM property_types
            ORDER BY id DESC
        `);

        return rows;
    }

    static async findById(id) {

        const [rows] = await pool.execute(
            `SELECT * FROM property_types WHERE id=?`,
            [id]
        );

        return rows[0];
    }

    static async update(id, data) {

        const sql = `
            UPDATE property_types
            SET
                name=?,
                status=?,
                updated_at=NOW()
            WHERE id=?
        `;

        const [result] = await pool.execute(sql, [
            data.name,
            data.icon,
            data.status,
            id
        ]);

        return result;
    }

    static async delete(id) {

        const [result] = await pool.execute(
            `DELETE FROM property_types WHERE id=?`,
            [id]
        );

        return result;
    }

}

export default PropertyType;