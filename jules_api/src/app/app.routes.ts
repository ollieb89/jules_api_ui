import { Routes } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { SessionListComponent } from './jules/session-list/session-list.component';
import { SessionCreateComponent } from './jules/session-create/session-create.component';
import { SessionDetailComponent } from './jules/session-detail/session-detail.component';
import { SettingsComponent } from './jules/settings/settings.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/users',
    pathMatch: 'full'
  },
  {
    path: 'users',
    component: UserListComponent
  },
  {
    path: 'users/new',
    component: UserFormComponent
  },
  {
    path: 'users/:id/edit',
    component: UserFormComponent
  },
  {
    path: 'jules',
    component: SessionListComponent
  },
  {
    path: 'jules/create',
    component: SessionCreateComponent
  },
  {
    path: 'jules/:id',
    component: SessionDetailComponent
  },
  {
    path: 'jules/settings',
    component: SettingsComponent
  }
];
