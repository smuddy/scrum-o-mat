import {RetroGroup} from './models/retro';

// Vertreter-Feature: die EINZIGE Wahrheitsquelle fuer die Rollen-Grenze einer Gruppe. Reine, seiteneffekt-
// freie Funktionen (ohne Firestore-Bezug -> direkt testbar). Alle Components leiten ihre Owner-/Vertreter-
// Checks hierueber ab (siehe group/board/board-list.component). uid = REALE uid (LoginService.currentUserId$);
// anonyme Link-Mitglieder haben keine reale uid und fallen damit ueberall auf false.

// Owner = eingeloggt und group.ownerId == uid. Owner-only-Aktionen (Gruppe umbenennen/loeschen, Vertreter
// verwalten, Board aus Gruppe loesen, Board loeschen) pruefen ausschliesslich dieses Predikat.
export function isGroupOwner(group: RetroGroup | undefined | null, uid: string | undefined | null): boolean {
  return !!group && !!uid && group.ownerId === uid;
}

// Vertreter = eingeloggt und uid in group.deputies. Fehlt deputies (Alt-Gruppen), ist niemand Vertreter.
export function isGroupDeputy(group: RetroGroup | undefined | null, uid: string | undefined | null): boolean {
  return !!group && !!uid && !!group.deputies?.includes(uid);
}

// "Board-Manager der Gruppe" = Owner ODER Vertreter. Gate fuer alle Board-Verwaltungsaktionen eines Boards,
// das zu dieser Gruppe gehoert (Timer, Spalten, umbenennen, verstecken, archivieren, Voting-Reset) sowie
// fuer "Neues Board in der Gruppe anlegen".
export function canManageBoards(group: RetroGroup | undefined | null, uid: string | undefined | null): boolean {
  return isGroupOwner(group, uid) || isGroupDeputy(group, uid);
}
