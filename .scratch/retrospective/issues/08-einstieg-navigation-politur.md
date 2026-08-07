# 08 — Einstieg/Navigation + Politur

Type: task
Status: resolved
Blocked by: 02, 03

## Question
Wie erreicht man das Feature und wie rund wirkt es?

Umsetzung:
- Einstieg auf der Landing/im Menü: Eintrag „Retrospektive" neben Scrum Poker / Sprint Planer (analog vorhandener Navigation, ggf. `HeaderService`/Menu).
- Breadcrumbs für Create + Board.
- Spaltenfarben sauber angewandt (Header/Border), responsive Grundlayout.

## Answer
Einstieg gebaut (`ng build` grün, 2026-08-06).
- Dritte Karte „Retrospektive" auf der App-Landing (`modules/init`) + Menüeintrag (`shared/menu`), beide `routerLink="/retrospective"` im Stil der bestehenden Einträge; Grid auf 3 Spalten + Mobile-Stacking.
- Icon: **`faChalkboardTeacher`** (Tafel-Icon wie im Scrum-Poker-Master, auf Nutzerwunsch statt faNoteSticky).
- Nicht eingeloggte Nutzer werden von `/retrospective` (AuthGuard) auf `/login` geleitet (gewollt).
- Hinweis (Wartbarkeit): Feature-Links sind in `init` und `menu` doppelt hartkodiert — kein gemeinsamer Ort. Spaltenfarben-Politur bewusst NICHT hier (liegt im Board, um Konflikt mit Board-Kette zu vermeiden).
