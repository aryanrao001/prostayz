
import pool from "../../config/db.js";
import PropertyType from "../../models/PropertyType.js";

export const createPropertyType = async (req, res) => {
    try {
        const { name, icon, status } = req.body;
        if (!name) {
            return res.status(422).json({
                success: false,
                message: "Property type name is required."
            });
        }
        await PropertyType.create({
            name,
            icon: icon || null,
            status: status ?? 1
        });
        res.status(201).json({
            success: true,
            message: "Property type created successfully."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getPropertyTypes = async (req, res) => {
    try {
        const data = await PropertyType.findAll();
        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getPropertyTypeById = async (req, res) => {
    try {
        const propertyType = await PropertyType.findById(req.params.id);
        if (!propertyType) {
            return res.status(404).json({
                success: false,
                message: "Property type not found."
            });
        }
        res.json({
            success: true,
            data: propertyType
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updatePropertyType = async (req, res) => {
    try {
        const { name, icon, status } = req.body;
        await PropertyType.update(req.params.id, {
            name,
            icon,
            status
        });
        res.json({
            success: true,
            message: "Property type updated successfully."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deletePropertyType = async (req, res) => {
    try {
        await PropertyType.delete(req.params.id);
        res.json({
            success: true,
            message: "Property type deleted successfully."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getAmenities = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT *
             FROM amenities
             WHERE status = 1
             ORDER BY name ASC`
        );
        return res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};