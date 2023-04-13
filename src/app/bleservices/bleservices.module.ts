import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BleservicesPageRoutingModule } from './bleservices-routing.module';

import { BleservicesPage } from './bleservices.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BleservicesPageRoutingModule
  ],
  declarations: [BleservicesPage]
})
export class BleservicesPageModule {}
