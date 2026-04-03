import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toggleLike } from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './Reel.module.css'

const BG_GRADIENTS = [
  'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
  'linear-gradient(135deg,#1a0533,#6b0f1a,#b91372)',
  'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
  'linear-gradient(135deg,#200122,#6f0000,#bf5af2)',
  'linear-gradient(135deg,#093028,#237a57,#0aff9d22)',
]

const MUSIC = [
  'Summer Vibes – Lo-fi Beats',
  'Night Drive – Synthwave',
  'Focus Mode – Chillhop',
  'Ocean Drive – Duke Dumont',
  'Void – Burial',
]

const TAGS = [
  ['#aesthetic','#vibes','#golden'],
  ['#nightlife','#city','#neon'],
  ['#coding','#dev','#tech'],
  ['#surf','#ocean','#waves'],
  ['#mood','#art','#dark'],
]

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function Reel({ post, index, isActive, showToast }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [heartPop, setHeartPop] = useState(false)
  const [progress, setProgress] = useState(0)
  const tapRef = useRef(null)
  const progRef = useRef(null)

  const username = post.username ?? post.user?.username ?? 'user'
  const bg = BG_GRADIENTS[index % BG_GRADIENTS.length]
  const music = MUSIC[index % MUSIC.length]
  const tags = TAGS[index % TAGS.length]

  // progress bar animation when active
  useEffect(() => {
    if (!isActive) { setProgress(0); return }
    let val = 0
    progRef.current = setInterval(() => {
      val += 0.4
      setProgress(Math.min(val, 100))
      if (val >= 100) clearInterval(progRef.current)
    }, 80)
    return () => clearInterval(progRef.current)
  }, [isActive])

  const handleLike = async () => {
    if (!isLoggedIn) { showToast('🔒 Login to like posts'); return }
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => c + (wasLiked ? -1 : 1))
    try { await toggleLike(post.id) } catch {
      setLiked(wasLiked)
      setLikeCount((c) => c + (wasLiked ? 1 : -1))
    }
  }

  const handleTap = (e) => {
    if (e.target.closest('[data-action]')) return
    if (tapRef.current) {
      clearTimeout(tapRef.current)
      tapRef.current = null
      // double tap
      if (!liked) { setLiked(true); setLikeCount((c) => c + 1) }
      setHeartPop(true)
      setTimeout(() => setHeartPop(false), 900)
    } else {
      tapRef.current = setTimeout(() => { tapRef.current = null }, 280)
    }
  }

  return (
    <div
      className={styles.reel}
      data-reel={index}
      onClick={handleTap}
    >
      {/* Progress */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Background */}
      <div className={styles.bg} style={{ background: bg }} />

      {/* Particles */}
      <div className={styles.particles}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 5 + 2}px`,
              height: `${Math.random() * 5 + 2}px`,
              animationDuration: `${Math.random() * 8 + 6}s`,
              animationDelay: `${Math.random() * 6}s`,
              background: ['#ff2d55','#bf5af2','#0aff9d','#ff9f0a'][i % 4],
            }}
          />
        ))}
      </div>

      {/* Double-tap heart */}
      {heartPop && <div className={styles.heartPop}>❤️</div>}

      {/* Gradient overlay */}
      <div className={styles.overlay} />

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>{username[0].toUpperCase()}</div>
          <span
            className={styles.username}
            data-action
            onClick={() => navigate(`/profile/${username}`)}
          >
            @{username}
          </span>
          <button
            className={styles.followBtn}
            data-action
            onClick={() => showToast('✅ Following!')}
          >
            Follow
          </button>
        </div>

        <p className={styles.caption}>{post.content}</p>

        <div className={styles.tags}>
          {tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
        </div>

        <div className={styles.musicRow}>
          <span className={styles.musicDisc}>🎵</span>
          <span className={styles.musicName}>{music}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
          data-action
          onClick={handleLike}
        >
          <div className={styles.actionIcon}>
            <svg width="24" height="24" fill={liked ? 'var(--accent)' : 'none'} stroke={liked ? 'var(--accent)' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
          <span className={styles.actionCount}>{formatCount(likeCount)}</span>
        </button>

        <button
          className={styles.actionBtn}
          data-action
          onClick={() => showToast('💬 Scroll down to comment!')}
        >
          <div className={styles.actionIcon}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <span className={styles.actionCount}>{post.comment_count ?? 0}</span>
        </button>

        <button
          className={styles.actionBtn}
          data-action
          onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('🔗 Link copied!') }}
        >
          <div className={styles.actionIcon}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
          <span className={styles.actionCount}>Share</span>
        </button>

        <button
          className={styles.actionBtn}
          data-action
          onClick={() => showToast('🔖 Saved!')}
        >
          <div className={styles.actionIcon}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </div>
          <span className={styles.actionCount}>Save</span>
        </button>
      </div>

      {/* Scroll hint */}
      <div className={styles.scrollHint}>
        <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span>swipe</span>
      </div>
    </div>
  )
}
