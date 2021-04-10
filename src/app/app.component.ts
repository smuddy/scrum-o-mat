import {Component} from '@angular/core';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  public menuVisible = false;
  public faBars = faBars;

  public onClickMenuButton() {
    this.menuVisible = !this.menuVisible;
  }

  public onClickOutlet(event) {
    if (this.menuVisible) {
      this.menuVisible = false;
      event.stopPropagation();
    }
  }
}
