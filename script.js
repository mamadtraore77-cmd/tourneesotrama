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

function updateSyncTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const syncEl = document.getElementById("lastSync");
    if(syncEl) syncEl.textContent = `Dernière synchro : ${timeString}`;
}

async function loadTable() {
  const tbody = document.getElementById("tableBody");
  try {
    const payload = await jsonp(EXEC_URL);

    if (!payload || payload.ok === false) {
      tbody.innerHTML = `<tr><td colspan="10" style="color:#b91c1c; text-align:center;">Erreur de connexion avec Google Sheets.</td></tr>`;
      return;
    }

    const values = payload.values; 
    if (!values || values.length < 2) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#6b7280; padding:20px;">Aucun appel enregistré dans le tableau.</td></tr>`;
      updateSyncTime();
      return;
    }

    const rows = values.slice(1).reverse();
    tbody.innerHTML = "";
    
    rows.forEach(r => {
      const utilisateur = r[0] || "";
      const date = r[1] || "";
      const nom = r[2] || "";
      const telephone = r[3] || "";
      const cp = r[4] || "";
      const ville = r[5] || "";
      const adresse = r[6] || "";
      const commentaire = r[7] || "";
      const confirme = (r[8] || "Non").toString();
      const camion = r[9] || ""; // Récupère la colonne camion créée par Apps Script

      let dateAffichee = date;
      if(date.includes("T")) {
          dateAffichee = date.split("T")[0].split("-").reverse().join("/");
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(dateAffichee)}</td>
        <td><span style="font-weight:600; color:#1b5e20;">${escapeHtml(camion)}</span></td>
        <td><strong>${escapeHtml(nom)}</strong></td>
        <td>${escapeHtml(telephone)}</td>
        <td>${escapeHtml(cp)}</td>
        <td>${escapeHtml(ville)}</td>
        <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(adresse)}</td>
        <td>${escapeHtml(utilisateur)}</td>
        <td style="text-align:center;">${confirmeBadge(confirme === "Oui" ? "Oui" : "Non")}</td>
        <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(commentaire)}</td>
      `;
      tbody.appendChild(tr);
    });

    applySearchFilter();
    updateSyncTime();

  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("callForm");
  form.action = EXEC_URL;

  const dateEl = document.getElementById("date");
  if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split("T")[0];

  document.getElementById("search").addEventListener("input", applySearchFilter);

  const status = document.getElementById("status");
  form.addEventListener("submit", () => {
    status.style.color = "#1b5e20";
    status.textContent = "⏳ Enregistrement en cours...";
    
    setTimeout(() => {
      status.textContent = "✅ Appel enregistré avec succès !";
      setTimeout(loadTable, 1500); 
      
      // On vide tout sauf date et utilisateur
      document.getElementById("camion").value = "";
      document.getElementById("nom").value = "";
      document.getElementById("telephone").value = "";
      document.getElementById("code_postal").value = "";
      document.getElementById("ville").value = "";
      document.getElementById("adresse").value = "";
      document.getElementById("commentaire").value = "";
      document.getElementById("confirme").checked = false;

      setTimeout(() => status.textContent = "", 4000);
    }, 1000);
  });

  loadTable();
  setInterval(loadTable, REFRESH_MS);
});
