async function inspectBundle() {
  try {
    const htmlRes = await fetch("https://dance-flow-ten.vercel.app");
    const html = await htmlRes.text();

    const matches = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!matches) {
      console.log("Could not find index.js asset script tag in HTML.");
      console.log("HTML snippet:", html.slice(0, 300));
      return;
    }

    const jsUrl = "https://dance-flow-ten.vercel.app" + matches[1];
    console.log("Found JS Asset URL:", jsUrl);

    const jsRes = await fetch(jsUrl);
    const js = await jsRes.text();

    console.log("JS Bundle length:", js.length);
    console.log("Contains 'up.railway.app'?", js.includes("up.railway.app"));

    const railwayMatches = js.match(/https:\/\/[a-zA-Z0-9.-]+\.up\.railway\.app[^\s"']*/g);
    console.log("Railway URL matches in JS bundle:", railwayMatches);

    // Search for fallback getApiUrl logic in bundle
    const fallbackMatches = js.match(/hostname[^"']*/g);
    console.log("Hostname matches count:", fallbackMatches ? fallbackMatches.length : 0);

  } catch (err) {
    console.error("Bundle inspection error:", err);
  }
}

inspectBundle();
