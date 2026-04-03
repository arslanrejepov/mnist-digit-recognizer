# seed.py  —  run once from your SeS/ root:  python seed.py
# Creates 4 singer accounts + sample song posts for each.

import sys
import os

sys.path.append(os.path.dirname(__file__))

from app.db.database import SessionLocal, engine, Base
from app.models.models import User, Post, Follow
from app.auth.auth import hash_password

# ── make sure all tables exist (including new 'follows' table) ────
Base.metadata.create_all(bind=engine)

PASSWORD = "ses123456"

SINGERS = [
    {
        "username": "maher_zain",
        "email": "maher@ses.app",
        "posts": [
            "🎵 Just recorded a new cover of 'Forgive Me' — 45 seconds of pure soul. Drop a ❤️ if you feel it.",
            "🎤 Karaoke night! Singing 'Paradise' acapella — no beats, just voice. Who's joining?",
            "✨ Working on a new original. The melody came to me at 3am. SeS exclusive preview soon 🎶",
            "🙏 Thank you for 10K listens on my last cover. You all make this worth it.",
        ],
    },
    {
        "username": "syke_dali",
        "email": "syke@ses.app",
        "posts": [
            "🌊 New cover dropping tonight — blending R&B with eastern scales. 58 seconds of something different.",
            "🎹 Just vibing on a piano loop at midnight. Recorded it raw, no edits. Pure mood 🖤",
            "🔥 Who wants a collab? Drop your best 30-second vocal and let's make something crazy.",
            "🎤 Karaoke challenge: sing any song in a language you don't speak. Mine is in Turkish 😂",
        ],
    },
    {
        "username": "mustafa_ceceli",
        "email": "mustafa@ses.app",
        "posts": [
            "🌹 Bir şarkı söyledim bu sabah — sabahın sessizliğinde ses ne kadar güzel. 52 saniye 🎵",
            "🎤 New cover: 'Söyle' — recorded in one take, no autotune. What do you think?",
            "🕊️ Music is a language everyone understands. Posting a bilingual cover this Friday.",
            "✨ Sometimes the simplest melody carries the deepest emotion. 48-second original tonight.",
        ],
    },
    {
        "username": "j_cole",
        "email": "jcole@ses.app",
        "posts": [
            "🎤 60 seconds. No beat. Just words. Recorded this in my car at 2am — real talk only.",
            "📝 Writing is singing without melody. But today I gave the words a melody. 55 sec freestyle.",
            "🔥 Dropped a new verse on an old beat. Sometimes the classics hit different. Listen up.",
            "🌙 Late night sessions hit different. Here's 1 minute of something I've been sitting on.",
        ],
    },
]

def seed():
    db = SessionLocal()
    try:
        created_users = []

        for singer in SINGERS:
            # Skip if already exists
            existing = db.query(User).filter(User.username == singer["username"]).first()
            if existing:
                print(f"  ⚠️  @{singer['username']} already exists — skipping user creation")
                created_users.append(existing)
                continue

            user = User(
                username=singer["username"],
                email=singer["email"],
                hashed_password=hash_password(PASSWORD),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            created_users.append(user)
            print(f"  ✅ Created user: @{user.username}")

            # Create posts for this user
            for content in singer["posts"]:
                # Skip if post already exists
                exists = db.query(Post).filter(
                    Post.user_id == user.id,
                    Post.content == content
                ).first()
                if not exists:
                    post = Post(content=content, user_id=user.id)
                    db.add(post)
            db.commit()
            print(f"     📝 Added {len(singer['posts'])} posts for @{user.username}")

        # Make them all follow each other
        print("\n  🤝 Setting up follow relationships...")
        for i, follower in enumerate(created_users):
            for j, followed in enumerate(created_users):
                if follower.id == followed.id:
                    continue
                exists = db.query(Follow).filter(
                    Follow.follower_id == follower.id,
                    Follow.followed_id == followed.id,
                ).first()
                if not exists:
                    db.add(Follow(follower_id=follower.id, followed_id=followed.id))
        db.commit()
        print("  ✅ All singers follow each other!")

        print("\n✅ Seed complete! Accounts:")
        for s in SINGERS:
            print(f"   username: {s['username']}   password: {PASSWORD}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding database...\n")
    seed()