import {Injectable, Type} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

// Ein Menu-Eintrag rendert entweder eine Text-Aktion (name/action/confirm, wie bisher) oder eine
// eigene Component (component/inputs, siehe addCustomComponent()). Alle Zusatzfelder sind optional,
// damit bestehende addCustomAction()-Aufrufe unveraendert funktionieren und die Template-Typpruefung
// in menu.component.html nicht bricht.
export interface MenuEntry {
  name: string;
  action: () => void;
  confirm?: boolean;
  open?: boolean;
  component?: Type<any>;
  inputs?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private iMenuEntries$ = new BehaviorSubject<MenuEntry[]>([]);
  public menuEntries$ = this.iMenuEntries$.asObservable();

  private iMenuOpen$ = new BehaviorSubject(false);
  public menuOpen$ = this.iMenuOpen$.asObservable();

  constructor() {
  }

  public addCustomAction(name: string, action: () => void, confirm = false): void {
    const entries = this.iMenuEntries$.getValue();
    entries.push({name, action, confirm});
    this.iMenuEntries$.next(entries);
  }

  // Registriert eine Component (z.B. TimerControlComponent) als Menu-Zeile statt einer Text-Aktion.
  // name/action bleiben leer/no-op -- sie existieren nur, damit MenuEntry ein einziges Interface
  // bleibt und bestehende Konsumenten (Text-Aktionen) unveraendert funktionieren.
  public addCustomComponent(component: Type<any>, inputs?: Record<string, unknown>): void {
    const entries = this.iMenuEntries$.getValue();
    entries.push({name: '', action: () => {}, component, inputs});
    this.iMenuEntries$.next(entries);
  }

  public resetCustomActions(): void {
    this.iMenuEntries$.next([]);
  }

  public openMenu = () => this.iMenuOpen$.next(true);
  public closeMenu = () => this.iMenuOpen$.next(false);
  public toggleMenu = () => this.iMenuOpen$.next(!this.iMenuOpen$.value);
}
