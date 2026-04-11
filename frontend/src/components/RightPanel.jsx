import { useEffect, useState } from 'react'
import { getComments, addComment, getAllUsers, followUser, getFollowers } from '../api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import styles from './RightPanel.module.css'

// Deterministic color from username — same user always same color
function avatarColor(username = '') {
  const colors = [
    '#ff2d55', '#bf5af2', '#0aff9d', '#ff9f0a',
    '#0a84ff', '#ff6b6b', '#ffd93d', '#6bcb77',
  ]
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function RightPanel({ activePost, showToast }) {
  const [tab, setTab] = useState('comments')
  const [comments, setComments] = useState([])
  const [input, setInput] = useState('')
  const [posting, setPosting] = useState(false)
  const [users, setUsers] = useState([])
  const [followState, setFollowState] = useState({}) // { username: bool }
  const [followerCounts, setFollowerCounts] = useState({}) // { username: number }
  const { isLoggedIn, username: me } = useAuth()
  const navigate = useNavigate()

  // Load real users from DB
  useEffect(() => {
    if (!isLoggedIn) return
    getAllUsers()
      .then(async (list) => {
        setUsers(list)
        // Load follower counts for each user
        const counts = {}
        await Promise.all(
          list.map(async (u) => {
            try {
              const followers = await getFollowers(u.username)
              counts[u.username] = followers.length
            } catch {
              counts[u.username] = 0
            }
          })
        )
        setFollowerCounts(counts)
      })
      .catch(() => setUsers([]))
  }, [isLoggedIn])

  // Load comments when active post changes
  useEffect(() => {
    if (!activePost) return
    getComments(activePost.id)
      .then(setComments)
      .catch(() => setComments([]))
  }, [activePost?.id])

  const handleFollow = async (username) => {
    if (!isLoggedIn) { showToast('🔒 Login to follow'); return }
    try {
      const result = await followUser(username)
      setFollowState((prev) => ({ ...prev, [username]: result.following }))
      setFollowerCounts((prev) => ({ ...prev, [username]: result.follower_count }))
      showToast(result.message)
    } catch {
      showToast('❌ Follow failed')
    }
  }

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

  const formatCount = (n) => {
    if (!n) return '0'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return String(n)
  }

  return (
    <aside className={styles.panel}>

      {/* Stories — real users from DB */}
      <div className={styles.stories}>
        <div className={styles.storyItem} onClick={() => showToast('📸 Your story')}>
          <div className={styles.storyRing}>
            <div className={styles.storyInner} style={{ background: avatarColor(me) }}>
              {me?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
          <span className={styles.storyName}>Your story</span>
        </div>

        {users.slice(0, 8).map((u) => (
          <div
            key={u.id}
            className={styles.storyItem}
            onClick={() => navigate(`/profile/${u.username}`)}
          >
            <div className={styles.storyRing}>
              <div className={styles.storyInner} style={{ background: avatarColor(u.username) }}>
                {u.username[0].toUpperCase()}
              </div>
            </div>
            <span className={styles.storyName}>@{u.username}</span>
          </div>
        ))}
      </div>

      {/* Header + Tabs */}
      <div className={styles.header}>
        <span className={styles.title}>{tab === 'comments' ? 'Comments' : 'People'}</span>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'comments' ? styles.active : ''}`}
            onClick={() => setTab('comments')}
          >
            Comments
          </button>
          <button
            className={`${styles.tab} ${tab === 'suggested' ? styles.active : ''}`}
            onClick={() => setTab('suggested')}
          >
            People
          </button>
        </div>
      </div>

      {/* ── Comments tab ── */}
      {tab === 'comments' && (
        <>
          <div className={styles.commentsList}>
            {comments.length === 0 && (
              <p className={styles.empty}>No comments yet. Be first!</p>
            )}
            {comments.map((c, i) => {
              const commentUser = c.author?.username ?? c.username ?? 'user'
              return (
                <div key={c.id ?? i} className={styles.comment}>
                  <div
                    className={styles.commentAvatar}
                    style={{ background: avatarColor(commentUser) }}
                  >
                    {commentUser[0].toUpperCase()}
                  </div>
                  <div className={styles.commentBody}>
                    <div className={styles.commentMeta}>
                      <span
                        className={styles.commentUser}
                        onClick={() => navigate(`/profile/${commentUser}`)}
                      >
                        @{commentUser}
                      </span>
                      <span className={styles.commentTime}>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'just now'}
                      </span>
                    </div>
                    <p className={styles.commentText}>{c.content}</p>
                    <div className={styles.commentActions}>
                      <span className={styles.commentAction}>Like</span>
                      <span className={styles.commentAction}>Reply</span>
                    </div>
                  </div>
                </div>
              )
            })}
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
            <button
              className={styles.sendBtn}
              onClick={handlePost}
              disabled={posting || !isLoggedIn}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </>
      )}

      {/* ── People tab — real users from DB ── */}
      {tab === 'suggested' && (
        <div className={styles.suggestedList}>
          <p className={styles.suggestedTitle}>Singers on SeS</p>

          {users.length === 0 && (
            <p className={styles.empty}>No other users yet.</p>
          )}

          {users.map((u) => {
            const isFollowing = followState[u.username] ?? false
            const count = followerCounts[u.username] ?? 0
            return (
              <div key={u.id} className={styles.suggestedUser}>
                <div
                  className={styles.suggestedAvatar}
                  style={{ background: avatarColor(u.username) }}
                  onClick={() => navigate(`/profile/${u.username}`)}
                >
                  {u.username[0].toUpperCase()}
                </div>
                <div className={styles.suggestedInfo}>
                  <div
                    className={styles.suggestedName}
                    onClick={() => navigate(`/profile/${u.username}`)}
                  >
                    @{u.username}
                  </div>
                  <div className={styles.suggestedSub}>
                    {formatCount(count)} followers
                  </div>
                </div>
                <button
                  className={`${styles.followPill} ${isFollowing ? styles.following : ''}`}
                  onClick={() => handleFollow(u.username)}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}