# 05 — Bestehende Boards einer Gruppe zuordnen / verschieben

Type: task
Status: open
Blocked by: 01, 03

## Question
Wie ordnet der Owner ein bestehendes (Einzel- oder anders gruppiertes) Board einer Gruppe zu oder löst es wieder heraus?

Umsetzung:
- In der Owner-Übersicht (Ticket 03) an der Board-Zeile eine Aktion „In Gruppe verschieben" → Auswahl **einer** bestehenden Gruppe **oder** „keine Gruppe" (herauslösen) → `assignBoardToGroup(boardId, groupId | null)`.
- Ein Board gehört zu genau einer Gruppe: das Verschieben ersetzt eine bestehende Zuordnung (keine Mehrfachzuordnung).
- Wirkt sich sofort auf die Übersicht (Gruppierung) und die betreffende(n) Gruppen-Seite(n) aus (Firestore-Realtime).
- **Nur Owner** (AuthGuard-Bereich).
- Stil/Interaktion konsistent zum bestehenden Inline-Editing der `board-list`.

Deckt die Weichenstellung „Zuordnung = flexibel, verschiebbar" ab.
