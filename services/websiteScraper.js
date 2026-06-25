const cheerio = require("cheerio");

const MAX_TEXT_LENGTH = 12000;
const MAX_EXTRA_PAGES = 3;

const USEFUL_PATH_KEYWORDS = ["about", "services", "faq", "contact", "pricing", "team"];

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "https://" + url;
  }
  return url;
}

function extractText($) {
  $("script, style, nav, footer, noscript, svg, header").remove();
  const text = $("body").text();
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}

function getPageTitle($) {
  return $("title").text().trim() || "No title";
}

function findInternalLinks($, baseUrl) {
  const base = new URL(baseUrl);
  const found = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let fullUrl;
    try {
      fullUrl = new URL(href, baseUrl).href;
    } catch {
      return;
    }

    const linkUrl = new URL(fullUrl);
    if (linkUrl.hostname !== base.hostname) return;

    const path = linkUrl.pathname.toLowerCase();
    const isUseful = USEFUL_PATH_KEYWORDS.some((kw) => path.includes(kw));

    if (isUseful && !found.includes(fullUrl)) {
      found.push(fullUrl);
    }
  });

  return found;
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 403) {
    throw new Error(
      "Website blocked the scraper with HTTP 403. Try another site or add browser-based scraping later."
    );
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error(`Non-HTML content type: ${contentType}`);
  }

  return await response.text();
}

async function scrapePage(url) {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  return {
    url,
    title: getPageTitle($),
    text: extractText($),
    $,
  };
}

/**
 * Scrapes a website homepage and up to 3 useful internal pages.
 * @param {string} websiteUrl
 * @returns {Object} { url, pages_scraped, combined_text, scraped_at }
 */
async function scrapeWebsite(websiteUrl) {
  if (!websiteUrl || typeof websiteUrl !== "string" || websiteUrl.trim() === "") {
    throw new Error("website_url is required and must be a non-empty string");
  }

  const normalizedUrl = normalizeUrl(websiteUrl.trim());

  if (!isValidUrl(normalizedUrl)) {
    throw new Error(`Invalid website URL: ${websiteUrl}`);
  }

  const pages_scraped = [];

  let homepageData;
  try {
    homepageData = await scrapePage(normalizedUrl);
  } catch (err) {
    throw new Error(`Failed to fetch homepage (${normalizedUrl}): ${err.message}`);
  }

  pages_scraped.push({
    url: homepageData.url,
    title: homepageData.title,
    text: homepageData.text,
  });

  const internalLinks = findInternalLinks(homepageData.$, normalizedUrl);
  const extraLinks = internalLinks.slice(0, MAX_EXTRA_PAGES);

  for (const link of extraLinks) {
    try {
      const pageData = await scrapePage(link);
      pages_scraped.push({
        url: pageData.url,
        title: pageData.title,
        text: pageData.text,
      });
    } catch (err) {
      console.warn(`[scraper] Skipping ${link}: ${err.message}`);
    }
  }

  const combined_text = pages_scraped
    .map((p) => `[${p.title}]\n${p.text}`)
    .join("\n\n---\n\n")
    .slice(0, MAX_TEXT_LENGTH);

  return {
    url: normalizedUrl,
    pages_scraped,
    combined_text,
    scraped_at: new Date().toISOString(),
  };
}

module.exports = { scrapeWebsite };
