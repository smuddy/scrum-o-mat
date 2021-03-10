import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {environment} from '../environments/environment';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {InitComponent} from './init/init.component';
import {FormsModule} from '@angular/forms';
import {ScrumMasterModule} from './modules/scrum-master/scrum-master.module';
import {DeveloperModule} from './modules/developer/developer.module';
import {AdminModule} from './modules/admin/admin.module';
import {QrcodeModule} from './modules/qrcode/qrcode.module';
import {AngularFireModule} from '@angular/fire';

@NgModule({
  declarations: [
    AppComponent,
    InitComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    // AngularFirestoreModule.enablePersistence(),

    ScrumMasterModule,
    DeveloperModule,
    AdminModule,
    QrcodeModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
