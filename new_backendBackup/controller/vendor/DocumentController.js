import pool from "../../config/db.js";

export const uploadVendorDocument = async (req, res) => {
    try {

        const vendorId = req.vendor.id;

        const {
            property_id,
            document_type,
            document_name
        } = req.body;

        if (!property_id || !document_type) {
            return res.status(400).json({
                success: false,
                message: "Property ID and Document Type are required."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a document."
            });
        }

        // Check Property Ownership
        const [property] = await pool.query(
            `SELECT id
             FROM properties
             WHERE id = ?
             AND vendor_id = ?`,
            [property_id, vendorId]
        );

        if (property.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Property not found."
            });
        }

        // Prevent Duplicate Upload
        const [existing] = await pool.query(
            `SELECT id
             FROM property_documents
             WHERE property_id = ?
             AND document_type = ?`,
            [property_id, document_type]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: `${document_type} already uploaded.`
            });
        }

        // Insert Document
        await pool.query(
            `INSERT INTO property_documents
            (
                property_id,
                vendor_id,
                document_type,
                document_name,
                file_path,
                mime_type,
                file_size
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                property_id,
                vendorId,
                document_type,
                document_name || req.file.originalname,
                req.file.path,
                req.file.mimetype,
                req.file.size
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Document uploaded successfully."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });

    }
};