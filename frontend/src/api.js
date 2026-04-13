const BASE = '/api'
export const STATIC = 'http://localhost:8000'

// ─── Token helpers ────────────────────────────────────────────────
export const getToken  = () => localStorage.getItem('ses_token')
export const setToken  = (t) => localStorage.setItem('ses_token', t)
export const clearToken = () => localStorage.removeItem('ses_token')
export const getUser   = () => localStorage.getItem('ses_user')
export const setUser   = (u) => localStorage.setItem('ses_user', u)
export const clearUser = () => localStorage.removeItem('ses_user')

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })
const jsonHeader = () => ({ 'Content-Type': 'application/json', ...authHeader() })

// ─── Auth ─────────────────────────────────────────────────────────
export async function login(username, password) {
  const fd = new FormData()
  fd.append('username', username)
  fd.append('password', password)
  const res = await fetch(`${BASE}/auth/login`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

export async function register(username, email, password) {
  const res = await fetch(`${BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Registration failed') }
  return res.json()
}

// ─── Posts ────────────────────────────────────────────────────────
export async function getFeed() {
  const res = await fetch(`${BASE}/posts/feed`)
  if (!res.ok) throw new Error('Failed to load feed')
  return res.json()
}

export async function createPost(content) {
  const res = await fetch(`${BASE}/posts/`, {
    method: 'POST',
    headers: jsonHeader(),
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Failed to create post')
  return res.json()
}

export async function deletePost(id) {
  await fetch(`${BASE}/posts/${id}`, { method: 'DELETE', headers: authHeader() })
}

// ─── Likes ────────────────────────────────────────────────────────
export async function toggleLike(postId) {
  const res = await fetch(`${BASE}/posts/${postId}/like/`, { method: 'POST', headers: authHeader() })
  if (!res.ok) throw new Error('Like failed')
  return res.json()
}

// ─── Comments ─────────────────────────────────────────────────────
export async function getComments(postId) {
  const res = await fetch(`${BASE}/posts/${postId}/comments/`)
  if (!res.ok) throw new Error('Failed to load comments')
  return res.json()
}

export async function addComment(postId, content) {
  const res = await fetch(`${BASE}/posts/${postId}/comments/`, {
    method: 'POST', headers: jsonHeader(), body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Failed to post comment')
  return res.json()
}

// ─── Users ────────────────────────────────────────────────────────
export async function getProfile(username) {
  const res = await fetch(`${BASE}/users/${username}`)
  if (!res.ok) throw new Error('User not found')
  return res.json()
}

export async function getUserPosts(username) {
  const res = await fetch(`${BASE}/users/${username}/posts`)
  if (!res.ok) throw new Error('Failed to load user posts')
  return res.json()
}

export async function getAllUsers() {
  const res = await fetch(`${BASE}/users/`)
  if (!res.ok) throw new Error('Failed to load users')
  return res.json()
}

export async function followUser(username) {
  const res = await fetch(`${BASE}/users/${username}/follow`, { method: 'POST', headers: authHeader() })
  if (!res.ok) throw new Error('Follow failed')
  return res.json()
}

export async function getFollowers(username) {
  const res = await fetch(`${BASE}/users/${username}/followers`)
  if (!res.ok) return []
  return res.json()
}

export async function getFollowing(username) {
  const res = await fetch(`${BASE}/users/${username}/following`)
  if (!res.ok) return []
  return res.json()
}

// ─── Uploads ──────────────────────────────────────────────────────

// Upload profile avatar — file is a File object from <input type="file">
export async function uploadAvatar(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${BASE}/uploads/avatar`, {
    method: 'POST',
    headers: authHeader(),
    body: fd,
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Upload failed') }
  return res.json() // { avatar_url }
}

// Upload image for a post
export async function uploadPostImage(postId, file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${BASE}/uploads/post/${postId}/image`, {
    method: 'POST',
    headers: authHeader(),
    body: fd,
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Upload failed') }
  return res.json() // { image_url }
}

// Upload audio for a post
export async function uploadPostAudio(postId, file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${BASE}/uploads/post/${postId}/audio`, {
    method: 'POST',
    headers: authHeader(),
    body: fd,
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Upload failed') }
  return res.json() // { audio_url }
}