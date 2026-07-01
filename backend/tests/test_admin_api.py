"""Admin endpoint tests for GoROAM/AuraTravel API.

Verifies: role-based access (403 for non-admin), CRUD for stays/packages,
booking + user + review admin endpoints, stats payload shape.
"""
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://travel-stays-38.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@auratravel.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_h(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    assert r.json()["user"].get("role") == "admin"
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def user_h(session):
    email = f"test_user_{uuid.uuid4().hex[:6]}@auratravel.com"
    r = session.post(f"{API}/auth/register", json={"name": "TEST User", "email": email, "password": "test1234"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}, r.json()["user"]


# --- RBAC ---
class TestAdminRBAC:
    """Admin endpoints must reject non-admin users with 403 and missing auth with 401."""

    @pytest.mark.parametrize("path", [
        "/admin/stats", "/admin/stays", "/admin/packages",
        "/admin/bookings", "/admin/users", "/admin/reviews",
    ])
    def test_non_admin_forbidden(self, session, user_h, path):
        h, _ = user_h
        r = session.get(f"{API}{path}", headers=h)
        assert r.status_code == 403, f"{path}: expected 403, got {r.status_code} {r.text}"

    @pytest.mark.parametrize("path", [
        "/admin/stats", "/admin/stays", "/admin/packages",
        "/admin/bookings", "/admin/users", "/admin/reviews",
    ])
    def test_no_auth_unauthorized(self, session, path):
        r = session.get(f"{API}{path}")
        assert r.status_code == 401


# --- Stats ---
class TestAdminStats:
    def test_stats_shape(self, session, admin_h):
        r = session.get(f"{API}/admin/stats", headers=admin_h)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "totals" in data and "top_items" in data and "recent_bookings" in data
        for k in ("bookings", "revenue", "confirmed", "cancelled", "users", "stays", "packages", "reviews"):
            assert k in data["totals"], f"missing total: {k}"
        assert isinstance(data["top_items"], list)
        assert isinstance(data["recent_bookings"], list)


# --- Stays CRUD ---
class TestAdminStaysCRUD:
    created_id = None

    def test_list(self, session, admin_h):
        r = session.get(f"{API}/admin/stays", headers=admin_h)
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) >= 8

    def test_create(self, session, admin_h):
        payload = {
            "title": "TEST_Beach Villa",
            "location": "Test Beach, Test",
            "city": "TestCity",
            "country": "India",
            "category": "Beachfront",
            "price_per_night": 5500,
            "rating": 4.7,
            "reviews_count": 10,
            "images": ["https://example.com/a.jpg", "https://example.com/b.jpg"],
            "amenities": ["WiFi", "Pool"],
            "description": "A lovely test villa.",
            "host_name": "Test Host",
            "host_avatar": "https://i.pravatar.cc/150?img=12",
            "max_guests": 4,
            "bedrooms": 2,
            "beds": 2,
            "baths": 1,
        }
        r = session.post(f"{API}/admin/stays", json=payload, headers=admin_h)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["id"].startswith("stay-") and doc["title"] == "TEST_Beach Villa"
        assert "_id" not in doc
        TestAdminStaysCRUD.created_id = doc["id"]

    def test_get_via_public(self, session):
        sid = TestAdminStaysCRUD.created_id
        assert sid
        r = session.get(f"{API}/stays/{sid}")
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Beach Villa"

    def test_update(self, session, admin_h):
        sid = TestAdminStaysCRUD.created_id
        payload = {
            "title": "TEST_Beach Villa Updated",
            "location": "Test Beach, Test",
            "city": "TestCity",
            "country": "India",
            "category": "Beachfront",
            "price_per_night": 6000,
            "rating": 4.8,
            "reviews_count": 12,
            "images": ["https://example.com/a.jpg"],
            "amenities": ["WiFi", "Pool", "AC"],
            "description": "Updated.",
            "host_name": "Test Host",
            "host_avatar": "https://i.pravatar.cc/150?img=12",
            "max_guests": 4,
            "bedrooms": 2,
            "beds": 2,
            "baths": 1,
        }
        r = session.put(f"{API}/admin/stays/{sid}", json=payload, headers=admin_h)
        assert r.status_code == 200, r.text
        assert r.json()["title"] == "TEST_Beach Villa Updated"
        # verify persistence
        r2 = session.get(f"{API}/stays/{sid}")
        assert r2.json()["price_per_night"] == 6000

    def test_delete(self, session, admin_h):
        sid = TestAdminStaysCRUD.created_id
        r = session.delete(f"{API}/admin/stays/{sid}", headers=admin_h)
        assert r.status_code == 200 and r.json().get("ok") is True
        # verify gone
        r2 = session.get(f"{API}/stays/{sid}")
        assert r2.status_code == 404

    def test_update_non_existing(self, session, admin_h):
        payload = {
            "title": "x", "location": "x", "city": "x", "country": "India", "category": "x",
            "price_per_night": 1, "rating": 1.0, "reviews_count": 0,
            "images": [], "amenities": [], "description": "x", "host_name": "x",
            "host_avatar": "x", "max_guests": 1, "bedrooms": 1, "beds": 1, "baths": 1,
        }
        r = session.put(f"{API}/admin/stays/nope-missing", json=payload, headers=admin_h)
        assert r.status_code == 404


# --- Packages CRUD ---
class TestAdminPackagesCRUD:
    created_id = None

    def test_create(self, session, admin_h):
        payload = {
            "title": "TEST_Adventure Trek",
            "destination": "TestPeak",
            "duration_nights": 3,
            "duration_days": 4,
            "price": 15000,
            "original_price": 18000,
            "rating": 4.5,
            "reviews_count": 5,
            "category": "Adventure",
            "cover_image": "https://example.com/cover.jpg",
            "gallery": ["https://example.com/1.jpg"],
            "short_description": "Test trek.",
            "highlights": ["High view"],
            "itinerary": [
                {"day": 1, "title": "Arrive", "description": "Reach base."},
                {"day": 2, "title": "Trek", "description": "Climb summit."},
            ],
            "inclusions": ["Stay"],
            "exclusions": ["Flights"],
        }
        r = session.post(f"{API}/admin/packages", json=payload, headers=admin_h)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["id"].startswith("pkg-")
        assert len(doc["itinerary"]) == 2 and doc["itinerary"][0]["day"] == 1
        TestAdminPackagesCRUD.created_id = doc["id"]

    def test_update_itinerary(self, session, admin_h):
        pid = TestAdminPackagesCRUD.created_id
        payload = {
            "title": "TEST_Adventure Trek v2", "destination": "TestPeak",
            "duration_nights": 4, "duration_days": 5, "price": 16000,
            "original_price": 19000, "rating": 4.6, "reviews_count": 6,
            "category": "Adventure", "cover_image": "https://example.com/cover.jpg",
            "gallery": ["https://example.com/1.jpg"], "short_description": "v2",
            "highlights": ["High view"],
            "itinerary": [
                {"day": 1, "title": "A", "description": "."},
                {"day": 2, "title": "B", "description": "."},
                {"day": 3, "title": "C", "description": "."},
            ],
            "inclusions": ["Stay"], "exclusions": ["Flights"],
        }
        r = session.put(f"{API}/admin/packages/{pid}", json=payload, headers=admin_h)
        assert r.status_code == 200, r.text
        assert len(r.json()["itinerary"]) == 3
        # persistence via public
        r2 = session.get(f"{API}/packages/{pid}")
        assert r2.json()["title"] == "TEST_Adventure Trek v2"

    def test_delete(self, session, admin_h):
        pid = TestAdminPackagesCRUD.created_id
        r = session.delete(f"{API}/admin/packages/{pid}", headers=admin_h)
        assert r.status_code == 200
        assert session.get(f"{API}/packages/{pid}").status_code == 404


# --- Bookings admin ---
class TestAdminBookings:
    booking_id = None

    def test_list_bookings_enriched(self, session, admin_h, user_h):
        h, user = user_h
        # create a booking as user
        r = session.post(f"{API}/bookings", json={
            "item_type": "stay", "item_id": "stay-1", "guests": 2, "total_price": 17000,
            "check_in": "2026-02-10", "check_out": "2026-02-12"
        }, headers=h)
        assert r.status_code == 200
        TestAdminBookings.booking_id = r.json()["id"]

        # admin list
        r2 = session.get(f"{API}/admin/bookings", headers=admin_h)
        assert r2.status_code == 200
        items = r2.json()
        assert isinstance(items, list) and len(items) >= 1
        mine = next((b for b in items if b["id"] == TestAdminBookings.booking_id), None)
        assert mine is not None
        assert mine.get("user_email") == user["email"]
        assert mine.get("user_name")

    def test_update_status(self, session, admin_h):
        bid = TestAdminBookings.booking_id
        r = session.put(f"{API}/admin/bookings/{bid}", json={"status": "completed"}, headers=admin_h)
        assert r.status_code == 200
        assert r.json()["status"] == "completed"

    def test_update_status_invalid(self, session, admin_h):
        bid = TestAdminBookings.booking_id
        r = session.put(f"{API}/admin/bookings/{bid}", json={"status": "bogus"}, headers=admin_h)
        assert r.status_code == 422

    def test_delete_booking(self, session, admin_h):
        bid = TestAdminBookings.booking_id
        r = session.delete(f"{API}/admin/bookings/{bid}", headers=admin_h)
        assert r.status_code == 200
        # verify removed
        r2 = session.get(f"{API}/admin/bookings", headers=admin_h)
        assert not any(b["id"] == bid for b in r2.json())


# --- Users admin ---
class TestAdminUsers:
    def test_list_users_counts(self, session, admin_h, user_h):
        _, user = user_h
        r = session.get(f"{API}/admin/users", headers=admin_h)
        assert r.status_code == 200
        users = r.json()
        target = next((u for u in users if u["id"] == user["id"]), None)
        assert target is not None
        assert "bookings_count" in target and "wishlist_count" in target
        assert "password_hash" not in target


# --- Reviews admin ---
class TestAdminReviews:
    def test_list_and_delete_review(self, session, admin_h, user_h):
        h, _ = user_h
        # create review
        r = session.post(f"{API}/reviews", json={
            "item_type": "stay", "item_id": "stay-3", "rating": 5, "comment": "TEST_admin review"
        }, headers=h)
        assert r.status_code == 200
        rid = r.json()["id"]
        # admin list contains it
        r2 = session.get(f"{API}/admin/reviews", headers=admin_h)
        assert r2.status_code == 200
        assert any(x["id"] == rid for x in r2.json())
        # delete
        r3 = session.delete(f"{API}/admin/reviews/{rid}", headers=admin_h)
        assert r3.status_code == 200
        # gone
        r4 = session.get(f"{API}/admin/reviews", headers=admin_h)
        assert not any(x["id"] == rid for x in r4.json())
