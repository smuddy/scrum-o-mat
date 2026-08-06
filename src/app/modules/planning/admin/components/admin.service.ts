import {inject, Injectable, Injector, runInInjectionContext} from '@angular/core';
import {collection, collectionData, deleteDoc, doc, Firestore} from '@angular/fire/firestore';
import {toSignal} from '@angular/core/rxjs-interop';
import {firstValueFrom, Observable} from 'rxjs';
import {first} from 'rxjs/operators';
import {PlanningId} from '../../models/planning';
import {DeveloperId} from '../../models/delevoper';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private afs = inject(Firestore);
  private injector = inject(Injector);

  // AngularFire-Aufrufe muessen im Injection-Kontext laufen (sonst Warnung + instabile CD/Hydration).
  private inCtx<T>(op: () => T): T {
    return runInInjectionContext(this.injector, op);
  }

  public plannings: Observable<PlanningId[]> =
    this.inCtx(() => collectionData(collection(this.afs, 'planning'), {idField: 'id'})) as Observable<PlanningId[]>;

  // Signal-Variante additiv (Observable plannings bleibt bestehen)
  public planningsSignal = toSignal(this.plannings, {initialValue: [] as PlanningId[]});

  public async deletePlanning(planningId: string) {
    // Firestore loescht Subcollections nicht kaskadierend -> erst alle developer-Docs
    // entfernen, damit keine verwaisten Eintraege (Datenmuell) zurueckbleiben.
    const developers = await firstValueFrom(this.getDevelopers(planningId).pipe(first()));
    await Promise.all(developers.map(_ => this.deleteUser(planningId, _.id)));
    await this.inCtx(() => deleteDoc(doc(this.afs, 'planning/' + planningId)));
  }

  public async deleteUser(planningId: string, userId: string) {
    await this.inCtx(() => deleteDoc(doc(this.afs, 'planning/' + planningId + '/developer/' + userId)));
  }

  public getDevelopers(planningId: string): Observable<DeveloperId[]> {
    return this.inCtx(() => collectionData(collection(this.afs, 'planning/' + planningId + '/developer'), {idField: 'id'})) as Observable<DeveloperId[]>;
  }

}
