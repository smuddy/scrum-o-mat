import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';
import {Project, ProjectId} from '../models/project';
import {LoginService} from '../../login/login.service';
import {mergeMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private projectCollection: AngularFirestoreCollection<Project>;
  private projects: Observable<ProjectId[]>;

  constructor(
    private afs: AngularFirestore,
    private loginService: LoginService,
  ) {

    this.projectCollection = afs.collection<Project>('project', _ => _.where('owner', '==', 'x'));
    this.projects = loginService.currentUserId$().pipe(
      mergeMap(userId => afs.collection<Project>('project', _ => _.where('owner', '==', userId)).valueChanges({idField: 'id'}))
    );
  }

  public getProjects(): Observable<ProjectId[] | undefined> {
    return this.projects;
  }

  public getProject(projectId: string): Observable<Project | undefined> {
    return this.afs.doc<Project>('project/' + projectId).valueChanges();
  }

  public async addNewProject(userId: string) {
    const project = {
      name: 'neues Projekt',
      owner: userId,
      sprints: [],
      initialVelocity: 1,
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
