# 🌍 Village Location API

A production-style hierarchical location API for Indian states, districts, subdistricts, and villages with autocomplete, filtering, caching, authentication, and rate limiting support.

---

## 🔗 Live Links

| Resource | URL |
|---|---|
| 🌐 Live API | https://village-location-api.onrender.com |
| 📖 Swagger Docs | https://village-location-api.onrender.com/api-docs/ |

---

## 🚀 Features

- Hierarchical Location APIs
- Village Search & Autocomplete
- Search Filters (state, district, subdistrict)
- Multi-level Autocomplete (village, subdistrict, district, state)
- API Key Authentication
- JWT Authentication
- Redis Caching (Upstash)
- Rate Limiting (per plan)
- Request Logging
- Pagination Support

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Upstash Redis
- JWT + bcrypt
- Swagger UI
- Git & GitHub

---

## 📂 Project Structure

```
village_location_api/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── db/
│   ├── app.js
│   └── package.json
│
├── data_cleaning/
│   ├── raw/
│   ├── cleaned/
│   └── clean_data.py
│
├── prd/
│
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Installation

```bash
git clone git@github.com:shreyashambade/village_location_api.git
cd village_location_api/backend
npm install
node app.js
```

---

## 🔑 Authentication

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "you@business.com",
  "password": "yourpassword",
  "business_name": "Your Company"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "you@business.com",
  "password": "yourpassword"
}
```

### Generate API Key (JWT required)
```
POST /api/auth/keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "key_name": "Production Server"
}
```

### Use API Key on all /api/v1/* routes
```
X-API-Key: your_api_key
```

---

## 📌 Main API Endpoints

### States
```
GET /api/v1/states
```

### Districts
```
GET /api/v1/states/:state_code/districts
```

### Subdistricts
```
GET /api/v1/districts/:district_code/subdistricts
```

### Villages (paginated)
```
GET /api/v1/subdistricts/:subdistrict_code/villages?page=1&limit=100
```

### Search
```
GET /api/v1/search?q=man
GET /api/v1/search?q=man&state=Maharashtra&district=Pune
```

### Autocomplete
```
GET /api/v1/autocomplete?q=mah&hierarchyLevel=state
GET /api/v1/autocomplete?q=man&hierarchyLevel=village
```

---

## 📋 Standard Response Format

```json
{
  "success": true,
  "count": 20,
  "data": [...],
  "meta": {
    "requestId": "req_abc123",
    "responseTime": 45,
    "cached": true
  }
}
```

---

## 👨‍💻 Author

Shreyash Ambade

GitHub: https://github.com/shreyashambade