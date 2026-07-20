// Minimal Worker script — handles the one dynamic route (/api/geo) and
// otherwise serves the static build via the ASSETS binding.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/geo") {
      // request.cf.country is populated by Cloudflare's edge for every
      // request based on the connecting IP — no external geolocation
      // service, no IP address stored or logged beyond what Cloudflare's
      // hosting already involves (already disclosed in the Datenschutz page).
      const country = (request.cf && request.cf.country) || "US";
      return new Response(JSON.stringify({ country }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
