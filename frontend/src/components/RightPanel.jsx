import { useEffect, useState } from 'react'
import { getComments, addComment } from '../api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import styles from './RightPanel.module.css'

const SUGGESTED = [
  { username: 'aurora_x', followers: '142K', emoji: '🌸' },
  { username: 'neon_drift', followers: '89K', emoji: '🌃' },
  { username: 'pixelqueen', followers: '234K', emoji: '💻' },
  { username: 'wavechaser', followers: '67K', emoji: '🌊' },
  { username: 'lofi_girl', followers: '1.2M', emoji: '🎵' },
]

export default function RightPanel({ activePost, showToast }) {
  const [tab, setTab] = useState('comments')
  const [comments, setComments] = useState([])
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)
  const { isLoggedIn, username } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!activePost) return
    getComments(activePost.id)
      .then(setComments)
      .catch(() => setComments([]))
  }, [activePost?.id])

  const handlePost = async () => {
    if (!input.trim()) return
    if (!isLoggedIn) { showToast('🔒 Login to comment'); return }
    setPosting(true)
    try {
      const c = await addComment(activePost.id, input.trim())
      setComments((prev) => [c, ...prev])
      setInput('')
    } catch {
      showToast('❌ Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  return (
    <aside className={styles.panel}>
      {/* Stories */}
      <div className={styles.stories}>
        {['You', 'aurora', 'neon', 'pixel', 'wave', 'lofi'].map((u, i) => (
          <div key={u} className={styles.storyItem} onClick={() => showToast(`📸 Story from @${u}`)}>
            <div className={`${styles.storyRing} ${i > 2 ? styles.seen : ''}`}>
              <div className={styles.storyInner}>{u[0].toUpperCase()}</div>
            </div>
            <span className={styles.storyName}>{i === 0 ? 'Your story' : u}</span>
          </div>
        ))}
      </div>

      {/* Header + Tabs */}
      <div className={styles.header}>
        <span className={styles.title}>{tab === 'comments' ? 'Comments' : 'People'}</span>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'comments' ? styles.active : ''}`} onClick={() => setTab('comments')}>Comments</button>
          <button className={`${styles.tab} ${tab === 'suggested' ? styles.active : ''}`} onClick={() => setTab('suggested')}>People</button>
        </div>
      </div>

      {/* Comments tab */}
      {tab === 'comments' && (
        <>
          <div className={styles.commentsList}>
            {comments.length === 0 && (
              <p className={styles.empty}>No comments yet. Be first!</p>
            )}
            {comments.map((c, i) => (
              <div key={c.id ?? i} className={styles.comment}>
                <div className={styles.commentAvatar}>
                  {(c.username ?? c.user?.username ?? 'u')[0].toUpperCase()}
                </div>
                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <span
                      className={styles.commentUser}
                      onClick={() => navigate(`/profile/${c.username ?? c.user?.username}`)}
                    >
                      @{c.username ?? c.user?.username ?? 'user'}
                    </span>
                    <span className={styles.commentTime}>
                      {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                    </span>
                  </div>
                  <p className={styles.commentText}>{c.content}</p>
                  <div className={styles.commentActions}>
                    <span className={styles.commentAction}>Like</span>
                    <span className={styles.commentAction}>Reply</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.inputArea}>
            <input
              className={styles.input}
              placeholder={isLoggedIn ? 'Add a comment…' : 'Login to comment'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePost() }}
              disabled={!isLoggedIn}
            />
            <button className={styles.sendBtn} onClick={handlePost} disabled={posting || !isLoggedIn}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Suggested tab */}
      {tab === 'suggested' && (
        <div className={styles.suggestedList}>
          <p className={styles.suggestedTitle}>Suggested for you</p>
          {SUGGESTED.map((u) => (
            <div key={u.username} className={styles.suggestedUser}>
              <div className={styles.suggestedAvatar}>{u.emoji}</div>
              <div className={styles.suggestedInfo}>
                <div
                  className={styles.suggestedName}
                  onClick={() => navigate(`/profile/${u.username}`)}
                >
                  @{u.username}
                </div>
                <div className={styles.suggestedSub}>{u.followers} followers</div>
              </div>
              <button className={styles.followPill} onClick={() => showToast('✅ Following!')}>
                Follow
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
