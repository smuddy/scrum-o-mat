import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {environment} from '../environments/environment';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {FormsModule} from '@angular/forms';
import {AngularFireModule} from '@angular/fire';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {MenuModule} from './shared/menu/menu.module';
import {HeaderModule} from './shared/header/header.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule.enablePersistence({synchronizeTabs: true}),
    AngularFireAuthModule,
    FontAwesomeModule,
    MenuModule,
    HeaderModule,
    // AngularFirestoreModule.enablePersistence(),


  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
