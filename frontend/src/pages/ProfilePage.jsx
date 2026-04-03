import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProfile, getUserPosts } from '../api'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProfile(username), getUserPosts(username)])
      .then(([p, ps]) => { setProfile(p); setPosts(ps) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <div className={styles.loading}>Loading…</div>

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/')}>← Back</button>

      <div className={styles.header}>
        <div className={styles.avatar}>{username[0].toUpperCase()}</div>
        <h1 className={styles.name}>@{username}</h1>
        {profile?.email && <p className={styles.email}>{profile.email}</p>}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{posts.length}</span>
            <span className={styles.statLabel}>Posts</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {posts.map((post) => (
          <div key={post.id} className={styles.postCard}>
            <p className={styles.postContent}>{post.content}</p>
            <span className={styles.postDate}>
              {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
            </span>
          </div>
        ))}
        {posts.length === 0 && (
          <p className={styles.empty}>No posts yet.</p>
        )}
      </div>
    </div>
  )
}
