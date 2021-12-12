import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';
import {Planning, PlanningId} from '../../models/planning';
import {DeveloperId} from '../../models/delevoper';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  public plannings: Observable<PlanningId[]>;
  private planningCollection: AngularFirestoreCollection<PlanningId>;

  constructor(private afs: AngularFirestore) {
    this.planningCollection = afs.collection<PlanningId>('planning');
    this.plannings = this.planningCollection.valueChanges({idField: 'id'});
  }

  public async deletePlanning(planningId: string) {
    await this.planningCollection.doc(planningId).delete();
  }

  public async deleteUser(planningId: string, userId: string) {
    await this.planningCollection.doc(planningId).collection('developer').doc(userId).delete();
  }

  public getDevelopers(planningId: string): Observable<DeveloperId[]> {
    const planningRef = this.afs.doc<Planning>('planning/' + planningId);
    const developerCollection = planningRef.collection<DeveloperId>('developer');
    return developerCollection.valueChanges({idField: 'id'});
  }

}
