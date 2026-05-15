// ==========================
// Registre Appels - Front
// Lecture via JSONP (anti-CORS)
// Ecriture via <form> POST
// ==========================

const EXEC_URL = window.EXEC_URL;
const REFRESH_MS = 5000;

// ------- Utilitaires -------
function escapeHtml(str) {
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// JSONP loader: EXEC_URL?callback=xxx&_=
function jsonpGet(url) {
  return new Promise((resolve, reject) => {
    const cbName = "cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    script.async = true;

    window[cbName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    const cleanup = () => {
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    script.onerror = () => {
