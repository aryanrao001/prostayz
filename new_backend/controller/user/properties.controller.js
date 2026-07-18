import pool from "../../config/db.js";

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
//     // pi.image is wrapped in ANY_VALUE() because MySQL's ONLY_FULL_GROUP_BY mode
//     // can't prove it's functionally dependent on p.id (even filtered by is_cover = 1),
//     // since in theory more than one row per property could match that filter.
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
//         ANY_VALUE(pi.image) AS cover_image,
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
//       filters: {
//         type: type ?? null,
//         location: location ?? null,
//         search: search ?? null,
//         min_price: min_price ?? null,
//         max_price: max_price ?? null,
//         sort,
//       },
//     });
//   } catch (err) {
//     console.error("getProperties error:", err);
//     return res.status(500).json({ success: false, message: "Failed to fetch properties" });
//   }
// };


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
    // property_addresses is 1:1 with properties, so its columns are safe to
    // select alongside GROUP BY p.id.
    //
    // property_images is 1:many (even filtered to is_cover = 1, in theory more
    // than one row could match), so instead of trying to aggregate it with
    // ANY_VALUE() — which MySQL 5.7+ has but MariaDB does not implement at
    // all — we pull the cover image with a plain scalar subquery. That sidesteps
    // the aggregation/ONLY_FULL_GROUP_BY question entirely, since it no longer
    // participates in the GROUP BY at all.
    //
    // property_amenities / amenities are 1:many too, so those stay aggregated
    // with GROUP_CONCAT as before.
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
        (
          SELECT pi.image
          FROM property_images pi
          WHERE pi.property_id = p.id AND pi.is_cover = 1
          LIMIT 1
        ) AS cover_image,
        GROUP_CONCAT(DISTINCT a.name) AS amenities
      FROM properties p
      LEFT JOIN property_addresses  pa  ON pa.property_id = p.id
      LEFT JOIN property_types      pt  ON pt.id = p.property_type_id
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
// export const getPropertyDetails = async (req, res) => {
//   try {
//     const { slug } = req.params;

//     const [[property]] = await pool.query(
//       `SELECT p.*, pt.name AS property_type_name
//        FROM properties p
//        LEFT JOIN property_types pt ON pt.id = p.property_type_id
//        WHERE p.slug = ? AND p.status = 'approved'
//        LIMIT 1`,
//       [slug]
//     );

//     if (!property) {
//       return res.status(404).json({ success: false, message: "Property not found" });
//     }

//     const [
//       [address],
//       images,
//       amenityRows,
//       rooms,
//       [host],
//       policies,
//       rules,
//       [reviewSummary],
//     ] = await Promise.all([
//       pool.query(`SELECT * FROM property_addresses WHERE property_id = ? LIMIT 1`, [property.id]).then((r) => r[0]),
//       pool.query(
//         `SELECT id, image, is_cover, sort_order FROM property_images WHERE property_id = ? ORDER BY is_cover DESC, sort_order ASC`,
//         [property.id]
//       ).then((r) => r[0]),
//       pool.query(
//         `SELECT a.id, a.name, a.icon FROM property_amenities pam
//          JOIN amenities a ON a.id = pam.amenity_id
//          WHERE pam.property_id = ?`,
//         [property.id]
//       ).then((r) => r[0]),
//       pool.query(
//         `SELECT r.*, rp.price, rp.weekend_price, rp.extra_guest_price, rp.tax
//          FROM rooms r
//          LEFT JOIN room_prices rp ON rp.room_id = r.id
//          WHERE r.property_id = ?
//          ORDER BY rp.price ASC`,
//         [property.id]
//       ).then((r) => r[0]),
//       pool.query(
//         `SELECT id, first_name, last_name, business_name, profile_image, created_at
//          FROM vendors WHERE id = ? LIMIT 1`,
//         [property.vendor_id]
//       ).then((r) => r[0]),
//       pool.query(`SELECT * FROM property_policies WHERE property_id = ?`, [property.id]).then((r) => r[0]),
//       pool.query(`SELECT * FROM property_rules WHERE property_id = ?`, [property.id]).then((r) => r[0]),
//       pool.query(
//         `SELECT
//             COUNT(*) AS total_reviews,
//             ROUND(AVG(rating), 2) AS average_rating,
//             ROUND(AVG(cleanliness_rating), 2) AS cleanliness_avg,
//             ROUND(AVG(accuracy_rating), 2) AS accuracy_avg,
//             ROUND(AVG(value_rating), 2) AS value_avg
//          FROM property_reviews
//          WHERE property_id = ? AND status = 'approved'`,
//         [property.id]
//       ).then((r) => r[0]),
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: {
//         ...property,
//         property_type_name: property.property_type_name,
//         address: address || null,
//         images: images || [],
//         amenities: amenityRows || [],
//         rooms: rooms || [],
//         host: host
//           ? {
//             id: host.id,
//             name: host.business_name || `${host.first_name} ${host.last_name}`,
//             profile_image: host.profile_image,
//             hosting_since: host.created_at,
//           }
//           : null,
//         policies: policies?.[0] || null,
//         rules: rules?.[0] || null,
//         reviews_summary: reviewSummary || {
//           total_reviews: 0,
//           average_rating: null,
//           cleanliness_avg: null,
//           accuracy_avg: null,
//           value_avg: null,
//         },
//       },
//     });
//   } catch (err) {
//     console.error("getPropertyDetails error:", err);
//     return res.status(500).json({ success: false, message: "Failed to fetch property" });
//   }
// };



export const getPropertyBySlug = async (req, res, next) => {
  const { slug } = req.params;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ success: false, message: 'A valid property slug is required.' });
  }

  const conn = await pool.getConnection();

  try {
    // ---------------------------------------------------------------------
    // 1. Core property row (+ type name, vendor info)
    // ---------------------------------------------------------------------
    const [propertyRows] = await conn.query(
      `SELECT
         p.id, p.vendor_id, p.property_type_id, p.property_name, p.slug,
         p.description, p.star_rating, p.contact_name, p.contact_number,
         p.email, p.website, p.check_in, p.check_out, p.total_rooms,
         p.min_price, p.max_price, p.status, p.is_featured,
         p.latitude, p.longitude, p.average_rating, p.total_reviews,
         p.created_at, p.updated_at,
         pt.name AS property_type_name,
         v.id AS vendor_id_ref, v.business_name AS vendor_business_name,
         v.first_name AS vendor_first_name, v.last_name AS vendor_last_name,
         v.phone AS vendor_phone, v.email AS vendor_email
       FROM properties p
       LEFT JOIN property_types pt ON pt.id = p.property_type_id
       LEFT JOIN vendors v ON v.id = p.vendor_id
       WHERE p.slug = ? AND p.status = 'approved'
       LIMIT 1`,
      [slug]
    );

    const property = propertyRows[0];

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    const propertyId = property.id;

    // ---------------------------------------------------------------------
    // 2. Address, amenities, images, policies, rules — run in parallel
    // ---------------------------------------------------------------------
    const [
      [addressRows],
      [amenityRows],
      [imageRows],
      [policyRows],
      [ruleRows],
    ] = await Promise.all([
      conn.query(
        `SELECT country, state, city, area, address, pincode, landmark
         FROM property_addresses WHERE property_id = ? LIMIT 1`,
        [propertyId]
      ),
      conn.query(
        `SELECT a.id, a.name, a.icon
         FROM property_amenities pa
         JOIN amenities a ON a.id = pa.amenity_id
         WHERE pa.property_id = ? AND a.status = 1
         ORDER BY a.name ASC`,
        [propertyId]
      ),
      conn.query(
        `SELECT id, image, is_cover, sort_order
         FROM property_images
         WHERE property_id = ?
         ORDER BY is_cover DESC, sort_order ASC`,
        [propertyId]
      ),
      conn.query(
        `SELECT cancellation_policy, house_rules, refund_policy
         FROM property_policies WHERE property_id = ? LIMIT 1`,
        [propertyId]
      ),
      conn.query(
        `SELECT smoking_allowed, pets_allowed, parties_allowed, couples_allowed, children_allowed
         FROM property_rules WHERE property_id = ? LIMIT 1`,
        [propertyId]
      ),
    ]);

    // ---------------------------------------------------------------------
    // 3. Rooms + their prices (base row per room)
    // ---------------------------------------------------------------------
    const [roomRows] = await conn.query(
      `SELECT
         r.id, r.room_name, r.room_type, r.room_category, r.max_adults,
         r.max_children, r.total_rooms, r.available_rooms, r.room_size,
         r.room_size_unit, r.private_bathroom, r.balcony, r.air_conditioning,
         r.description,
         rp.price, rp.weekend_price, rp.extra_guest_price, rp.tax
       FROM rooms r
       LEFT JOIN room_prices rp ON rp.room_id = r.id
       WHERE r.property_id = ?
       ORDER BY r.id ASC`,
      [propertyId]
    );

    const roomIds = roomRows.map((r) => r.id);

    // Room images / beds / dorm beds / upcoming availability — only if there are rooms
    let roomImagesByRoom = {};
    let bedsByRoom = {};
    let dormBedsByRoom = {};
    let availabilityByRoom = {};

    if (roomIds.length > 0) {
      const [
        [roomImageRows],
        [bedRows],
        [dormBedRows],
        [availabilityRows],
      ] = await Promise.all([
        conn.query(
          `SELECT id, room_id, image, is_cover, sort_order
           FROM room_images WHERE room_id IN (?) ORDER BY is_cover DESC, sort_order ASC`,
          [roomIds]
        ),
        conn.query(
          `SELECT id, room_id, bed_type, quantity
           FROM room_beds WHERE room_id IN (?)`,
          [roomIds]
        ),
        conn.query(
          `SELECT id, room_id, bed_label, bed_type, status, price
           FROM room_dorm_beds WHERE room_id IN (?) ORDER BY bed_label ASC`,
          [roomIds]
        ),
        conn.query(
          `SELECT room_id, available_date, available_rooms, blocked_rooms, special_price
           FROM room_availability
           WHERE room_id IN (?) AND available_date >= CURDATE()
           ORDER BY available_date ASC
           LIMIT 500`,
          [roomIds]
        ),
      ]);

      roomImagesByRoom = groupBy(roomImageRows, 'room_id');
      bedsByRoom = groupBy(bedRows, 'room_id');
      dormBedsByRoom = groupBy(dormBedRows, 'room_id');
      availabilityByRoom = groupBy(availabilityRows, 'room_id');
    }

    const rooms = roomRows.map((room) => ({
      id: room.id,
      room_name: room.room_name,
      room_type: room.room_type,
      room_category: room.room_category,
      max_adults: room.max_adults,
      max_children: room.max_children,
      total_rooms: room.total_rooms,
      available_rooms: room.available_rooms,
      room_size: room.room_size,
      room_size_unit: room.room_size_unit,
      private_bathroom: !!room.private_bathroom,
      balcony: !!room.balcony,
      air_conditioning: !!room.air_conditioning,
      description: room.description,
      pricing: {
        price: room.price,
        weekend_price: room.weekend_price,
        extra_guest_price: room.extra_guest_price,
        tax: room.tax,
      },
      images: roomImagesByRoom[room.id] || [],
      beds: bedsByRoom[room.id] || [],
      dorm_beds: dormBedsByRoom[room.id] || [],
      upcoming_availability: availabilityByRoom[room.id] || [],
    }));

    // ---------------------------------------------------------------------
    // 4. Approved reviews (with reviewer display name, respecting anonymity)
    // ---------------------------------------------------------------------
    const [reviewRows] = await conn.query(
      `SELECT
         pr.id, pr.rating, pr.title, pr.review, pr.is_anonymous, pr.created_at,
         u.id AS user_id, u.first_name, u.last_name
       FROM property_reviews pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.property_id = ? AND pr.status = 'approved'
       ORDER BY pr.created_at DESC
       LIMIT 50`,
      [propertyId]
    );

    const reviews = reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      review: r.review,
      created_at: r.created_at,
      reviewer_name: r.is_anonymous ? 'Anonymous Guest' : `${r.first_name} ${r.last_name ?? ''}`.trim(),
    }));

    // ---------------------------------------------------------------------
    // 5. Assemble final response
    // ---------------------------------------------------------------------
    return res.status(200).json({
      success: true,
      data: {
        id: property.id,
        slug: property.slug,
        property_name: property.property_name,
        property_type: property.property_type_name,
        description: property.description,
        star_rating: property.star_rating,
        check_in: property.check_in,
        check_out: property.check_out,
        total_rooms: property.total_rooms,
        min_price: property.min_price,
        max_price: property.max_price,
        is_featured: !!property.is_featured,
        average_rating: property.average_rating,
        total_reviews: property.total_reviews,
        latitude: property.latitude,
        longitude: property.longitude,
        contact: {
          name: property.contact_name,
          number: property.contact_number,
          email: property.email,
          website: property.website,
        },
        vendor: {
          id: property.vendor_id_ref,
          business_name: property.vendor_business_name,
          contact_person: `${property.vendor_first_name ?? ''} ${property.vendor_last_name ?? ''}`.trim(),
          phone: property.vendor_phone,
          email: property.vendor_email,
        },
        address: addressRows[0] || null,
        amenities: amenityRows,
        images: imageRows,
        policies: policyRows[0] || null,
        rules: ruleRows[0] || null,
        rooms,
        reviews,
        created_at: property.created_at,
        updated_at: property.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  } finally {
    conn.release();
  }
};

/**
 * Groups an array of rows by a given key into { [keyValue]: row[] }.
 */
function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    const groupKey = row[key];
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(row);
    return acc;
  }, {});
}

export default { getPropertyBySlug };