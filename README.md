# SeS
Social media
# Social Media API

A minimal, production-style social media backend built with **FastAPI**, **SQLAlchemy**, and **SQLite**.

## Features

| Feature | Endpoint(s) |
|---|---|
| Register / Login | `POST /users/register`, `POST /auth/login` |
| Create / delete posts | `POST /posts/`, `DELETE /posts/{id}` |
| Home feed | `GET /posts/feed` |
| User profile + posts | `GET /users/{username}`, `GET /users/{username}/posts` |
| Like / unlike posts | `POST /posts/{id}/like/` |
| Comment on posts | `POST /posts/{id}/comments/` |

---

## Project Structure

```
social_media/
├── app/
│   ├── main.py               # App entry point, router registration
│   ├── db/
│   │   └── database.py       # SQLite engine, session, Base, get_db()
│   ├── models/
│   │   └── models.py         # SQLAlchemy ORM models (User, Post, Comment, Like)
│   ├── schemas/
│   │   └── schemas.py        # Pydantic v2 request/response schemas
│   ├── auth/
│   │   ├── auth.py           # Password hashing, JWT creation, current_user dep
│   │   └── router.py         # POST /auth/login
│   ├── users/
│   │   └── router.py         # Register, profile, user posts
│   ├── posts/
│   │   └── router.py         # Feed, create, get, delete post
│   ├── comments/
│   │   └── router.py         # List, add, delete comment
│   └── likes/
│       └── router.py         # Toggle like/unlike
├── requirements.txt
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
cd social_media
pip install -r requirements.txt
```

### 2. Run the server

```bash
uvicorn app.main:app --reload
```

### 3. Open the interactive docs

Navigate to [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Authentication

The API uses **JWT Bearer tokens**.

1. Register: `POST /users/register`
2. Login: `POST /auth/login` (returns `access_token`)
3. Add header to protected requests: `Authorization: Bearer <token>`

In the Swagger UI, click **Authorize** and paste your token.

---

## Example Workflow

```bash
# 1. Register
curl -X POST http://localhost:8000/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"secret123"}'

# 2. Login → grab token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -F "username=alice" -F "password=secret123" | jq -r .access_token)

# 3. Create a post
curl -X POST http://localhost:8000/posts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello world!"}'

# 4. View feed
curl http://localhost:8000/posts/feed
```

---

## Notes

- The SQLite database file (`social_media.db`) is created automatically on first run.
- `SECRET_KEY` in `app/auth/auth.py` **must** be replaced with an environment variable in production.
- For production, replace SQLite with PostgreSQL and use Alembic for migrations.