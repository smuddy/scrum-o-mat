import {Component, OnInit} from '@angular/core';
import {BarcodeFormat} from '@zxing/library';
import {Router} from '@angular/router';
import {fade} from '../../../../../animation';
import {PlanningService} from '../../../planning.service';
import {environment} from '../../../../../../environments/environment';

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.less'],
  animations: [fade]
})
export class QrcodeComponent implements OnInit {
  public format = [BarcodeFormat.QR_CODE];
  public subject: string;
  public showScanner: boolean;
  public showText: boolean;

  constructor(private planningService: PlanningService, private router: Router) {
  }

  ngOnInit() {
    this.showScanner = true;
  }

  scanSuccessHandler(url: string) {
    const planningId = url.replace(environment.url, '');
    this.planningService.getPlanning(planningId).subscribe(planning => {
      if (planning && planning.subject && this.showScanner) {
        this.subject = planning.subject;
        this.showScanner = false;
        this.showText = true;
        setTimeout(() => this.showText = false, 4000);
        setTimeout(() => this.router.navigateByUrl(this.router.createUrlTree(['/planning/'], {queryParams: {session: planningId}})), 5000);
      }
    });
  }
}
