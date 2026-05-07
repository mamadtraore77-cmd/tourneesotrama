const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyoqQPBFc42_hIe-1RvcvgojYiYGE9ie07P70t8WroyrCBBmaapimXeHbrbanWYMFAYow/exec";

document.getElementById("callForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const data = new URLSearchParams();
  data.append("utilisateur", document.getElementById("utilisateur").value);
  data.append("date", document.getElementById("date").value);
  data.append("nom", document.getElementById("nom").value);
  data.append("telephone", document.getElementById("telephone").value);
  data.append("code_postal", document.getElementById("code_postal").value);
  data.append("adresse", document.getElementById("adresse").value);
  data.append("commentaire", document.getElementById("commentaire").value);
  data.append(
    "confirme",
    document.getElementById("confirme").checked ? "Oui" : "Non"
  );

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body: data,
    mode: "no-cors"   // ✅ CRUCIAL
  });

  alert("✅ Appel enregistré");

  document.getElementById("callForm").reset();
});
``
