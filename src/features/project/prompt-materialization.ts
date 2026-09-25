const FULL_SCRIPT_PLACEHOLDER =
  /(?:\[\s*FULL\s+(?:FINAL\s+)?SCRIPT(?:\s+HERE)?\s*\]|\{\{\s*FULL\s+(?:FINAL\s+)?SCRIPT\s*\}\})/gi;

/** Ensure every disconnected Omni request receives the actual finalized script. */
export function materializeFullScript(prompt: string, fullScript: string): string {
  const script = fullScript.trim();
  if (!script) return prompt;

  if (FULL_SCRIPT_PLACEHOLDER.test(prompt)) {
    FULL_SCRIPT_PLACEHOLDER.lastIndex = 0;
    return prompt.replace(FULL_SCRIPT_PLACEHOLDER, script);
  }

  FULL_SCRIPT_PLACEHOLDER.lastIndex = 0;
  if (prompt.includes(script)) return prompt;

  const introduction =
    "this is full script and i am giving you my image also so keep the character consistent and do not change face structure";
  const introductionIndex = prompt.toLocaleLowerCase("en-IN").indexOf(introduction);
  if (introductionIndex >= 0) {
    const insertionPoint = introductionIndex + introduction.length;
    return `${prompt.slice(0, insertionPoint)}\n\n${script}${prompt.slice(insertionPoint)}`;
  }

  return `${introduction}\n\n${script}\n\n${prompt}`;
}
