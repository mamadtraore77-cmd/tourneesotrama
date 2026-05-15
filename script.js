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
      cleanup();
      reject(new Error("Erreur JSONP (chargement bloqué ou URL invalide)"));
    };

    const sep = url.includes("?") ? "&" : "?";
    script.src = `${url}${sep}callback=${cbName}&_=${Date.now()}`;

    document.body.appendChild(script);
  });
}

// ------- Table rendering -------
function toObjectsFrom2D(data2d) {
  // data2d[0] = headers
  const headers = (data2d && data2d.length) ? data2d[0] : [];
  return data2d.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function normalizeHeaders(obj) {
  // Rend robuste aux variations d'entêtes
  // On accepte plusieurs orthographes potentielles.
  const pick = (candidates) => {
    for (const k of candidates) {
      if (k in obj) return obj[k];
    }
    return "";
  };

  return {
    utilisateur: pick(["utilisateur", "Utilisateur"]),
    date: pick(["date", "Date"]),
    nom: pick(["nom", "Nom", "Nom du client", "NomClient"]),
    telephone: pick(["telephone", "Téléphone", "Telephone"]),
    code_postal: pick(["code_postal", "Code postal", "CP", "CodePostal"]),
    ville: pick(["ville", "Ville"]),
    adresse: pick(["adresse", "Adresse"]),
    commentaire: pick(["commentaire", "Commentaire"]),
    confirme: pick(["confirme", "Confirmé", "Confirme", "Confirmé ?"])
  };
}

function confirmeToOuiNon(val) {
  const s = (val ?? "").toString().trim().toLowerCase();
  return (s === "oui" || s === "true" || s === "vrai" || s === "1") ? "Oui" : "Non";
}

function renderTable(rows2d) {
  const tbody = document.querySelector("#table tbody");
  tbody.innerHTML = "";

  if (!rows2d || rows2d.length < 2) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9" style="text-align:center; color:#6b7280;">Aucune donnée pour le moment.</td>`;
    tbody.appendChild(tr);
    return;
  }

  const objects = toObjectsFrom2D(rows2d).map(normalizeHeaders).reverse();

  for (const r of objects) {
    const ouiNon = confirmeToOuiNon(r.confirme);
    const badge = ouiNon === "Oui"
      ? `<span class="badge-oui">Oui</span>`
      : `<span class="badge-non">Non</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.date)}</td>
      <td>${escapeHtml(r.nom)}</td>
      <td>${escapeHtml(r.telephone)}</td>
      <td>${escapeHtml(r.code_postal)}</td>
      <td>${escapeHtml(r.ville)}</td>
      <td>${escapeHtml(r.adresse)}</td>
      <td>${escapeHtml(r.utilisateur)}</td>
      <td style="text-align:center;">${badge}</td>
      <td>${escapeHtml(r.commentaire)}</td>
    `;
    tbody.appendChild(tr);
  }

  applySearchFilter();
}

// ------- Chargement données -------
async function loadData() {
  try {
    const rows2d = await jsonpGet(EXEC_URL);
    renderTable(rows2d);
  } catch (err) {
    console.error(err);
    const tbody = document.querySelector("#table tbody");
    tbody.innerHTML = `<tr><td colspan="9" style="color:#b91c1c;">
      Impossible de charger l’historique (JSONP). Vérifie que doGet existe et que l’URL /exec est la bonne.
    </td></tr>`;
  }
}

// ------- Recherche -------
function applySearchFilter() {
  const q = (document.getElementById("search").value || "").toLowerCase();
  document.querySelectorAll("#table tbody tr").forEach(tr => {
    tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}

// ------- Init -------
document.addEventListener("DOMContentLoaded", () => {
  // Date par défaut = aujourd’hui
  const dateEl = document.getElementById("date");
  if (dateEl && !dateEl.value) {
    dateEl.value = new Date().toISOString().split("T")[0];
  }

  // Brancher la recherche
  document.getElementById("search").addEventListener("input", applySearchFilter);

  // IMPORTANT: le form doit pointer vers EXEC_URL
  const form = document.getElementById("callForm");
  form.action = EXEC_URL;

  // Message + refresh après envoi
  const status = document.getElementById("status");
  form.addEventListener("submit", () => {
    status.textContent = "Enregistrement en cours...";
    setTimeout(() => {
      status.textContent = "✅ Appel enregistré (si la feuille est bien connectée).";
      // refresh après petite latence
      setTimeout(loadData, 1200);
      setTimeout(() => status.textContent = "", 3000);
    }, 500);
  });

  // Premier chargement + refresh périodique
  loadData();
  setInterval(loadData, REFRESH_MS);
});
