export interface RetroColumn {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface RetroBoard {
  ownerId: string;
  title: string;
  columns: RetroColumn[];
  hidden: boolean;
  timerEndsAt: any | null;
  // Ticket 14: Rest-Millisekunden, waehrend der Timer pausiert ist (timerEndsAt ist dann null).
  // null/undefined = kein pausierter Timer (entweder laeuft er gerade oder ist inaktiv).
  timerPausedRemainingMs?: number | null;
  created: any;
  modified: any;
  // Ticket 12: optionales Archiv-Flag -- fehlt bei Alt-Boards, wird dann als "nicht archiviert" behandelt.
  archived?: boolean;
  // Gruppen-Feature: optionale Zugehoerigkeit zu genau EINER Gruppe (retroGroup/{groupId}). Fehlt das
  // Feld, ist es ein Einzel-Board wie bisher (additiv, nicht brechend).
  groupId?: string;
}

export interface RetroBoardId extends RetroBoard {
  id: string;
}

// Gruppen-Feature: eine Gruppe (= Team, Gruppenname = Teamname) buendelt mehrere Boards eines Owners
// und wird per Link geteilt (/retrospective/group/:groupId). Zugehoerige Boards referenzieren die
// Gruppe ueber RetroBoard.groupId. Gespeichert unter retroGroup/{groupId} (siehe retro.service.ts).
export interface RetroGroup {
  ownerId: string;
  name: string;
  created: any;
  modified: any;
}

export interface RetroGroupId extends RetroGroup {
  id: string;
}

export interface RetroCard {
  text: string;
  columnId: string;
  authorId: string;
  order: number;
  created: any;
  modified: any;
  // Ticket 15: Dot-Voting -- Stimmen je Nutzer (uid -> Anzahl, stapelbar). Fehlt der Key bzw. das
  // ganze Feld, hat der jeweilige Nutzer (noch) keine Stimme auf dieser Karte abgegeben.
  votes?: { [uid: string]: number };
  // Ticket 16: Emoji-Reaktionen -- je Emoji die Liste der uids, die reagiert haben (Toggle, kein
  // Stapeln). Fehlt ein Emoji-Key bzw. das ganze Feld, hat (noch) niemand mit diesem Emoji reagiert.
  // Immer sichtbar/erlaubt, auch bei board.hidden (siehe board.component).
  reactions?: { [emoji: string]: string[] };
  // Live-Bearbeitungs-Hinweis: uid des Teilnehmers, der die Karte gerade bearbeitet. null/undefined =
  // niemand bearbeitet die Karte gerade. Wird bei anderen Teilnehmern als dezentes Pulsieren
  // dargestellt (siehe BoardComponent.isBeingEditedByOther()); Speichern/Abbrechen leert das Feld
  // wieder (siehe RetroService.updateCardText()/setCardEditing()).
  editingBy?: string | null;
}

export interface RetroCardId extends RetroCard {
  id: string;
}

// Ticket 17: Action-Items/To-dos -- eigene Sektion unter dem Board (keine Spalte, siehe
// board.component.html), gespeichert unter retro/{boardId}/actionItems (siehe retro.service.ts).
export interface RetroActionItem {
  text: string;
  assignee?: string;
  done: boolean;
  authorId: string;
  order: number;
  created: any;
  modified: any;
}

export interface RetroActionItemId extends RetroActionItem {
  id: string;
}
