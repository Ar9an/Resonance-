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

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: fullPrompt })
    });

    // 🔥 safer handling
    if (!response.ok) {
      throw new Error("Backend error");
    }

    const text = await response.text();

    if (!text) {
      throw new Error("Empty response from backend");
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid backend JSON:", text);
      throw new Error("Server returned invalid data");
    }

    if (data.error) throw new Error(data.error);

    const rawText =
      data.choices?.[0]?.message?.content ||
      data.output ||
      "";

    if (!rawText) throw new Error("Empty AI response");

    // ✅ CLEAN RESPONSE
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
      console.warn("First parse failed, trying fix...");

      // 🔥 FIX COMMON JSON ISSUES
      try {
        const fixed = clean
          .replace(/,\s*}/g, "}")   // remove trailing commas
          .replace(/,\s*]/g, "]")
          .replace(/\n/g, " ")
          .replace(/\t/g, " ");

        parsed = JSON.parse(fixed);
      } catch (e2) {
        console.error("RAW AI RESPONSE:", rawText);
        throw new Error("AI returned invalid JSON. Try again.");
      }
    }

    renderOutput(parsed);
    setLoading(false);

  } catch (err) {
    setLoading(false);
    showError(err.message);
  }
}