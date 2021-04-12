import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private iMenuEntries$ = new BehaviorSubject<{ name: string, action: () => void, confirm?: boolean }[]>([]);
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

  public resetCustomActions(): void {
    this.iMenuEntries$.next([]);
  }

  public openMenu = () => this.iMenuOpen$.next(true);
  public closeMenu = () => this.iMenuOpen$.next(false);
  public toggleMenu = () => this.iMenuOpen$.next(!this.iMenuOpen$.value);
}
