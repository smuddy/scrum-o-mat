import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  private fullscreen = new BehaviorSubject<boolean>(false);
  public fullscreen$ = this.fullscreen.asObservable();

  private breadcrumb = new BehaviorSubject<{ name: string, route: string }[]>([]);
  public breadcrumb$ = this.breadcrumb.asObservable();

  setFullscreen(fullscreen: boolean): void {
    this.fullscreen.next(fullscreen);
  }

  setBreadcrumb(breadcrumb: { name: string, route: string }[]): void {
    console.log(breadcrumb)
    this.breadcrumb.next(breadcrumb);
  }


}
