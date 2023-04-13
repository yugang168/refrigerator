import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { IonicStorageModule } from '@ionic/storage-angular';
import { BLE } from '@awesome-cordova-plugins/ble/ngx';
import { BluetoothLE } from '@awesome-cordova-plugins/bluetooth-le/ngx';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { NavParams, ToastController } from '@ionic/angular';
// import { NavController } from '@ionic/angular';
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';
import { BleservicesPage} from './bleservices/bleservices.page';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule,IonicStorageModule.forRoot()],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },BLE, BluetoothLE,BluetoothSerial,NavParams,NativeStorage,BleservicesPage],
  bootstrap: [AppComponent],
})
export class AppModule {}
