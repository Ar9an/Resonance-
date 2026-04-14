export default async function handler(req, res) {
  try {
    const { ad, url } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.vercel.app",
        "X-Title": "Ad Generator Project"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: `Create a high-converting personalized landing page.

Ad Creative:
${ad}

Landing Page URL:
${url}

Generate:
- Headline
- Subheadline
- CTA
- Key sections
- Persuasive copy`
          }
        ]
      })
    });

    const data = await response.json();

    res.status(200).json({
      output: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}