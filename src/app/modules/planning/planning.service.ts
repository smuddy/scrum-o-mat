import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/firestore';
import {first} from 'rxjs/operators';
import {StoryPoints} from './models/storyPoints';
import {Developer, DeveloperId} from './models/delevoper';
import {PlanningEstimatePartial} from './models/planningEstimatePartial';
import {Planning} from './models/planning';
import {StoryPointsPartial} from './models/storyPointsPartial';
import {Observable} from 'rxjs';

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
      storyPoints: null
    };
  }

  public async createNewSession(subject: string): Promise<string> {
    const planning: Planning = {
      issue: null,
      subject,
      modified: new Date(),
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: null
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
      storyPoints: null
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(planning);
    this.resetStoryPoints(planningId);
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

  public async setEstimateResult(planningId: string, allValidStoryPointsAreEqual: boolean, storyPoints: StoryPoints) {
    const estimateResult: PlanningEstimatePartial = {
      estimateRequested: false,
      estimateSucceeded: allValidStoryPointsAreEqual,
      storyPoints
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(estimateResult);
  }

  public async resetEstimate(planningId: string) {
    this.resetStoryPoints(planningId);
    const estimateResult: PlanningEstimatePartial = {
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: 0
    };

    const planningRef = this.getPlanningRef(planningId);
    await planningRef.update(estimateResult);
  }

  private resetStoryPoints(planningId: string) {
    this.getDevelopers(planningId).pipe(first()).subscribe(developers => {
      for (const developer of developers) {
        this.updateStoryPoints(planningId, developer.id, null);
      }
    });
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
