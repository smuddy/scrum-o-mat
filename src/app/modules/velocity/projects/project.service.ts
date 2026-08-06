import {inject, Injectable, Injector, runInInjectionContext} from '@angular/core';
import {addDoc, collection, collectionData, deleteDoc, doc, docData, Firestore, query, updateDoc, where} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {Project, ProjectId, ProjectOwner} from '../models/project';
import {LoginService} from '../../login/login.service';
import {mergeMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private afs = inject(Firestore);
  private injector = inject(Injector);
  private loginService = inject(LoginService);

  // AngularFire-Aufrufe muessen im Injection-Kontext laufen (sonst Warnung + instabile CD/Hydration).
  private inCtx<T>(op: () => T): T {
    return runInInjectionContext(this.injector, op);
  }

  private projectsAsOwner: Observable<ProjectId[]> = this.loginService.currentUserId$().pipe(
    mergeMap(userId => this.inCtx(() => collectionData(query(collection(this.afs, 'project'), where('owner', '==', userId)), {idField: 'id'})) as Observable<ProjectId[]>)
  );
  private projectsAsReader: Observable<ProjectId[]> = this.loginService.currentUserId$().pipe(
    mergeMap(userId => this.inCtx(() => collectionData(query(collection(this.afs, 'project'), where('coReaders', 'array-contains', userId)), {idField: 'id'})) as Observable<ProjectId[]>)
  );
  private projectsAsWriter: Observable<ProjectId[]> = this.loginService.currentUserId$().pipe(
    mergeMap(userId => this.inCtx(() => collectionData(query(collection(this.afs, 'project'), where('coWriters', 'array-contains', userId)), {idField: 'id'})) as Observable<ProjectId[]>)
  );

  public getProjectsOwner(): Observable<ProjectId[] | undefined> {
    return this.projectsAsOwner;
  }

  public getProjectsReader(): Observable<ProjectId[] | undefined> {
    return this.projectsAsReader;
  }

  public getProjectsWriter(): Observable<ProjectId[] | undefined> {
    return this.projectsAsWriter;
  }

  public getProject(projectId: string): Observable<ProjectId | undefined> {
    return this.inCtx(() => docData(doc(this.afs, 'project/' + projectId), {idField: 'id'})) as Observable<ProjectId | undefined>;
  }

  public async addNewProject(userId: string) {
    const project: ProjectOwner = {
      name: 'neues Projekt',
      owner: userId,
      sprints: [],
      initialVelocity: 1,
      coReaders: [],
      coWriters: [],
    };
    const newDoc = await this.inCtx(() => addDoc(collection(this.afs, 'project'), project));
    return newDoc.id;
  }

  public async deleteProject(projectId: string) {
    await this.inCtx(() => deleteDoc(doc(this.afs, 'project/' + projectId)));
  }

  public async updateProject(projectId: string, project: Partial<Project>) {
    await this.inCtx(() => updateDoc(doc(this.afs, 'project/' + projectId), {...project}));
  }

}
