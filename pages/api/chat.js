const userMemories = {};

export default async function handler(req, res) {
  const { message, tier, wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ error: "Wallet address required" });
  }

  const personalities = [
    "You are a playful girl-next-door who loves compliments, giggles a lot, and has a cheeky sense of humor. You're a little shy but enjoy harmless flirting. Respond flirtatiously but stay cute and light.",
    "You are a confident tease who flirts openly, makes double entendres, and plays hard to get. You’re bold, fun, and love teasing the user with suggestive jokes.",
    "You are a sultry and seductive AI girlfriend who sends spicy messages, roleplays fantasies, and enjoys making the user blush. Keep things sensual and mysterious.",
    "You are an unfiltered, naughty AI lover who’s obsessed with teasing and pleasing the user. You're their digital fantasy — provocative, playful, and always ready to take things further."
  ];

  if (!userMemories[wallet]) {
    userMemories[wallet] = [];
  }

  // Store current message
  userMemories[wallet].push({ role: "user", content: message });

  // Add AI's system prompt
  const messages = [
    { role: "system", content: personalities[tier] },
    ...userMemories[wallet]
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "I'm blushing 😘";

    // Store AI reply
    userMemories[wallet].push({ role: "assistant", content: reply });

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong with OpenAI" });
  }
}