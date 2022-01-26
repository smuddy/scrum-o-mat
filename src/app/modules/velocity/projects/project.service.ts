import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';
import {Project, ProjectId, ProjectOwner} from '../models/project';
import {LoginService} from '../../login/login.service';
import {mergeMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private projectCollection: AngularFirestoreCollection<Project>;
  private projectsAsOwner: Observable<ProjectId[]>;
  private projectsAsReader: Observable<ProjectId[]>;
  private projectsAsWriter: Observable<ProjectId[]>;

  constructor(
    private afs: AngularFirestore,
    private loginService: LoginService,
  ) {

    this.projectCollection = afs.collection<Project>('project', _ => _.where('owner', '==', 'x'));
    this.projectsAsOwner = loginService.currentUserId$().pipe(
      mergeMap(userId => afs.collection<Project>('project', _ => _.where('owner', '==', userId)).valueChanges({idField: 'id'}))
    );    this.projectsAsReader = loginService.currentUserId$().pipe(
      mergeMap(userId => afs.collection<Project>('project', _ => _.where('coReaders', 'array-contains', userId)).valueChanges({idField: 'id'}))
    );    this.projectsAsWriter = loginService.currentUserId$().pipe(
      mergeMap(userId => afs.collection<Project>('project', _ => _.where('coWriters', 'array-contains', userId)).valueChanges({idField: 'id'}))
    );
  }

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
    return this.afs.doc<Project>('project/' + projectId).valueChanges({idField: 'id'});
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
    const newDoc = await this.projectCollection.add(project);
    return newDoc.id;
  }

  public async deleteProject(projectId: string) {
    await this.projectCollection.doc(projectId).delete();
  }

  public async updateProject(projectId: string, project: Partial<Project>) {
    const doc = this.afs.doc<Project>('project/' + projectId);
    await doc.update(project);
  }

}
