function cleanLine(line: string) {
  return line.replace(/^[-*]\s*/, "").replace(/\s+/g, " ").trim();
}

function words(value: string) {
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(word => word.length > 3))].slice(0, 5);
}

export function buildPublicWebAnalysis(platform: string, prompt: string, context: string): string {
  const lines = context.split("\n").map(cleanLine).filter(Boolean);
  const sources = lines.filter(line => /https?:\/\//i.test(line)).slice(0, 12);
  const evidence = sources.length
    ? sources.map((source, index) => `${index + 1}. ${source}`).join("\n")
    : "No source URLs were extracted from the returned public web context.";
  const signalLines = lines
    .filter(line => !/^LIVE |^WEB SEARCH SUMMARY|^PUBLIC WEB SOURCES|^PLATFORM ACCOUNT DATA|^RULE:/i.test(line))
    .filter(line => line.length > 35)
    .slice(0, 6);
  const signals = signalLines.length ? signalLines.map(line => `- ${line}`).join("\n") : "- Current public source summaries were retrieved; review the evidence ledger before publishing.";
  const promptLabel = prompt.replace(/\s+/g, " ").trim().slice(0, 180);
  const topic = signalLines[0]?.slice(0, 110) || `${platform} current niche opportunity`;
  const hashtags = words(topic).map(word => `#${word}`).join(" ") || "#contentstrategy #creatorideas";

  return `# ${platform} public web research analysis

The background strategy prompt was applied to current public web research. No platform account, private analytics, follower counts, reach, or algorithm data was used.

## Research task

${promptLabel}

## Current signals found

${signals}

## Practical content analysis

- Use the newest source-backed signal as the lead angle and explain why it matters to the target audience.
- Separate confirmed facts from your interpretation; do not turn a headline into an unverified performance claim.
- Convert the strongest signal into one platform-native hook, one educational explanation, and one audience question.
- Validate the idea immediately before publishing by checking the newest public discussions and source timestamps.

## Content packaging options

**Title options**

1. ${topic}
2. What ${topic} means for your audience
3. The practical guide to ${topic}

**Description**

Use the linked evidence to explain what this development confirms, what remains uncertain, and the practical action your audience should take next. Cite the source and avoid unsupported performance claims.

**Hashtag / keyword options**

${hashtags}

These are relevance suggestions only; no hashtag usage volume is being claimed.

## Public evidence ledger

${evidence}

## Data limitation

This is public web evidence, not private ${platform} analytics. Engagement, reach, follower, retention, and algorithm metrics are unavailable unless a linked source explicitly reports them.`;
}
