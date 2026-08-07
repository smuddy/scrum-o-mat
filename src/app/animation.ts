import {animate, animateChild, query, stagger, style, transition, trigger} from '@angular/animations';

export const fade = trigger('fade', [

  transition(':enter', [
    style({opacity: 0, 'max-height': 0}),
    animate('600ms 800ms', style({opacity: 0, 'max-height': '800px'})),
    animate('300ms', style({opacity: 1, 'max-height': '800px'})),
    query('@listAnimation', [animateChild()], {optional: true}),
  ]),

  transition(':leave', [
    style({opacity: 1, 'max-height': '800px'}),
    animate('600ms', style({opacity: 0, 'max-height': '0px'})),
  ])
]);

export const fadefast = trigger('fadefast', [

  transition(':enter', [
    style({opacity: 0, 'max-height': 0}),
    animate('150ms 150ms', style({opacity: 0, 'max-height': '800px'})),
    animate('150ms', style({opacity: 1, 'max-height': '800px'})),
    query('@listAnimation', [animateChild()], {optional: true}),
  ]),

  transition(':leave', [
    style({opacity: 1, 'max-height': '800px'}),
    animate('150ms', style({opacity: 0, 'max-height': '0px'})),
  ])
]);

export const fadeTranslate = trigger('fadeTranslate', [

  transition(':enter', [
    style({opacity: 0, transform: 'translateY(-10px) scale(1.02)'}),
    animate('100ms 500ms ease-out', style({opacity: 1, transform: 'translateY(0px) scale(1)'}))
  ]),

  transition(':leave', [
    style({opacity: 1, 'max-height': '800px'}),
    animate('300ms ease-in', style({opacity: 0, transform: 'translateY(10px) scale(0.98)'})),
  ])
]);
export const fadeTranslateInstant = trigger('fadeTranslateInstant', [

  transition(':enter', [
    style({opacity: 0, 'max-height': '0px', transform: 'translateY(-10px) scale(1.01)', overflow: 'hidden'}),
    animate('100ms 100ms ease-out', style({opacity: 0, 'max-height': '1000px', transform: 'translateY(-10px) scale(1.01)'})),
    animate('300ms 300ms ease-out', style({opacity: 1, 'max-height': '1000px', transform: 'translateY(0px) scale(1)'})),
  ]),

  transition(':leave', [
    style({opacity: 1, 'max-height': '1000px', transform: 'translateY(0px) scale(1)', overflow: 'hidden'}),
    animate('100ms ease-in', style({opacity: 0, 'max-height': '0px', transform: 'translateY(-10px) scale(0.98)', overflow: 'hidden'})),
  ])
]);

export const fadeBlur = trigger('fadeBlur', [

  transition(':enter', [
    style({opacity: 0}),
    animate('300ms ease-out', style({opacity: 1}))
  ]),

  transition(':leave', [
    style({opacity: 1}),
    animate('300ms ease-in', style({opacity: 0})),
  ])
]);

export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter',
      [style({opacity: 0}), stagger('200ms', animate('600ms ease-out', style({opacity: 1})))],
      {optional: true}
    ),
    query(':leave',
      animate('200ms', style({opacity: 0})),
      {optional: true}
    )
  ])
]);

export const cardTransition = trigger('card', [
  transition(':enter', [
    query('.card-child', style({opacity: 0, transform: 'translateY(-10px) scale(1.02)'}), {optional: true}),

    query('.card-child', stagger('100ms', [
      animate('100ms ease-out', style({opacity: 0, transform: 'translateY(-10px) scale(1.02)'})),
      animate('500ms ease-out', style({opacity: 1, transform: 'translateY(0) scale(1)'})),
    ]), {optional: true}),

    query('.card-child', [
      animate(100, style('*'))
    ], {optional: true})

  ])
 ]);

// Ein-/Ausblenden EINZELNER Retro-Karten bei Aenderungen der Kartenliste (Hinzufuegen/Loeschen).
// Liegt pro Karte am @for-Element (siehe board.component.html) -- Angular feuert :enter beim
// Einfuegen und :leave beim Entfernen eines Listeneintrags. Neben opacity/transform werden auch
// height, padding und margin mitanimiert (von/auf 0), damit die uebrigen Karten weich nachruecken
// statt zu springen; overflow:hidden klippt den Karteninhalt waehrend des Kollabierens.
// Das initiale, gestaffelte Einblenden bleibt beim Container-Trigger @card -- dessen beim ersten
// Rendern laufende Eltern-Animation unterdrueckt dieses :enter, sodass es sich nicht doppelt.
export const cardListItem = trigger('cardListItem', [
  transition(':enter', [
    style({
      opacity: 0,
      height: 0,
      'padding-top': 0,
      'padding-bottom': 0,
      'margin-bottom': 0,
      transform: 'translateY(-8px) scale(0.98)',
      overflow: 'hidden',
    }),
    animate('220ms ease-out', style({
      opacity: 1,
      height: '*',
      'padding-top': '*',
      'padding-bottom': '*',
      'margin-bottom': '*',
      transform: 'translateY(0) scale(1)',
    })),
  ]),

  transition(':leave', [
    style({overflow: 'hidden'}),
    animate('200ms ease-in', style({
      opacity: 0,
      height: 0,
      'padding-top': 0,
      'padding-bottom': 0,
      'margin-bottom': 0,
      transform: 'translateY(-8px) scale(0.98)',
    })),
  ]),
]);

// Vertikales Ein-/Ausblenden eines Blocks samt Kollabieren seines Platzbedarfs (height + vertikale
// margin/padding), analog zu @cardListItem bei den Karten -- so verschiebt sich der darunterliegende
// Bereich weich, statt zu springen, wenn der Block erscheint/verschwindet (z.B. die Timer-Anzeige,
// siehe board.component.html). overflow:hidden klippt den Inhalt waehrend des Kollabierens.
export const collapse = trigger('collapse', [
  transition(':enter', [
    style({
      opacity: 0,
      height: 0,
      'margin-top': 0,
      'margin-bottom': 0,
      'padding-top': 0,
      'padding-bottom': 0,
      transform: 'translateY(-8px)',
      overflow: 'hidden',
    }),
    animate('220ms ease-out', style({
      opacity: 1,
      height: '*',
      'margin-top': '*',
      'margin-bottom': '*',
      'padding-top': '*',
      'padding-bottom': '*',
      transform: 'translateY(0)',
    })),
  ]),

  transition(':leave', [
    style({overflow: 'hidden'}),
    animate('200ms ease-in', style({
      opacity: 0,
      height: 0,
      'margin-top': 0,
      'margin-bottom': 0,
      'padding-top': 0,
      'padding-bottom': 0,
      transform: 'translateY(-8px)',
    })),
  ]),
]);
