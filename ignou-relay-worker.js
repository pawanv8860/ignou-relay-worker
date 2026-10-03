// Small relay for the IGNOU Grade Card Analyzer (Cloudflare Workers, free plan).
// It only forwards grade card requests to gradecard.ignou.ac.in and adds the
// header that lets your analyzer page read the answer.
//
// Use: https://<your-worker>.workers.dev/?eno=ENROLMENT&prog=PROGRAMME&type=TYPE
// Then put the worker address in the analyzer: Settings > Your own relay URL.

// Set this to the address where your analyzer page is hosted, e.g. "https://example.com".
// "*" lets any website use your relay.
const ALLOWED_ORIGIN = "*";

export default {
  async fetch(request) {
    const cors = { "Access-Control-Allow-Origin": ALLOWED_ORIGIN, "Vary": "Origin" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });

    const q = new URL(request.url).searchParams;
    const eno = q.get("eno") || "", prog = q.get("prog") || "", type = q.get("type") || "";
    if (!/^\d{9,10}$/.test(eno) || !/^[A-Za-z0-9_()\-]{2,20}$/.test(prog) || !/^[1-4]$/.test(type)) {
      return new Response("Invalid parameters", { status: 400, headers: cors });
    }
    const target = "https://gradecard.ignou.ac.in/view_gradecard.aspx?eno=" + encodeURIComponent(eno) +
      "&prog=" + encodeURIComponent(prog) + "&type=" + type;
    try {
      const upstream = await fetch(target, { headers: { "User-Agent": "Mozilla/5.0" } });
      return new Response(await upstream.text(), {
        status: upstream.status,
        headers: { ...cors, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      });
    } catch (e) {
      return new Response("Could not reach the IGNOU website", { status: 502, headers: cors });
    }
  }
};
