import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Pre-clean any leftover task comments
  const cleanContent = content.replace(/<!--TASK:[\s\S]*?-->/g, '').trim();

  // Split by code blocks
  const parts = cleanContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[15px] text-neutral-200">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const language = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
          const code = (language ? lines.slice(1) : lines).join('\n');

          return (
            <div
              key={index}
              className="my-3 rounded-lg border border-neutral-800 bg-neutral-950/80 overflow-hidden font-mono text-xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/80 bg-neutral-900/60 text-neutral-400">
                <span className="text-[11px] font-mono lowercase">
                  {language || 'code'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(code, index)}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-neutral-300 leading-normal">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render regular markdown text
        return <FormattedBlock key={index} text={part} />;
      })}
    </div>
  );
};

const FormattedBlock: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Check if paragraph is a table
        if (trimmed.includes('|') && trimmed.includes('\n')) {
          const lines = trimmed.split('\n').filter((l) => l.includes('|'));
          if (lines.length >= 2) {
            const headerCells = lines[0]
              .split('|')
              .filter((_, i, arr) => i > 0 && i < arr.length - 1)
              .map((c) => c.trim());
            const rows = lines.slice(2).map((row) =>
              row
                .split('|')
                .filter((_, i, arr) => i > 0 && i < arr.length - 1)
                .map((c) => c.trim())
            );

            return (
              <div
                key={pIdx}
                className="my-3 overflow-x-auto rounded-lg border border-neutral-800"
              >
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/90 text-neutral-300 border-b border-neutral-800 text-xs">
                    <tr>
                      {headerCells.map((h, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-neutral-900/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2 text-neutral-300">
                            {formatInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={pIdx}
              className="text-base font-semibold text-neutral-100 tracking-tight mt-3 mb-1"
            >
              {formatInline(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={pIdx}
              className="text-lg font-semibold text-neutral-100 tracking-tight mt-4 mb-1.5"
            >
              {formatInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={pIdx}
              className="text-xl font-bold text-neutral-100 tracking-tight mt-4 mb-2"
            >
              {formatInline(trimmed.slice(2))}
            </h1>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={pIdx}
              className="border-l-2 border-amber-500/60 pl-3 py-1 italic text-neutral-300 my-2 bg-neutral-900/30 rounded-r"
            >
              {formatInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Bullet / Ordered lists
        const lines = trimmed.split('\n');
        const isBulletList = lines.every(
          (l) => l.trim().startsWith('- ') || l.trim().startsWith('* ')
        );
        const isNumList = lines.every((l) => /^\d+\.\s/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2 ml-1">
              {lines.map((l, lIdx) => {
                const item = l.trim().replace(/^[-*]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 mt-2 shrink-0" />
                    <span>{formatInline(item)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        if (isNumList) {
          return (
            <ol key={pIdx} className="space-y-1.5 my-2 ml-1">
              {lines.map((l, lIdx) => {
                const match = l.trim().match(/^(\d+)\.\s+(.*)$/);
                const num = match ? match[1] : lIdx + 1;
                const text = match ? match[2] : l;
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="text-xs font-mono text-neutral-400 mt-0.5 w-4 shrink-0 text-right tabular-nums">
                      {num}.
                    </span>
                    <span>{formatInline(text)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formatInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
};

const formatInline = (text: string): React.ReactNode => {
  // Handle bold, italic, inline code
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, i) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded bg-neutral-800/80 px-1.5 py-0.5 font-mono text-xs text-amber-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-neutral-100">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <em key={i} className="italic text-neutral-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
};
