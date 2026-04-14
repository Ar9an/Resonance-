// =============================================
//  SECURE VERSION (NO API KEY HERE)
// =============================================

const PROMPT_TEMPLATE = `You are a CRO (Conversion Rate Optimization) and landing page personalization expert.

Given:
1. A description of an ad creative (headline, offer, CTA, tone, audience)
2. The current landing page copy (headline, sub, CTA, features)

Your job:
- Extract the ad's core promise, audience, urgency signals, and tone
- Rewrite the landing page copy to achieve "message match"
- Apply CRO best practices: benefit-led headline, specific offer in sub, action-verb CTA, social proof line

Return ONLY a valid JSON object. No text before or after. No markdown. Start with { and end with }.

JSON schema:
{
  "adAnalysis": "2-3 sentence summary",
  "insights": [
    { "label": "Audience", "value": "..." },
    { "label": "Core offer", "value": "..." },
    { "label": "Tone", "value": "..." },
    { "label": "Urgency", "value": "..." }
  ],
  "before": {
    "headline": "",
    "sub": "",
    "cta": "",
    "features": ["", "", ""],
    "ctaColor": "#4f6ef7"
  },
  "after": {
    "headline": "",
    "sub": "",
    "cta": "",
    "trust": "",
    "features": ["", "", ""],
    "ctaColor": "#hex"
  }
}`;

async function personalize() {
  const adInput = document.getElementById("ad-input").value.trim();
  const lpInput = document.getElementById("lp-input").value.trim();

  if (!adInput) return showError("Please describe your ad creative.");
  if (!lpInput) return showError("Please paste your landing page copy.");

  clearError();
  setLoading(true, "Analyzing your ad...");
  document.getElementById("output").classList.add("hidden");

  const fullPrompt = `${PROMPT_TEMPLATE}

Ad creative:
${adInput}

Current landing page copy:
${lpInput}`;

  try {
    setLoading(true, "Personalizing your landing page...");

    // ✅ CALL BACKEND (SAFE)
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: fullPrompt
      })
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const rawText =
      data.choices?.[0]?.message?.content ||
      data.output ||
      "";

    if (!rawText) throw new Error("Empty response");

    // ✅ CLEAN + EXTRACT JSON
    let clean = rawText
      .replace(/```json|```/g, "")
      .trim();

    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      clean = clean.substring(start, end + 1);
    }

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("RAW RESPONSE:", rawText);
      throw new Error("AI returned invalid JSON");
    }

    renderOutput(parsed);
    setLoading(false);

  } catch (err) {
    setLoading(false);
    showError("Error: " + err.message);
  }
}

function renderOutput(data) {
  const insightRow = document.getElementById("insights");

  insightRow.innerHTML = (data.insights || [])
    .map(i => `<div class="chip"><strong>${i.label}:</strong> ${i.value}</div>`)
    .join("");

  document.getElementById("analysis").textContent = data.adAnalysis || "";

  document.getElementById("before-frame").innerHTML =
    buildFrame(data.before, false);

  document.getElementById("after-frame").innerHTML =
    buildFrame(data.after, true);

  document.getElementById("output").classList.remove("hidden");
}

function buildFrame(d, isAfter) {
  const ctaColor = d?.ctaColor || "#4f6ef7";
  const iconBg = isAfter ? "#d4edda" : "#eef2ff";
  const iconColor = isAfter ? "#1a6b33" : "#3a57e0";

  const features = (d?.features || []).map(f => `
    <div class="lp-feat">
      <div class="feat-icon" style="background:${iconBg}; color:${iconColor};">✓</div>
      <span>${f}</span>
    </div>
  `).join("");

  const trust = d?.trust
    ? `<div class="lp-trust">${d.trust}</div>`
    : "";

  return `
    <div class="lp-bar">
      <div class="dot" style="background:#ff5f57;"></div>
      <div class="dot" style="background:#febc2e;"></div>
      <div class="dot" style="background:#28c840;"></div>
      <div class="lp-url">yourdomain.com</div>
    </div>
    <div class="lp-body">
      <div class="lp-headline">${d?.headline || ""}</div>
      <div class="lp-sub">${d?.sub || ""}</div>
      <button class="lp-cta" style="background:${ctaColor};">
        ${d?.cta || "Get started"}
      </button>
      ${trust}
      <div class="lp-features">${features}</div>
    </div>
  `;
}

function setLoading(show, text = "") {
  document.getElementById("status").classList.toggle("hidden", !show);
  document.getElementById("run-btn").disabled = show;

  if (text) {
    document.getElementById("status-text").textContent = text;
  }
}

function showError(msg) {
  const el = document.getElementById("error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  document.getElementById("error").classList.add("hidden");
}