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
      guests,
      check_in,
      check_out,
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
      conditions.push("(pa.city = ? OR pa.state = ? OR pa.country = ?)");
      params.push(location, location, location);
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

    // Guests: only show properties that have at least one room sleeping
    // the requested party size (adults). Airbnb-style "who" step.
    if (guests !== undefined && guests !== "" && Number(guests) > 0) {
      conditions.push(
        "EXISTS (SELECT 1 FROM rooms r2 WHERE r2.property_id = p.id AND r2.max_adults >= ?)"
      );
      params.push(Number(guests));
    }

    // Dates: exclude properties where every room is already fully booked
    // for the requested range. Best-effort check — a room only counts as
    // unavailable if bookings on overlapping nights consume all its inventory.
    let dateJoin = "";
    if (check_in && check_out) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM rooms r3
          WHERE r3.property_id = p.id
            AND r3.available_rooms > COALESCE((
              SELECT SUM(br.quantity)
              FROM booking_rooms br
              JOIN bookings b ON b.id = br.booking_id
              WHERE br.room_id = r3.id
                AND b.booking_status NOT IN ('cancelled','no_show')
                AND b.check_in_date < ? AND b.check_out_date > ?
            ), 0)
        )
      `);
      params.push(check_out, check_in);
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

/* ============================================================
   GET /user/properties/:slug
   Everything the redesigned property details page needs in one
   round trip: gallery, description, facts, address+coords (for
   the map), host info, amenities, rooms w/ pricing, policies,
   rules, and a review summary (average + category breakdown).
   Full review list is paginated separately via
   GET /review/property/:propertyId.
============================================================ */
export const getPropertyDetails = async (req, res) => {
  try {
    const { slug } = req.params;

    const [[property]] = await pool.query(
      `SELECT p.*, pt.name AS property_type_name
       FROM properties p
       LEFT JOIN property_types pt ON pt.id = p.property_type_id
       WHERE p.slug = ? AND p.status = 'approved'
       LIMIT 1`,
      [slug]
    );

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const [
      [address],
      images,
      amenityRows,
      rooms,
      [host],
      policies,
      rules,
      [reviewSummary],
    ] = await Promise.all([
      pool.query(`SELECT * FROM property_addresses WHERE property_id = ? LIMIT 1`, [property.id]).then((r) => r[0]),
      pool.query(
        `SELECT id, image, is_cover, sort_order FROM property_images WHERE property_id = ? ORDER BY is_cover DESC, sort_order ASC`,
        [property.id]
      ).then((r) => r[0]),
      pool.query(
        `SELECT a.id, a.name, a.icon FROM property_amenities pam
         JOIN amenities a ON a.id = pam.amenity_id
         WHERE pam.property_id = ?`,
        [property.id]
      ).then((r) => r[0]),
      pool.query(
        `SELECT r.*, rp.price, rp.weekend_price, rp.extra_guest_price, rp.tax
         FROM rooms r
         LEFT JOIN room_prices rp ON rp.room_id = r.id
         WHERE r.property_id = ?
         ORDER BY rp.price ASC`,
        [property.id]
      ).then((r) => r[0]),
      pool.query(
        `SELECT id, first_name, last_name, business_name, profile_image, created_at
         FROM vendors WHERE id = ? LIMIT 1`,
        [property.vendor_id]
      ).then((r) => r[0]),
      pool.query(`SELECT * FROM property_policies WHERE property_id = ?`, [property.id]).then((r) => r[0]),
      pool.query(`SELECT * FROM property_rules WHERE property_id = ?`, [property.id]).then((r) => r[0]),
      pool.query(
        `SELECT
            COUNT(*) AS total_reviews,
            ROUND(AVG(rating), 2) AS average_rating,
            ROUND(AVG(cleanliness_rating), 2) AS cleanliness_avg,
            ROUND(AVG(accuracy_rating), 2) AS accuracy_avg,
            ROUND(AVG(value_rating), 2) AS value_avg
         FROM property_reviews
         WHERE property_id = ? AND status = 'approved'`,
        [property.id]
      ).then((r) => r[0]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...property,
        property_type_name: property.property_type_name,
        address: address || null,
        images: images || [],
        amenities: amenityRows || [],
        rooms: rooms || [],
        host: host
          ? {
              id: host.id,
              name: host.business_name || `${host.first_name} ${host.last_name}`,
              profile_image: host.profile_image,
              hosting_since: host.created_at,
            }
          : null,
        policies: policies?.[0] || null,
        rules: rules?.[0] || null,
        reviews_summary: reviewSummary || {
          total_reviews: 0,
          average_rating: null,
          cleanliness_avg: null,
          accuracy_avg: null,
          value_avg: null,
        },
      },
    });
  } catch (err) {
    console.error("getPropertyDetails error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch property" });
  }
};