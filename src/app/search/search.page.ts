import { Component, OnInit,NgZone, ViewChild } from '@angular/core';
import { BLE } from '@awesome-cordova-plugins/ble/ngx';
// import { NavController } from 'ionic-angular';
// import { ToastController } from 'ionic-angular';
import { NavParams, ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { Router} from '@angular/router'

import { Injectable } from '@angular/core';
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';
import { IonModal } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';

@Injectable({
  providedIn: 'root'
})

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {
  @ViewChild(IonModal) modal: IonModal;

// // 开始扫描按钮的禁用与开启
  // disabled:string="false";
  //设备列表 
  devices: any[] = [];
  statusMessage: string;

  // 蓝牙冰箱的mac地址前6位
  deviceMac:string="FF:22:07";

  constructor( public router:Router, public navCtrl: NavController,private ble: BLE ,private ngZone: NgZone,public toastCtrl: ToastController,private nativeStorage: NativeStorage,
             ) {
  }

  ngOnInit() {
  }
  cancel() {
    this.modal.dismiss(null, '取消');
  }

  confirm() {
    this.modal.dismiss(null, '确定');
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
     console.log( `Hello, ${ev.detail.data}!`);
    }
  }
  // 扫描蓝牙设备进行的设置
  scanSet(){
    
  }


  ionViewDidEnter() {
    console.log('ionViewDidEnter');
    this.scan();

    // 如果本地存储了设备信息则直接连接即可，直接跳转到blesrvices页面，如果没有需要连接冰箱

    this.nativeStorage.getItem('device')
      .then(
        (data) => {
          console.log(data);
          if(data==null){
            this.scan();
          }else{
            // 存储了设备信息，直接跳转到bleservices页面
            this.router.navigate(["/bleservices"]);
          }

            
        },
        // 第一次连接设备是不会有device属性的
        (error) => {
          console.error(error)
          this.scan();
        }
      );
  }

  scan() {
    this.setStatus('Scanning for Bluetooth LE Devices');
    this.devices = [];  // clear list

    var count=0
    this.ble.scan([], 5).subscribe(
      (device) => {
        count=count+1;
        this.onDeviceDiscovered(count,device);
      },
      error => this.scanError(error)
    );
  }

  onDeviceDiscovered(count,device) {
    console.log('Discovered ' + JSON.stringify(device, null, 2));
    this.ngZone.run(() => {
      // 过滤冰箱设备
          if(device.id.substring(0,8)==this.deviceMac){
        //显示的设备名为自己重名的设备名
        this.nativeStorage.getItem('connectedDevice').then(
          data=>{
            for(var i=0;i<data.length;i++){
              if(data[i].id==device.id)
              device.name=data[i].rename;
            }
          }
        )
            this.devices.push(device);
          };
          // document.getElementById('device').innerHTML = "查找出来的长度为"+this.devices.length+"数据部分为"+device.id+"类型"+typeof(device.id)+'次数为'+count;
    });
  }

  // If location permission is denied, you'll end up here
  async scanError(error) {
    this.setStatus('Error ' + error);
    const toast = await this.toastCtrl.create({
      message: 'Error scanning for Bluetooth low energy devices',
      position: 'middle',
      duration: 2000,
    });
    toast.present();

  }

  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  // 选择需要连接的设备
  deviceSelected(device) {
    console.log(JSON.stringify(device) + ' selected');

    // 存储设备信息到本地
    this.nativeStorage.setItem('device', device)
      .then(
        () => console.log('Stored item!'),
        error => console.error('Error storing item', error)
      );

    // 如果本地存储了已连接设备的的对象，则进一步查询是否存储了当前设备
    // 如果本地没有存储已连接设备的对象，则新建一个对象
    this.nativeStorage.getItem('connectedDevice')
      .then(
        (data) => {
          var flag=0;

        for(var i=0;i<data.length;i++){
          if(data[i]["id"]==device["id"]){
              flag=1;
          }
          if(flag==0){
            // alert("找到未出现过的设备!");
            data.push({"name":device["name"],"id":device["id"],"rename":device["name"]});
            this.nativeStorage.setItem('connectedDevice',data)
              .then(
                () => console.log('Stored item!'),
                error => console.error('Error storing item', error)
              );
          }
        }
        this.router.navigate(["/bleservices"],{
          queryParams:{
            name:device.name,
            id:device.id
          }
        });
            
        },
        // 第一次连接设备是不会有device属性的
        (error) => {
          // alert("新建connectedDevice");
          var data=[];
          data.push({"name":device["name"],"id":device["id"],"rename":device["name"]});
          this.nativeStorage.setItem('connectedDevice',data)
          .then(
            () => {
              this.router.navigate(["/bleservices"],{
                queryParams:{
                  name:device.name,
                  id:device.id
                }
              });
            },

            error => console.error('Error storing item', error)
          );
        }
      );
  }

  // 跳转测试
  junp(){
    this.nativeStorage.setItem('device', {name:"王大锤",id:"45.56.78.88",rssi:"456"})
      .then(
        () => console.log('Stored item!'),
        error => console.error('Error storing item', error)
      );

    this.router.navigate(["/bleservices"],{
      queryParams:{
        name:"hello",
        id:"456",
      }
    });
  }
}