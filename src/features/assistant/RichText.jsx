// Mise en forme légère du texte (gras, listes), sans HTML brut.

function inline(text, keyBase) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) => (
    chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4
      ? <strong key={`${keyBase}-${i}`} className="font-black text-white">{chunk.slice(2, -2)}</strong>
      : chunk.replace(/(^|\s)\*([^*\s][^*]*)\*/g, '$1$2')
  ));
}

/** Réponse de l'assistant : paragraphes, titres, listes et gras, sans jamais interpréter de HTML. */
export default function RichText({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      if (!list) { list = { ordered: /^\s*\d/.test(line), items: [] }; blocks.push(list); }
      list.items.push(<li key={i}>{inline(bullet[1], i)}</li>);
      return;
    }
    list = null;
    if (!line.trim()) return;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(heading
      ? <p key={i} className="font-black text-white">{inline(heading[1], i)}</p>
      : <p key={i}>{inline(line, i)}</p>);
  });
  return (
    <div className="space-y-2 text-[15px] leading-relaxed">
      {blocks.map((b, i) => (b.items ? (
        b.ordered
          ? <ol key={`l${i}`} className="list-decimal pl-5 space-y-1">{b.items}</ol>
          : <ul key={`l${i}`} className="list-disc pl-5 space-y-1 marker:text-amber-400">{b.items}</ul>
      ) : b))}
    </div>
  );
}
