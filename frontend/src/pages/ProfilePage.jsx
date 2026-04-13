import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getProfile, getUserPosts, getFollowers, getFollowing,
  followUser, uploadAvatar, uploadPostImage, uploadPostAudio,
  STATIC,
} from '../api'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import styles from './ProfilePage.module.css'

// Deterministic avatar color
function avatarColor(username = '') {
  const colors = ['#ff2d55','#bf5af2','#0aff9d','#ff9f0a','#0a84ff','#ff6b6b','#ffd93d','#6bcb77']
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatCount(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function ProfilePage() {
  const { username } = useParams()
  const navigate     = useNavigate()
  const { username: me, isLoggedIn } = useAuth()
  const isMyProfile  = me === username

  const [profile,   setProfile]   = useState(null)
  const [posts,     setPosts]     = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [following_me, setFollowingMe] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')  // posts | followers | following
  const [toast,     setToast]     = useState('')

  // Upload state
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [uploadingPost,   setUploadingPost]   = useState(null) // post id being uploaded
  const avatarInputRef = useRef(null)

  // Playing audio
  const [playingId, setPlayingId] = useState(null)
  const audioRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getProfile(username),
      getUserPosts(username),
      getFollowers(username),
      getFollowing(username),
    ])
      .then(([p, ps, frs, fng]) => {
        setProfile(p)
        setPosts(ps)
        setFollowers(frs)
        setFollowing(fng)
        // Check if current user follows this profile
        if (me) setFollowingMe(frs.some((f) => f.username === me))
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [username])

  // ── Follow / unfollow ──
  const handleFollow = async () => {
    if (!isLoggedIn) { showToast('🔒 Login to follow'); return }
    try {
      const result = await followUser(username)
      setFollowingMe(result.following)
      setProfile((p) => ({ ...p, follower_count: result.follower_count }))
      if (result.following) {
        setFollowers((prev) => [...prev, { username: me }])
      } else {
        setFollowers((prev) => prev.filter((f) => f.username !== me))
      }
      showToast(result.message)
    } catch { showToast('❌ Follow failed') }
  }

  // ── Avatar upload ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const result = await uploadAvatar(file)
      setProfile((p) => ({ ...p, avatar_url: result.avatar_url }))
      showToast('✅ Avatar updated!')
    } catch (err) { showToast(`❌ ${err.message}`) }
    finally { setAvatarUploading(false) }
  }

  // ── Post image upload ──
  const handlePostImage = async (postId, file) => {
    if (!file) return
    setUploadingPost(postId)
    try {
      const result = await uploadPostImage(postId, file)
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, image_url: result.image_url } : p))
      showToast('✅ Image added to post!')
    } catch (err) { showToast(`❌ ${err.message}`) }
    finally { setUploadingPost(null) }
  }

  // ── Post audio upload ──
  const handlePostAudio = async (postId, file) => {
    if (!file) return
    setUploadingPost(postId)
    try {
      const result = await uploadPostAudio(postId, file)
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, audio_url: result.audio_url } : p))
      showToast('✅ Audio added to post!')
    } catch (err) { showToast(`❌ ${err.message}`) }
    finally { setUploadingPost(null) }
  }

  // ── Audio player ──
  const toggleAudio = (postId, audioUrl) => {
    if (playingId === postId) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) audioRef.current.pause()
      audioRef.current = new Audio(`${STATIC}${audioUrl}`)
      audioRef.current.play()
      audioRef.current.onended = () => setPlayingId(null)
      setPlayingId(postId)
    }
  }

  if (loading) return <div className={styles.loading}>Loading…</div>
  if (!profile) return null

  const color = avatarColor(username)

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/')}>← Feed</button>

      {/* ── Hero header ── */}
      <div className={styles.hero}>
        <div className={styles.heroBg} style={{ background: `radial-gradient(circle at 50% 0%, ${color}33, transparent 70%)` }} />

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          {profile.avatar_url ? (
            <img src={`${STATIC}${profile.avatar_url}`} className={styles.avatarImg} alt={username} />
          ) : (
            <div className={styles.avatarInitial} style={{ background: color }}>
              {username[0].toUpperCase()}
            </div>
          )}

          {/* Edit avatar button — only on own profile */}
          {isMyProfile && (
            <>
              <button
                className={styles.editAvatarBtn}
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                title="Change photo"
              >
                {avatarUploading ? '…' : '📷'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </>
          )}
        </div>

        <h1 className={styles.username}>@{username}</h1>
        <p className={styles.email}>{profile.email}</p>

        {/* Stats row */}
        <div className={styles.stats}>
          <button className={`${styles.stat} ${activeTab === 'posts' ? styles.statActive : ''}`} onClick={() => setActiveTab('posts')}>
            <span className={styles.statNum}>{posts.length}</span>
            <span className={styles.statLabel}>Posts</span>
          </button>
          <button className={`${styles.stat} ${activeTab === 'followers' ? styles.statActive : ''}`} onClick={() => setActiveTab('followers')}>
            <span className={styles.statNum}>{formatCount(followers.length)}</span>
            <span className={styles.statLabel}>Followers</span>
          </button>
          <button className={`${styles.stat} ${activeTab === 'following' ? styles.statActive : ''}`} onClick={() => setActiveTab('following')}>
            <span className={styles.statNum}>{formatCount(following.length)}</span>
            <span className={styles.statLabel}>Following</span>
          </button>
        </div>

        {/* Follow / Edit button */}
        {!isMyProfile && (
          <button className={`${styles.followBtn} ${following_me ? styles.following : ''}`} onClick={handleFollow}>
            {following_me ? '✓ Following' : '+ Follow'}
          </button>
        )}
      </div>

      {/* ── Tab content ── */}
      <div className={styles.content}>

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div className={styles.postsGrid}>
            {posts.length === 0 && <p className={styles.empty}>No posts yet 🎤</p>}
            {posts.map((post) => (
              <div key={post.id} className={styles.postCard}>

                {/* Post cover image */}
                {post.image_url ? (
                  <img src={`${STATIC}${post.image_url}`} className={styles.postImage} alt="cover" />
                ) : isMyProfile ? (
                  <label className={styles.uploadImageBtn}>
                    {uploadingPost === post.id ? 'Uploading…' : '🖼️ Add cover photo'}
                    <input
                      type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => handlePostImage(post.id, e.target.files?.[0])}
                      disabled={uploadingPost === post.id}
                    />
                  </label>
                ) : (
                  <div className={styles.noImage}>🎵</div>
                )}

                <div className={styles.postBody}>
                  <p className={styles.postContent}>{post.content}</p>

                  {/* Audio player */}
                  {post.audio_url ? (
                    <button
                      className={`${styles.audioBtn} ${playingId === post.id ? styles.playing : ''}`}
                      onClick={() => toggleAudio(post.id, post.audio_url)}
                    >
                      {playingId === post.id ? '⏸ Playing…' : '▶ Play Song'}
                    </button>
                  ) : isMyProfile ? (
                    <label className={styles.uploadAudioBtn}>
                      {uploadingPost === post.id ? 'Uploading…' : '🎤 Upload audio (≤1 min)'}
                      <input
                        type="file" accept="audio/*" style={{ display: 'none' }}
                        onChange={(e) => handlePostAudio(post.id, e.target.files?.[0])}
                        disabled={uploadingPost === post.id}
                      />
                    </label>
                  ) : (
                    <span className={styles.noAudio}>No audio yet</span>
                  )}

                  <div className={styles.postMeta}>
                    <span>❤️ {post.like_count}</span>
                    <span>💬 {post.comment_count}</span>
                    <span className={styles.postDate}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Followers tab */}
        {activeTab === 'followers' && (
          <div className={styles.userList}>
            {followers.length === 0 && <p className={styles.empty}>No followers yet.</p>}
            {followers.map((u) => (
              <div key={u.id ?? u.username} className={styles.userRow} onClick={() => navigate(`/profile/${u.username}`)}>
                <div className={styles.userAvatar} style={{ background: avatarColor(u.username) }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <div className={styles.userRowName}>@{u.username}</div>
                  <div className={styles.userRowSub}>{formatCount(u.follower_count ?? 0)} followers</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Following tab */}
        {activeTab === 'following' && (
          <div className={styles.userList}>
            {following.length === 0 && <p className={styles.empty}>Not following anyone yet.</p>}
            {following.map((u) => (
              <div key={u.id ?? u.username} className={styles.userRow} onClick={() => navigate(`/profile/${u.username}`)}>
                <div className={styles.userAvatar} style={{ background: avatarColor(u.username) }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <div className={styles.userRowName}>@{u.username}</div>
                  <div className={styles.userRowSub}>{formatCount(u.follower_count ?? 0)} followers</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast} />
    </div>
  )
}