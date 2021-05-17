import {animate, animateChild, query, stagger, style, transition, trigger} from '@angular/animations';

export const fade = trigger('fade', [

  // fade in when created. this could also be written as transition('void => *')
  transition(':enter', [
    style({opacity: 0, 'max-height': 0}),
    animate('600ms 800ms', style({opacity: 0, 'max-height': '800px'})),
    animate('300ms', style({opacity: 1, 'max-height': '800px'})),
    query('@listAnimation', [animateChild()], {optional: true}),
  ]),

  // fade out when destroyed. this could also be written as transition('void => *')
  transition(':leave', [
    style({opacity: 1, 'max-height': '800px'}),
    animate('600ms', style({opacity: 0, 'max-height': '0px'})),
  ])
]);

export const fadeTranslate = trigger('fadeTranslate', [

  // fade in when created. this could also be written as transition('void => *')
  transition(':enter', [
    style({opacity: 0, transform: 'translateY(-10px) scale(1.02)'}),
    animate('300ms 300ms ease-out', style({opacity: 1, transform: 'translateY(0px) scale(1)'}))
  ]),

  // fade out when destroyed. this could also be written as transition('void => *')
  transition(':leave', [
    style({opacity: 1, 'max-height': '800px'}),
    animate('300ms ease-in', style({opacity: 0, transform: 'translateY(10px) scale(0.98)'})),
  ])
]);
export const fadeTranslateInstant = trigger('fadeTranslateInstant', [

  // fade in when created. this could also be written as transition('void => *')
  transition(':enter', [
    style({opacity: 0, transform: 'translateY(-10px) scale(1.01)'}),
    animate('300ms ease-out', style({opacity: 1, transform: 'translateY(0px) scale(1)'}))
  ]),

  // fade out when destroyed. this could also be written as transition('void => *')
  transition(':leave', [
    style({opacity: 1, 'max-height': '800px'}),
    animate('300ms ease-in', style({opacity: 0, transform: 'translateY(10px) scale(0.99)'})),
  ])
]);

export const fadeBlur = trigger('fadeBlur', [

  // fade in when created. this could also be written as transition('void => *')
  transition(':enter', [
    style({opacity: 0, 'backdrop-filter': 'blur(0)'}),
    animate('300ms 800ms ease-out', style({opacity: 1, 'backdrop-filter': 'blur(10px)'}))
  ]),

  // fade out when destroyed. this could also be written as transition('void => *')
  transition(':leave', [
    style({opacity: 1, 'backdrop-filter': 'blur(10px)'}),
    animate('300ms ease-in', style({opacity: 0, 'backdrop-filter': 'blur(0)'})),
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
