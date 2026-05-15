const EXEC_URL = window.EXEC_URL;
const REFRESH_MS = 5000;

function escapeHtml(str) {
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// JSONP helper (anti-CORS)
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout JSONP"));
    }, 8000);

    function cleanup() {
      clearTimeout(timeout);
      if (s.parentNode) s.parentNode.removeChild(s);
      try { delete window[cb]; } catch { window[cb] = undefined; }
    }

    window[cb] = (payload) => {
      cleanup();
      resolve(payload);
    };

    s.onerror = () => {
      cleanup();
      reject(new Error("Erreur chargement JSONP"));
    };

    const sep = url.includes("?") ? "&" : "?";
    s.src = `${url}${sep}callback=${cb}&_=${Date.now()}`;
    document.body.appendChild(s);
  });
}

function confirmeBadge(ouiNon) {
  return (ouiNon === "Oui")
    ? `<span class="badge-oui">Oui</span>`
    : `<span class="badge-non">Non</span>`;
}

function applySearchFilter() {
  const q = (document.getElementById("search").value || "").toLowerCase();
  document.querySelectorAll("#table tbody tr").forEach(tr => {
    tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}

async function loadTable() {
  const tbody = document.querySelector("#table tbody");
  try {
    const payload = await jsonp(EXEC_URL);

    if (!payload || payload.ok === false) {
      tbody.innerHTML = `<tr><td colspan="9" style="color:#b91c1c;">
        Erreur lecture: ${escapeHtml(payload?.error || "inconnue")}
      </td></tr>`;
      return;
    }

    const values = payload.values; // 2D array
    if (!values || values.length < 2) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#6b7280;">Aucune donnée.</td></tr>`;
      return;
    }

    // values[0] = headers, values[1..] = rows
    const rows = values.slice(1).reverse();

    tbody.innerHTML = "";
    rows.forEach(r => {
      // Ordre FIXE (doPost)
      const utilisateur = r[0] || "";
      const date = r[1] || "";
      const nom = r[2] || "";
      const telephone = r[3] || "";
      const cp = r[4] || "";
      const ville = r[5] || "";
      const adresse = r[6] || "";
      const commentaire = r[7] || "";
      const confirme = (r[8] || "Non").toString();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(nom)}</td>
        <td>${escapeHtml(telephone)}</td>
        <td>${escapeHtml(cp)}</td>
        <td>${escapeHtml(ville)}</td>
        <td>${escapeHtml(adresse)}</td>
        <td>${escapeHtml(utilisateur)}</td>
        <td style="text-align:center;">${confirmeBadge(confirme === "Oui" ? "Oui" : "Non")}</td>
        <td>${escapeHtml(commentaire)}</td>
      `;
      tbody.appendChild(tr);
    });

    applySearchFilter();

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="9" style="color:#b91c1c;">
      Impossible de charger l’historique (JSONP). Vérifie doGet + déploiement + SPREADSHEET_ID.
    </td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Action du formulaire = exec url
  const form = document.getElementById("callForm");
  form.action = EXEC_URL;

  // Date par défaut
  const dateEl = document.getElementById("date");
  if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split("T")[0];

  // Recherche
  document.getElementById("search").addEventListener("input", applySearchFilter);

  // Message + reload tableau après envoi
  const status = document.getElementById("status");
  form.addEventListener("submit", () => {
    status.textContent = "Enregistrement en cours...";
    setTimeout(() => {
      status.textContent = "✅ Appel enregistré (vérifie la feuille si besoin).";
      setTimeout(loadTable, 1200);
      setTimeout(() => status.textContent = "", 3000);
    }, 600);
  });

  loadTable();
  setInterval(loadTable, REFRESH_MS);
});
