const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz1_4oRKGtcz-Uy43x5B9-ZIx6Zb7usqoP6tYxZPYwcl4FnJqoPV2_eVBoJYLqL1tx_bQ/exec";

document.getElementById("callForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("utilisateur", document.getElementById("utilisateur").value);
  formData.append("date", document.getElementById("date").value);
  formData.append("nom", document.getElementById("nom").value);
  formData.append("telephone", document.getElementById("telephone").value);
  formData.append("code_postal", document.getElementById("code_postal").value);
  formData.append("adresse", document.getElementById("adresse").value);
  formData.append("commentaire", document.getElementById("commentaire").value);
  formData.append(
    "confirme",
    document.getElementById("confirme").checked ? "Oui" : "Non"
  );

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body: formData
  })
    .then(() => {
      alert("✅ Appel enregistré dans le registre commun");
      document.getElementById("callForm").reset();
    })
    .catch((err) => {
      alert("❌ Erreur lors de l’envoi");
      console.error(err);
    });
});
