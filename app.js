// =============================================
//  CONFIG — paste your OpenRouter API key here
// =============================================
const OPENROUTER_API_KEY = "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";
// Get your free key at: https://openrouter.ai
// =============================================

const PROMPT_TEMPLATE = `You are a CRO (Conversion Rate Optimization) and landing page personalization expert.

Given:
1. A description of an ad creative (headline, offer, CTA, tone, audience)
2. The current landing page copy (headline, sub, CTA, features)

Your job:
- Extract the ad's core promise, audience, urgency signals, and tone
- Rewrite the landing page copy to achieve "message match" — the LP should feel like a direct continuation of the ad
- Apply CRO best practices: benefit-led headline, specific offer in sub, action-verb CTA, social proof line

Return ONLY valid JSON. No markdown, no backticks, no explanation. Just the raw JSON object.

JSON schema:
{
  "adAnalysis": "2-3 sentence summary of what the ad communicates and who it targets",
  "insights": [
    { "label": "Audience", "value": "..." },
    { "label": "Core offer", "value": "..." },
    { "label": "Tone", "value": "..." },
    { "label": "Urgency", "value": "..." }
  ],
  "before": {
    "headline": "the original headline from the LP input",
    "sub": "the original subheadline",
    "cta": "the original CTA text",
    "features": ["original feature 1", "original feature 2", "original feature 3"],
    "ctaColor": "#4f6ef7"
  },
  "after": {
    "headline": "rewritten headline — specific, benefit-driven, mirrors ad promise",
    "sub": "rewritten sub — echoes ad offer and audience pain point",
    "cta": "rewritten CTA — matches ad's action verb",
    "trust": "a short social proof or urgency line, e.g. '3,200 teams joined this week'",
    "features": ["rewritten feature 1 aligned to ad", "rewritten feature 2", "rewritten feature 3"],
    "ctaColor": "#hex color that fits the ad energy"
  }
}`;

async function personalize() {
  const adInput = document.getElementById("ad-input").value.trim();
  const lpInput = document.getElementById("lp-input").value.trim();

  if (!adInput) return showError("Please describe your ad creative.");
  if (!lpInput) return showError("Please paste your landing page copy.");
  if (OPENROUTER_API_KEY === "YOUR_OPENROUTER_KEY_HERE") {
    return showError("Open app.js and paste your OpenRouter API key at the top.");
  }

  clearError();
  setLoading(true, "Analyzing your ad...");
  document.getElementById("output").classList.add("hidden");

  const fullPrompt = `${PROMPT_TEMPLATE}

Ad creative:
${adInput}

Current landing page copy:
${lpInput}

Return only the JSON object, nothing else.`;

  try {
    setLoading(true, "Personalizing your landing page...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost",
        "X-Title": "LP Personalizer"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error.message || "OpenRouter API error");

    const rawText = data.choices?.[0]?.message?.content || "";
    if (!rawText) throw new Error("Empty response. Please try again.");

    const clean = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    renderOutput(parsed);
    setLoading(false);

  } catch (err) {
    setLoading(false);
    if (err.message.includes("JSON")) {
      showError("AI returned unexpected format. Please try again.");
    } else {
      showError("Error: " + err.message);
    }
  }
}

function renderOutput(data) {
  const insightRow = document.getElementById("insights");
  insightRow.innerHTML = (data.insights || [])
    .map(i => `<div class="chip"><strong>${i.label}:</strong> ${i.value}</div>`)
    .join("");

  document.getElementById("analysis").textContent = data.adAnalysis || "";
  document.getElementById("before-frame").innerHTML = buildFrame(data.before, false);
  document.getElementById("after-frame").innerHTML = buildFrame(data.after, true);
  document.getElementById("output").classList.remove("hidden");
}

function buildFrame(d, isAfter) {
  const ctaColor  = d.ctaColor || "#4f6ef7";
  const iconBg    = isAfter ? "#d4edda" : "#eef2ff";
  const iconColor = isAfter ? "#1a6b33" : "#3a57e0";

  const features = (d.features || []).map(f => `
    <div class="lp-feat">
      <div class="feat-icon" style="background:${iconBg}; color:${iconColor};">✓</div>
      <span>${f}</span>
    </div>`).join("");

  const trust = d.trust ? `<div class="lp-trust">${d.trust}</div>` : "";

  return `
    <div class="lp-bar">
      <div class="dot" style="background:#ff5f57;"></div>
      <div class="dot" style="background:#febc2e;"></div>
      <div class="dot" style="background:#28c840;"></div>
      <div class="lp-url">yourdomain.com</div>
    </div>
    <div class="lp-body">
      <div class="lp-headline">${d.headline || ""}</div>
      <div class="lp-sub">${d.sub || ""}</div>
      <button class="lp-cta" style="background:${ctaColor};">${d.cta || "Get started"}</button>
      ${trust}
      <div class="lp-features">${features}</div>
    </div>`;
}

function setLoading(show, text = "") {
  document.getElementById("status").classList.toggle("hidden", !show);
  document.getElementById("run-btn").disabled = show;
  if (text) document.getElementById("status-text").textContent = text;
}

function showError(msg) {
  const el = document.getElementById("error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  document.getElementById("error").classList.add("hidden");
}