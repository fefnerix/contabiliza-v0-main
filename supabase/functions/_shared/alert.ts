export async function alertDiscord(
  level: "info" | "warn" | "error" | "critical",
  title: string,
  details: string,
  context?: Record<string, string>,
) {
  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!webhookUrl) return;

  const colors = { info: 0x3498db, warn: 0xf39c12, error: 0xe74c3c, critical: 0x8e44ad };
  const emojis = { info: "ℹ️", warn: "⚠️", error: "❌", critical: "🚨" };
  const fields = Object.entries(context || {}).map(([name, value]) => ({
    name,
    value: String(value).slice(0, 100),
    inline: true,
  }));

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: `${emojis[level]} ${title}`,
          description: details.slice(0, 500),
          color: colors[level],
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: "Contabiliza Monitor" },
        },
      ],
    }),
  });
}
