import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {Project, ProjectId, ProjectOwner} from '../models/project';
import {LoginService} from '../../login/login.service';

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
    this.projectCollection = afs.collection<Project>('project');
    this.projects = this.projectCollection.valueChanges({idField: 'id'});
  }

  public getProjects(): Observable<ProjectId[] | undefined> {
    return this.projects;
  }

  public getProject(projectId: string): Observable<Project | undefined> {
    return this.afs.doc<Project>('project/' + projectId).valueChanges();
  }

  public async addNewProject(userId: string) {
    const project: ProjectOwner = {
      name: 'neues Projekt',
      owner: userId,
      sprints: [],
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
