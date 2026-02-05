export const stripIndents = (value: TemplateStringsArray | string) => {
  const text = Array.isArray(value) ? value.join('') : value;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const trimmedLines = lines.filter((line, index) => line.trim().length > 0 || index === lines.length - 1);
  const indentLengths = trimmedLines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^(\s*)/)?.[1].length ?? 0);
  const minIndent = indentLengths.length ? Math.min(...indentLengths) : 0;
  return trimmedLines.map((line) => line.slice(minIndent)).join('\n').trim();
};
