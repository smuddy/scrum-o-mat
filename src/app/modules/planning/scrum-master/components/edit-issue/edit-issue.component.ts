import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {faCheck, faTimes} from '@fortawesome/free-solid-svg-icons';
import {filter} from 'rxjs/operators';
import {PlanningService} from '../../../planning.service';

@Component({
  selector: 'app-edit-issue',
  templateUrl: './edit-issue.component.html',
  styleUrls: ['./edit-issue.component.less']
})
export class EditIssueComponent implements OnInit {
  @ViewChild('input', {static: true}) inputRef;
  @Input() planningId: string;
  @Input() middle: boolean;
  public subject: string;
  public faCheck = faCheck;
  public faTimes = faTimes;
  public issue: string;
  public edit = true;

  constructor(
    private planningService: PlanningService
  ) {
  }

  public ngOnInit(): void {
    this.edit = true;
    this.planningService.getPlanning(this.planningId).pipe(
      filter(_ => !!_)
    ).subscribe(planning => {
      this.issue = planning.issue;
      this.subject = planning.subject;
      this.edit = !planning.issue;
    });
  }

  public async setIssue(): Promise<any> {
    if (!this.issue) {
      this.inputRef.nativeElement.focus();
      return;
    }
    await this.updateIssue();
    this.edit = false;
  }

  public async resetIssue(): Promise<any> {
    this.issue = null;
    await this.updateIssue();
    this.edit = true;
    this.inputRef.nativeElement.focus();
  }

  public async updateIssue(): Promise<any> {
    await this.planningService.updateIssue(this.planningId, this.issue);
  }

}
