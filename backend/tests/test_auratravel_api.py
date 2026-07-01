"""Backend API tests for AuraTravel."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://travel-stays-38.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@auratravel.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    return data["token"]


@pytest.fixture(scope="module")
def new_user(session):
    email = f"test_{uuid.uuid4().hex[:8]}@auratravel.com"
    r = session.post(f"{API}/auth/register", json={"name": "TEST User", "email": email, "password": "test1234"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "password": "test1234", "token": data["token"], "user": data["user"]}


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("app") == "AuraTravel"


# ---------- Auth ----------
class TestAuth:
    def test_register_and_login_new_user(self, session, new_user):
        assert new_user["user"]["email"] == new_user["email"]
        # login with same creds
        r = session.post(f"{API}/auth/login", json={"email": new_user["email"], "password": new_user["password"]})
        assert r.status_code == 200
        assert r.json()["user"]["email"] == new_user["email"]

    def test_register_duplicate_email(self, session, new_user):
        r = session.post(f"{API}/auth/register", json={"name": "x", "email": new_user["email"], "password": "test1234"})
        assert r.status_code == 400

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpw"})
        assert r.status_code == 401

    def test_me_requires_auth(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, session, admin_token):
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------- Stays ----------
class TestStays:
    def test_list_stays(self, session):
        r = session.get(f"{API}/stays")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 8, f"Expected 8+ stays, got {len(data)}"
        # validate shape
        item = data[0]
        for k in ("id", "title", "city", "category", "price_per_night", "images", "amenities"):
            assert k in item
        assert "_id" not in item

    def test_get_stay_by_id(self, session):
        r = session.get(f"{API}/stays/stay-1")
        assert r.status_code == 200
        assert r.json()["id"] == "stay-1"

    def test_get_stay_not_found(self, session):
        r = session.get(f"{API}/stays/does-not-exist")
        assert r.status_code == 404

    def test_filter_by_category(self, session):
        r = session.get(f"{API}/stays", params={"category": "Heritage"})
        assert r.status_code == 200
        data = r.json()
        assert all(s["category"] == "Heritage" for s in data)

    def test_search_query(self, session):
        r = session.get(f"{API}/stays", params={"q": "Manali"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1


# ---------- Packages ----------
class TestPackages:
    def test_list_packages(self, session):
        r = session.get(f"{API}/packages")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 6
        item = data[0]
        for k in ("id", "title", "destination", "price", "itinerary", "inclusions", "exclusions"):
            assert k in item
        assert isinstance(item["itinerary"], list) and len(item["itinerary"]) > 0
        assert "day" in item["itinerary"][0]

    def test_get_package(self, session):
        r = session.get(f"{API}/packages/pkg-1")
        assert r.status_code == 200
        assert r.json()["id"] == "pkg-1"

    def test_get_package_not_found(self, session):
        r = session.get(f"{API}/packages/does-not-exist")
        assert r.status_code == 404


# ---------- Wishlist ----------
class TestWishlist:
    def test_wishlist_requires_auth(self, session):
        r = session.get(f"{API}/wishlist")
        assert r.status_code == 401
        r2 = session.post(f"{API}/wishlist/toggle", json={"item_type": "stay", "item_id": "stay-1"})
        assert r2.status_code == 401

    def test_wishlist_toggle_and_list(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        # add
        r = session.post(f"{API}/wishlist/toggle", json={"item_type": "stay", "item_id": "stay-1"}, headers=h)
        assert r.status_code == 200
        assert r.json()["saved"] is True
        # list
        r2 = session.get(f"{API}/wishlist", headers=h)
        assert r2.status_code == 200
        data = r2.json()
        assert any(s["id"] == "stay-1" for s in data["stays"])
        # toggle off
        r3 = session.post(f"{API}/wishlist/toggle", json={"item_type": "stay", "item_id": "stay-1"}, headers=h)
        assert r3.json()["saved"] is False
        # add package
        r4 = session.post(f"{API}/wishlist/toggle", json={"item_type": "package", "item_id": "pkg-1"}, headers=h)
        assert r4.json()["saved"] is True
        r5 = session.get(f"{API}/wishlist", headers=h)
        assert any(p["id"] == "pkg-1" for p in r5.json()["packages"])


# ---------- Bookings ----------
class TestBookings:
    def test_bookings_requires_auth(self, session):
        assert session.get(f"{API}/bookings").status_code == 401
        assert session.post(f"{API}/bookings", json={
            "item_type": "stay", "item_id": "stay-1", "guests": 2, "total_price": 17000
        }).status_code == 401

    def test_create_stay_booking(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        r = session.post(f"{API}/bookings", json={
            "item_type": "stay",
            "item_id": "stay-1",
            "check_in": "2026-02-01",
            "check_out": "2026-02-03",
            "guests": 2,
            "total_price": 17000,
        }, headers=h)
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["item_type"] == "stay" and b["item_id"] == "stay-1"
        assert b["status"] == "confirmed"
        assert b["item_title"] and b["item_image"]
        # list
        r2 = session.get(f"{API}/bookings", headers=h)
        assert r2.status_code == 200
        assert any(x["id"] == b["id"] for x in r2.json())

    def test_create_package_booking(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        r = session.post(f"{API}/bookings", json={
            "item_type": "package", "item_id": "pkg-2", "guests": 2, "total_price": 36998,
        }, headers=h)
        assert r.status_code == 200
        assert r.json()["item_type"] == "package"

    def test_booking_invalid_item(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        r = session.post(f"{API}/bookings", json={
            "item_type": "stay", "item_id": "nope", "guests": 1, "total_price": 100
        }, headers=h)
        assert r.status_code == 404


# ---------- Reviews ----------
class TestReviews:
    def test_list_reviews_public(self, session):
        r = session.get(f"{API}/reviews", params={"item_type": "stay", "item_id": "stay-1"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_review_requires_auth(self, session):
        r = session.post(f"{API}/reviews", json={
            "item_type": "stay", "item_id": "stay-1", "rating": 5, "comment": "Nice"
        })
        assert r.status_code == 401

    def test_create_and_fetch_review(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        r = session.post(f"{API}/reviews", json={
            "item_type": "stay", "item_id": "stay-2", "rating": 5, "comment": "TEST review great cabin"
        }, headers=h)
        assert r.status_code == 200
        rid = r.json()["id"]
        r2 = session.get(f"{API}/reviews", params={"item_type": "stay", "item_id": "stay-2"})
        assert any(x["id"] == rid for x in r2.json())

    def test_review_rating_validation(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        r = session.post(f"{API}/reviews", json={
            "item_type": "stay", "item_id": "stay-1", "rating": 9, "comment": "bad rating"
        }, headers=h)
        assert r.status_code == 422


# ---------- AI Search ----------
class TestAiSearch:
    def test_ai_search_validation(self, session):
        r = session.post(f"{API}/ai/search", json={"query": ""})
        assert r.status_code == 422

    def test_ai_search_returns_response(self, session):
        r = session.post(f"{API}/ai/search", json={"query": "Suggest a Kerala trip under 40000"}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "response" in data and isinstance(data["response"], str) and len(data["response"]) > 10

