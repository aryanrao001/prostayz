import pool from "../../config/db.js";

// Documents that must be verified before a vendor is considered fully
// verified. `ownership_proof` is intentionally excluded — it's tied to a
// specific property, not the vendor as a whole.
const REQUIRED_VENDOR_DOC_TYPES = [
    "business_registration",
    "pan_card",
    "gst_certificate",
    "government_id",
];

const ALL_DOC_TYPES = [...REQUIRED_VENDOR_DOC_TYPES, "ubo", "ownership_proof"];

/* ============================================================
   POST /api/vendor/documents/upload  (vendor)
   Accepts multipart upload.fields([...]) — one file per document type
   in the same request. The previous version read req.file (singular),
   which is only populated by upload.single(); with upload.fields() multer
   populates req.files as an object keyed by fieldname, so every upload
   here was silently ignored / crashed before reaching the DB, and the
   INSERT also targeted a `property_documents` table that didn't exist.
============================================================ */
export const uploadVendorDocument = async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const { property_id } = req.body;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one document."
            });
        }

        // If any uploaded field is ownership_proof, a property must be specified
        // and owned by this vendor. Other doc types are vendor-level (property_id
        // stays NULL).
        let ownedPropertyId = null;
        if (req.files.ownership_proof) {
            if (!property_id) {
                return res.status(400).json({
                    success: false,
                    message: "property_id is required to upload ownership proof."
                });
            }
            const [property] = await pool.query(
                `SELECT id FROM properties WHERE id = ? AND vendor_id = ?`,
                [property_id, vendorId]
            );
            if (property.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Property not found."
                });
            }
            ownedPropertyId = property_id;
        }

        const results = [];

        for (const fieldName of Object.keys(req.files)) {
            if (!ALL_DOC_TYPES.includes(fieldName)) continue;
            const file = req.files[fieldName][0];
            const propId = fieldName === "ownership_proof" ? ownedPropertyId : null;

            // Upsert: a vendor can re-upload after a rejection, or replace a
            // pending document, without hitting the unique constraint.
            await pool.query(
                `INSERT INTO property_documents
                    (vendor_id, property_id, document_type, document_name, file_path, mime_type, file_size, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                 ON DUPLICATE KEY UPDATE
                    document_name = VALUES(document_name),
                    file_path = VALUES(file_path),
                    mime_type = VALUES(mime_type),
                    file_size = VALUES(file_size),
                    status = 'pending',
                    rejection_reason = NULL,
                    reviewed_by = NULL,
                    reviewed_at = NULL,
                    updated_at = NOW()`,
                [
                    vendorId,
                    propId,
                    fieldName,
                    file.originalname,
                    file.path,
                    file.mimetype,
                    file.size,
                ]
            );
            results.push(fieldName);
        }

        if (!results.length) {
            return res.status(400).json({
                success: false,
                message: "No recognized document types were uploaded."
            });
        }

        // Vendor now has documents pending review — flip their status so the
        // admin panel can surface it, unless they're already verified/rejected
        // with a note in progress.
        await pool.query(
            `UPDATE vendors SET verification_status = 'pending'
             WHERE id = ? AND verification_status = 'unverified'`,
            [vendorId]
        );

        return res.status(201).json({
            success: true,
            message: "Document(s) uploaded successfully.",
            data: { uploaded: results }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
};

/* ============================================================
   GET /api/vendor/documents/mine  (vendor)
   Returns every required doc type with its current status, so the UI can
   render a checklist ("business_registration: verified", "pan_card: missing").
============================================================ */
export const getMyDocuments = async (req, res) => {
    try {
        const vendorId = req.vendor.id;
        const { property_id } = req.query;

        const [rows] = await pool.query(
            `SELECT id, property_id, document_type, document_name, file_path,
                    status, rejection_reason, created_at, updated_at
             FROM property_documents
             WHERE vendor_id = ? AND (property_id IS NULL OR property_id = ?)`,
            [vendorId, property_id || null]
        );

        const byType = new Map(rows.map((r) => [r.document_type, r]));
        const checklist = ALL_DOC_TYPES.map((type) => ({
            document_type: type,
            required: REQUIRED_VENDOR_DOC_TYPES.includes(type),
            ...(byType.get(type) || { status: "missing" }),
        }));

        const [[vendor]] = await pool.query(
            `SELECT verification_status, verification_notes, verified_at FROM vendors WHERE id = ?`,
            [vendorId]
        );

        return res.json({ success: true, data: checklist, vendor });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

/* ============================================================
   Admin document verification
============================================================ */

// GET /api/admin/documents?status=pending&vendorId=1
export const getAllDocumentsAdmin = async (req, res) => {
    try {
        const { status, vendorId } = req.query;
        const conditions = [];
        const params = [];
        if (status) { conditions.push("d.status = ?"); params.push(status); }
        if (vendorId) { conditions.push("d.vendor_id = ?"); params.push(vendorId); }
        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const [rows] = await pool.query(
            `SELECT d.*, v.first_name, v.last_name, v.business_name, v.email,
                    p.property_name
             FROM property_documents d
             JOIN vendors v ON v.id = d.vendor_id
             LEFT JOIN properties p ON p.id = d.property_id
             ${where}
             ORDER BY d.created_at DESC`,
            params
        );
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

// PATCH /api/admin/documents/:id/verify
export const verifyDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.id;

        const [[doc]] = await pool.query(`SELECT * FROM property_documents WHERE id = ?`, [id]);
        if (!doc) return res.status(404).json({ success: false, message: "Document not found." });

        await pool.query(
            `UPDATE property_documents
             SET status = 'verified', rejection_reason = NULL, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [adminId, id]
        );

        await refreshVendorVerificationStatus(doc.vendor_id);

        return res.json({ success: true, message: "Document verified." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

// PATCH /api/admin/documents/:id/reject  { reason }
export const rejectDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.admin.id;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: "Rejection reason is required." });
        }

        const [[doc]] = await pool.query(`SELECT * FROM property_documents WHERE id = ?`, [id]);
        if (!doc) return res.status(404).json({ success: false, message: "Document not found." });

        await pool.query(
            `UPDATE property_documents
             SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ?`,
            [reason.trim(), adminId, id]
        );

        await refreshVendorVerificationStatus(doc.vendor_id);

        return res.json({ success: true, message: "Document rejected." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

// Recompute a vendor's overall verification_status from their required docs.
async function refreshVendorVerificationStatus(vendorId) {
    const [docs] = await pool.query(
        `SELECT document_type, status FROM property_documents
         WHERE vendor_id = ? AND property_id IS NULL AND document_type IN (?)`,
        [vendorId, REQUIRED_VENDOR_DOC_TYPES]
    );

    const byType = new Map(docs.map((d) => [d.document_type, d.status]));
    const allSubmitted = REQUIRED_VENDOR_DOC_TYPES.every((t) => byType.has(t));
    const allVerified = allSubmitted && REQUIRED_VENDOR_DOC_TYPES.every((t) => byType.get(t) === "verified");
    const anyRejected = REQUIRED_VENDOR_DOC_TYPES.some((t) => byType.get(t) === "rejected");

    let status = "pending";
    if (allVerified) status = "verified";
    else if (anyRejected) status = "rejected";
    else if (!allSubmitted) status = "unverified";

    await pool.query(
        `UPDATE vendors
         SET verification_status = ?, verified_at = IF(? = 'verified', NOW(), verified_at)
         WHERE id = ?`,
        [status, status, vendorId]
    );
}
