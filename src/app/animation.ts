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
