import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FidelityRoutingModule } from './fidelity-routing.module';
import { FidelityListComponent } from './fidelity-list/fidelity-list.component';
import { FidelityDetailsComponent } from './fidelity-details/fidelity-details.component';
import { PointHistoryComponent } from './point-history/point-history.component';
import { FidelityModifyComponent } from './fidelity-modify/fidelity-modify.component';

@NgModule({
  declarations: [
    FidelityListComponent,
    FidelityDetailsComponent,
    PointHistoryComponent,
    FidelityModifyComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FidelityRoutingModule
  ]
})
export class FidelityModule { }