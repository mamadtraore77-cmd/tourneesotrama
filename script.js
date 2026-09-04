const EXEC_URL = window.EXEC_URL;
const REFRESH_MS = 5000;

let registeredPhones = []; 

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

function setQuickFilter(term) {
  document.getElementById("search").value = term;
  applySearchFilter();
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

function formatPhone(phone) {
    let num = (phone || "").toString().replace(/\D/g, "");
    if (num.startsWith("0")) {
        num = num.substring(1);
    }
    return num;
}

async function loadTable() {
  const tbody = document.getElementById("tableBody");
  try {
    const payload = await jsonp(EXEC_URL);

    if (!payload || payload.ok === false) {
      tbody.innerHTML = `<tr><td colspan="11" style="color:#b91c1c; text-align:center;">Erreur de connexion avec Google Sheets.</td></tr>`;
      return;
    }

    const values = payload.values; 
    if (!values || values.length < 2) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:#6b7280; padding:20px;">Aucun appel enregistré dans le tableau.</td></tr>`;
      updateSyncTime();
      registeredPhones = [];
      return;
    }

    const rows = values.slice(1).reverse();
    tbody.innerHTML = "";
    registeredPhones = []; 

    let countTotal = 0;
    let countConfirmes = 0;
    let countAttente = 0;
    
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
      const camion = r[9] || ""; 
      const dateConteneur = r[10] || ""; // NOUVEAU CHAMP (Colonne K dans GSheets)

      countTotal++;
      if (confirme === "Oui") countConfirmes++;
      else countAttente++;

      if (telephone) {
        registeredPhones.push(formatPhone(telephone));
      }

      // Formatage de la date d'appel
      let dateAffichee = date;
      if(date.includes("T")) {
          dateAffichee = date.split("T")[0].split("-").reverse().join("/");
      }

      // Formatage de la date du conteneur (si elle existe)
      let dateConteneurAffichee = dateConteneur;
      if(dateConteneur.includes("T")) {
          dateConteneurAffichee = dateConteneur.split("T")[0].split("-").reverse().join("/");
      } else if (dateConteneur && dateConteneur.includes("-") && dateConteneur.length === 10) {
          dateConteneurAffichee = dateConteneur.split("-").reverse().join("/");
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(dateAffichee)}</td>
        <td><span style="font-weight:600; color:#0277bd;">${escapeHtml(dateConteneurAffichee)}</span></td>
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

    document.getElementById("stat-total").textContent = countTotal;
    document.getElementById("stat-confirmes").textContent = countConfirmes;
    document.getElementById("stat-attente").textContent = countAttente;

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

  // --- FORMATAGE AUTOMATIQUE DU TELEPHONE ---
  const phoneInput = document.getElementById("telephone");
  phoneInput.addEventListener("input", function (e) {
    let val = this.value.replace(/\D/g, ""); 
    let formatted = val.match(/.{1,2}/g)?.join(" ") || "";
    this.value = formatted.substring(0, 14); 
  });

  // ========================================================
  // AUTO-COMPLETION : CODE POSTAL <-> VILLE
  // ========================================================
  const cpInput = document.getElementById("code_postal");
  const villeInput = document.getElementById("ville");

  // 1. Saisie du Code Postal => Remplissage de la Ville
  cpInput.addEventListener("input", async function () {
    const cp = this.value;
    if (cp.length === 5) { 
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=nom&format=json`);
        const data = await res.json();
        if (data && data.length > 0) {
          villeInput.value = data[0].nom; 
          villeInput.style.borderColor = "#28a745"; 
          villeInput.style.backgroundColor = "#e8f5e9";
          setTimeout(() => {
            villeInput.style.borderColor = "var(--border-color)";
            villeInput.style.backgroundColor = "#fff";
          }, 1500);
        }
      } catch(e) { console.error("Erreur API Code Postal", e); }
    }
  });

  // 2. Saisie de la Ville => Remplissage du Code Postal
  let timeoutVille; 
  villeInput.addEventListener("input", function () {
    clearTimeout(timeoutVille); 
    const ville = this.value.trim();
    
    if (ville.length >= 3) { 
      timeoutVille = setTimeout(async () => {
        try {
          const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${ville}&fields=codesPostaux&boost=population&limit=1`);
          const data = await res.json();
          
          if (data && data.length > 0 && data[0].codesPostaux) {
            cpInput.value = data[0].codesPostaux[0]; 
            
            cpInput.style.borderColor = "#28a745"; 
            cpInput.style.backgroundColor = "#e8f5e9";
            setTimeout(() => {
              cpInput.style.borderColor = "var(--border-color)";
              cpInput.style.backgroundColor = "#fff";
            }, 1500);
          }
        } catch(e) { 
          console.error("Erreur API Ville", e); 
        }
      }, 800); 
    }
  });
  // ========================================================

  const status = document.getElementById("status");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", (e) => {
    
    const originalPhone = document.getElementById("telephone").value;
    const phoneInputClean = formatPhone(originalPhone);
    
    if (registeredPhones.includes(phoneInputClean)) {
      e.preventDefault(); 
      alert(`⚠️ IMPOSSIBLE : Le numéro ${originalPhone} est déjà enregistré dans le tableau !`); 
      return; 
    }

    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.6"; 
    submitBtn.style.cursor = "not-allowed";

    status.style.color = "#1b5e20";
    status.textContent = "⏳ Enregistrement en cours...";
    
    setTimeout(() => {
      status.textContent = "✅ Appel enregistré avec succès !";
      setTimeout(loadTable, 1500); 
      
      // Remise à zéro de tous les champs
      document.getElementById("camion").value = "";
      document.getElementById("date_conteneur").value = ""; // RAZ DU NOUVEAU CHAMP
      document.getElementById("nom").value = "";
      document.getElementById("telephone").value = "";
      document.getElementById("code_postal").value = "";
      document.getElementById("ville").value = "";
      document.getElementById("adresse").value = "";
      document.getElementById("commentaire").value = "";
      document.getElementById("confirme").checked = false;

      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
      
      setTimeout(() => status.textContent = "", 4000);
    }, 1000);
  });

  loadTable();
  setInterval(loadTable, REFRESH_MS);
});
