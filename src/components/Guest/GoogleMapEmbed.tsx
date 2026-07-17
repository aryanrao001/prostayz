interface GoogleMapEmbedProps {
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
  className?: string;
  height?: number;
}

/**
 * Free-tier Google Maps embed — uses the public `/maps?output=embed` iframe
 * endpoint, which needs no API key and no billing account, unlike the
 * Maps JavaScript/Embed API. Good enough for "show this property on a map"
 * across every property page. Falls back to a text-search query (city/area)
 * when a property has no lat/lng yet, so the map still renders something
 * useful instead of a blank box.
 */
const GoogleMapEmbed = ({ latitude, longitude, label, className = "", height = 320 }: GoogleMapEmbedProps) => {
  const query =
    latitude != null && longitude != null
      ? `${latitude},${longitude}`
      : label
      ? encodeURIComponent(label)
      : null;

  if (!query) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-[#E5DECF] bg-[#F5F2EA] text-[13px] text-[#9A917D] ${className}`}
        style={{ height }}
      >
        Location not available yet
      </div>
    );
  }

  const src = `https://www.google.com/maps?q=${query}&output=embed`;

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#E5DECF] ${className}`} style={{ height }}>
      <iframe
        title={label ? `Map showing ${label}` : "Property location"}
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default GoogleMapEmbed;
