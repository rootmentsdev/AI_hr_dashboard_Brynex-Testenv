import React from 'react';

/**
 * FormattedChatMessage
 * Parses Claude AI markdown (headers, bold/italic, bullet/numbered lists, dividers, tables)
 * into clean, beautifully styled HTML elements.
 * Eliminates all raw '#', '##', '**', '---' artifacts from chat replies.
 */

function formatInline(text = '') {
  if (!text) return '';
  return text
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')
    // Bold + Italic ***text*** or ___text___
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')
    // Bold **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // Italic *text* or _text_
    .replace(/(?:^|[^*])\*([^*\n]+)\*(?:[^*]|$)/g, (match, p1) => match.replace(`*${p1}*`, `<em>${p1}</em>`))
    .replace(/(?:^|[^_])_([^_\n]+)_(?:[^_]|$)/g, (match, p1) => match.replace(`_${p1}_`, `<em>${p1}</em>`))
    // Clean up any remaining stray asterisks or hashes
    .replace(/\*\*/g, '');
}

export default function FormattedChatMessage({ content }) {
  if (!content) return null;

  // Split content by newline (supporting both CRLF and LF)
  const lines = String(content).split(/\r?\n/);
  const elements = [];

  let currentList = null; // { type: 'ul' | 'ol', items: [] }
  let tableRows = []; // array of cell arrays

  const flushList = () => {
    if (currentList && currentList.items.length > 0) {
      if (currentList.type === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="chat-ol">
            {currentList.items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="chat-ul">
            {currentList.items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
      }
      currentList = null;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const bodyRows = tableRows.slice(1);
      elements.push(
        <div key={`table-wrap-${elements.length}`} className="chat-table-wrapper">
          <table className="chat-table">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      flushTable();
      continue;
    }

    // 1. Horizontal separator: --- or *** or ___
    if (/^(\-{3,}|\*{3,}|\_{3,})$/.test(trimmed)) {
      flushList();
      flushTable();
      elements.push(<hr key={`hr-${elements.length}`} className="chat-hr" />);
      continue;
    }

    // 2. Headings: #, ##, ###, ####
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushList();
      flushTable();
      const level = headingMatch[1].length;
      // Strip outer asterisks if wrapped e.g. "## **Store Count**" -> "Store Count"
      const headingRaw = headingMatch[2].replace(/^\*{1,2}|\*{1,2}$/g, '').trim();
      const headingHtml = formatInline(headingRaw);

      if (level === 1) {
        elements.push(
          <div
            key={`h1-${elements.length}`}
            className="chat-h1"
            dangerouslySetInnerHTML={{ __html: headingHtml }}
          />
        );
      } else if (level === 2) {
        elements.push(
          <div
            key={`h2-${elements.length}`}
            className="chat-h2"
            dangerouslySetInnerHTML={{ __html: headingHtml }}
          />
        );
      } else {
        elements.push(
          <div
            key={`h3-${elements.length}`}
            className="chat-h3"
            dangerouslySetInnerHTML={{ __html: headingHtml }}
          />
        );
      }
      continue;
    }

    // 3. Table rows: | Col1 | Col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      // Skip delimiter row like |---|---| or |:---|---:|
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        continue;
      }
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // 4. Unordered lists: - item, * item, • item
    const ulMatch = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // 5. Ordered lists: 1. item or 1) item
    const olMatch = /^(\d+)[\.\)]\s+(.+)$/.exec(trimmed);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // 6. Regular paragraph
    flushList();
    elements.push(
      <p
        key={`p-${elements.length}`}
        className="chat-p"
        dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
      />
    );
  }

  flushList();
  flushTable();

  return <div className="chat-formatted-body">{elements}</div>;
}
