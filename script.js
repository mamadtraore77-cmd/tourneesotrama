// ================================
// URL du Google Apps Script (BASE DE DONNÉES)
// ================================
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwJB1aejrukTEaFkRq2_QF2JsTYdyGOlWuIg_UcYlDPaQ2-9jlZzO9gX7WkmKG372Dwrw/exec";

// ================================
// Initialisation
// ================================
window.onload = () => {
    const now = new Date();
    document.getElementById('date').value = now.toISOString().split('T')[0];
};

// ================================
// Enregistrement d'un appel (WEB PARTAGÉ)
// ================================
document.getElementById('callForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const data = {
        date: document.getElementById('date').value,
        nom: document.getElementById('nom').value,
        telephone: document.getElementById('telephone').value,
        code_postal: document.getElementById('code_postal').value,
        adresse: document.getElementById('adresse').value,
        commentaire: document.getElementById('commentaire').value,
        confirme: document.getElementById('confirme').checked ? "Oui" : "Non"
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    alert("✅ Appel enregistré dans le registre commun");

    document.getElementById('callForm').reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
});
