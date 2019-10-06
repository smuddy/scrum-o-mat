import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ZXingScannerModule} from '@zxing/ngx-scanner';
import {QrcodeComponent} from './components/qrcode/qrcode.component';

@NgModule({
  declarations: [QrcodeComponent],
  imports: [
    CommonModule,
    ZXingScannerModule,
  ],
  exports: [
    QrcodeComponent
  ]
})
export class QrcodeModule {
}
