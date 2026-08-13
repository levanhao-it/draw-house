/**
 * Word-wrap text to fit maxWidth pixels using canvas text measurement.
 * Returns an array of line strings (never empty).
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) lines.push(current);
  if (lines.length === 0) lines.push('');
  return lines;
}

/** Count how many lines `text` requires at the given maxWidth with the current font. */
export function countTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): number {
  return wrapText(ctx, text, maxWidth).length;
}
