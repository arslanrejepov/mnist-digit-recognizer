import { useEffect, useState, useRef } from 'react'
import { getFeed, createPost } from '../api'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Reel from '../components/Reel'
import RightPanel from '../components/RightPanel'
import Toast from '../components/Toast'
import styles from './FeedPage.module.css'

export default function FeedPage() {
  const [posts, setPosts] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [toast, setToast] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [creating, setCreating] = useState(false)
  const containerRef = useRef(null)
  const { username } = useAuth()

  useEffect(() => {
    getFeed()
      .then(setPosts)
      .catch(() => showToast('⚠️ Could not load feed'))
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const reels = container.querySelectorAll('[data-reel]')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setActiveIndex(Number(en.target.dataset.reel))
          }
        })
      },
      { threshold: 0.6 }
    )
    reels.forEach((r) => obs.observe(r))
    return () => obs.disconnect()
  }, [posts])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleCreate = async () => {
    if (!newContent.trim()) return
    setCreating(true)
    try {
      const post = await createPost(newContent.trim())
      setPosts((p) => [post, ...p])
      setNewContent('')
      setShowCreate(false)
      showToast('✅ Post created!')
    } catch {
      showToast('❌ Failed to create post')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        username={username}
        onCreate={() => setShowCreate(true)}
        showToast={showToast}
      />

      <main className={styles.feed}>
        <div className={styles.topbar}>
          <div className={styles.feedTabs}>
            <button className={styles.feedTab} onClick={() => showToast('🔒 Follow people to see their posts')}>Following</button>
            <button className={`${styles.feedTab} ${styles.active}`}>For You</button>
          </div>
          <button className={styles.iconBtn} onClick={() => setShowCreate(true)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </button>
        </div>

        <div className={styles.reelContainer} ref={containerRef}>
          {posts.length === 0 && (
            <div className={styles.empty}>
              <p>No posts yet.</p>
              <button className={styles.emptyBtn} onClick={() => setShowCreate(true)}>Create the first post →</button>
            </div>
          )}
          {posts.map((post, i) => (
            <Reel
              key={post.id}
              post={post}
              index={i}
              isActive={i === activeIndex}
              showToast={showToast}
            />
          ))}
        </div>
      </main>

      <RightPanel
        activePost={posts[activeIndex] || null}
        showToast={showToast}
      />

      {/* Create post modal */}
      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>New Post</h2>
            <textarea
              className={styles.textarea}
              placeholder="What's on your mind?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
              <button className={styles.postBtn} onClick={handleCreate} disabled={creating}>
                {creating ? 'Posting…' : 'Post →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
