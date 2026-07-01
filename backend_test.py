"""
Smoke test for NEW Prostayz admin endpoints (settings, analytics, admin flights,
search merging custom+demo, flight book + cancel).
"""
import sys
import requests
from pathlib import Path

FRONTEND_ENV = Path("/app/frontend/.env")
BASE_URL = None
for line in FRONTEND_ENV.read_text().splitlines():
    if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
        BASE_URL = line.split("=", 1)[1].strip().strip('"').strip("'")
        break

assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not found"
API = f"{BASE_URL}/api"
print(f"Testing against: {API}")

results = []


def record(name, ok, detail=""):
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name} -- {detail}")
    results.append((name, ok, detail))


def main():
    # Login admin
    token = None
    try:
        r = requests.post(
            f"{API}/auth/login",
            json={"email": "admin@auratravel.com", "password": "admin123"},
            timeout=15,
        )
        d = r.json()
        token = d.get("token")
        ok = r.status_code == 200 and token and d.get("user", {}).get("role") == "admin"
        record("Admin login", ok, f"status={r.status_code} role={d.get('user', {}).get('role')}")
    except Exception as e:
        record("Admin login", False, str(e))
        sys.exit(1)

    if not token:
        sys.exit(1)
    H = {"Authorization": f"Bearer {token}"}

    # 1. GET /api/admin/settings (initial)
    try:
        r = requests.get(f"{API}/admin/settings", headers=H, timeout=15)
        d = r.json()
        keys_present = all(k in d for k in [
            "razorpay_key_id", "razorpay_mode", "app_name"
        ])
        ok = r.status_code == 200 and isinstance(d, dict) and keys_present
        record("1. GET /admin/settings", ok,
               f"status={r.status_code} keys={list(d.keys()) if isinstance(d, dict) else 'n/a'}")
    except Exception as e:
        record("1. GET /admin/settings", False, str(e))

    # 2. PUT /api/admin/settings
    try:
        body = {
            "razorpay_key_id": "rzp_test_dummy123",
            "razorpay_mode": "test",
            "app_name": "Prostayz",
        }
        r = requests.put(f"{API}/admin/settings", json=body, headers=H, timeout=15)
        d = r.json()
        ok = r.status_code == 200 and d.get("ok") is True
        record("2. PUT /admin/settings", ok,
               f"status={r.status_code} body={d}")
    except Exception as e:
        record("2. PUT /admin/settings", False, str(e))

    # 3. GET settings again - verify update reflected
    try:
        r = requests.get(f"{API}/admin/settings", headers=H, timeout=15)
        d = r.json()
        ok = (r.status_code == 200
              and d.get("razorpay_key_id") == "rzp_test_dummy123"
              and d.get("razorpay_mode") == "test"
              and d.get("app_name") == "Prostayz")
        record("3. GET /admin/settings (reflect update)", ok,
               f"status={r.status_code} razorpay_key_id={d.get('razorpay_key_id')} mode={d.get('razorpay_mode')} app_name={d.get('app_name')}")
    except Exception as e:
        record("3. GET /admin/settings (reflect)", False, str(e))

    # 4. GET /api/admin/analytics
    try:
        r = requests.get(f"{API}/admin/analytics", headers=H, timeout=15)
        d = r.json()
        rt = d.get("revenue_trend", [])
        bt = d.get("bookings_by_type", [])
        bs = d.get("bookings_by_status", [])
        td = d.get("top_destinations", [])
        ok = (r.status_code == 200
              and isinstance(rt, list) and len(rt) == 7
              and isinstance(bt, list)
              and isinstance(bs, list) and len(bs) == 4
              and isinstance(td, list))
        record("4. GET /admin/analytics", ok,
               f"status={r.status_code} rev_trend={len(rt)} by_type={len(bt)} by_status={len(bs)} top_dest={len(td)}")
    except Exception as e:
        record("4. GET /admin/analytics", False, str(e))

    # 5. POST /api/admin/flights
    created_flight_id = None
    try:
        body = {
            "flight_number": "6E-TEST",
            "airline": "IndiGo",
            "airline_code": "6E",
            "from_code": "DEL",
            "to_code": "BOM",
            "depart_time": "10:00",
            "arrive_time": "12:00",
            "duration_minutes": 120,
            "stops": 0,
            "price": 5000,
            "travel_class": "economy",
            "seats_available": 100,
        }
        r = requests.post(f"{API}/admin/flights", json=body, headers=H, timeout=15)
        d = r.json()
        created_flight_id = d.get("id")
        ok = (r.status_code == 200 and isinstance(created_flight_id, str)
              and d.get("flight_number") == "6E-TEST")
        record("5. POST /admin/flights", ok,
               f"status={r.status_code} flight_id={created_flight_id} flight_no={d.get('flight_number')}")
    except Exception as e:
        record("5. POST /admin/flights", False, str(e))

    # 6. GET /api/admin/flights (list contains created)
    try:
        r = requests.get(f"{API}/admin/flights", headers=H, timeout=15)
        d = r.json()
        found = isinstance(d, list) and any(f.get("id") == created_flight_id for f in d)
        ok = r.status_code == 200 and found
        record("6. GET /admin/flights contains created", ok,
               f"status={r.status_code} count={len(d) if isinstance(d, list) else 'n/a'} found={found}")
    except Exception as e:
        record("6. GET /admin/flights", False, str(e))

    # 7. POST /api/flights/search - should merge custom+demo
    try:
        body = {
            "from_code": "DEL", "to_code": "BOM",
            "depart_date": "2025-07-01", "trip_type": "oneway",
            "passengers": 1, "travel_class": "economy",
        }
        r = requests.post(f"{API}/flights/search", json=body, timeout=15)
        d = r.json()
        ob = d.get("outbound", [])
        has_custom = any(f.get("data_source") == "custom" or f.get("flight_number") == "6E-TEST"
                         for f in ob)
        has_demo = any(f.get("data_source") != "custom" and f.get("flight_number") != "6E-TEST"
                       for f in ob)
        first_is_custom = ob and (ob[0].get("data_source") == "custom"
                                  or ob[0].get("flight_number") == "6E-TEST")
        ok = (r.status_code == 200 and len(ob) >= 8
              and has_custom and has_demo
              and d.get("data_source") == "mixed")
        record("7. POST /flights/search (custom+demo merged)", ok,
               f"status={r.status_code} outbound={len(ob)} has_custom={has_custom} has_demo={has_demo} "
               f"first_is_custom={first_is_custom} source={d.get('data_source')}")
    except Exception as e:
        record("7. POST /flights/search merged", False, str(e))

    # 8. DELETE /api/admin/flights/{id}
    if created_flight_id:
        try:
            r = requests.delete(f"{API}/admin/flights/{created_flight_id}", headers=H, timeout=15)
            d = r.json()
            ok = r.status_code == 200 and d.get("deleted") == 1
            record("8. DELETE /admin/flights/{id}", ok,
                   f"status={r.status_code} body={d}")
        except Exception as e:
            record("8. DELETE /admin/flights/{id}", False, str(e))
    else:
        record("8. DELETE /admin/flights/{id}", False, "no created_flight_id")

    # 9. POST /api/flights/book - create flight booking for cancellation test
    flight_booking_id = None
    try:
        body = {
            "outbound": {"id": "demo-out", "price": 4500, "flight_number": "6E-100"},
            "passengers": [{"name": "Aarav Sharma", "age": "32", "gender": "M"}],
            "total_price": 4500,
        }
        r = requests.post(f"{API}/flights/book", json=body, headers=H, timeout=15)
        d = r.json()
        flight_booking_id = d.get("id")
        ok = (r.status_code == 200 and isinstance(flight_booking_id, str)
              and d.get("type") == "flight"
              and d.get("status") == "pending")
        record("9. POST /flights/book", ok,
               f"status={r.status_code} booking_id={flight_booking_id} status={d.get('status')}")
    except Exception as e:
        record("9. POST /flights/book", False, str(e))

    # 10. PATCH /api/bookings/{id}/cancel
    if flight_booking_id:
        try:
            r = requests.patch(f"{API}/bookings/{flight_booking_id}/cancel", headers=H, timeout=15)
            d = r.json()
            ok = r.status_code == 200 and d.get("ok") is True and d.get("status") == "cancelled"
            record("10. PATCH /bookings/{id}/cancel", ok,
                   f"status={r.status_code} body={d}")
        except Exception as e:
            record("10. PATCH /bookings/{id}/cancel", False, str(e))
    else:
        record("10. PATCH /bookings/{id}/cancel", False, "no flight_booking_id")

    print("\n=== SUMMARY ===")
    passes = sum(1 for _, ok, _ in results if ok)
    fails = sum(1 for _, ok, _ in results if not ok)
    print(f"Passed: {passes} / {len(results)}  Failed: {fails}")
    for name, ok, detail in results:
        if not ok:
            print(f"  FAILED: {name} -- {detail}")
    sys.exit(0 if fails == 0 else 1)


if __name__ == "__main__":
    main()
