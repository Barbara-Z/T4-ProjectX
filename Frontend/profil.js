const API_BASE = "http://localhost:3001";
const MAX_BYTES = 5 * 1024 * 1024;
const t = (key, fb) => (window.I18n ? window.I18n.t(key, fb) : fb || key);

const els = {};

// Sprachwechsel: aktuell sichtbare Statusmeldungen (falls dynamisch gerendert)
// werden hier nicht zwingend übersetzt; statische Labels übernimmt I18n.apply().
document.addEventListener("languagechange", () => {
  // E-Mail-Element neu rendern, damit user.email-Text bleibt
});

document.addEventListener("DOMContentLoaded", () => {
  els.avatarButton = document.getElementById("avatarButton");
  els.avatarImage = document.getElementById("avatarImage");
  els.avatarFallback = document.getElementById("avatarFallback");
  els.avatarInput = document.getElementById("avatarInput");
  els.avatarStatus = document.getElementById("avatarStatus");
  els.userName = document.getElementById("userName");
  els.userEmail = document.getElementById("userEmail");
  els.emailForm = document.getElementById("emailForm");
  els.emailMessage = document.getElementById("emailMessage");
  els.passwordForm = document.getElementById("passwordForm");
  els.passwordMessage = document.getElementById("passwordMessage");

  els.avatarButton.addEventListener("click", () => els.avatarInput.click());
  els.avatarInput.addEventListener("change", handleAvatarChange);
  els.emailForm.addEventListener("submit", handleEmailSubmit);
  els.passwordForm.addEventListener("submit", handlePasswordSubmit);

  loadProfile();
});

async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`, { credentials: "include" });
    if (res.status === 401) {
      window.location.href = `/Login.html?redirect=${encodeURIComponent("Profil.html")}`;
      return;
    }
    if (!res.ok) throw new Error(t("msg.profileLoadError"));
    const user = await res.json();
    renderProfile(user);
  } catch (err) {
    setStatus(els.avatarStatus, err.message || t("msg.profileLoadError"), "error");
  }
}

function renderProfile(user) {
  els.userName.textContent = `${user.firstName} ${user.lastName}`.trim() || t("generic.user");
  els.userEmail.textContent = user.email || "";

  const initials = ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || "U";
  els.avatarFallback.textContent = initials;

  if (user.profile_picture) {
    els.avatarImage.src = `${API_BASE}${user.profile_picture}?t=${Date.now()}`;
    els.avatarImage.hidden = false;
    els.avatarFallback.hidden = true;
  } else {
    els.avatarImage.hidden = true;
    els.avatarFallback.hidden = false;
  }
}

async function handleAvatarChange(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
    setStatus(els.avatarStatus, t("msg.invalidImage"), "error");
    return;
  }
  if (file.size > MAX_BYTES) {
    setStatus(els.avatarStatus, t("msg.imageTooLarge"), "error");
    return;
  }

  setStatus(els.avatarStatus, t("msg.uploading"));
  els.avatarButton.classList.add("uploading");

  try {
    const dataUrl = await readAsDataURL(file);
    const res = await fetch(`${API_BASE}/profile/picture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ image: dataUrl })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || t("msg.profileLoadError"));

    els.avatarImage.src = `${API_BASE}${data.profile_picture}?t=${Date.now()}`;
    els.avatarImage.hidden = false;
    els.avatarFallback.hidden = true;
    setStatus(els.avatarStatus, t("msg.avatarUpdated"), "success");
  } catch (err) {
    setStatus(els.avatarStatus, err.message, "error");
  } finally {
    els.avatarButton.classList.remove("uploading");
  }
}

async function handleEmailSubmit(event) {
  event.preventDefault();
  const formData = new FormData(els.emailForm);
  const newEmail = (formData.get("newEmail") || "").trim();
  const password = formData.get("password") || "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    setStatus(els.emailMessage, t("msg.invalidEmail"), "error");
    return;
  }
  if (!password) {
    setStatus(els.emailMessage, t("msg.passwordRequired"), "error");
    return;
  }

  setStatus(els.emailMessage, t("msg.saving"));
  try {
    const res = await fetch(`${API_BASE}/profile/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ newEmail, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || t("msg.profileLoadError"));

    els.userEmail.textContent = data.email;
    els.emailForm.reset();
    setStatus(els.emailMessage, t("msg.emailUpdated"), "success");
  } catch (err) {
    setStatus(els.emailMessage, err.message, "error");
  }
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  const formData = new FormData(els.passwordForm);
  const oldPassword = formData.get("oldPassword") || "";
  const newPassword = formData.get("newPassword") || "";
  const confirmPassword = formData.get("newPasswordConfirm") || "";

  if (!oldPassword || !newPassword) {
    setStatus(els.passwordMessage, t("msg.bothPasswordsRequired"), "error");
    return;
  }
  if (newPassword.length < 6) {
    setStatus(els.passwordMessage, t("msg.passwordTooShort"), "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    setStatus(els.passwordMessage, t("msg.passwordsMismatch"), "error");
    return;
  }

  setStatus(els.passwordMessage, t("msg.saving"));
  try {
    const res = await fetch(`${API_BASE}/profile/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || t("msg.profileLoadError"));

    els.passwordForm.reset();
    setStatus(els.passwordMessage, t("msg.passwordUpdated"), "success");
  } catch (err) {
    setStatus(els.passwordMessage, err.message, "error");
  }
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}

function setStatus(el, text, kind = "") {
  if (!el) return;
  el.textContent = text || "";
  el.classList.remove("error", "success");
  if (kind) el.classList.add(kind);
}
