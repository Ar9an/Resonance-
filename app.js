const PROMPT_TEMPLATE = `Return ONLY valid JSON.

{
  "adAnalysis": "",
  "insights": [],
  "before": {},
  "after": {}
}`;

document.getElementById("run-btn").addEventListener("click", personalize);

async function personalize() {
  console.log("BUTTON CLICKED");

  const adInput = document.getElementById("ad-input").value.trim();
  const lpInput = document.getElementById("lp-input").value.trim();

  if (!adInput) return showError("Enter ad");
  if (!lpInput) return showError("Enter landing page");

  clearError();
  setLoading(true);

  const fullPrompt = `${PROMPT_TEMPLATE}

Ad: ${adInput}
LP: ${lpInput}`;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: fullPrompt })
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    let raw = data.choices?.[0]?.message?.content || "";

    let clean = raw.replace(/```json|```/g, "").trim();

    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      clean = clean.substring(start, end + 1);
    }

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch {
      clean = clean.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      parsed = JSON.parse(clean);
    }

    renderOutput(parsed);
    setLoading(false);

  } catch (err) {
    setLoading(false);
    showError(err.message);
  }
}

// UI functions
function renderOutput(data) {
  document.getElementById("analysis").textContent = data.adAnalysis || "Done!";
  document.getElementById("before-frame").textContent = JSON.stringify(data.before);
  document.getElementById("after-frame").textContent = JSON.stringify(data.after);
  document.getElementById("output").classList.remove("hidden");
}

function setLoading(show) {
  document.getElementById("status").classList.toggle("hidden", !show);
}

function showError(msg) {
  const el = document.getElementById("error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  document.getElementById("error").classList.add("hidden");
}