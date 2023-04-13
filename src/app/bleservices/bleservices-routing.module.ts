import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BleservicesPage } from './bleservices.page';

const routes: Routes = [
  {
    path: '',
    component: BleservicesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BleservicesPageRoutingModule {}
