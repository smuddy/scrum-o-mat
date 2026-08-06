import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter, withRouterConfig} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {routes} from './app.routes';
import {environment} from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes, withRouterConfig({onSameUrlNavigation: 'reload'})),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ],
};
