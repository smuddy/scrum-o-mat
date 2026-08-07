import {RetroActionItemId, RetroBoardId, RetroCardId} from '../../models/retro';

// Ticket 18: Export (CSV/Markdown) -- bewusst reine Funktionen ohne Angular-Abhaengigkeit, damit sie
// unabhaengig vom TestBed getestet werden koennen (siehe retro-export.spec.ts). Der Download selbst
// (Blob/URL.createObjectURL) lebt in board.component.ts, das diese Funktionen nur aufruft.

// Baut den kompletten Markdown-Export eines Boards: Titel, je Spalte (nach order) eine Ueberschrift
// mit ihren Karten (nach order) als Bullet-Liste (inkl. Stimmen-Summe und Reaktionen), gefolgt von
// einem Action-Items-Abschnitt (Checkbox-Liste mit optionalem Assignee).
export function boardToMarkdown(board: RetroBoardId, cards: RetroCardId[], actionItems: RetroActionItemId[]): string {
  const lines: string[] = [`# ${board.title}`];

  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);
  for (const column of sortedColumns) {
    lines.push('', `## ${column.name}`);
    const columnCards = cards.filter(card => card.columnId === column.id).sort((a, b) => a.order - b.order);
    for (const card of columnCards) {
      lines.push(cardToMarkdownLine(card));
    }
  }

  lines.push('', '## Action-Items');
  const sortedActionItems = [...actionItems].sort((a, b) => a.order - b.order);
  for (const item of sortedActionItems) {
    lines.push(actionItemToMarkdownLine(item));
  }

  return lines.join('\n');
}

// Eine Karte als Markdown-Bullet: Text, optional die Stimmen-Summe (nur wenn > 0) und optional je
// Emoji mit mind. einer Reaktion dessen Anzahl (Reihenfolge = Einfuege-Reihenfolge der reactions-Map).
function cardToMarkdownLine(card: RetroCardId): string {
  let line = `- ${card.text}`;
  const totalVotes = sumVotes(card);
  if (totalVotes > 0) {
    line += ` (★${totalVotes})`;
  }
  for (const [emoji, uids] of Object.entries(card.reactions ?? {})) {
    if (uids.length > 0) {
      line += ` ${emoji}${uids.length}`;
    }
  }
  return line;
}

function actionItemToMarkdownLine(item: RetroActionItemId): string {
  const checkbox = item.done ? '[x]' : '[ ]';
  let line = `- ${checkbox} ${item.text}`;
  if (item.assignee) {
    line += ` (@${item.assignee})`;
  }
  return line;
}

// Baut den CSV-Export der Karten eines Boards: Kopfzeile Spalte/Karte/Stimmen, danach je Karte
// (gruppiert nach Spalte, jeweils nach order sortiert) eine Zeile mit Spaltenname, Kartentext und der
// Stimmen-Summe der Karte.
export function boardToCsv(board: RetroBoardId, cards: RetroCardId[]): string {
  const rows: string[][] = [['Spalte', 'Karte', 'Stimmen']];

  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);
  for (const column of sortedColumns) {
    const columnCards = cards.filter(card => card.columnId === column.id).sort((a, b) => a.order - b.order);
    for (const card of columnCards) {
      rows.push([column.name, card.text, String(sumVotes(card))]);
    }
  }

  return rows.map(row => row.map(csvEscapeValue).join(',')).join('\n');
}

function sumVotes(card: RetroCardId): number {
  return Object.values(card.votes ?? {}).reduce((sum, count) => sum + count, 0);
}

// CSV-Escaping (RFC 4180): Werte, die Komma, Anfuehrungszeichen oder einen Zeilenumbruch enthalten,
// werden in Anfuehrungszeichen eingeschlossen; enthaltene Anfuehrungszeichen werden verdoppelt.
function csvEscapeValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
