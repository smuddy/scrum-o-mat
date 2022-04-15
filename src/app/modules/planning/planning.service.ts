import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/compat/firestore';
import {distinctUntilChanged, first, mergeMap} from 'rxjs/operators';
import {StoryPoints} from './models/storyPoints';
import {Developer, DeveloperId} from './models/delevoper';
import {PlanningEstimatePartial} from './models/planningEstimatePartial';
import {Planning, PlanningId} from './models/planning';
import {StoryPointsPartial} from './models/storyPointsPartial';
import {firstValueFrom, Observable} from 'rxjs';
import {LoginService} from '../login/login.service';

@Injectable({
  providedIn: 'root'
})
export class PlanningService {

  private planningCollection: AngularFirestoreCollection<Planning>;
  private plannings: Observable<Planning[]>;

  public listMyPlannings$ = this.loginService.authStateAllowAnonymous$.pipe(
    mergeMap(user => this.afs.collection<PlanningId>('planning/', ref => ref.where('userId', '==', user.uid)).valueChanges({idField: 'id'})),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  );

  private static newDeveloper(name: string): Developer {
    return {
      name,
      storyPoints: null
    };
  }

  constructor(
    private afs: AngularFirestore,
    private loginService: LoginService,
  ) {
    this.planningCollection = afs.collection<Planning>('planning');
    this.plannings = this.planningCollection.valueChanges();
  }

  public async updateIssue(planningId: string, issue: string) {
    const planning = {
      issue,
      modified: new Date(),
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: null,
      count: 1,
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(planning);
    this.resetStoryPoints(planningId);
  }

  public async createNewSession(subject: string): Promise<string> {
    const user = await firstValueFrom(this.loginService.authStateAllowAnonymous$);
    const planning: Planning = {
      issue: null,
      subject,
      modified: new Date(),
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: null,
      count: 0,
      userId: user.uid,
    };
    const newDoc = await this.planningCollection.add(planning);
    return newDoc.id;
  }

  public getPlanning(planningId: string): Observable<Planning | undefined> {
    return this.afs.doc<Planning>('planning/' + planningId).valueChanges();
  }

  public async deletePlanning(planningId: string) {
    const planningRef = this.afs.doc<Planning>('planning/' + planningId);
    const developerCollection = planningRef.collection<DeveloperId>('developer');
    const developers = await developerCollection.valueChanges({idField: 'id'}).pipe(first()).toPromise();
    const deleteOperations = developers.map(_ => this.deleteUser(planningId, _.id));
    await Promise.all(deleteOperations);
    await this.planningCollection.doc(planningId).delete();
  }

  public async addUser(planningId: string, name: string): Promise<string> {
    const user = PlanningService.newDeveloper(name);
    localStorage.setItem('user', name);
    const planningRef = this.getPlanningRef(planningId);
    const developerCollection = planningRef.collection('developer');
    const newDoc = await developerCollection.add(user);

    return newDoc.id;
  }

  public async updateStoryPoints(planningId: string, userId: string, storyPoints: StoryPoints) {
    const partial: StoryPointsPartial = {storyPoints};
    const planningRef = this.getPlanningRef(planningId);
    const developerCollection = planningRef.collection('developer');
    const developer = developerCollection.doc(userId);
    await developer.update(partial);
  }

  public getDevelopers(planningId: string): Observable<DeveloperId[]> {
    const planningRef = this.afs.doc<Planning>('planning/' + planningId);
    const developerCollection = planningRef.collection<DeveloperId>('developer');
    return developerCollection.valueChanges({idField: 'id'});
  }

  public getDeveloper(planningId: string, userId: string): Observable<Developer> {
    const planningRef = this.getPlanningRef(planningId);
    const developerCollection = planningRef.collection<Developer>('developer');
    return developerCollection.doc<Developer>(userId).valueChanges();
  }

  public async deleteUser(planningId: string, userId: string) {
    await this.planningCollection.doc(planningId).collection('developer').doc(userId).delete();
  }

  public async setEstimateResult(planningId: string, allValidStoryPointsAreEqual: boolean, storyPoints: StoryPoints) {
    const estimateResult: PlanningEstimatePartial = {
      estimateRequested: false,
      estimateSucceeded: allValidStoryPointsAreEqual,
      storyPoints,
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(estimateResult);
  }

  public async resetEstimate(planningId: string, count: number) {
    await this.resetStoryPoints(planningId);
    const estimateResult: PlanningEstimatePartial = {
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: 0,
      count: count,
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(estimateResult);
  }

  private async resetStoryPoints(planningId: string) {
    const developers = await firstValueFrom(this.getDevelopers(planningId));

    for (const developer of developers) {
      await this.updateStoryPoints(planningId, developer.id, null);
    }

  }


  private getPlanningRef(planningId: string): AngularFirestoreDocument<Planning> {
    return this.afs.doc<Planning>('planning/' + planningId);
  }
}

export function renderStoryPoint(storyPoints): string {
  switch (storyPoints) {
    case StoryPoints.sHalf:
      return '1/2';
    case StoryPoints.s1:
      return '1';
    case StoryPoints.s2:
      return '2';
    case StoryPoints.s3:
      return '3';
    case StoryPoints.s5:
      return '5';
    case StoryPoints.s8:
      return '8';
    case StoryPoints.s13:
      return '13';
    case StoryPoints.s20:
      return '20';
    case StoryPoints.s40:
      return '40';
    case StoryPoints.s100:
      return '100';
    case StoryPoints.unsure:
      return '?';
    case StoryPoints.noway:
      return '∞';
    case StoryPoints.coffee:
      return '☕️';
    default:
      return null;
  }
}
