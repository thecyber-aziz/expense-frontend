// ── auth.js ─────────────────────────────────────────────────────────────────
// Simple localStorage-based auth. Each email = isolated expense data.
// Passwords are hashed with a basic encode (not cryptographic — for real
// production use Firebase Auth or a backend).

const USERS_KEY = "et_users";
const SESSION_KEY = "et_session";

function getUsers() {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Simple encode — keeps passwords from being plain text in localStorage
function encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// ── Public API ───────────────────────────────────────────────────────────────

export function signUp(email, password, name) {
  const em = email.trim().toLowerCase();
  const users = getUsers();
  if (users[em]) return { ok: false, error: "Email already registered." };
  users[em] = { email: em, name: name.trim(), password: encode(password) };
  saveUsers(users);
  const session = { email: em, name: name.trim() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, user: session };
}

export function logIn(email, password) {
  const em = email.trim().toLowerCase();
  const users = getUsers();
  const user = users[em];
  if (!user) return { ok: false, error: "No account found with this email." };
  if (user.password !== encode(password)) return { ok: false, error: "Incorrect password." };
  const session = { email: em, name: user.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, user: session };
}

export function logOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

// Each user's expense data is namespaced by email so data never mixes
export function userKey(email, key) {
  return `et_${email.replace(/[@.]/g, "_")}_${key}`;
}