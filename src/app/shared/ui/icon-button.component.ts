import {booleanAttribute, ChangeDetectionStrategy, Component, input} from '@angular/core';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';

/**
 * Zentraler Icon-Button (a11y): echtes <button> mit fa-icon + Pflicht-`label` (aria-label),
 * sichtbarem Fokus (global). Ersetzt das Muster <button class="icon-btn"><fa-icon/></button>.
 * Verwendung: <app-icon-button [icon]="faTrash" label="Löschen" (click)="delete()"/>
 * Icon-Größe folgt der Schriftgröße des Kontexts (font-size: inherit) und kann per CSS auf
 * dem Host feinjustiert werden.
 */
@Component({
  selector: 'app-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent],
  template: `
    <button [type]="type()" [disabled]="disabled()"
            [attr.aria-label]="label()" [attr.title]="title() || label()">
      <fa-icon [icon]="icon()"/>
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 6px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: var(--icon-btn-color, var(--text-dim));
      font-size: inherit;
      cursor: pointer;
      transition: color 150ms ease, background 150ms ease;
    }

    button:hover {
      background: var(--hover);
      color: var(--text);
    }

    button:disabled {
      opacity: .5;
      cursor: default;
    }
  `],
})
export class IconButtonComponent {
  readonly icon = input.required<IconDefinition>();
  readonly label = input.required<string>();
  readonly title = input<string>('');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false, {transform: booleanAttribute});
}
