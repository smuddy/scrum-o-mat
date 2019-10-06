import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Planning} from '../../../models/planning';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Developer} from '../../../models/delevoper';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  public plannings: Observable<{ id: string, data: Planning }[]>;
  private planningCollection: AngularFirestoreCollection<Planning>;

  constructor(private afs: AngularFirestore) {
    this.planningCollection = afs.collection<Planning>('planning');
    this.plannings = this.planningCollection.snapshotChanges().pipe(map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Planning;
        const id = a.payload.doc.id;
        return {id, data};
      });
    }));
  }

  public async deletePlanning(planningId: string) {
    await this.planningCollection.doc(planningId).delete();
  }

  public async deleteUser(planningId: string, userId: string) {
    await this.planningCollection.doc(planningId).collection('developer').doc(userId).delete();
  }

  public getDevelopers(planningId: string): Observable<{ id: string, data: Developer }[]> {
    const planningRef = this.afs.doc<Planning>('planning/' + planningId);
    const developerCollection = planningRef.collection<Developer>('developer');
    return developerCollection.snapshotChanges().pipe(map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Developer;
        const id = a.payload.doc.id;
        return {id, data};
      });
    }));
  }

}
