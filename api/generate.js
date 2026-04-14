export default async function handler(req, res) {
  try {
    // ✅ get prompt from frontend
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.vercel.app",
        "X-Title": "LP Personalizer"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",   // ✅ stable model
        temperature: 0.3,              // ✅ less randomness
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    // ✅ handle API errors
    if (data.error) {
      return res.status(500).json({
        error: data.error.message || "OpenRouter error"
      });
    }

    // ✅ always return clean structure
    const output = data.choices?.[0]?.message?.content || "";

    if (!output) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    return res.status(200).json({
      choices: [
        {
          message: {
            content: output
          }
        }
      ]
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}