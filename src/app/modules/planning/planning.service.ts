import {inject, Injectable, Injector, runInInjectionContext} from '@angular/core';
import {addDoc, collection, collectionData, deleteDoc, doc, docData, Firestore, query, updateDoc, where} from '@angular/fire/firestore';
import {toSignal} from '@angular/core/rxjs-interop';
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

  private afs = inject(Firestore);
  private injector = inject(Injector);
  private loginService = inject(LoginService);

  // AngularFire-Aufrufe muessen im Injection-Kontext laufen (sonst Warnung + instabile CD/Hydration).
  private inCtx<T>(op: () => T): T {
    return runInInjectionContext(this.injector, op);
  }

  public listMyPlannings$: Observable<PlanningId[]> = this.loginService.authStateAllowAnonymous$.pipe(
    mergeMap(user => this.inCtx(() => collectionData(
      query(collection(this.afs, 'planning'), where('userId', '==', user.uid)),
      {idField: 'id'}
    )) as Observable<PlanningId[]>),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  );

  // Signal-Variante additiv (Observable listMyPlannings$ bleibt bestehen)
  public listMyPlanningsSignal = toSignal(this.listMyPlannings$, {initialValue: [] as PlanningId[]});

  private static newDeveloper(name: string): Developer {
    return {
      name,
      storyPoints: null
    };
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

    await this.inCtx(() => updateDoc(doc(this.afs, 'planning/' + planningId), planning));
    await this.resetStoryPoints(planningId);
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
    const newDoc = await this.inCtx(() => addDoc(collection(this.afs, 'planning'), planning));
    return newDoc.id;
  }

  public getPlanning(planningId: string): Observable<Planning | undefined> {
    return this.inCtx(() => docData(doc(this.afs, 'planning/' + planningId))) as Observable<Planning | undefined>;
  }

  public async deletePlanning(planningId: string) {
    const developers = await firstValueFrom(this.getDevelopers(planningId).pipe(first()));
    const deleteOperations = developers.map(_ => this.deleteUser(planningId, _.id));
    await Promise.all(deleteOperations);
    await this.inCtx(() => deleteDoc(doc(this.afs, 'planning/' + planningId)));
  }

  public async addUser(planningId: string, name: string): Promise<string> {
    const user = PlanningService.newDeveloper(name);
    localStorage.setItem('user', name);
    const newDoc = await this.inCtx(() => addDoc(collection(this.afs, 'planning/' + planningId + '/developer'), user));

    return newDoc.id;
  }

  public async updateStoryPoints(planningId: string, userId: string, storyPoints: StoryPoints) {
    const partial: StoryPointsPartial = {storyPoints};
    await this.inCtx(() => updateDoc(doc(this.afs, 'planning/' + planningId + '/developer/' + userId), {...partial}));
  }

  public getDevelopers(planningId: string): Observable<DeveloperId[]> {
    return this.inCtx(() => collectionData(collection(this.afs, 'planning/' + planningId + '/developer'), {idField: 'id'})) as Observable<DeveloperId[]>;
  }

  public getDeveloper(planningId: string, userId: string): Observable<Developer> {
    return this.inCtx(() => docData(doc(this.afs, 'planning/' + planningId + '/developer/' + userId))) as Observable<Developer>;
  }

  public async deleteUser(planningId: string, userId: string) {
    await this.inCtx(() => deleteDoc(doc(this.afs, 'planning/' + planningId + '/developer/' + userId)));
  }

  public async setEstimateResult(planningId: string, allValidStoryPointsAreEqual: boolean, storyPoints: StoryPoints) {
    const estimateResult: PlanningEstimatePartial = {
      estimateRequested: false,
      estimateSucceeded: allValidStoryPointsAreEqual,
      storyPoints,
    };

    await this.inCtx(() => updateDoc(doc(this.afs, 'planning/' + planningId), {...estimateResult}));
  }

  public async resetEstimate(planningId: string, count: number) {
    await this.resetStoryPoints(planningId);
    const estimateResult: PlanningEstimatePartial = {
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: 0,
      count: count,
    };

    await this.inCtx(() => updateDoc(doc(this.afs, 'planning/' + planningId), {...estimateResult}));
  }

  private async resetStoryPoints(planningId: string) {
    const developers = await firstValueFrom(this.getDevelopers(planningId));

    for (const developer of developers) {
      await this.updateStoryPoints(planningId, developer.id, null);
    }

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
