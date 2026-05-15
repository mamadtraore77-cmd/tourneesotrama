<script>
const URL = "https://script.google.com/macros/s/AKfycbyoqQPBFc42_hIe-1RvcvgojYiYGE9ie07P70t8WroyrCBBmaapimXeHbrbanWYMFAYow/exec";

function chargerDonnees() {
  fetch(URL)
    .then(res => res.json())
    .then(data => {

      const tbody = document.querySelector("#table tbody");
      tbody.innerHTML = "";

      // ignorer première ligne (header)
      data.slice(1).reverse().forEach(row => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${row[1] || ""}</td>
          <td>${row[2] || ""}</td>
          <td>${row[3] || ""}</td>
          <td>${row[5] || ""}</td>
          <td>${row[0] || ""}</td>
          <td>${row[8] === "Oui" ? "✅" : "❌"}</td>
        `;

        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error(err));
}

// 🔍 recherche
document.getElementById("search").addEventListener("input", function() {
  const value = this.value.toLowerCase();

  document.querySelectorAll("#table tbody tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
});

// ✅ refresh auto
setInterval(chargerDonnees, 4000);

// ✅ premier chargement
chargerDonnees();
</script>
