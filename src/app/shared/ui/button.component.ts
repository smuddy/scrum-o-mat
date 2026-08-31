import {booleanAttribute, ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Zentraler Text-Button (flach). Ersetzt die pro Component duplizierten Button-Styles.
 * Verwendung: <app-button variant="primary" (click)="save()" [disabled]="busy">Speichern</app-button>
 * Der (click) bubbelt vom nativen <button>; [disabled] verhindert nativ den Klick.
 * `full` streckt den Button auf die Elternbreite (z.B. in Grid-/Formular-Spalten).
 */
@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.full]': 'full()',
    '[class.sm]': "size() === 'sm'",
  },
  template: `
    <button [type]="type()" [disabled]="disabled()" [class.primary]="variant() === 'primary'">
      <ng-content/>
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    :host(.full) {
      display: flex;
      width: 100%;
    }

    :host(.full) button {
      width: 100%;
    }

    /* kompakte Variante -- gleiche Hoehe wie ein Eingabefeld, fuer inline neben Inputs */
    :host(.sm) button {
      padding: 7px 14px;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 0;
      padding: 11px 18px;
      color: var(--text);
      background: var(--surface-2);
      border: none;
      border-radius: var(--radius);
      font-family: inherit;
      font-size: inherit;
      cursor: pointer;
      transition: background 150ms ease, filter 150ms ease;
    }

    button:hover {
      background: var(--hover);
    }

    button:disabled {
      opacity: .5;
      cursor: default;
    }

    button.primary {
      color: #15233a;
      background: var(--accent);
      font-weight: bold;
    }

    button.primary:hover {
      background: var(--accent);
      filter: brightness(1.08);
    }

    button.primary:disabled {
      filter: none;
    }
  `],
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary'>('secondary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false, {transform: booleanAttribute});
  readonly full = input(false, {transform: booleanAttribute});
  readonly size = input<'md' | 'sm'>('md');
}
