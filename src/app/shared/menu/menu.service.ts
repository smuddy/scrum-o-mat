import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private iMenuEntries$ = new BehaviorSubject<{ name: string, action: () => void }[]>([]);
  public menuEntries$ = this.iMenuEntries$.asObservable();

  constructor() {
  }

  public addCustomAction(name: string, action: () => void): void {
    const entries = this.iMenuEntries$.getValue();
    entries.push({name, action});
    this.iMenuEntries$.next(entries);
  }

  public resetCustomActions(): void {
    this.iMenuEntries$.next([]);
  }
}
