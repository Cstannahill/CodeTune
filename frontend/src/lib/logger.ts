import pino from "pino";

// Configure pino for browser environment
const logger = pino({
  browser: {
    serialize: true,
    asObject: true,
    transmit: {
      send: async function (level, logEvent) {
        // In development, just log to console
        if (import.meta.env.DEV) {
          console.log(`[${level}]`, logEvent);
          return;
        }

        // In production, you could send to a logging service
        // Example: send to your backend logging endpoint
        try {
          await fetch("/api/logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([logEvent]),
          });
        } catch (error) {
          console.error("Failed to send log:", error);
        }
      },
    },
  },
  level: import.meta.env.DEV ? "debug" : "info",
});

export default logger;
