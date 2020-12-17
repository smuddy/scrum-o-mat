import {Component, Input, OnInit}from '@angular/core';
import {PlanningService, renderStorypoint}from '../../../../services/planning.service';
import {Developer}from '../../../../models/delevoper';
import {Storypoints}from '../../../../models/storypoints';
import {faTimes}from '@fortawesome/free-solid-svg-icons';
import {faTrash}from '@fortawesome/free-solid-svg-icons';
import {ActivatedRoute, Router}from '@angular/router';
import {AdminService}from '../../../admin/components/admin.service';
import {Observable}from 'rxjs';
import {AngularFirestore, AngularFirestoreDocument}from '@angular/fire/firestore';
import {debounce }from 'rxjs/operators';

@Component( {
  selector:'app-developers',
  templateUrl:'./developers.component.html',
  styleUrls:['./developers.component.less']
})
export class DevelopersComponent implements OnInit {
  @Input()public developers: {id:string; data:Developer }[];
  @Input()public showResults:boolean;
  public faTimes = faTimes;
  public faTrash = faTrash;
  public planningId:string;


  public users: {id:string, data:Developer }[];
  // tslint:disable-next-line:max-line-length

  constructor(
    private activatedRoute:ActivatedRoute,
    private planningService:PlanningService,
    private router:Router,
    private adminService:AdminService,
    private afs:AngularFirestore) {
    activatedRoute.params.subscribe(_ => this.planningId = _.planningId);
  }
  ngOnInit() {
    // added
    if (this.planningId) {
      this.adminService.getDevelopers(this.planningId).subscribe(_ => this.developers = _);
    }
  }

  public async delete(id:string) {
    await this.adminService.deleteUser(this.planningId, id);
  }

  renderStorypoints(storypoints:Storypoints):string {
    return renderStorypoint(storypoints);

  }
  public devIsReady(storypoints:Storypoints) {
    const hasStorypoints = storypoints != null;
    const unsure = storypoints === Storypoints.unsure;

    return ( ! this.showResults && hasStorypoints) || (this.showResults &&  ! unsure);
  }


}
