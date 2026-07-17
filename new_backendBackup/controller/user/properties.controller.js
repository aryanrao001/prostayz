// import pool from "../../config/db.js";

// export const getProperties = async (req, res) => {
//   try {
//     const {
//       type,
//       location,
//       search,
//       min_price,
//       max_price,
//       sort = "newest",
//       page = 1,
//       limit = 10,
//     } = req.query;

//     // ---- Build WHERE clause + params together so nothing gets out of sync ----
//     const conditions = ["p.status = 'approved'"];
//     const params = [];

//     if (type) {
//       conditions.push("p.property_type_id = ?");
//       params.push(Number(type));
//     }

//     if (location) {
//       conditions.push("pa.city = ?");
//       params.push(location);
//     }

//     if (search) {
//       conditions.push(
//         "(p.property_name LIKE ? OR p.description LIKE ? OR pa.area LIKE ? OR pa.city LIKE ?)"
//       );
//       const like = `%${search}%`;
//       params.push(like, like, like, like);
//     }

//     if (min_price !== undefined && min_price !== "") {
//       conditions.push("p.min_price >= ?");
//       params.push(Number(min_price));
//     }

//     if (max_price !== undefined && max_price !== "") {
//       conditions.push("p.max_price <= ?");
//       params.push(Number(max_price));
//     }

//     const whereClause = `WHERE ${conditions.join(" AND ")}`;

//     // ---- Sorting ----
//     const SORT_MAP = {
//       newest: "p.created_at DESC",
//       price_low: "p.min_price ASC",
//       price_high: "p.max_price DESC",
//       rating: "p.star_rating DESC",
//     };
//     const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

//     // ---- Pagination ----
//     const pageNum = Math.max(parseInt(page, 10) || 1, 1);
//     const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
//     const offset = (pageNum - 1) * limitNum;

//     // ---- Data query ----
//     // property_addresses / property_amenities / property_images are 1:1 or 1:many,
//     // so GROUP BY p.id + GROUP_CONCAT collapses amenities into one row per property.
//     const dataSql = `
//       SELECT
//         p.id,
//         p.property_name,
//         p.slug,
//         p.star_rating,
//         p.min_price,
//         p.max_price,
//         p.total_rooms,
//         p.check_in,
//         p.check_out,
//         pa.area,
//         pa.city,
//         pa.state,
//         pa.country,
//         pt.id   AS property_type_id,
//         pt.name AS property_type_name,
//         pi.image AS cover_image,
//         GROUP_CONCAT(DISTINCT a.name) AS amenities
//       FROM properties p
//       LEFT JOIN property_addresses  pa  ON pa.property_id = p.id
//       LEFT JOIN property_types      pt  ON pt.id = p.property_type_id
//       LEFT JOIN property_images     pi  ON pi.property_id = p.id AND pi.is_cover = 1
//       LEFT JOIN property_amenities  pam ON pam.property_id = p.id
//       LEFT JOIN amenities           a   ON a.id = pam.amenity_id
//       ${whereClause}
//       GROUP BY p.id
//       ORDER BY ${orderBy}
//       LIMIT ? OFFSET ?
//     `;

//     // ---- Count query for pagination (same filters, no GROUP BY/LIMIT) ----
//     const countSql = `
//       SELECT COUNT(DISTINCT p.id) AS total
//       FROM properties p
//       LEFT JOIN property_addresses pa ON pa.property_id = p.id
//       LEFT JOIN property_types     pt ON pt.id = p.property_type_id
//       ${whereClause}
//     `;

//     const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);
//     const [countRows] = await pool.query(countSql, params);
//     const total = countRows[0]?.total || 0;

//     const properties = rows.map((r) => ({
//       ...r,
//       amenities: r.amenities ? r.amenities.split(",") : [],
//     }));

//     return res.status(200).json({
//       success: true,
//       data: properties,
//       pagination: {
//         page: pageNum,
//         limit: limitNum,
//         total,
//         totalPages: Math.ceil(total / limitNum) || 1,
//       },
//       filters: { type: type ?? null, location: location ?? null, search: search ?? null, min_price: min_price ?? null, max_price: max_price ?? null, sort },
//     });
//   } catch (err) {
//     console.error("getProperties error:", err);
//     return res.status(500).json({ success: false, message: "Failed to fetch properties" });
//   }
// };


import pool from "../../config/db.js";

export const getProperties = async (req, res) => {
  try {
    const {
      type,
      location,
      search,
      min_price,
      max_price,
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    // ---- Build WHERE clause + params together so nothing gets out of sync ----
    const conditions = ["p.status = 'approved'"];
    const params = [];

    if (type) {
      conditions.push("p.property_type_id = ?");
      params.push(Number(type));
    }

    if (location) {
      conditions.push("pa.city = ?");
      params.push(location);
    }

    if (search) {
      conditions.push(
        "(p.property_name LIKE ? OR p.description LIKE ? OR pa.area LIKE ? OR pa.city LIKE ?)"
      );
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (min_price !== undefined && min_price !== "") {
      conditions.push("p.min_price >= ?");
      params.push(Number(min_price));
    }

    if (max_price !== undefined && max_price !== "") {
      conditions.push("p.max_price <= ?");
      params.push(Number(max_price));
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // ---- Sorting ----
    const SORT_MAP = {
      newest: "p.created_at DESC",
      price_low: "p.min_price ASC",
      price_high: "p.max_price DESC",
      rating: "p.star_rating DESC",
    };
    const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

    // ---- Pagination ----
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const offset = (pageNum - 1) * limitNum;

    // ---- Data query ----
    // property_addresses / property_amenities / property_images are 1:1 or 1:many,
    // so GROUP BY p.id + GROUP_CONCAT collapses amenities into one row per property.
    // pi.image is wrapped in ANY_VALUE() because MySQL's ONLY_FULL_GROUP_BY mode
    // can't prove it's functionally dependent on p.id (even filtered by is_cover = 1),
    // since in theory more than one row per property could match that filter.
    const dataSql = `
      SELECT
        p.id,
        p.property_name,
        p.slug,
        p.star_rating,
        p.min_price,
        p.max_price,
        p.total_rooms,
        p.check_in,
        p.check_out,
        pa.area,
        pa.city,
        pa.state,
        pa.country,
        pt.id   AS property_type_id,
        pt.name AS property_type_name,
        ANY_VALUE(pi.image) AS cover_image,
        GROUP_CONCAT(DISTINCT a.name) AS amenities
      FROM properties p
      LEFT JOIN property_addresses  pa  ON pa.property_id = p.id
      LEFT JOIN property_types      pt  ON pt.id = p.property_type_id
      LEFT JOIN property_images     pi  ON pi.property_id = p.id AND pi.is_cover = 1
      LEFT JOIN property_amenities  pam ON pam.property_id = p.id
      LEFT JOIN amenities           a   ON a.id = pam.amenity_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    // ---- Count query for pagination (same filters, no GROUP BY/LIMIT) ----
    const countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM properties p
      LEFT JOIN property_addresses pa ON pa.property_id = p.id
      LEFT JOIN property_types     pt ON pt.id = p.property_type_id
      ${whereClause}
    `;

    const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const properties = rows.map((r) => ({
      ...r,
      amenities: r.amenities ? r.amenities.split(",") : [],
    }));

    return res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      filters: {
        type: type ?? null,
        location: location ?? null,
        search: search ?? null,
        min_price: min_price ?? null,
        max_price: max_price ?? null,
        sort,
      },
    });
  } catch (err) {
    console.error("getProperties error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch properties" });
  }
};