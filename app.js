document.getElementById("run-btn").addEventListener("click", personalize);

async function personalize() {
  const ad = document.getElementById("ad-input").value.trim();
  const lp = document.getElementById("lp-input").value.trim();

  if (!ad || !lp) return showError("Fill both fields");

  clearError();
  setLoading(true);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: `Ad: ${ad}\nLP: ${lp}\nReturn JSON only`
      })
    });

    const data = await res.json();
    let raw = data.output;

    let parsed = JSON.parse(raw);

    render(parsed);
    setLoading(false);

  } catch (e) {
    showError("Something went wrong");
    setLoading(false);
  }
}

function render(data) {
  document.getElementById("analysis").innerText = data.adAnalysis;

  document.getElementById("insights").innerHTML =
    data.insights.map(i => `<span>${i.label}: ${i.value}</span>`).join("");

  document.getElementById("before-frame").innerText =
    JSON.stringify(data.before, null, 2);

  document.getElementById("after-frame").innerText =
    JSON.stringify(data.after, null, 2);

  document.getElementById("output").classList.remove("hidden");
}

function setLoading(show) {
  document.getElementById("status").classList.toggle("hidden", !show);
}

function showError(msg) {
  const el = document.getElementById("error");
  el.innerText = msg;
  el.classList.remove("hidden");
}

function clearError() {
  document.getElementById("error").classList.add("hidden");
}