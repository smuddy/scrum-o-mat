import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private fullscreen = new BehaviorSubject<boolean>(false);
  public fullscreen$: Observable<boolean> = this.fullscreen.asObservable();

  setFullscreen(fullscreen: boolean): void {
    this.fullscreen.next(fullscreen);
  }
}
