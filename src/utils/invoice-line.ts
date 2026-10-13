export interface InvoiceLineListItem {
  text: string;
  children: string[];
}

export type InvoiceLineBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: InvoiceLineListItem[] };

export interface InvoiceLine {
  name: string;
  blocks: InvoiceLineBlock[];
}

const BULLET = /^([•·◦▪*–-])\s+/;
const SUB_BULLET = /^[·◦]\s/;
const SENTENCE_END = /[.!?:;]$/;
const LIST_LINE_MAX = 80;

/**
 * Package and product inclusions are stored as newline lists, either in the
 * detail field or folded into the description under the item name.
 */
export function parseInvoiceLine(
  description: string,
  detail: string | null | undefined,
): InvoiceLine {
  const [first = "", ...rest] = (description || "").split(/\r?\n/);
  const body = [rest.join("\n"), detail || ""]
    .filter((part) => part.trim())
    .join("\n\n");
  return {
    name: first.trim() || (description || "").trim(),
    blocks: body
      .split(/\r?\n\s*\r?\n/)
      .map(parseBlock)
      .filter((block): block is InvoiceLineBlock => block !== null),
  };
}

function parseBlock(chunk: string): InvoiceLineBlock | null {
  const lines = chunk.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return null;

  const hasBullets = lines.some((line) => BULLET.test(line.trim()));
  const isShortList =
    lines.length > 1
    && lines.every((line) => {
      const text = line.trim();
      return text.length <= LIST_LINE_MAX && !SENTENCE_END.test(text);
    });
  if (!hasBullets && !isShortList) {
    return { kind: "paragraph", text: lines.map((line) => line.trim()).join("\n") };
  }

  const items: Array<InvoiceLineListItem & { isSubItem: boolean }> = [];
  for (const line of lines) {
    const text = line.trim();
    const label = text.replace(BULLET, "").trim();
    if (!label) continue;
    const parent = items[items.length - 1];
    const isSubItem = /^\s/.test(line) || SUB_BULLET.test(text);
    if (parent && isSubItem && !parent.isSubItem) {
      parent.children.push(label);
    } else {
      items.push({ text: label, children: [], isSubItem });
    }
  }
  return {
    kind: "list",
    items: items.map(({ text, children }) => ({ text, children })),
  };
}
