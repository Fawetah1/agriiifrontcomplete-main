import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FidelityListComponent } from './fidelity-list/fidelity-list.component';
import { FidelityDetailsComponent } from './fidelity-details/fidelity-details.component';
import { PointHistoryComponent } from './point-history/point-history.component';
import { FidelityModifyComponent } from './fidelity-modify/fidelity-modify.component';

const routes: Routes = [
  { path: 'fidelities', component: FidelityListComponent },
  { path: 'fidelity/:id', component: FidelityDetailsComponent },
  { path: 'history/:userId', component: PointHistoryComponent },
  { path: 'modify/:userId', component: FidelityModifyComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FidelityRoutingModule { }