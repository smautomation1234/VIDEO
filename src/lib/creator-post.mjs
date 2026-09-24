// Keep literal financial symbols, handles and hashtags; normalize formatting only.
export function creatorMarkup(value = '') {
    return String(value)
        .replace(/\\([*_~])/g, '$1')
        .replace(/\[(?:h|BIG|BOLD|HIGHLIGHT)\]([\s\S]*?)\[\/(?:h|BIG|BOLD|HIGHLIGHT)\]/gi, '**$1**')
        .replace(/\[\/?(?:h|BIG|BOLD|HIGHLIGHT)\]/gi, '')
        .replace(/^#{1,6}\s+/gm, '')
        .trim();
}

export function creatorPlainText(value = '') {
    return creatorMarkup(value).replace(/\*{1,3}|`|~~/g, '').trim();
}

// Remove production notes that sometimes get pasted beside publishable copy.
// These belong to the editor, not inside a finished social post.
export function creatorSourceText(value = '') {
    return String(value)
        .replace(/\b(?:remove|delete)\s+(?:the\s+)?old\s+content\b[^.!?\n]*/gi, '')
        .replace(/\breplace\s+(?:it|this|that|the\s+old\s+content)?\s*(?:with|by)\s+this\s+new\s+content\b[^.!?\n]*/gi, '')
        .replace(/\b(?:image|photo|visual)\s+(?:in\s+)?high\s+quality\b/gi, '')
        .replace(/\\(?=[^A-Za-z0-9\s])/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function creatorWordCount(slide) {
    return creatorPlainText([slide?.title, slide?.body, ...(slide?.bullets || [])].join(' ')).split(/\s+/).filter(Boolean).length;
}

export function creatorPostPrompt(source, count) {
    const cleanSource = creatorSourceText(source);
    const sourceWords = cleanSource.split(/\s+/).filter(Boolean).length;
    return `Write a carousel in the style of a complete editorial social post, using the SOURCE below.
Return JSON only: {"caption":"...","hashtags":"...","slides":[{"title":"...","body":"...","bullets":[]}]}
- Return exactly ${count} complete slides, each with 20–32 words TOTAL including its headline. This applies to the FIRST and LAST slide too.
- Keep every slide to a maximum of 5 visible lines: a 5–8 word headline plus 1–2 concise body sentences. Never return a teaser-only cover or a generic follow-me ending.
- Use **paired bold markers** around one important sentence and the concluding insight. Do not output [BIG], [h], HTML, layout notes or placeholders. Do not bold the whole body.
- Use only facts supplied in SOURCE. Preserve qualifiers, approximately (~), names and figures. Never invent facts to reach a word count.
- Expand by explaining the source's reasoning, not by repeating the headline or padding. Each slide must add a distinct angle supported by the source.
- The source contains about ${sourceWords} words. Reframe its supported reasoning into ${count} distinct angles: context, business implication, strategic mechanism, risk, comparison, and takeaway. Do not repeat the same paragraph across slides.
- Do not include requests about editing images or layout from the source in the published text.
- The caption must preserve the same factual qualifications as the source.
SOURCE:
${cleanSource}`;
}
