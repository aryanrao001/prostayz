from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_DAYS = 7

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="AuraTravel API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRES_DAYS),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user.get("name"),
        "email": user["email"],
        "role": user.get("role", "user"),
        "created_at": user.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def admin_only(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def vendor_or_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ("admin", "vendor"):
        raise HTTPException(status_code=403, detail="Vendor or admin access required")
    return user


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    token: str
    user: dict


class Stay(BaseModel):
    id: str
    title: str
    location: str
    city: str
    country: str = "India"
    category: str  # Beachfront, Cabin, Luxury, Heritage, Mountain, Treehouse
    type: Literal["hotel", "villa"] = "villa"
    price_per_night: int
    rating: float
    reviews_count: int
    images: List[str]
    thumbnail: Optional[str] = None
    amenities: List[str]
    description: str
    host_name: str
    host_avatar: str
    max_guests: int
    bedrooms: int
    beds: int
    baths: int


class ItineraryDay(BaseModel):
    day: int
    title: str
    description: str


class HolidayPackage(BaseModel):
    id: str
    title: str
    destination: str
    duration_nights: int
    duration_days: int
    price: int
    original_price: Optional[int] = None
    rating: float
    reviews_count: int
    category: str  # Beach, Mountain, Heritage, Adventure, Wildlife, Spiritual
    cover_image: str
    cover_images: List[str] = []
    thumbnail: Optional[str] = None
    gallery: List[str]
    short_description: str
    highlights: List[str]
    itinerary: List[ItineraryDay]
    inclusions: List[str]
    exclusions: List[str]


class BookingCreate(BaseModel):
    item_type: Literal["stay", "package"]
    item_id: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    guests: int = 1
    total_price: int


class Booking(BaseModel):
    id: str
    user_id: str
    item_type: str
    item_id: str
    item_title: str
    item_image: str
    item_location: str
    check_in: Optional[str]
    check_out: Optional[str]
    guests: int
    total_price: int
    status: str
    created_at: str


class WishlistToggle(BaseModel):
    item_type: Literal["stay", "package"]
    item_id: str


class ReviewCreate(BaseModel):
    item_type: Literal["stay", "package"]
    item_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=1000)


class AiSearchIn(BaseModel):
    query: str = Field(min_length=1, max_length=500)


# Admin payloads — flexible (all optional except id) for upserts
class StayUpsert(BaseModel):
    title: str
    location: str
    city: str
    country: str = "India"
    category: str
    type: Literal["hotel", "villa"] = "villa"
    price_per_night: int
    rating: float = 4.8
    reviews_count: int = 0
    images: List[str]
    thumbnail: Optional[str] = None
    amenities: List[str]
    description: str
    host_name: str
    host_avatar: str = "https://i.pravatar.cc/150?img=12"
    max_guests: int = 2
    bedrooms: int = 1
    beds: int = 1
    baths: int = 1


class PackageUpsert(BaseModel):
    title: str
    destination: str
    duration_nights: int
    duration_days: int
    price: int
    original_price: Optional[int] = None
    rating: float = 4.8
    reviews_count: int = 0
    category: str
    cover_image: str = ""
    cover_images: List[str] = []
    thumbnail: Optional[str] = None
    gallery: List[str]
    short_description: str
    highlights: List[str]
    itinerary: List[ItineraryDay]
    inclusions: List[str]
    exclusions: List[str]


class BookingStatusUpdate(BaseModel):
    status: Literal["confirmed", "cancelled", "completed", "pending"]


class VendorApply(BaseModel):
    business_name: str = Field(min_length=2, max_length=100)
    business_type: str = Field(min_length=2, max_length=50)  # Hotel, Villa, Travel Agency, etc.
    phone: str = Field(min_length=5, max_length=20)
    city: str = Field(min_length=2, max_length=50)
    description: str = Field(min_length=10, max_length=500)


class VendorApproval(BaseModel):
    approved: bool


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@api.post("/auth/register", response_model=AuthOut)
async def register(body: RegisterIn):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "email": email,
        "password_hash": hash_password(body.password),
        "role": "user",
        "created_at": now_utc(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_doc["id"], user_doc["email"])
    return {"token": token, "user": public_user(user_doc)}


@api.post("/auth/login", response_model=AuthOut)
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": public_user(user)}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


# ---------------------------------------------------------------------------
# Stays endpoints
# ---------------------------------------------------------------------------
@api.get("/stays")
async def list_stays(category: Optional[str] = None, q: Optional[str] = None, type: Optional[str] = None, limit: int = 50):
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if type and type in ("hotel", "villa"):
        query["type"] = type
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.stays.find(query, {"_id": 0}).limit(limit)
    return await cursor.to_list(length=limit)


@api.get("/stays/{stay_id}")
async def get_stay(stay_id: str):
    stay = await db.stays.find_one({"id": stay_id}, {"_id": 0})
    if not stay:
        raise HTTPException(status_code=404, detail="Stay not found")
    return stay


# ---------------------------------------------------------------------------
# Packages endpoints
# ---------------------------------------------------------------------------
@api.get("/packages")
async def list_packages(category: Optional[str] = None, q: Optional[str] = None, limit: int = 50):
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"destination": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.packages.find(query, {"_id": 0}).limit(limit)
    return await cursor.to_list(length=limit)


@api.get("/packages/{package_id}")
async def get_package(package_id: str):
    pkg = await db.packages.find_one({"id": package_id}, {"_id": 0})
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg


# ---------------------------------------------------------------------------
# Wishlist endpoints
# ---------------------------------------------------------------------------
@api.post("/wishlist/toggle")
async def toggle_wishlist(body: WishlistToggle, user: dict = Depends(get_current_user)):
    existing = await db.wishlist.find_one({
        "user_id": user["id"], "item_type": body.item_type, "item_id": body.item_id
    })
    if existing:
        await db.wishlist.delete_one({"_id": existing["_id"]})
        return {"saved": False}
    await db.wishlist.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "item_type": body.item_type,
        "item_id": body.item_id,
        "created_at": now_utc(),
    })
    return {"saved": True}


@api.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(length=500)
    stay_ids = [w["item_id"] for w in items if w["item_type"] == "stay"]
    pkg_ids = [w["item_id"] for w in items if w["item_type"] == "package"]
    stays = await db.stays.find({"id": {"$in": stay_ids}}, {"_id": 0}).to_list(length=len(stay_ids)) if stay_ids else []
    packages = await db.packages.find({"id": {"$in": pkg_ids}}, {"_id": 0}).to_list(length=len(pkg_ids)) if pkg_ids else []
    return {"stays": stays, "packages": packages}


# ---------------------------------------------------------------------------
# Bookings endpoints
# ---------------------------------------------------------------------------
@api.post("/bookings", response_model=Booking)
async def create_booking(body: BookingCreate, user: dict = Depends(get_current_user)):
    if body.item_type == "stay":
        item = await db.stays.find_one({"id": body.item_id}, {"_id": 0})
    else:
        item = await db.packages.find_one({"id": body.item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    image = (item.get("images") or [item.get("cover_image")])[0] if body.item_type == "stay" else item.get("cover_image")
    location = item.get("location") or item.get("destination", "")

    booking = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "vendor_id": item.get("owner_id"),
        "item_type": body.item_type,
        "item_id": body.item_id,
        "item_title": item.get("title", ""),
        "item_image": image,
        "item_location": location,
        "check_in": body.check_in,
        "check_out": body.check_out,
        "guests": body.guests,
        "total_price": body.total_price,
        "status": "confirmed",
        "created_at": now_utc(),
    }
    await db.bookings.insert_one(booking)
    booking.pop("_id", None)
    return booking


@api.get("/bookings")
async def list_bookings(user: dict = Depends(get_current_user)):
    cursor = db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=200)


# ---------------------------------------------------------------------------
# Reviews endpoints
# ---------------------------------------------------------------------------
@api.get("/reviews")
async def list_reviews(item_type: str, item_id: str):
    cursor = db.reviews.find({"item_type": item_type, "item_id": item_id}, {"_id": 0}).sort("created_at", -1).limit(50)
    return await cursor.to_list(length=50)


@api.post("/reviews")
async def create_review(body: ReviewCreate, user: dict = Depends(get_current_user)):
    review = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name", "Traveler"),
        "item_type": body.item_type,
        "item_id": body.item_id,
        "rating": body.rating,
        "comment": body.comment,
        "created_at": now_utc(),
    }
    await db.reviews.insert_one(review)
    review.pop("_id", None)
    return review


# ---------------------------------------------------------------------------
# AI search endpoint
# ---------------------------------------------------------------------------
@api.post("/ai/search")
async def ai_search(body: AiSearchIn):
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    # Build compact catalog context so the LLM can recommend our inventory.
    stays = await db.stays.find({}, {"_id": 0, "id": 1, "title": 1, "location": 1, "category": 1, "price_per_night": 1}).to_list(length=50)
    packages = await db.packages.find({}, {"_id": 0, "id": 1, "title": 1, "destination": 1, "duration_nights": 1, "duration_days": 1, "price": 1, "category": 1}).to_list(length=50)

    catalog_stays = "\n".join([f"- [{s['id']}] {s['title']} · {s['location']} · {s['category']} · ₹{s['price_per_night']}/night" for s in stays])
    catalog_pkgs = "\n".join([f"- [{p['id']}] {p['title']} · {p['destination']} · {p['duration_nights']}N/{p['duration_days']}D · {p['category']} · ₹{p['price']}" for p in packages])

    system = (
        "You are Roamie, the friendly AI travel concierge for Prostayz — a premium Indian travel booking app. "
        "Your job is to craft inspiring trip plans and recommend items ONLY from the provided catalog below. "
        "ALWAYS include item ids in square brackets like [pkg-1] or [stay-3] after each recommendation so the user can tap them.\n\n"
        "When the user asks to PLAN a trip / itinerary (e.g. they mention destination + days / travelers / budget), "
        "respond in this exact structure:\n\n"
        "**Trip summary** — 1 short sentence setting the mood.\n\n"
        "**Day-by-day**\n"
        "Day 1: <title> — 1 line of what happens.\n"
        "Day 2: <title> — 1 line.\n"
        "…continue for every day requested.\n\n"
        "**Recommended stays**\n"
        "• <stay title> [stay-id] — one-line reason.\n"
        "• <stay title> [stay-id] — one-line reason.\n\n"
        "**Curated package** (if any fits)\n"
        "• <package title> [pkg-id] — one-line reason.\n\n"
        "**Budget note** — a realistic one-liner about fit.\n\n"
        "For casual questions (not trip planning), reply warmly in 3-5 bullet points with 2-4 recommended items from the catalog, each tagged with [id].\n"
        "If the query is unrelated to travel, gently steer it back to trip planning.\n\n"
        f"STAYS CATALOG:\n{catalog_stays}\n\nHOLIDAY PACKAGES CATALOG:\n{catalog_pkgs}"
    )

    try:
        chat = LlmChat(
            api_key=key,
            session_id=str(uuid.uuid4()),
            system_message=system,
        ).with_model("gemini", "gemini-2.5-flash")
        reply = await chat.send_message(UserMessage(text=body.query))
        return {"response": reply}
    except Exception as e:
        logger.exception("AI search failed")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")


# ---------------------------------------------------------------------------
# ADMIN endpoints (require role=admin)
# ---------------------------------------------------------------------------
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(admin_only)):
    bookings = await db.bookings.find({}, {"_id": 0}).to_list(length=10000)
    total_revenue = sum(b.get("total_price", 0) for b in bookings)
    confirmed = sum(1 for b in bookings if b.get("status") == "confirmed")
    cancelled = sum(1 for b in bookings if b.get("status") == "cancelled")

    users_total = await db.users.count_documents({})
    stays_total = await db.stays.count_documents({})
    pkgs_total = await db.packages.count_documents({})
    reviews_total = await db.reviews.count_documents({})

    # Top selling items
    top_counts: dict = {}
    for b in bookings:
        key = (b.get("item_type"), b.get("item_id"), b.get("item_title"))
        top_counts[key] = top_counts.get(key, 0) + 1
    top_sorted = sorted(top_counts.items(), key=lambda x: -x[1])[:5]
    top_items = [
        {"item_type": k[0], "item_id": k[1], "item_title": k[2], "bookings": v}
        for k, v in top_sorted
    ]

    # Recent bookings (last 8)
    recent = sorted(bookings, key=lambda b: b.get("created_at", ""), reverse=True)[:8]

    return {
        "totals": {
            "bookings": len(bookings),
            "revenue": total_revenue,
            "confirmed": confirmed,
            "cancelled": cancelled,
            "users": users_total,
            "stays": stays_total,
            "packages": pkgs_total,
            "reviews": reviews_total,
        },
        "top_items": top_items,
        "recent_bookings": recent,
    }


# ---- STAYS admin CRUD ----
@api.get("/admin/stays")
async def admin_list_stays(_: dict = Depends(admin_only)):
    return await db.stays.find({}, {"_id": 0}).to_list(length=500)


@api.post("/admin/stays")
async def admin_create_stay(body: StayUpsert, _: dict = Depends(admin_only)):
    doc = body.model_dump()
    doc["id"] = f"stay-{uuid.uuid4().hex[:8]}"
    doc["created_at"] = now_utc()
    await db.stays.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/stays/{stay_id}")
async def admin_update_stay(stay_id: str, body: StayUpsert, _: dict = Depends(admin_only)):
    update = body.model_dump()
    result = await db.stays.update_one({"id": stay_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Stay not found")
    doc = await db.stays.find_one({"id": stay_id}, {"_id": 0})
    return doc


@api.delete("/admin/stays/{stay_id}")
async def admin_delete_stay(stay_id: str, _: dict = Depends(admin_only)):
    result = await db.stays.delete_one({"id": stay_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stay not found")
    await db.wishlist.delete_many({"item_type": "stay", "item_id": stay_id})
    return {"ok": True}


# ---- PACKAGES admin CRUD ----
@api.get("/admin/packages")
async def admin_list_packages(_: dict = Depends(admin_only)):
    return await db.packages.find({}, {"_id": 0}).to_list(length=500)


@api.post("/admin/packages")
async def admin_create_package(body: PackageUpsert, _: dict = Depends(admin_only)):
    doc = body.model_dump()
    doc["id"] = f"pkg-{uuid.uuid4().hex[:8]}"
    doc["created_at"] = now_utc()
    await db.packages.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/packages/{pkg_id}")
async def admin_update_package(pkg_id: str, body: PackageUpsert, _: dict = Depends(admin_only)):
    update = body.model_dump()
    result = await db.packages.update_one({"id": pkg_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    doc = await db.packages.find_one({"id": pkg_id}, {"_id": 0})
    return doc


@api.delete("/admin/packages/{pkg_id}")
async def admin_delete_package(pkg_id: str, _: dict = Depends(admin_only)):
    result = await db.packages.delete_one({"id": pkg_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    await db.wishlist.delete_many({"item_type": "package", "item_id": pkg_id})
    return {"ok": True}


# ---- BOOKINGS admin ----
@api.get("/admin/bookings")
async def admin_list_bookings(_: dict = Depends(admin_only)):
    cursor = db.bookings.find({}, {"_id": 0}).sort("created_at", -1)
    bookings = await cursor.to_list(length=1000)
    # Enrich with user email/name
    user_ids = list({b["user_id"] for b in bookings})
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "name": 1, "email": 1}).to_list(length=len(user_ids))
    umap = {u["id"]: u for u in users}
    for b in bookings:
        u = umap.get(b["user_id"], {})
        b["user_name"] = u.get("name", "—")
        b["user_email"] = u.get("email", "—")
    return bookings


@api.put("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, body: BookingStatusUpdate, _: dict = Depends(admin_only)):
    result = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": body.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    doc = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return doc


@api.delete("/admin/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str, _: dict = Depends(admin_only)):
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"ok": True}


# ---- USERS admin ----
@api.get("/admin/users")
async def admin_list_users(_: dict = Depends(admin_only)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(length=1000)
    user_ids = [u["id"] for u in users]
    # Batch aggregate counts to avoid N+1
    book_counts = {d["_id"]: d["count"] async for d in db.bookings.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
    ])}
    wish_counts = {d["_id"]: d["count"] async for d in db.wishlist.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
    ])}
    for u in users:
        u["bookings_count"] = book_counts.get(u["id"], 0)
        u["wishlist_count"] = wish_counts.get(u["id"], 0)
    return users


# ---- REVIEWS admin ----
@api.get("/admin/reviews")
async def admin_list_reviews(_: dict = Depends(admin_only)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=500)


@api.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, _: dict = Depends(admin_only)):
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}


# ---- VENDORS admin ----
@api.get("/admin/vendors")
async def admin_list_vendors(_: dict = Depends(admin_only)):
    vendors = await db.vendors.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    vendor_user_ids = [v["user_id"] for v in vendors]
    # Batch aggregate counts/revenue
    stays_counts = {d["_id"]: d["count"] async for d in db.stays.aggregate([
        {"$match": {"owner_id": {"$in": vendor_user_ids}}},
        {"$group": {"_id": "$owner_id", "count": {"$sum": 1}}},
    ])}
    packages_counts = {d["_id"]: d["count"] async for d in db.packages.aggregate([
        {"$match": {"owner_id": {"$in": vendor_user_ids}}},
        {"$group": {"_id": "$owner_id", "count": {"$sum": 1}}},
    ])}
    bookings_agg = {d["_id"]: d async for d in db.bookings.aggregate([
        {"$match": {"vendor_id": {"$in": vendor_user_ids}}},
        {"$group": {
            "_id": "$vendor_id",
            "count": {"$sum": 1},
            "revenue": {"$sum": {"$cond": [{"$ne": ["$status", "cancelled"]}, "$total_price", 0]}},
        }},
    ])}
    for v in vendors:
        v["stays_count"] = stays_counts.get(v["user_id"], 0)
        v["packages_count"] = packages_counts.get(v["user_id"], 0)
        agg = bookings_agg.get(v["user_id"])
        v["bookings_count"] = agg["count"] if agg else 0
        v["revenue"] = agg["revenue"] if agg else 0
    return vendors


@api.put("/admin/vendors/{vendor_id}")
async def admin_approve_vendor(vendor_id: str, body: VendorApproval, _: dict = Depends(admin_only)):
    new_status = "approved" if body.approved else "rejected"
    result = await db.vendors.update_one({"id": vendor_id}, {"$set": {"status": new_status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if body.approved:
        await db.users.update_one({"id": vendor["user_id"]}, {"$set": {"role": "vendor"}})
    return vendor


# ---------------------------------------------------------------------------
# VENDOR endpoints (vendor self-service)
# ---------------------------------------------------------------------------
@api.post("/vendor/apply")
async def vendor_apply(body: VendorApply, user: dict = Depends(get_current_user)):
    existing = await db.vendors.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Vendor application already exists")
    vendor = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "business_name": body.business_name,
        "business_type": body.business_type,
        "phone": body.phone,
        "city": body.city,
        "description": body.description,
        "status": "approved",
        "created_at": now_utc(),
    }
    await db.vendors.insert_one(vendor)
    await db.users.update_one({"id": user["id"]}, {"$set": {"role": "vendor"}})
    vendor.pop("_id", None)
    return vendor


@api.get("/vendor/me")
async def vendor_me(user: dict = Depends(vendor_or_admin)):
    v = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    return v or {}


@api.get("/vendor/stats")
async def vendor_stats(user: dict = Depends(vendor_or_admin)):
    bookings = await db.bookings.find({"vendor_id": user["id"]}, {"_id": 0}).to_list(length=5000)
    revenue = sum(b.get("total_price", 0) for b in bookings if b.get("status") != "cancelled")
    confirmed = sum(1 for b in bookings if b.get("status") == "confirmed")
    cancelled = sum(1 for b in bookings if b.get("status") == "cancelled")
    stays = await db.stays.count_documents({"owner_id": user["id"]})
    packages = await db.packages.count_documents({"owner_id": user["id"]})
    recent = sorted(bookings, key=lambda b: b.get("created_at", ""), reverse=True)[:8]
    return {
        "totals": {"bookings": len(bookings), "revenue": revenue, "confirmed": confirmed,
                   "cancelled": cancelled, "stays": stays, "packages": packages},
        "recent_bookings": recent,
    }


@api.get("/vendor/stays")
async def vendor_stays(user: dict = Depends(vendor_or_admin)):
    return await db.stays.find({"owner_id": user["id"]}, {"_id": 0}).to_list(length=500)


@api.post("/vendor/stays")
async def vendor_create_stay(body: StayUpsert, user: dict = Depends(vendor_or_admin)):
    doc = body.model_dump()
    doc["id"] = f"stay-{uuid.uuid4().hex[:8]}"
    doc["owner_id"] = user["id"]
    doc["owner_name"] = user.get("name")
    doc["created_at"] = now_utc()
    await db.stays.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/vendor/stays/{stay_id}")
async def vendor_update_stay(stay_id: str, body: StayUpsert, user: dict = Depends(vendor_or_admin)):
    stay = await db.stays.find_one({"id": stay_id}, {"_id": 0})
    if not stay:
        raise HTTPException(status_code=404, detail="Stay not found")
    if user.get("role") != "admin" and stay.get("owner_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.stays.update_one({"id": stay_id}, {"$set": body.model_dump()})
    return await db.stays.find_one({"id": stay_id}, {"_id": 0})


@api.delete("/vendor/stays/{stay_id}")
async def vendor_delete_stay(stay_id: str, user: dict = Depends(vendor_or_admin)):
    stay = await db.stays.find_one({"id": stay_id}, {"_id": 0})
    if not stay:
        raise HTTPException(status_code=404, detail="Stay not found")
    if user.get("role") != "admin" and stay.get("owner_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.stays.delete_one({"id": stay_id})
    await db.wishlist.delete_many({"item_type": "stay", "item_id": stay_id})
    return {"ok": True}


@api.get("/vendor/packages")
async def vendor_packages(user: dict = Depends(vendor_or_admin)):
    return await db.packages.find({"owner_id": user["id"]}, {"_id": 0}).to_list(length=500)


@api.post("/vendor/packages")
async def vendor_create_package(body: PackageUpsert, user: dict = Depends(vendor_or_admin)):
    doc = body.model_dump()
    doc["id"] = f"pkg-{uuid.uuid4().hex[:8]}"
    doc["owner_id"] = user["id"]
    doc["owner_name"] = user.get("name")
    doc["created_at"] = now_utc()
    await db.packages.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/vendor/packages/{pkg_id}")
async def vendor_update_package(pkg_id: str, body: PackageUpsert, user: dict = Depends(vendor_or_admin)):
    pkg = await db.packages.find_one({"id": pkg_id}, {"_id": 0})
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    if user.get("role") != "admin" and pkg.get("owner_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.packages.update_one({"id": pkg_id}, {"$set": body.model_dump()})
    return await db.packages.find_one({"id": pkg_id}, {"_id": 0})


@api.delete("/vendor/packages/{pkg_id}")
async def vendor_delete_package(pkg_id: str, user: dict = Depends(vendor_or_admin)):
    pkg = await db.packages.find_one({"id": pkg_id}, {"_id": 0})
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    if user.get("role") != "admin" and pkg.get("owner_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.packages.delete_one({"id": pkg_id})
    await db.wishlist.delete_many({"item_type": "package", "item_id": pkg_id})
    return {"ok": True}


@api.get("/vendor/bookings")
async def vendor_bookings(user: dict = Depends(vendor_or_admin)):
    cursor = db.bookings.find({"vendor_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    bookings = await cursor.to_list(length=1000)
    user_ids = list({b["user_id"] for b in bookings})
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "name": 1, "email": 1}).to_list(length=len(user_ids))
    umap = {u["id"]: u for u in users}
    for b in bookings:
        u = umap.get(b["user_id"], {})
        b["user_name"] = u.get("name", "—")
        b["user_email"] = u.get("email", "—")
    return bookings



# ---------------------------------------------------------------------------
# Flights endpoints (with demo data + Amadeus-ready abstraction)
# ---------------------------------------------------------------------------
INDIAN_AIRPORTS = [
    ("DEL", "Delhi", "Indira Gandhi Intl"),
    ("BOM", "Mumbai", "Chhatrapati Shivaji"),
    ("BLR", "Bengaluru", "Kempegowda Intl"),
    ("MAA", "Chennai", "Chennai Intl"),
    ("HYD", "Hyderabad", "Rajiv Gandhi Intl"),
    ("CCU", "Kolkata", "Netaji Subhas Chandra"),
    ("GOI", "Goa", "Dabolim"),
    ("COK", "Kochi", "Cochin Intl"),
    ("PNQ", "Pune", "Pune Airport"),
    ("AMD", "Ahmedabad", "Sardar Vallabhbhai"),
    ("JAI", "Jaipur", "Jaipur Intl"),
    ("LKO", "Lucknow", "Chaudhary Charan Singh"),
    ("IXC", "Chandigarh", "Chandigarh Intl"),
    ("SXR", "Srinagar", "Sheikh ul-Alam"),
    ("GAU", "Guwahati", "LGB Intl"),
    ("ATQ", "Amritsar", "Sri Guru Ram Dass"),
    ("VNS", "Varanasi", "Lal Bahadur Shastri"),
    ("PAT", "Patna", "Jay Prakash Narayan"),
    ("IXR", "Ranchi", "Birsa Munda"),
    ("DED", "Dehradun", "Jolly Grant"),
]

AIRLINES = [
    {"code": "AI", "name": "Air India", "logo": "https://logos-world.net/wp-content/uploads/2023/01/Air-India-Logo.png"},
    {"code": "6E", "name": "IndiGo", "logo": "https://logos-world.net/wp-content/uploads/2023/01/IndiGo-Logo.png"},
    {"code": "SG", "name": "SpiceJet", "logo": "https://logos-world.net/wp-content/uploads/2023/01/SpiceJet-Logo.png"},
    {"code": "UK", "name": "Vistara", "logo": "https://logos-world.net/wp-content/uploads/2023/01/Vistara-Logo.png"},
    {"code": "I5", "name": "AIX Connect", "logo": "https://logos-world.net/wp-content/uploads/2023/01/Air-India-Express-Logo.png"},
    {"code": "QP", "name": "Akasa Air", "logo": "https://logos-world.net/wp-content/uploads/2023/01/Akasa-Air-Logo.png"},
]


class FlightSearchRequest(BaseModel):
    from_code: str  # IATA code like DEL
    to_code: str
    depart_date: str  # YYYY-MM-DD
    return_date: Optional[str] = None
    passengers: int = 1
    travel_class: Literal["economy", "premium", "business", "first"] = "economy"
    trip_type: Literal["oneway", "round"] = "oneway"


@api.get("/flights/airports")
async def list_airports():
    return [{"code": c, "city": city, "name": name} for c, city, name in INDIAN_AIRPORTS]


def _generate_demo_flights(from_code: str, to_code: str, date_str: str, travel_class: str) -> List[dict]:
    """Generate deterministic demo flights for a given route/date."""
    import hashlib
    from_city = next((c[1] for c in INDIAN_AIRPORTS if c[0] == from_code), from_code)
    to_city = next((c[1] for c in INDIAN_AIRPORTS if c[0] == to_code), to_code)
    base_seed = int(hashlib.md5(f"{from_code}{to_code}{date_str}".encode()).hexdigest()[:8], 16)

    flights = []
    departure_hours = [6, 9, 12, 14, 17, 20, 22]
    for i, dep_hour in enumerate(departure_hours):
        airline = AIRLINES[(base_seed + i) % len(AIRLINES)]
        duration_min = 90 + (base_seed % 60) + (i * 7) % 30  # 90-180 min
        arr_min = dep_hour * 60 + duration_min
        arr_hour = (arr_min // 60) % 24
        arr_minute = arr_min % 60
        next_day = arr_min >= 24 * 60

        base_price = 3500 + ((base_seed + i * 1234) % 7000)
        class_multiplier = {"economy": 1.0, "premium": 1.6, "business": 3.2, "first": 5.0}.get(travel_class, 1.0)
        price = int(base_price * class_multiplier)

        stops = 0 if i % 3 != 1 else 1
        flight_no = f"{airline['code']}-{(base_seed + i) % 900 + 100}"

        flights.append({
            "id": f"{flight_no}-{date_str}",
            "flight_number": flight_no,
            "airline": airline["name"],
            "airline_code": airline["code"],
            "airline_logo": airline["logo"],
            "from_code": from_code,
            "from_city": from_city,
            "to_code": to_code,
            "to_city": to_city,
            "depart_date": date_str,
            "depart_time": f"{dep_hour:02d}:00",
            "arrive_time": f"{arr_hour:02d}:{arr_minute:02d}",
            "next_day_arrival": next_day,
            "duration_minutes": duration_min,
            "duration_label": f"{duration_min // 60}h {duration_min % 60:02d}m",
            "stops": stops,
            "stop_label": "Non-stop" if stops == 0 else f"{stops} stop",
            "price": price,
            "currency": "INR",
            "class": travel_class,
            "baggage": "15 kg" if travel_class == "economy" else "25 kg",
            "cabin_baggage": "7 kg",
            "refundable": travel_class in ("business", "first"),
        })
    return flights


@api.post("/flights/search")
async def search_flights(req: FlightSearchRequest):
    """Search flights. Merges admin/vendor-added custom flights with demo data."""
    if not req.from_code or not req.to_code:
        raise HTTPException(status_code=400, detail="Origin and destination required")
    if req.from_code == req.to_code:
        raise HTTPException(status_code=400, detail="Origin and destination cannot be the same")

    # Custom DB-stored flights
    custom_outbound = []
    async for cf in db.flights.find({"from_code": req.from_code, "to_code": req.to_code, "active": {"$ne": False}}, {"_id": 0}):
        custom_outbound.append({**cf, "depart_date": req.depart_date, "data_source": "custom"})

    outbound = custom_outbound + _generate_demo_flights(req.from_code, req.to_code, req.depart_date, req.travel_class)

    inbound: List[dict] = []
    if req.trip_type == "round" and req.return_date:
        custom_inbound = []
        async for cf in db.flights.find({"from_code": req.to_code, "to_code": req.from_code, "active": {"$ne": False}}, {"_id": 0}):
            custom_inbound.append({**cf, "depart_date": req.return_date, "data_source": "custom"})
        inbound = custom_inbound + _generate_demo_flights(req.to_code, req.from_code, req.return_date, req.travel_class)

    return {
        "trip_type": req.trip_type,
        "from": req.from_code,
        "to": req.to_code,
        "depart_date": req.depart_date,
        "return_date": req.return_date,
        "passengers": req.passengers,
        "class": req.travel_class,
        "outbound": outbound,
        "inbound": inbound,
        "data_source": "mixed" if custom_outbound else "demo",
    }


@api.post("/flights/book")
async def book_flight(payload: dict, user: dict = Depends(get_current_user)):
    """Create a flight booking record (no payment yet)."""
    booking_id = str(uuid.uuid4())
    booking = {
        "id": booking_id,
        "user_id": user["id"],
        "type": "flight",
        "outbound": payload.get("outbound"),
        "inbound": payload.get("inbound"),
        "passengers": payload.get("passengers", []),
        "total_price": int(payload.get("total_price", 0)),
        "currency": "INR",
        "status": "pending",
        "created_at": now_utc(),
    }
    await db.flight_bookings.insert_one(booking)
    booking.pop("_id", None)
    return booking


@api.get("/flights/my-bookings")
async def my_flight_bookings(user: dict = Depends(get_current_user)):
    cursor = db.flight_bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50)
    return await cursor.to_list(length=50)


# ---------------------------------------------------------------------------
# Razorpay Payment endpoints
# ---------------------------------------------------------------------------
def _razorpay_client():
    try:
        import razorpay
    except ImportError:
        return None
    # First check DB-stored settings, then env
    key_id = ""
    key_secret = ""
    try:
        cfg = _get_settings_sync()
        key_id = (cfg.get("razorpay_key_id") or "").strip()
        key_secret = (cfg.get("razorpay_key_secret") or "").strip()
    except Exception:
        pass
    if not key_id:
        key_id = os.environ.get("RAZORPAY_KEY_ID", "").strip()
        key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
    if not key_id or not key_secret or key_id.startswith("PLACEHOLDER"):
        return None
    return razorpay.Client(auth=(key_id, key_secret))


def _get_settings_sync():
    """Get settings synchronously from cached or default."""
    return _settings_cache.get("doc", {})


_settings_cache: dict = {"doc": {}}


async def refresh_settings_cache():
    doc = await db.settings.find_one({"_id": "global_config"}) or {}
    _settings_cache["doc"] = doc


def _get_razorpay_key_id() -> str:
    cfg = _get_settings_sync()
    return (cfg.get("razorpay_key_id") or os.environ.get("RAZORPAY_KEY_ID", "")).strip()


class CreatePaymentOrder(BaseModel):
    amount: int  # in INR (rupees, will be converted to paise)
    booking_id: Optional[str] = None
    booking_type: Optional[str] = None  # flight/stay/package
    notes: Optional[dict] = None


@api.get("/payments/config")
async def payment_config():
    """Returns public Razorpay key for frontend checkout."""
    key_id = _get_razorpay_key_id()
    enabled = bool(key_id and not key_id.startswith("PLACEHOLDER"))
    return {
        "razorpay_key_id": key_id if enabled else None,
        "enabled": enabled,
        "mode": "live" if key_id.startswith("rzp_live") else "test",
    }


@api.post("/payments/create-order")
async def create_payment_order(payload: CreatePaymentOrder, user: dict = Depends(get_current_user)):
    """Create a Razorpay order. Falls back to mock order if Razorpay keys not configured."""
    amount_paise = max(100, int(payload.amount) * 100)
    client = _razorpay_client()

    if client:
        try:
            razor_order = client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": (payload.booking_id or f"ord_{uuid.uuid4().hex[:12]}")[:40],
                "payment_capture": 1,
                "notes": payload.notes or {},
            })
            await db.payment_orders.insert_one({
                "order_id": razor_order["id"],
                "user_id": user["id"],
                "amount_paise": amount_paise,
                "booking_id": payload.booking_id,
                "booking_type": payload.booking_type,
                "status": "created",
                "created_at": now_utc(),
                "provider": "razorpay",
            })
            return {
                "order_id": razor_order["id"],
                "amount": amount_paise,
                "currency": "INR",
                "key_id": os.environ.get("RAZORPAY_KEY_ID"),
                "mock": False,
            }
        except Exception as e:
            logger.error("Razorpay order creation failed: %s", e)
            raise HTTPException(status_code=500, detail=f"Payment provider error: {str(e)}")

    # Mock mode: simulate an order for UI testing
    mock_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
    await db.payment_orders.insert_one({
        "order_id": mock_order_id,
        "user_id": user["id"],
        "amount_paise": amount_paise,
        "booking_id": payload.booking_id,
        "booking_type": payload.booking_type,
        "status": "created",
        "created_at": now_utc(),
        "provider": "mock",
    })
    return {
        "order_id": mock_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "key_id": None,
        "mock": True,
    }


class VerifyPayment(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: Optional[str] = None
    booking_id: Optional[str] = None
    booking_type: Optional[str] = None


@api.post("/payments/verify")
async def verify_payment(payload: VerifyPayment, user: dict = Depends(get_current_user)):
    """Verify Razorpay signature and confirm the booking."""
    client = _razorpay_client()
    verified = False

    if client and payload.razorpay_signature:
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
            })
            verified = True
        except Exception as e:
            logger.error("Signature verification failed: %s", e)
            raise HTTPException(status_code=400, detail="Invalid payment signature")
    else:
        # Mock mode - accept all
        verified = True

    if verified:
        await db.payment_orders.update_one(
            {"order_id": payload.razorpay_order_id},
            {"$set": {"status": "paid", "payment_id": payload.razorpay_payment_id, "paid_at": now_utc()}},
        )
        # Update the related booking if any
        if payload.booking_id and payload.booking_type:
            collection = {
                "flight": db.flight_bookings,
                "stay": db.bookings,
                "package": db.bookings,
            }.get(payload.booking_type)
            if collection is not None:
                await collection.update_one(
                    {"id": payload.booking_id},
                    {"$set": {"status": "confirmed", "payment_id": payload.razorpay_payment_id, "paid_at": now_utc()}},
                )

    return {"verified": verified, "status": "paid"}


# ---------------------------------------------------------------------------
# Settings endpoints (admin only)
# ---------------------------------------------------------------------------
class AppSettings(BaseModel):
    razorpay_key_id: Optional[str] = ""
    razorpay_key_secret: Optional[str] = ""
    razorpay_mode: Optional[str] = "test"
    amadeus_client_id: Optional[str] = ""
    amadeus_client_secret: Optional[str] = ""
    serpapi_key: Optional[str] = ""
    sender_email: Optional[str] = ""
    support_phone: Optional[str] = ""
    app_name: Optional[str] = "Prostayz"
    tagline: Optional[str] = "Plan your perfect journey"


@api.get("/admin/settings")
async def get_admin_settings(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    doc = await db.settings.find_one({"_id": "global_config"}) or {}
    # Mask secrets except first 4 chars for safety
    def mask(s: str) -> str:
        if not s: return ""
        return s if len(s) <= 8 else f"{s[:4]}{'*'*(len(s)-8)}{s[-4:]}"
    return {
        "razorpay_key_id": doc.get("razorpay_key_id", ""),
        "razorpay_key_secret_masked": mask(doc.get("razorpay_key_secret", "")),
        "razorpay_key_secret_set": bool(doc.get("razorpay_key_secret")),
        "razorpay_mode": doc.get("razorpay_mode", "test"),
        "amadeus_client_id": doc.get("amadeus_client_id", ""),
        "amadeus_client_secret_set": bool(doc.get("amadeus_client_secret")),
        "serpapi_key_set": bool(doc.get("serpapi_key")),
        "sender_email": doc.get("sender_email", ""),
        "support_phone": doc.get("support_phone", ""),
        "app_name": doc.get("app_name", "Prostayz"),
        "tagline": doc.get("tagline", "Plan your perfect journey"),
    }


@api.put("/admin/settings")
async def update_admin_settings(payload: AppSettings, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    update_doc: dict = {}
    for k, v in payload.dict(exclude_unset=True).items():
        # Skip empty secret fields (keep existing)
        if k.endswith("_secret") and not v:
            continue
        update_doc[k] = v
    await db.settings.update_one({"_id": "global_config"}, {"$set": update_doc}, upsert=True)
    await refresh_settings_cache()
    return {"ok": True, "updated_fields": list(update_doc.keys())}


# ---------------------------------------------------------------------------
# Custom flights CRUD (admin + vendor)
# ---------------------------------------------------------------------------
class CustomFlight(BaseModel):
    flight_number: str
    airline: str
    airline_code: str
    airline_logo: Optional[str] = ""
    from_code: str
    to_code: str
    depart_time: str  # HH:MM
    arrive_time: str
    duration_minutes: int
    next_day_arrival: bool = False
    stops: int = 0
    price: int
    travel_class: str = "economy"
    baggage: str = "15 kg"
    cabin_baggage: str = "7 kg"
    refundable: bool = False
    seats_available: int = 100
    active: bool = True


def _flight_to_response(d: dict) -> dict:
    return {
        "id": d.get("id"),
        "flight_number": d.get("flight_number"),
        "airline": d.get("airline"),
        "airline_code": d.get("airline_code"),
        "airline_logo": d.get("airline_logo", ""),
        "from_code": d.get("from_code"),
        "from_city": next((c[1] for c in INDIAN_AIRPORTS if c[0] == d.get("from_code")), d.get("from_code")),
        "to_code": d.get("to_code"),
        "to_city": next((c[1] for c in INDIAN_AIRPORTS if c[0] == d.get("to_code")), d.get("to_code")),
        "depart_time": d.get("depart_time"),
        "arrive_time": d.get("arrive_time"),
        "duration_minutes": d.get("duration_minutes"),
        "duration_label": f"{int(d.get('duration_minutes', 0)) // 60}h {int(d.get('duration_minutes', 0)) % 60:02d}m",
        "next_day_arrival": d.get("next_day_arrival", False),
        "stops": d.get("stops", 0),
        "stop_label": "Non-stop" if d.get("stops", 0) == 0 else f"{d.get('stops')} stop",
        "price": d.get("price"),
        "currency": "INR",
        "class": d.get("travel_class", "economy"),
        "baggage": d.get("baggage", "15 kg"),
        "cabin_baggage": d.get("cabin_baggage", "7 kg"),
        "refundable": d.get("refundable", False),
        "seats_available": d.get("seats_available", 100),
        "active": d.get("active", True),
        "owner_id": d.get("owner_id"),
    }


@api.get("/admin/flights")
async def list_admin_flights(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    docs = []
    async for d in db.flights.find({}, {"_id": 0}).sort("created_at", -1):
        docs.append(_flight_to_response(d))
    return docs


@api.post("/admin/flights")
async def create_admin_flight(payload: CustomFlight, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    flight_id = str(uuid.uuid4())
    doc = {**payload.dict(), "id": flight_id, "owner_id": user["id"], "created_at": now_utc()}
    await db.flights.insert_one(doc)
    doc.pop("_id", None)
    return _flight_to_response(doc)


@api.put("/admin/flights/{flight_id}")
async def update_admin_flight(flight_id: str, payload: CustomFlight, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    res = await db.flights.update_one({"id": flight_id}, {"$set": payload.dict()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flight not found")
    doc = await db.flights.find_one({"id": flight_id}, {"_id": 0})
    return _flight_to_response(doc)


@api.delete("/admin/flights/{flight_id}")
async def delete_admin_flight(flight_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    res = await db.flights.delete_one({"id": flight_id})
    return {"deleted": res.deleted_count}


@api.get("/vendor/flights")
async def list_vendor_flights(user: dict = Depends(get_current_user)):
    if user.get("role") not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Vendor only")
    query = {} if user.get("role") == "admin" else {"owner_id": user["id"]}
    docs = []
    async for d in db.flights.find(query, {"_id": 0}).sort("created_at", -1):
        docs.append(_flight_to_response(d))
    return docs


@api.post("/vendor/flights")
async def create_vendor_flight(payload: CustomFlight, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Vendor only")
    flight_id = str(uuid.uuid4())
    doc = {**payload.dict(), "id": flight_id, "owner_id": user["id"], "created_at": now_utc()}
    await db.flights.insert_one(doc)
    doc.pop("_id", None)
    return _flight_to_response(doc)


@api.delete("/vendor/flights/{flight_id}")
async def delete_vendor_flight(flight_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Vendor only")
    query = {"id": flight_id}
    if user.get("role") != "admin":
        query["owner_id"] = user["id"]
    res = await db.flights.delete_one(query)
    return {"deleted": res.deleted_count}


# ---------------------------------------------------------------------------
# Analytics for dashboard charts
# ---------------------------------------------------------------------------
@api.get("/admin/analytics")
async def admin_analytics(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    from datetime import timedelta, datetime, timezone
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]

    # Revenue trend (last 7 days)
    revenue_trend = []
    for d in days:
        next_d = d + timedelta(days=1)
        agg = [
            {"$match": {"created_at": {"$gte": d, "$lt": next_d}, "status": {"$in": ["confirmed", "completed"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$total_price"}, "count": {"$sum": 1}}},
        ]
        r = await db.bookings.aggregate(agg).to_list(length=1)
        f = await db.flight_bookings.aggregate(agg).to_list(length=1)
        rev = (r[0]["total"] if r else 0) + (f[0]["total"] if f else 0)
        cnt = (r[0]["count"] if r else 0) + (f[0]["count"] if f else 0)
        revenue_trend.append({
            "date": d.strftime("%Y-%m-%d"),
            "label": d.strftime("%a"),
            "revenue": rev,
            "bookings": cnt,
        })

    # Bookings by type (pie)
    stay_count = await db.bookings.count_documents({"item_type": "stay"})
    pkg_count = await db.bookings.count_documents({"item_type": "package"})
    flight_count = await db.flight_bookings.count_documents({})
    by_type = [
        {"label": "Stays", "value": stay_count, "color": "#6B8E5A"},
        {"label": "Packages", "value": pkg_count, "color": "#8B6FA6"},
        {"label": "Flights", "value": flight_count, "color": "#C97B5C"},
    ]

    # Bookings by status
    statuses = ["pending", "confirmed", "cancelled", "completed"]
    by_status = []
    colors = {"pending": "#F4B400", "confirmed": "#6B8E5A", "cancelled": "#E45F44", "completed": "#5A8C6E"}
    for s in statuses:
        c = await db.bookings.count_documents({"status": s})
        cf = await db.flight_bookings.count_documents({"status": s})
        by_status.append({"label": s.capitalize(), "value": c + cf, "color": colors[s]})

    # Top destinations
    pipeline = [
        {"$match": {"item_type": {"$in": ["stay", "package"]}}},
        {"$group": {"_id": "$item_title", "count": {"$sum": 1}, "revenue": {"$sum": "$total_price"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_dest = []
    async for d in db.bookings.aggregate(pipeline):
        top_dest.append({"label": d["_id"], "count": d["count"], "revenue": d["revenue"]})

    return {
        "revenue_trend": revenue_trend,
        "bookings_by_type": by_type,
        "bookings_by_status": by_status,
        "top_destinations": top_dest,
    }


# ---------------------------------------------------------------------------
# User booking cancellation
# ---------------------------------------------------------------------------
@api.patch("/bookings/{booking_id}/cancel")
async def cancel_my_booking(booking_id: str, user: dict = Depends(get_current_user)):
    # Try stays/packages bookings first
    doc = await db.bookings.find_one({"id": booking_id, "user_id": user["id"]})
    collection_name = "bookings"
    if not doc:
        doc = await db.flight_bookings.find_one({"id": booking_id, "user_id": user["id"]})
        collection_name = "flight_bookings"
    if not doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    if doc.get("status") == "cancelled":
        return {"ok": True, "status": "cancelled", "message": "Already cancelled"}
    coll = db.bookings if collection_name == "bookings" else db.flight_bookings
    await coll.update_one({"id": booking_id}, {"$set": {"status": "cancelled", "cancelled_at": now_utc()}})
    return {"ok": True, "status": "cancelled"}


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"app": "Prostayz", "status": "ok"}



app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
KERALA_IMG = "https://images.pexels.com/photos/35080149/pexels-photo-35080149.jpeg"
KERALA_IMG2 = "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?crop=entropy&cs=srgb&fm=jpg"
HIMALAYA_IMG = "https://images.pexels.com/photos/28689395/pexels-photo-28689395.jpeg"
HIMALAYA_IMG2 = "https://images.unsplash.com/photo-1645033393637-9089ab100756?crop=entropy&cs=srgb&fm=jpg"
RAJ_IMG = "https://images.pexels.com/photos/570031/pexels-photo-570031.jpeg"
RAJ_IMG2 = "https://images.unsplash.com/photo-1601571574713-349e4e867fa6?crop=entropy&cs=srgb&fm=jpg"
RESORT_IMG = "https://images.pexels.com/photos/33726144/pexels-photo-33726144.jpeg"
RESORT_IMG2 = "https://images.unsplash.com/photo-1694366454450-7979697bab21?crop=entropy&cs=srgb&fm=jpg"
RESORT_IMG3 = "https://images.unsplash.com/photo-1695124565997-6f6552b1edb2?crop=entropy&cs=srgb&fm=jpg"
HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/b2ca5880-2dc3-4cdc-96c9-ed68b55a540b/images/e66d7ca0df99271d0f7bdec1d483eec81afcc8d4c33c6558517143bc65344f1a.png"

AVATARS = [
    "https://i.pravatar.cc/150?img=32",
    "https://i.pravatar.cc/150?img=47",
    "https://i.pravatar.cc/150?img=12",
    "https://i.pravatar.cc/150?img=25",
    "https://i.pravatar.cc/150?img=68",
    "https://i.pravatar.cc/150?img=5",
]

STAYS_SEED = [
    {
        "id": "stay-1",
        "title": "Serene Kerala Houseboat",
        "location": "Alleppey, Kerala",
        "city": "Alleppey",
        "country": "India",
        "category": "Houseboat",
        "price_per_night": 8500,
        "rating": 4.92,
        "reviews_count": 184,
        "images": [KERALA_IMG, KERALA_IMG2, RESORT_IMG],
        "amenities": ["Wi-Fi", "AC", "Private deck", "Meals included", "Sunset cruise"],
        "description": "Drift through Kerala's emerald backwaters on a hand-crafted teak houseboat. Wake up to birdsong, enjoy chef-prepared Keralan meals, and unwind on the private sundeck.",
        "host_name": "Arjun Menon",
        "host_avatar": AVATARS[0],
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 2,
    },
    {
        "id": "stay-2",
        "title": "Himalayan Pinewood Cabin",
        "location": "Manali, Himachal Pradesh",
        "city": "Manali",
        "country": "India",
        "category": "Cabin",
        "price_per_night": 6200,
        "rating": 4.85,
        "reviews_count": 231,
        "images": [HIMALAYA_IMG, HIMALAYA_IMG2, RESORT_IMG2],
        "amenities": ["Fireplace", "Wi-Fi", "Mountain view", "Heater", "Breakfast"],
        "description": "A cosy pine cabin perched above the Beas valley. Floor-to-ceiling windows frame the snow-capped peaks, and a log fire keeps winter evenings warm.",
        "host_name": "Priya Sharma",
        "host_avatar": AVATARS[1],
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 3,
        "baths": 1,
    },
    {
        "id": "stay-3",
        "title": "Royal Haveli Suite",
        "location": "Udaipur, Rajasthan",
        "city": "Udaipur",
        "country": "India",
        "category": "Heritage",
        "price_per_night": 12500,
        "rating": 4.97,
        "reviews_count": 412,
        "images": [RAJ_IMG, RAJ_IMG2, RESORT_IMG3],
        "amenities": ["Lake view", "Pool", "Spa", "Wi-Fi", "AC", "Breakfast"],
        "description": "Live like royalty in a hand-painted haveli overlooking Lake Pichola. Expect silk drapes, carved jharokhas, and personalised butler service.",
        "host_name": "Maharaj Vikram",
        "host_avatar": AVATARS[2],
        "max_guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "baths": 1,
    },
    {
        "id": "stay-4",
        "title": "Beachfront Villa, Palolem",
        "location": "South Goa",
        "city": "Goa",
        "country": "India",
        "category": "Beachfront",
        "price_per_night": 9800,
        "rating": 4.88,
        "reviews_count": 276,
        "images": [RESORT_IMG, RESORT_IMG2, KERALA_IMG2],
        "amenities": ["Private beach", "Pool", "Wi-Fi", "AC", "Chef on request"],
        "description": "Step out of your suite onto the golden sands of Palolem. This contemporary villa blends Goan-Portuguese architecture with modern comforts.",
        "host_name": "Neha D'Souza",
        "host_avatar": AVATARS[3],
        "max_guests": 6,
        "bedrooms": 3,
        "beds": 4,
        "baths": 3,
    },
    {
        "id": "stay-5",
        "title": "Ladakh Stargazing Dome",
        "location": "Nubra Valley, Ladakh",
        "city": "Leh",
        "country": "India",
        "category": "Unique",
        "price_per_night": 11200,
        "rating": 4.94,
        "reviews_count": 98,
        "images": [HIMALAYA_IMG2, HIMALAYA_IMG, RESORT_IMG3],
        "amenities": ["Transparent ceiling", "Heater", "Meals included", "Telescope"],
        "description": "A climate-controlled geodesic dome set against the Karakoram ranges. Fall asleep under a canopy of stars at 10,000 ft.",
        "host_name": "Tenzin Dorje",
        "host_avatar": AVATARS[4],
        "max_guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "baths": 1,
    },
    {
        "id": "stay-6",
        "title": "Rishikesh Riverside Treehouse",
        "location": "Rishikesh, Uttarakhand",
        "city": "Rishikesh",
        "country": "India",
        "category": "Treehouse",
        "price_per_night": 5400,
        "rating": 4.8,
        "reviews_count": 156,
        "images": [HIMALAYA_IMG, RESORT_IMG, KERALA_IMG],
        "amenities": ["River view", "Yoga deck", "Organic meals", "Wi-Fi"],
        "description": "Cradled in the canopy beside the Ganges. Morning yoga, afternoon rafting and evening aarti — all steps from your door.",
        "host_name": "Ananya Rawat",
        "host_avatar": AVATARS[5],
        "max_guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "baths": 1,
    },
    {
        "id": "stay-7",
        "title": "Jaipur Heritage Suite",
        "location": "Jaipur, Rajasthan",
        "city": "Jaipur",
        "country": "India",
        "category": "Heritage",
        "price_per_night": 7800,
        "rating": 4.82,
        "reviews_count": 189,
        "images": [RAJ_IMG2, RAJ_IMG, RESORT_IMG2],
        "amenities": ["Courtyard pool", "AC", "Wi-Fi", "Breakfast", "Rooftop"],
        "description": "A lovingly restored merchant's mansion in the heart of Jaipur's old city. Frescoed ceilings, stained glass, modern plumbing.",
        "host_name": "Rohan Singh",
        "host_avatar": AVATARS[0],
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "baths": 2,
    },
    {
        "id": "stay-8",
        "title": "Munnar Tea Estate Bungalow",
        "location": "Munnar, Kerala",
        "city": "Munnar",
        "country": "India",
        "category": "Mountain",
        "price_per_night": 8900,
        "rating": 4.89,
        "reviews_count": 203,
        "images": [KERALA_IMG2, KERALA_IMG, HIMALAYA_IMG],
        "amenities": ["Private garden", "Fireplace", "Wi-Fi", "Plantation walk"],
        "description": "A colonial-era planter's bungalow surrounded by emerald tea terraces. Guided walks, bonfire evenings and filter coffee at dawn.",
        "host_name": "George Varghese",
        "host_avatar": AVATARS[1],
        "max_guests": 5,
        "bedrooms": 3,
        "beds": 3,
        "baths": 2,
    },
]

PACKAGES_SEED = [
    {
        "id": "pkg-1",
        "title": "Kerala Backwaters & Beaches",
        "destination": "Kochi • Alleppey • Varkala",
        "duration_nights": 5,
        "duration_days": 6,
        "price": 34999,
        "original_price": 42000,
        "rating": 4.9,
        "reviews_count": 318,
        "category": "Beach",
        "cover_image": KERALA_IMG,
        "gallery": [KERALA_IMG, KERALA_IMG2, RESORT_IMG],
        "short_description": "Glide through palm-fringed canals and unwind on cliffside beaches — God's own escape, curated.",
        "highlights": ["Overnight houseboat", "Sunset at Varkala Cliff", "Kathakali performance", "Spice plantation tour"],
        "itinerary": [
            {"day": 1, "title": "Arrive in Kochi", "description": "Heritage walk through Fort Kochi, Chinese fishing nets at sunset, and a welcome Sadhya dinner."},
            {"day": 2, "title": "Munnar Tea Country", "description": "Scenic drive to Munnar. Afternoon plantation visit and Eravikulam wildlife park."},
            {"day": 3, "title": "Alleppey Houseboat", "description": "Board a premium houseboat. Cruise the backwaters with freshly caught karimeen for lunch."},
            {"day": 4, "title": "Varkala Cliff", "description": "Transfer to Varkala. Evening yoga and seafood at the cliff-top cafés."},
            {"day": 5, "title": "Leisure at Varkala", "description": "Optional ayurveda spa, beach time, and sunset reflection."},
            {"day": 6, "title": "Departure", "description": "Transfer to Trivandrum airport with a parting coconut welcome kit."},
        ],
        "inclusions": ["5 nights premium stays", "All breakfasts + 3 dinners", "Private AC car", "English-speaking guide", "Houseboat cruise"],
        "exclusions": ["Flights", "Personal expenses", "Travel insurance", "Alcoholic beverages"],
    },
    {
        "id": "pkg-2",
        "title": "Manali Adventure Escape",
        "destination": "Manali • Solang • Sissu",
        "duration_nights": 3,
        "duration_days": 4,
        "price": 18499,
        "original_price": 22000,
        "rating": 4.82,
        "reviews_count": 246,
        "category": "Adventure",
        "cover_image": HIMALAYA_IMG,
        "gallery": [HIMALAYA_IMG, HIMALAYA_IMG2, RESORT_IMG2],
        "short_description": "Paragliding, snow trails and pinewood nights in the Beas valley.",
        "highlights": ["Solang paragliding", "Atal Tunnel to Sissu", "Old Manali cafes", "Riverside bonfire"],
        "itinerary": [
            {"day": 1, "title": "Arrive Manali", "description": "Check in to a riverside cabin. Evening walk on Mall Road."},
            {"day": 2, "title": "Solang Valley", "description": "Full day adventure — paragliding, ATV, zip-line. Sunset at a local cafe."},
            {"day": 3, "title": "Atal Tunnel & Sissu", "description": "Drive through India's longest high-altitude tunnel to Sissu's frozen lake."},
            {"day": 4, "title": "Departure", "description": "Visit Hadimba temple, lunch and transfer to Bhuntar airport."},
        ],
        "inclusions": ["3 nights cabin stay", "Daily breakfast + 2 dinners", "Private SUV", "Paragliding voucher", "Airport transfers"],
        "exclusions": ["Flights", "Monument fees", "Ski equipment", "Personal shopping"],
    },
    {
        "id": "pkg-3",
        "title": "Royal Rajasthan Heritage",
        "destination": "Jaipur • Jodhpur • Udaipur",
        "duration_nights": 6,
        "duration_days": 7,
        "price": 52999,
        "original_price": 64000,
        "rating": 4.95,
        "reviews_count": 421,
        "category": "Heritage",
        "cover_image": RAJ_IMG,
        "gallery": [RAJ_IMG, RAJ_IMG2, RESORT_IMG3],
        "short_description": "Palaces, forts and desert sunsets — three royal cities in seven unforgettable days.",
        "highlights": ["Amber Fort elephant walk", "Mehrangarh at dusk", "Lake Pichola boat ride", "Private folk dinner"],
        "itinerary": [
            {"day": 1, "title": "Arrive Jaipur", "description": "Welcome dinner at a royal haveli with live folk music."},
            {"day": 2, "title": "Pink City Tour", "description": "Amber Fort, City Palace, Hawa Mahal and the bazaars of Johari."},
            {"day": 3, "title": "Drive to Jodhpur", "description": "Arrive the Blue City. Sunset walk to Mehrangarh Fort."},
            {"day": 4, "title": "Jodhpur & Bishnoi Villages", "description": "Morning at Jaswant Thada. Afternoon jeep safari to craft villages."},
            {"day": 5, "title": "Drive to Udaipur", "description": "Stop at Ranakpur's marble Jain temple. Check in to a lakeside heritage stay."},
            {"day": 6, "title": "Lake City", "description": "City Palace, Saheliyon ki Bari and a private boat ride on Lake Pichola."},
            {"day": 7, "title": "Departure", "description": "Breakfast and transfer to Udaipur airport."},
        ],
        "inclusions": ["6 nights heritage hotels", "All breakfasts + 4 dinners", "Private luxury car", "English guide", "Elephant & boat rides"],
        "exclusions": ["Flights", "Monument entries", "Camel safari upgrade", "Tips"],
    },
    {
        "id": "pkg-4",
        "title": "Ladakh Highlands Expedition",
        "destination": "Leh • Nubra • Pangong",
        "duration_nights": 5,
        "duration_days": 6,
        "price": 42999,
        "original_price": 52000,
        "rating": 4.91,
        "reviews_count": 156,
        "category": "Mountain",
        "cover_image": HIMALAYA_IMG2,
        "gallery": [HIMALAYA_IMG2, HIMALAYA_IMG, RESORT_IMG],
        "short_description": "Highest motorable passes, lunar deserts and midnight stars — a Himalayan odyssey.",
        "highlights": ["Khardung La pass", "Bactrian camel ride in Nubra", "Pangong Tso sunrise", "Monastery tour"],
        "itinerary": [
            {"day": 1, "title": "Arrive Leh", "description": "Rest day for acclimatisation. Evening monastery walk."},
            {"day": 2, "title": "Leh Sightseeing", "description": "Shanti Stupa, Leh Palace and Sangam viewpoint."},
            {"day": 3, "title": "Nubra Valley via Khardung La", "description": "Drive across the world's highest motorable road. Sand dunes and double-humped camels."},
            {"day": 4, "title": "Pangong Tso", "description": "Scenic drive via Shyok. Overnight in a premium lakeside camp."},
            {"day": 5, "title": "Return to Leh", "description": "Stop at Hemis and Thiksey monasteries."},
            {"day": 6, "title": "Departure", "description": "Transfer to Leh airport."},
        ],
        "inclusions": ["5 nights stay (including luxury camp)", "All meals", "SUV with driver", "Inner-line permits", "Oxygen support"],
        "exclusions": ["Flights", "Monastery entries", "Personal shopping", "Additional snacks"],
    },
    {
        "id": "pkg-5",
        "title": "Goa Leisure Getaway",
        "destination": "North & South Goa",
        "duration_nights": 3,
        "duration_days": 4,
        "price": 21999,
        "original_price": 28000,
        "rating": 4.78,
        "reviews_count": 389,
        "category": "Beach",
        "cover_image": RESORT_IMG,
        "gallery": [RESORT_IMG, RESORT_IMG2, KERALA_IMG2],
        "short_description": "Sundowners, shacks, and sunsets — the laid-back Goa everyone dreams of.",
        "highlights": ["Dudhsagar Falls trip", "Sunset cruise on the Mandovi", "Fontainhas heritage walk", "Beach-shack dinners"],
        "itinerary": [
            {"day": 1, "title": "Arrive Goa", "description": "Check in to a beachfront villa. Sunset at Baga Beach."},
            {"day": 2, "title": "North Goa Tour", "description": "Chapora Fort, Anjuna flea market and a Mandovi dinner cruise."},
            {"day": 3, "title": "South Goa Beaches", "description": "Palolem, Agonda and a spice plantation lunch."},
            {"day": 4, "title": "Departure", "description": "Breakfast and transfer to Goa airport."},
        ],
        "inclusions": ["3 nights beachfront stay", "Daily breakfast", "Airport transfers", "Dudhsagar tour", "Cruise tickets"],
        "exclusions": ["Flights", "Water sports", "Alcohol", "Personal shopping"],
    },
    {
        "id": "pkg-6",
        "title": "Rishikesh Yoga & Rafting",
        "destination": "Rishikesh • Haridwar",
        "duration_nights": 3,
        "duration_days": 4,
        "price": 15999,
        "original_price": 19000,
        "rating": 4.86,
        "reviews_count": 174,
        "category": "Spiritual",
        "cover_image": HIMALAYA_IMG,
        "gallery": [HIMALAYA_IMG, KERALA_IMG, RESORT_IMG3],
        "short_description": "Sunrise yoga on the Ganges, whitewater rapids and the aarti at Triveni Ghat.",
        "highlights": ["16 km river rafting", "Beatles Ashram visit", "Ganga aarti ceremony", "Daily sunrise yoga"],
        "itinerary": [
            {"day": 1, "title": "Arrive Rishikesh", "description": "Riverside check-in. Evening Ganga aarti at Parmarth Niketan."},
            {"day": 2, "title": "Yoga & Rafting", "description": "Morning asanas. Afternoon 16 km rafting from Shivpuri."},
            {"day": 3, "title": "Haridwar Day Trip", "description": "Har Ki Pauri aarti, Mansa Devi ropeway and vegetarian thali."},
            {"day": 4, "title": "Departure", "description": "Closing meditation and transfer to Dehradun airport."},
        ],
        "inclusions": ["3 nights riverside stay", "All vegetarian meals", "Rafting gear", "Yoga sessions", "Airport transfers"],
        "exclusions": ["Flights", "Personal expenses", "Photography add-ons", "Insurance"],
    },
]


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@auratravel.com")
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": email,
            "password_hash": hash_password(password),
            "role": "admin",
            "created_at": now_utc(),
        })
        logger.info("Admin user seeded: %s", email)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
        logger.info("Admin password updated")


async def seed_catalog():
    count_stays = await db.stays.count_documents({})
    if count_stays == 0:
        await db.stays.insert_many([dict(s) for s in STAYS_SEED])
        logger.info("Seeded %d stays", len(STAYS_SEED))
    count_pkgs = await db.packages.count_documents({})
    if count_pkgs == 0:
        await db.packages.insert_many([dict(p) for p in PACKAGES_SEED])
        logger.info("Seeded %d packages", len(PACKAGES_SEED))


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.stays.create_index("id", unique=True)
    await db.packages.create_index("id", unique=True)
    await db.wishlist.create_index([("user_id", 1), ("item_type", 1), ("item_id", 1)])
    await db.bookings.create_index([("user_id", 1), ("created_at", -1)])
    await seed_admin()
    await seed_catalog()
    # Migration: ensure all stays have a type field
    hotel_categories = {"Beachfront", "Heritage", "Luxury", "Resort"}
    async for stay in db.stays.find({"type": {"$exists": False}}, {"id": 1, "category": 1}):
        t = "hotel" if stay.get("category") in hotel_categories else "villa"
        await db.stays.update_one({"id": stay["id"]}, {"$set": {"type": t}})
    await refresh_settings_cache()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
