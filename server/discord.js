const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1392702624159236226/1e62bMZRxVYwYm-LeC1Sp4X-NtZ0WEfSM7UVeC3Uvr32GuSv_-2uNbI8ltX-TG-HamiQ";

/**
 * Send a message to Discord via webhook.
 *
 * Basic usage (back-compat):
 *   msgDiscord("Hello world");
 *
 * Advanced usage with formatting options:
 *   msgDiscord("Build succeeded!", { embed: true, color: 0x57F287 });
 *   msgDiscord("console.log('foo');", { code: true });
 *   msgDiscord({ content: "pre-built payload" }); // full Discord payload
 *
 * @param {string|object} message   Either a plain string *or* a pre-built Discord payload.
 * @param {object}        [options] Optional formatting options. Ignored if `message` is an object.
 * @param {boolean}       [options.embed=false]   Wrap message in a simple embed.
 * @param {boolean}       [options.code=false]    Wrap message in a code block.
 * @param {number}        [options.color]         Embed color (integer) if `embed` is true.
 */
export const msgDiscord = (message, options = {}) => {
  let payload;

  // Handle object input: could be pre-built payload OR a key/value map.
  if (typeof message === "object" && message !== null) {
    const isPrebuiltPayload =
      "content" in message || "embeds" in message || "tts" in message;

    if (isPrebuiltPayload) {
      // Developer supplied full Discord payload – send as-is.
      payload = message;
    } else {
      // Treat as key/value pairs → convert to embed fields.
      const { title = "", color = 0x5865f2 } = options;

      const fields = Object.entries(message).map(([name, value]) => ({
        name,
        value: String(value),
        inline: false,
      }));

      payload = {
        embeds: [
          {
            title,
            color,
            fields,
          },
        ],
      };
    }
  } else {
    // Build payload based on requested formatting options.
    const { embed = false, code = false, color = 0x5865f2 } = options;

    if (embed) {
      payload = {
        embeds: [
          {
            description: code ? `\`\`\`\n${message}\n\`\`\`` : message,
            color,
          },
        ],
      };
    } else if (code) {
      payload = { content: `\`\`\`\n${message}\n\`\`\`` };
    } else {
      payload = { content: message };
    }
  }

  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};
