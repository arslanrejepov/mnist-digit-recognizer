const BASE = '/api'

// ─── Token helpers ────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('ses_token')
export const setToken = (t) => localStorage.setItem('ses_token', t)
export const clearToken = () => localStorage.removeItem('ses_token')
export const getUser = () => localStorage.getItem('ses_user')
export const setUser = (u) => localStorage.setItem('ses_user', u)
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
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Registration failed')
  }
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
  const res = await fetch(`${BASE}/posts/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (!res.ok) throw new Error('Failed to delete post')
}

// ─── Likes ────────────────────────────────────────────────────────
export async function toggleLike(postId) {
  const res = await fetch(`${BASE}/posts/${postId}/like/`, {
    method: 'POST',
    headers: authHeader(),
  })
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
    method: 'POST',
    headers: jsonHeader(),
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Failed to post comment')
  return res.json()
}

export async function deleteComment(postId, commentId) {
  const res = await fetch(`${BASE}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (!res.ok) throw new Error('Failed to delete comment')
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

// PUBLIC — no token needed
export async function getAllUsers() {
  const res = await fetch(`${BASE}/users/`)
  if (!res.ok) throw new Error('Failed to load users')
  return res.json()
}

// Requires auth — toggles follow/unfollow
export async function followUser(username) {
  const res = await fetch(`${BASE}/users/${username}/follow`, {
    method: 'POST',
    headers: authHeader(),
  })
  if (!res.ok) throw new Error('Follow failed')
  return res.json()
}

export async function getFollowers(username) {
  const res = await fetch(`${BASE}/users/${username}/followers`)
  if (!res.ok) return []
  return res.json()
}