import {Component, Input} from '@angular/core';

/**
 * Kleine eigenstaendige SVG-Progress-Component als Ersatz fuer ng-circle-progress
 * (NgCircleProgressModule). Werte (radius, Strichbreite, Farben, Animationsdauer)
 * sind sinngemaess aus der bisherigen <circle-progress>-Konfiguration im guest-Template
 * uebernommen.
 */
@Component({
  selector: 'app-progress-circle',
  standalone: true,
  imports: [],
  template: `
    <svg [attr.viewBox]="viewBox" class="progress-circle" xmlns="http://www.w3.org/2000/svg">
      <circle
        [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
        [style.stroke]="innerStrokeColor" [attr.stroke-width]="outerStrokeWidth"
        fill="none"></circle>
      <circle
        [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
        [style.stroke]="outerStrokeColor" [attr.stroke-width]="outerStrokeWidth"
        [attr.stroke-dasharray]="circumference"
        [attr.stroke-dashoffset]="dashOffset"
        [attr.transform]="'rotate(-90 ' + center + ' ' + center + ')'"
        class="progress-circle__value" fill="none" stroke-linecap="round"></circle>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .progress-circle {
      display: block;
      width: 100%;
      height: 100%;
    }

    .progress-circle__value {
      transition: stroke-dashoffset 300ms ease;
    }
  `]
})
export class ProgressCircleComponent {
  @Input() radius = 100;
  @Input() outerStrokeWidth = 16;
  @Input() outerStrokeColor = 'var(--text-dim)';
  @Input() innerStrokeColor = 'var(--border-color)';
  @Input() percent = 0;

  public get center(): number {
    return this.radius + this.outerStrokeWidth / 2;
  }

  public get viewBox(): string {
    const size = this.center * 2;
    return `0 0 ${size} ${size}`;
  }

  public get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  public get dashOffset(): number {
    const clamped = Math.max(0, Math.min(100, this.percent || 0));
    return this.circumference * (1 - clamped / 100);
  }
}
