import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Planning} from '../models/planning';
import {Observable} from 'rxjs';
import {Storypoints} from '../models/storypoints';
import {Developer, DeveloperId} from '../models/delevoper';
import {StorypointsPartial} from '../models/storypointsPartial';
import {PlanningEstimatePartial} from '../models/planningEstimatePartial';
import {first, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PlanningService {

  private planningCollection: AngularFirestoreCollection<Planning>;
  private plannings: Observable<Planning[]>;

  constructor(private afs: AngularFirestore) {
    this.planningCollection = afs.collection<Planning>('planning');
    this.plannings = this.planningCollection.valueChanges();
  }

  private static newDeveloper(name: string): Developer {
    return {
      name,
      storypoints: null
    };
  }

  public async createNewSession(subject: string): Promise<string> {
    const planning: Planning = {
      issue: null,
      subject,
      modified: new Date(),
      estimateRequested: true,
      estimateSucceeded: false,
      storypoints: null
    };
    const newDoc = await this.planningCollection.add(planning);
    return newDoc.id;
  }

  public async updateIssue(planningId: string, issue: string) {
    const planning = {
      issue,
      modified: new Date(),
      estimateRequested: true,
      estimateSucceeded: false,
      storypoints: null
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(planning);
    this.resetStorypoints(planningId);
  }

  public getPlanning(planningId: string): Observable<Planning | undefined> {
    return this.afs.doc<Planning>('planning/' + planningId).valueChanges();
  }

  public async deletePlanning(planningId: string) {
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

  public async updateStorypoints(planningId: string, userId: string, storypoints: Storypoints) {
    const partial: StorypointsPartial = {storypoints};
    const planningRef = this.getPlanningRef(planningId);
    const developerCollection = planningRef.collection('developer');
    const developer = developerCollection.doc(userId);
    await developer.update(partial);
    console.log({userId, partial});
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

  public async setEstimateResult(planningId: string, allValidStorypointsAreEqual: boolean, storypoints: Storypoints) {
    const estimateResult: PlanningEstimatePartial = {
      estimateRequested: false,
      estimateSucceeded: allValidStorypointsAreEqual,
      storypoints
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(estimateResult);
  }

  public async resetEsimate(planningId: string) {
    this.resetStorypoints(planningId);
    const estimateResult: PlanningEstimatePartial = {
      estimateRequested: true,
      estimateSucceeded: false,
      storypoints: 0
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(estimateResult);
  }

  private resetStorypoints(planningId: string) {
    this.getDevelopers(planningId).pipe(first()).subscribe(developers => {
      for (const developer of developers) {
        this.updateStorypoints(planningId, developer.id, null);
      }
    });
  }


  private getPlanningRef(planningId: string): AngularFirestoreDocument<Planning> {
    return this.afs.doc<Planning>('planning/' + planningId);
  }
}

export function renderStorypoint(storypoints): string {
  switch (storypoints) {
    case Storypoints.sHalf:
      return '1/2';
    case Storypoints.s1:
      return '1';
    case Storypoints.s2:
      return '2';
    case Storypoints.s3:
      return '3';
    case Storypoints.s5:
      return '5';
    case Storypoints.s8:
      return '8';
    case Storypoints.s13:
      return '13';
    case Storypoints.s20:
      return '20';
    case Storypoints.s40:
      return '40';
    case Storypoints.s100:
      return '100';
    case Storypoints.unsure:
      return '?';
    case Storypoints.noway:
      return '∞';
    case Storypoints.coffee:
      return '☕️';
    default:
      return null;
  }
}
