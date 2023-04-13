import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
// import { NavController, NavParams } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { BLE } from '@awesome-cordova-plugins/ble/ngx';
import { ActivatedRoute } from '@angular/router';
import { RangeCustomEvent } from '@ionic/angular';
import { RangeValue } from '@ionic/core';
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';
import { Router } from '@angular/router';
import { IonModal } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import { PickerController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';



// Bluetooth UUIDs
const SERVICE = '1234'
const READ_NOTIFY = '1236';
const WRITE = '1235';
const WRITENOTIFY = 'fff1';

@Component({
  selector: 'app-bleservices',
  templateUrl: './bleservices.page.html',
  styleUrls: ['./bleservices.page.scss'],
})
export class BleservicesPage implements OnInit {
  @ViewChild(IonModal) modal: IonModal;

  ngOnInit() {

  }
  public peripheral: any = {};
  // 显示存储的设备
  public savedDevice: any = {};
  public statusMessage: string;
  public id: any;
  public name: any;

  public read_notify: any;
  public write_: any;
  public write_notify: any;
  public info: any = [];
  public power: any;
  public arryComp: Uint8Array;

  public infomation: any = [];


  lastEmittedValue: RangeValue = 0;
  times: Number = 0;
  message: any;
  maxValue: any = 20;
  minValue: any = -20

  // 此变量是用来控制加减温度时按的太快出现的问题
  lockCtr = 0;

  //  设备信息
  public deviceInfo: any;
  battery: any = [];//当前电量
  voltage: any = [];//当前电压
  temperature: any = [];//当前温度
  leftHouse: any = [];//左仓温度
  rightHouse: any = [];//右仓温度
  leftHouseSet: any = [];//左箱设置温度
  rightHouseSet: any = [];//右箱设置温度
  leftRightSet: any = [];//设置左右箱温度
  maxTemperatureSet: any = []//最大温度控制范围
  minTemperatureSet: any = []//最小温度控制范围
  temperatureUnit: string = "centigrade";//温度单位
  workVoltage: any = [];//工作电压
  ecoModel: any = [];//节能模式
  isLock: any = [];//锁定面板


  house: any = 'left-warehouse'
  language: any;//设置的语言
  powerBtnColor: any = [];//电源按钮的颜色

  cel = [];//八进制的表示的摄氏度
  cel_real = [];//十进制表示的摄氏度
  cel_fah_real = [];//八进制表示的摄氏度对应的华氏度
  cel_fah = [];//十进制表示的摄氏度对应的华氏度
  cel_all = [];//包含上述四个数组的数组

  fah = [];//八进制表示的华氏度
  fah_real = [];//十进制的华氏度
  fah_cel_real = [];//八进制表示的华氏度对应的摄氏度
  fah_cel = [];//十进制表示的华氏度对应的摄氏度
  fah_all = [];//包含上述四个数组的数组



  // 测试函数
  sayHello() {
    console.log("hello,world")!
  }


  // 构造函数
  constructor(private activatedRoute: ActivatedRoute,
    private ble: BLE, private ngZone: NgZone, public toastCtrl: ToastController,
    private nativeStorage: NativeStorage, public router: Router, private pickerCtrl: PickerController
    , private loadingCtrl: LoadingController) {

    //获取设备的的参数
    this.nativeStorage.getItem('device')
      .then(
        (data) => {
          console.log(data);
          this.id = data['id'];
          this.name = data['name'];

        },
        error => console.error(error)
      );
    // this.id=res['id'];
    // this.name=res['name'];
    this.nativeStorage.getItem('connectedDevice')
      .then(
        (data) => {

          for (var i = 0; i < data.length; i++) {
            if (data[i]['id'] == this.id) {
              this.savedDevice = data[i];
              // alert("存储的数组长度为:"+data.length+"this.id:"+this.id+data[0].id+data[0].rename);
            }
          }

        },
        // error => alert("未获取到connectedDevice")
      );

    this.setStatus('Connecting to ' + this.name);
    // 在温度条上显示设置温度
    // if(this.house=='left-warehouse'){
    //   this.lastEmittedValue=this.leftHouseSet[0];
    // }else{
    //   this.lastEmittedValue=this.rightHouseSet[0];
    // }


    // this.ble.connect(this.id).subscribe(
    //   peripheral => this.onConnected(peripheral),
    //   // peripheral => this.onDeviceDisconnected(peripheral)
    // );
    this.connect();



    this.cel_fah_func();

  }

  // 连接蓝牙
  async connect() {
    const loading = await this.loadingCtrl.create({
      message: '连接中...',
      spinner: 'circles',
    });
    loading.present();
    await this.ble.connect(this.id).subscribe(
      peripheral => {
        this.onConnected(peripheral);
      },
      peripheral => {
        this.onDeviceDisconnected(peripheral);
      }
    );

    // 连接完成后，加载框消失
    setTimeout(() => { loading.dismiss() }, 1000)


  }

  // 华氏度与摄氏度之间的映射数组
  cel_fah_func() {
    // 十六进制8位存储的摄氏度
    for (var i = 236; i <= 255; i++) {
      this.cel.push(i);
    }
    for (var i = 0; i <= 20; i++) {
      this.cel.push(i);
    }
    var item: any;
    //  实际温度
    for (var i = 0; i < this.cel.length; i++) {
      if (this.cel[i] > 100) {
        this.cel_real.push(this.cel[i] - 256);
      } else {
        this.cel_real.push(this.cel[i]);
      }
    }
    //  摄氏度对应的华氏度
    for (var i = 0; i < this.cel_real.length; i++) {
      this.cel_fah_real.push(Math.round(32 + 1.8 * this.cel_real[i]));
    }

    //  16进制8位存储的华氏度
    for (var i = 0; i < this.cel_fah_real.length; i++) {
      if (this.cel_fah_real[i] >= 0) {
        this.cel_fah.push(this.cel_fah_real[i]);
      } else {
        this.cel_fah.push(this.cel_fah_real[i] + 256);
      }
      this.cel_all.push(this.cel);
      this.cel_all.push(this.cel_real);
      this.cel_all.push(this.cel_fah_real);
      this.cel_all.push(this.cel_fah);
    }

    // 十六进制8位存储的华氏度
    for (var i = 252; i <= 255; i++) {
      this.fah.push(i);
    }
    for (var i = 0; i <= 68; i++) {
      this.fah.push(i);
    }
    //  实际温度
    for (var i = 0; i < this.fah.length; i++) {
      if (this.fah[i] > 100) {
        this.fah_real.push(this.fah[i] - 256);
      } else {
        this.fah_real.push(this.fah[i]);
      }
    }

    //  华氏度对应的摄氏度
    for (var i = 0; i < this.fah_real.length; i++) {
      this.fah_cel_real.push(Math.round((this.fah_real[i] - 32) / 1.8));
    }

    //  16进制8位存储的摄氏度
    for (var i = 0; i < this.fah_cel_real.length; i++) {
      if (this.fah_cel_real[i] >= 0) {
        this.fah_cel.push(this.fah_cel_real[i]);
      } else {
        this.fah_cel.push(this.fah_cel_real[i] + 256);
      }
    }
    this.fah_all.push(this.fah);
    this.fah_all.push(this.fah_real);
    this.fah_all.push(this.fah_cel_real);
    this.fah_all.push(this.fah_cel);


  }


  // 模态框中的函数*****************
  cancel() {
    this.modal.dismiss(null, '取消');
  }

  confirm() {
    this.modal.dismiss(this.name, '确定');
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      this.message = `Hello, ${ev.detail.data}!`;
    }
  }

  // 修改名字的输入框
  inputChange() {
    // 修改的名字要同步保存到本地
    this.nativeStorage.getItem('connectedDevice').then(
      data => {
        for (var i = 0; i < data.length; i++) {
          if (data[i]['id'] == this.savedDevice.id) {
            data[i]['rename'] = this.savedDevice.rename;
          }
        }

        this.nativeStorage.setItem('connectedDevice', data).then(
          data => {
            console.log("修改保存到本地成功！");
          },
          error => {
            console.log("修改保存到本地失败！");
          }
        )


      },
      error => {
      }
    )
  }

  // 恢复出场设置
  factorySet(e) {
    var value = e.detail.value;
    console.log("选择的值为", e.detail.value);
    if (value == 'yes') {
      var data = new Uint8Array(6);
      data[0] = 0xFE; // 帧头
      data[1] = 0xFE; // 帧头
      data[2] = 0x03; // 数据长度
      data[3] = 0x04; // 恢复出厂设置
      data[4] = 0x02; // 校验和
      data[5] = 0x03; // 校验和

      this.nativeStorage.getItem('device')
        .then(
          data => {
            this.peripheral = data;
          },
          error => console.error(error)
        );

      // 发出恢复出厂设置指令
      this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
        data => {
          this.message = "恢复出厂设置指令发送成功！";
        },
        error => {
          this.message = "恢复出厂设置指令发送失败！";
        }
      );
      // 捕获恢复出厂设置的回复
      this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
    }

  }

  // 设置温度单位
  temperatureUnitSet() {

    if (this.infomation[0][13] == 0x00) {
      // 设置单位为华氏度
      this.temperatureUnit = "fahrenheit";
      var set_8 = this.infomation[0][8];//左箱设定温度
      var set_9 = this.infomation[0][9];//最大控制范围
      var set_10 = this.infomation[0][10];//最小控制范围
      var set_11 = this.infomation[0][11];//左箱温度回差
      var set_13 = this.infomation[0][13];//温度单位
      var set_14 = this.infomation[0][14];//左箱T≥-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      var set_15 = this.infomation[0][15];//左箱-12≤T<-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      var set_16 = this.infomation[0][16];//左箱T<-12℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认-4℃
      var set_17 = this.infomation[0][17];//左箱停机温度补偿(-10℃, 0℃) /(-18℉, 0℉) 默认0℃

      var set_18 = this.infomation[0][18];//左箱实际温度

      var set_22 = this.infomation[1][2];//右箱设定温度 (最小控制范围, 最大控制范围) 默认0℃
      var set_25 = this.infomation[1][5];//右箱温度回差 (1℃, 10℃) /(2℉, 18℉) 默认2℃
      var set_26 = this.infomation[1][6];//右箱T≥-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      var set_27 = this.infomation[1][7];//右箱-12≤T<-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      var set_28 = this.infomation[1][8];//右箱T<-12℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认-4℃
      var set_29 = this.infomation[1][9];//右箱停机温度补偿(-10℃, 0℃) /(-18℉, 0℉) 默认0℃

      var set_30 = this.infomation[1][10];//右箱实际温度

      // 摄氏度的温度单位转为华氏度的单位
      var indexs = [];
      var values = [];
      // 左箱设定温度
      var set_8_index = this.cel.indexOf(set_8);
      indexs.push(8);
      values.push(this.cel_fah[set_8_index]);
      // 最大控制范围
      var set_9_index = this.cel.indexOf(set_9);
      indexs.push(9);
      values.push(this.cel_fah[set_9_index]);
      // 最小控制范围
      var set_10_index = this.cel.indexOf(set_10);
      indexs.push(10);
      values.push(this.cel_fah[set_10_index]);
      // 左箱温度回差
      var fah_set_11 = Math.round(set_11 * 1.8);
      indexs.push(11);
      values.push(fah_set_11);
      // 温度单位
      indexs.push(13);
      values.push(1);
      //左箱T≥-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      if (set_14 > 100) {
        var cel_set_14_real = set_14 - 256;
        var fah_set_14_real = Math.round(cel_set_14_real * 1.8);
        var fah_set_14 = fah_set_14_real + 256;
        indexs.push(14);
        values.push(fah_set_14);
      } else {
        var fah_set_14 = Math.round(set_14 * 1.8);
        indexs.push(14);
        values.push(fah_set_14);
      }
      //左箱-12≤T<-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      if (set_15 > 100) {
        var cel_set_15_real = set_15 - 256;
        var fah_set_15_real = Math.round(cel_set_15_real * 1.8);
        var fah_set_15 = fah_set_15_real + 256;
        indexs.push(15);
        values.push(fah_set_15);
      } else {
        var fah_set_15 = Math.round(set_15 * 1.8);
        indexs.push(15);
        values.push(fah_set_15);
      }
      //左箱T<-12℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认-4℃
      if (set_16 > 100) {
        var cel_set_16_real = set_16 - 256;
        var fah_set_16_real = Math.round(cel_set_16_real * 1.8);
        var fah_set_16 = fah_set_16_real + 256;
        indexs.push(16);
        values.push(fah_set_16);
      } else {
        var fah_set_16 = Math.round(set_16 * 1.8);
        indexs.push(16);
        values.push(fah_set_16);
      }
      //左箱停机温度补偿(-10℃, 0℃) /(-18℉, 0℉) 默认0℃
      if (set_17 > 100) {
        var cel_set_17_real = set_17 - 256;
        var fah_set_17_real = Math.round(cel_set_17_real * 1.8);
        var fah_set_17 = fah_set_17_real + 256;
        indexs.push(17);
        values.push(fah_set_17);
      } else {
        var fah_set_17 = Math.round(set_17 * 1.8);
        indexs.push(17);
        values.push(fah_set_17);
      }
      //右箱设定温度 (最小控制范围, 最大控制范围) 默认0℃
      var set_22_index = this.cel.indexOf(set_22);
      indexs.push(22 - 4);
      values.push(this.cel_fah[set_22_index]);
      //右箱温度回差 (1℃, 10℃) /(2℉, 18℉) 默认2℃
      var fah_set_25 = Math.round(set_25 * 1.8);
      indexs.push(25 - 4);
      values.push(fah_set_25);
      //右箱T≥-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      if (set_26 > 100) {
        var cel_set_26_real = set_26 - 256;
        var fah_set_26_real = Math.round(cel_set_26_real * 1.8);
        var fah_set_26 = fah_set_26_real + 256;
        indexs.push(26 - 4);
        values.push(fah_set_26);
      } else {
        var fah_set_26 = Math.round(set_26 * 1.8);
        indexs.push(26 - 4);
        values.push(fah_set_26);
      }
      ////右箱-12≤T<-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      if (set_27 > 100) {
        var cel_set_27_real = set_27 - 256;
        var fah_set_27_real = Math.round(cel_set_27_real * 1.8);
        var fah_set_27 = fah_set_27_real + 256;
        indexs.push(27 - 4);
        values.push(fah_set_27);
      } else {
        var fah_set_27 = Math.round(set_27 * 1.8);
        indexs.push(27 - 4);
        values.push(fah_set_27);
      }
      //右箱T<-12℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认-4℃
      if (set_28 > 100) {
        var cel_set_28_real = set_28 - 256;
        var fah_set_28_real = Math.round(cel_set_28_real * 1.8);
        var fah_set_28 = fah_set_28_real + 256;
        indexs.push(28 - 4);
        values.push(fah_set_28);
      } else {
        var fah_set_28 = Math.round(set_28 * 1.8);
        indexs.push(28 - 4);
        values.push(fah_set_28);
      }
      //右箱停机温度补偿(-10℃, 0℃) /(-18℉, 0℉) 默认0℃
      if (set_29 > 100) {
        var cel_set_29_real = set_29 - 256;
        var fah_set_29_real = Math.round(cel_set_29_real * 1.8);
        var fah_set_29 = fah_set_29_real + 256;
        indexs.push(29 - 4);
        values.push(fah_set_29);
      } else {
        var fah_set_29 = Math.round(set_29 * 1.8);
        indexs.push(29 - 4);
        values.push(fah_set_29);
      }
      this.sendInstructions(indexs, values);

    } else {
      // 设置单位为摄氏度
      this.temperatureUnit = "centigrade";
      var set_8 = this.infomation[0][8];//左箱设定温度
      var set_9 = this.infomation[0][9];//最大控制范围
      var set_10 = this.infomation[0][10];//最小控制范围
      var set_11 = this.infomation[0][11];//左箱温度回差
      var set_13 = this.infomation[0][13];//温度单位
      var set_14 = this.infomation[0][14];//左箱T≥-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      var set_15 = this.infomation[0][15];//左箱-12≤T<-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      var set_16 = this.infomation[0][16];//左箱T<-12℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认-4℃
      var set_17 = this.infomation[0][17];//左箱停机温度补偿(-10℃, 0℃) /(-18℉, 0℉) 默认0℃

      var set_18 = this.infomation[0][18];//左箱实际温度

      var set_22 = this.infomation[1][2];//右箱设定温度 (最小控制范围, 最大控制范围) 默认0℃
      var set_25 = this.infomation[1][5];//右箱温度回差 (1℃, 10℃) /(2℉, 18℉) 默认2℃
      var set_26 = this.infomation[1][6];//右箱T≥-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      var set_27 = this.infomation[1][7];//右箱-12≤T<-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      var set_28 = this.infomation[1][8];//右箱T<-12℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认-4℃
      var set_29 = this.infomation[1][9];//右箱停机温度补偿(-10℃, 0℃) /(-18℉, 0℉) 默认0℃

      var set_30 = this.infomation[1][10];//右箱实际温度

      // 华氏度的温度单位转为摄氏度的单位
      var indexs = [];
      var values = [];
      // 左箱设定温度
      var set_8_index = this.fah.indexOf(set_8);
      indexs.push(8);
      values.push(this.fah_cel[set_8_index]);
      // 最大控制范围
      var set_9_index = this.fah.indexOf(set_9);
      indexs.push(9);
      values.push(this.fah_cel[set_9_index]);
      // 最小控制范围
      var set_10_index = this.fah.indexOf(set_10);
      indexs.push(10);
      values.push(this.fah_cel[set_10_index]);
      // 左箱温度回差
      var cel_set_11 = Math.round(set_11 / 1.8);
      indexs.push(11);
      values.push(cel_set_11);
      // 温度单位
      indexs.push(13);
      values.push(0);
      //左箱T≥-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      if (set_14 > 100) {
        var fah_set_14_real = set_14 - 256;
        var cel_set_14_real = Math.round(fah_set_14_real / 1.8);
        var cel_set_14 = cel_set_14_real + 256;
        indexs.push(14);
        values.push(cel_set_14);
      } else {
        var cel_set_14 = Math.round(set_14 / 1.8);
        indexs.push(14);
        values.push(cel_set_14);
      }
      //左箱-12≤T<-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      if (set_15 > 100) {
        var fah_set_15_real = set_15 - 256;
        var cel_set_15_real = Math.round(fah_set_15_real / 1.8);
        var cel_set_15 = cel_set_15_real + 256;
        indexs.push(15);
        values.push(cel_set_15);
      } else {
        var cel_set_15 = Math.round(set_15 / 1.8);
        indexs.push(15);
        values.push(cel_set_15);
      }
      //左箱T<-12℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认-4℃
      if (set_16 > 100) {
        var fah_set_16_real = set_16 - 256;
        var cel_set_16_real = Math.round(fah_set_16_real / 1.8);
        var cel_set_16 = cel_set_16_real + 256;
        indexs.push(16);
        values.push(cel_set_16);
      } else {
        var cel_set_16 = Math.round(set_16 / 1.8);
        indexs.push(16);
        values.push(cel_set_16);
      }
      //左箱停机温度补偿(-10℃, 0℃) /(-18℉, 0℉) 默认0℃
      if (set_17 > 100) {
        var fah_set_17_real = set_17 - 256;
        var cel_set_17_real = Math.round(fah_set_17_real / 1.8);
        var cel_set_17 = cel_set_17_real + 256;
        indexs.push(17);
        values.push(cel_set_17);
      } else {
        var cel_set_17 = Math.round(set_17 / 1.8);
        indexs.push(17);
        values.push(cel_set_17);
      }
      //右箱设定温度 (最小控制范围, 最大控制范围) 默认0℃
      var set_22_index = this.fah.indexOf(set_22);
      indexs.push(22 - 4);
      values.push(this.fah_cel[set_22_index]);
      //右箱温度回差 (1℃, 10℃) /(2℉, 18℉) 默认2℃
      var cel_set_25 = Math.round(set_25 / 1.8);
      indexs.push(25 - 4);
      values.push(cel_set_25);
      //右箱T≥-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      if (set_26 > 100) {
        var fah_set_26_real = set_26 - 256;
        var cel_set_26_real = Math.round(fah_set_26_real / 1.8);
        var cel_set_26 = cel_set_26_real + 256;
        indexs.push(26 - 4);
        values.push(cel_set_26);
      } else {
        var cel_set_26 = Math.round(set_26 / 1.8);
        indexs.push(26 - 4);
        values.push(cel_set_26);
      }
      ////右箱-12≤T<-6℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认0℃
      if (fah_set_27_real > 100) {
        var fah_set_27_real = set_27 - 256;
        var cel_set_27_real = Math.round(fah_set_27_real / 1.8);
        var cel_set_27 = cel_set_27_real + 256;
        indexs.push(27 - 4);
        values.push(cel_set_27);
      } else {
        var cel_set_27 = Math.round(set_27 / 1.8);
        indexs.push(27 - 4);
        values.push(cel_set_27);
      }
      //右箱T<-12℃温度补偿 (-10℃, 10℃) /(-18℉, 18℉) 默认-4℃
      if (set_28 > 100) {
        var fah_set_28_real = set_28 - 256;
        var cel_set_28_real = Math.round(fah_set_28_real / 1.8);
        var cel_set_28 = cel_set_28_real + 256;
        indexs.push(28 - 4);
        values.push(cel_set_28);
      } else {
        var cel_set_28 = Math.round(set_28 / 1.8);
        indexs.push(28 - 4);
        values.push(cel_set_28);
      }
      //右箱停机温度补偿(-10℃, 0℃) /(-18℉, 0℉) 默认0℃
      if (set_29 > 100) {
        var fah_set_29_real = set_29 - 256;
        var cel_set_29_real = Math.round(fah_set_29_real / 1.8);
        var cel_set_29 = cel_set_29_real + 256;
        indexs.push(29 - 4);
        values.push(cel_set_29);
      } else {
        var cel_set_29 = Math.round(set_29 / 1.8);
        indexs.push(29 - 4);
        values.push(cel_set_29);
      }

      this.sendInstructions(indexs, values);

    }
  }

  // 发送指令的函数
  // indexs:表示需要值的下标，数组类型。
  // values：表示设置的值
  sendInstructions(indexs, values) {
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和
    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(31);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x1C; // 数据长度
          dataSet[3] = 0x02; // 设置
          // dataSet[4] = 0x00; // UNLOCK/LOCK

          for (var i = 4; i <= 17; i++) {
            dataSet[i] = this.arryComp[i];
          }
          for (var i = 18; i <= 25; i++) {
            dataSet[i] = this.arryComp[i + 4];
          }

          // 设定的值
          for (var i = 0; i < indexs.length; i++) {
            dataSet[indexs[i]] = values[i];
          }
          dataSet[26] = this.arryComp[33];
          dataSet[27] = this.arryComp[32];
          dataSet[28] = 0x00; // 预留

          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 28; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[30] = checkSum & 0x00FF; //校验和(低位)

          // 前二十个字节
          var front = new Uint8Array(20);
          for (var i = 0; i <= 19; i++) {
            front[i] = dataSet[i];
          }
          // 后十一个字节
          var behind = new Uint8Array(11);
          for (var i = 0; i <= 10; i++) {
            behind[i] = dataSet[i + 20];
          }

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("设置指令（20）发出成功！" + data);
            },
            error => {
              this.setStatus("设置指令（20）发出失败" + error);
            }
          );

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("设置指令（11）发出成功！" + data);
            },
            error => {
              this.setStatus("设置指令（11）发出失败" + error);
            }

          );
          // 捕获设置的回复
          this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
          //  刷新页面
          this.queryInfomation();


        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }

      }
    );
  }


  // 最大控制范围
  maxTemperature(e) {
    var value = e.detail.value;
    console.log("选择的值为", e.detail.value);
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和
    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(31);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x1C; // 数据长度
          dataSet[3] = 0x02; // 设置
          // dataSet[4] = 0x00; // UNLOCK/LOCK

          for (var i = 4; i <= 8; i++) {
            dataSet[i] = this.arryComp[i];
          }
          // 设置能调节的最大温度
          dataSet[9] = parseInt(value);
          dataSet[10] = this.arryComp[10];
          for (var i = 11; i <= 17; i++) {
            dataSet[i] = this.arryComp[i];
          }
          for (var i = 18; i <= 25; i++) {
            dataSet[i] = this.arryComp[i + 4];
          }

          dataSet[26] = this.arryComp[33];
          dataSet[27] = this.arryComp[32];
          dataSet[28] = 0x00; // 预留

          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 28; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[30] = checkSum & 0x00FF; //校验和(低位)

          // this.power= this.dataSet;
          // document.getElementById('set').innerHTML='set'+dataSet.toString();
          // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
          // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

          // 前二十个字节
          var front = new Uint8Array(20);
          for (var i = 0; i <= 19; i++) {
            front[i] = dataSet[i];
          }
          // 后十一个字节
          var behind = new Uint8Array(11);
          for (var i = 0; i <= 10; i++) {
            behind[i] = dataSet[i + 20];
          }

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("温度设置指令（20）发出成功！" + data);
            },
            error => {
              this.setStatus("温度设置指令（20）发出失败" + error);
            }
          );

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("温度设置指令（11）发出成功！" + data);
            },
            error => {
              this.setStatus("温度设置指令（11）发出失败" + error);
            }

          );
          // 捕获设置的回复
          this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
          //  刷新页面
          this.queryInfomation();


        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }

      }
    );

  }

  // 最小控制范围
  minTemperature(e) {
    var value = e.detail.value;
    console.log("选择的值为", e.detail.value);

    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和

    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(31);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x1C; // 数据长度
          dataSet[3] = 0x02; // 设置
          // dataSet[4] = 0x00; // UNLOCK/LOCK

          for (var i = 4; i <= 8; i++) {
            dataSet[i] = this.arryComp[i];
          }
          // 设置能调节的最小温度
          dataSet[9] = this.arryComp[9];
          dataSet[10] = parseInt(value) + 256;
          for (var i = 11; i <= 17; i++) {
            dataSet[i] = this.arryComp[i];
          }
          for (var i = 18; i <= 25; i++) {
            dataSet[i] = this.arryComp[i + 4];
          }

          dataSet[26] = this.arryComp[33];
          dataSet[27] = this.arryComp[32];
          dataSet[28] = 0x00; // 预留

          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 28; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[30] = checkSum & 0x00FF; //校验和(低位)

          // this.power= this.dataSet;
          // document.getElementById('set').innerHTML='set'+dataSet.toString();
          // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
          // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

          // 前二十个字节
          var front = new Uint8Array(20);
          for (var i = 0; i <= 19; i++) {
            front[i] = dataSet[i];
          }
          // 后十一个字节
          var behind = new Uint8Array(11);
          for (var i = 0; i <= 10; i++) {
            behind[i] = dataSet[i + 20];
          }

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("温度设置指令（20）发出成功！" + data);
            },
            error => {
              this.setStatus("温度设置指令（20）发出失败" + error);
            }
          );

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("温度设置指令（11）发出成功！" + data);
            },
            error => {
              this.setStatus("温度设置指令（11）发出失败" + error);
            }

          );
          // 捕获设置的回复
          this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
          //  刷新页面
          this.queryInfomation();


        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }

      }
    );

  }


  handleChange(e) {
    var value = e.detail.value;
    console.log("选择的值为", e.detail.value);
  }

  // 启动延时
  async startDelay() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'delay',
          options: [
            {
              text: '0M',
              value: '0',
            },
            {
              text: '1M',
              value: '1',
            },
            {
              text: '2M',
              value: '2',
            },
            {
              text: '3M',
              value: '3',
            },
            {
              text: '4M',
              value: '4',
            },
            {
              text: '5M',
              value: '5',
            },
            {
              text: '6M',
              value: '6',
            },
            {
              text: '7M',
              value: '7',
            },
            {
              text: '8M',
              value: '8',
            },
            {
              text: '9M',
              value: '9',
            },
            {
              text: '10M',
              value: '10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.delay.value}`);
            var result = parseInt(value.delay.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置
                  // dataSet[4] = 0x00; // UNLOCK/LOCK

                  for (var i = 4; i <= 11; i++) {
                    dataSet[i] = this.arryComp[i];
                  }
                  // 设置启动延时
                  dataSet[12] = result;
                  for (var i = 13; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }
                  for (var i = 18; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("启动延时指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("启动延时指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("启动延时指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("启动延时指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 温度单位是摄氏度的设置**************************************
  // 左箱温度回差
  async leftTempReturn() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempReturn',
          options: [
            {
              text: '1℃',
              value: '1',
            },
            {
              text: '2℃',
              value: '2',
            },
            {
              text: '3℃',
              value: '3',
            },
            {
              text: '4℃',
              value: '4',
            },
            {
              text: '5℃',
              value: '5',
            },
            {
              text: '6℃',
              value: '6',
            },
            {
              text: '7℃',
              value: '7',
            },
            {
              text: '8℃',
              value: '8',
            },
            {
              text: '9℃',
              value: '9',
            },
            {
              text: '10℃',
              value: '10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempReturn.value}`);
            var result = parseInt(value.leftTempReturn.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置
                  // dataSet[4] = 0x00; // UNLOCK/LOCK

                  for (var i = 4; i <= 10; i++) {
                    dataSet[i] = this.arryComp[i];
                  }
                  // 设置启动延时
                  dataSet[11] = result;
                  for (var i = 12; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }
                  for (var i = 18; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱温度回差指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱温度回差指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱温度回差指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱温度回差指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 左箱停机温补
  async leftTempCompensate() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempCompensate',
          options: [
            {
              text: '0℃',
              value: '0',
            },
            {
              text: '-1℃',
              value: '-1',
            },
            {
              text: '-2℃',
              value: '-2',
            },
            {
              text: '-3℃',
              value: '-3',
            },
            {
              text: '-4℃',
              value: '-4',
            },
            {
              text: '-5℃',
              value: '-5',
            },
            {
              text: '-6℃',
              value: '-6',
            },
            {
              text: '-7℃',
              value: '-7',
            },
            {
              text: '-8℃',
              value: '-8',
            },
            {
              text: '-9℃',
              value: '-9',
            },
            {
              text: '-10℃',
              value: '-10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempCompensate.value}`);
            var result = parseInt(value.leftTempCompensate.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置

                  for (var i = 4; i <= 16; i++) {
                    dataSet[i] = this.arryComp[i];
                  }
                  // 设置左箱停机温补
                  if (result == 0) {
                    dataSet[17] = result;
                  } else {
                    dataSet[17] = result + 256;
                  }

                  for (var i = 18; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱温度温补指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱温度温补指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱温度温补指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱温度温补指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 左箱温补T≥-6℃温补
  async leftTempCompensate_6() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempCompensate_6',
          options: [
            {
              text: '10℃',
              value: '10',
            },
            {
              text: '9℃',
              value: '9',
            },
            {
              text: '8℃',
              value: '8',
            },
            {
              text: '7℃',
              value: '7',
            },
            {
              text: '6℃',
              value: '6',
            },
            {
              text: '5℃',
              value: '5',
            },
            {
              text: '4℃',
              value: '4',
            },
            {
              text: '3℃',
              value: '3',
            },
            {
              text: '2℃',
              value: '2',
            },
            {
              text: '1℃',
              value: '1',
            },
            {
              text: '0℃',
              value: '0',
            },
            {
              text: '-1℃',
              value: '-1',
            },
            {
              text: '-2℃',
              value: '-2',
            },
            {
              text: '-3℃',
              value: '-3',
            },
            {
              text: '-4℃',
              value: '-4',
            },
            {
              text: '-5℃',
              value: '-5',
            },
            {
              text: '-6℃',
              value: '-6',
            },
            {
              text: '-7℃',
              value: '-7',
            },
            {
              text: '-8℃',
              value: '-8',
            },
            {
              text: '-9℃',
              value: '-9',
            },
            {
              text: '-10℃',
              value: '-10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempCompensate_6.value}`);
            var result = parseInt(value.leftTempCompensate_6.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置

                  for (var i = 4; i <= 13; i++) {
                    dataSet[i] = this.arryComp[i];
                  }
                  // 设置左箱停机温补T≥-6℃
                  if (result >= 0) {
                    dataSet[14] = result;
                  } else {
                    dataSet[14] = result + 256;
                  }
                  for (var i = 15; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }

                  for (var i = 18; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("箱停机温补T≥-6℃指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("箱停机温补T≥-6℃指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("箱停机温补T≥-6℃指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("箱停机温补T≥-6℃指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 左箱温补-12≤T≤-6℃温补
  async leftTempCompensate_12_6() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempCompensate_12_6',
          options: [
            {
              text: '10℃',
              value: '10',
            },
            {
              text: '9℃',
              value: '9',
            },
            {
              text: '8℃',
              value: '8',
            },
            {
              text: '7℃',
              value: '7',
            },
            {
              text: '6℃',
              value: '6',
            },
            {
              text: '5℃',
              value: '5',
            },
            {
              text: '4℃',
              value: '4',
            },
            {
              text: '3℃',
              value: '3',
            },
            {
              text: '2℃',
              value: '2',
            },
            {
              text: '1℃',
              value: '1',
            },
            {
              text: '0℃',
              value: '0',
            },
            {
              text: '-1℃',
              value: '-1',
            },
            {
              text: '-2℃',
              value: '-2',
            },
            {
              text: '-3℃',
              value: '-3',
            },
            {
              text: '-4℃',
              value: '-4',
            },
            {
              text: '-5℃',
              value: '-5',
            },
            {
              text: '-6℃',
              value: '6',
            },
            {
              text: '-7℃',
              value: '-7',
            },
            {
              text: '-8℃',
              value: '-8',
            },
            {
              text: '-9℃',
              value: '-9',
            },
            {
              text: '-10℃',
              value: '-10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempCompensate_12_6.value}`);
            var result = parseInt(value.leftTempCompensate_12_6.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置

                  for (var i = 4; i <= 14; i++) {
                    dataSet[i] = this.arryComp[i];
                  }
                  // 设置左箱停机温补-12≤T≤-6℃
                  if (result >= 0) {
                    dataSet[15] = result;
                  } else {
                    dataSet[15] = result + 256;
                  }
                  for (var i = 16; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }

                  for (var i = 18; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 左箱温补T≤-12℃温补
  async leftTempCompensate_12() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempCompensate_12',
          options: [
            {
              text: '10℃',
              value: '10',
            },
            {
              text: '9℃',
              value: '9',
            },
            {
              text: '8℃',
              value: '8',
            },
            {
              text: '7℃',
              value: '7',
            },
            {
              text: '6℃',
              value: '6',
            },
            {
              text: '5℃',
              value: '5',
            },
            {
              text: '4℃',
              value: '4',
            },
            {
              text: '3℃',
              value: '3',
            },
            {
              text: '2℃',
              value: '2',
            },
            {
              text: '1℃',
              value: '1',
            },
            {
              text: '0℃',
              value: '0',
            },
            {
              text: '-1℃',
              value: '-1',
            },
            {
              text: '-2℃',
              value: '-2',
            },
            {
              text: '-3℃',
              value: '-3',
            },
            {
              text: '-4℃',
              value: '-4',
            },
            {
              text: '-5℃',
              value: '-5',
            },
            {
              text: '-6℃',
              value: '-6',
            },
            {
              text: '-7℃',
              value: '-7',
            },
            {
              text: '-8℃',
              value: '-8',
            },
            {
              text: '-9℃',
              value: '-9',
            },
            {
              text: '-10℃',
              value: '-10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempCompensate_12.value}`);
            var result = parseInt(value.leftTempCompensate_12.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置

                  for (var i = 4; i <= 15; i++) {
                    dataSet[i] = this.arryComp[i];
                  }
                  // 设置左箱箱T≤-12℃温补
                  if (result >= 0) {
                    dataSet[16] = result;
                  } else {
                    dataSet[16] = result + 256;
                  }
                  for (var i = 17; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }

                  for (var i = 18; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱温度回差
  async rightTempReturn() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempReturn',
          options: [
            {
              text: '1℃',
              value: '1',
            },
            {
              text: '2℃',
              value: '2',
            },
            {
              text: '3℃',
              value: '3',
            },
            {
              text: '4℃',
              value: '4',
            },
            {
              text: '5℃',
              value: '5',
            },
            {
              text: '6℃',
              value: '6',
            },
            {
              text: '7℃',
              value: '7',
            },
            {
              text: '8℃',
              value: '8',
            },
            {
              text: '9℃',
              value: '9',
            },
            {
              text: '10℃',
              value: '10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempReturn.value}`);
            var result = parseInt(value.rightTempReturn.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置
                  // dataSet[4] = 0x00; // UNLOCK/LOCK

                  for (var i = 4; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }

                  for (var i = 18; i <= 20; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }
                  // 设置右箱温度回差
                  dataSet[21] = result;
                  for (var i = 22; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("右箱温度回差指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("右箱温度回差指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("右箱温度回差指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("右箱温度回差指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱停机温补
  async rightTempCompensate() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempCompensate',
          options: [
            {
              text: '0℃',
              value: '0',
            },
            {
              text: '-1℃',
              value: '-1',
            },
            {
              text: '-2℃',
              value: '-2',
            },
            {
              text: '-3℃',
              value: '-3',
            },
            {
              text: '-4℃',
              value: '-4',
            },
            {
              text: '-5℃',
              value: '-5',
            },
            {
              text: '-6℃',
              value: '-6',
            },
            {
              text: '-7℃',
              value: '-7',
            },
            {
              text: '-8℃',
              value: '-8',
            },
            {
              text: '-9℃',
              value: '-9',
            },
            {
              text: '-10℃',
              value: '-10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempCompensate.value}`);
            var result = parseInt(value.rightTempCompensate.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置

                  for (var i = 4; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }

                  for (var i = 18; i <= 24; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  // 设置右箱停机补偿
                  if (result >= 0) {
                    dataSet[25] = result;
                  } else {
                    dataSet[25] = result + 256;
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("右箱停机补偿指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("右箱停机补偿指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("右箱停机补偿指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("右箱停机补偿指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱温补T≥-6℃温补
  async rightTempCompensate_6() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempCompensate_6',
          options: [
            {
              text: '10℃',
              value: '10',
            },
            {
              text: '9℃',
              value: '9',
            },
            {
              text: '8℃',
              value: '8',
            },
            {
              text: '7℃',
              value: '7',
            },
            {
              text: '6℃',
              value: '6',
            },
            {
              text: '5℃',
              value: '5',
            },
            {
              text: '4℃',
              value: '4',
            },
            {
              text: '3℃',
              value: '3',
            },
            {
              text: '2℃',
              value: '2',
            },
            {
              text: '1℃',
              value: '1',
            },
            {
              text: '0℃',
              value: '0',
            },
            {
              text: '-1℃',
              value: '-1',
            },
            {
              text: '-2℃',
              value: '-2',
            },
            {
              text: '-3℃',
              value: '-3',
            },
            {
              text: '-4℃',
              value: '-4',
            },
            {
              text: '-5℃',
              value: '-5',
            },
            {
              text: '-6℃',
              value: '-6',
            },
            {
              text: '-7℃',
              value: '-7',
            },
            {
              text: '-8℃',
              value: '-8',
            },
            {
              text: '-9℃',
              value: '-9',
            },
            {
              text: '-10℃',
              value: '-10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempCompensate_6.value}`);
            var result = parseInt(value.rightTempCompensate_6.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置

                  for (var i = 4; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }


                  for (var i = 18; i <= 21; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  // 设置右箱停机温补T≥-6℃
                  if (result >= 0) {
                    dataSet[22] = result;
                  } else {
                    dataSet[22] = result + 256;
                  }

                  for (var i = 23; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("右箱停机温补T≥-6℃指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("右箱停机温补T≥-6℃指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("右箱停机温补T≥-6℃指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("右箱停机温补T≥-6℃指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱温补-12≤T≤-6℃温补
  async rightTempCompensate_12_6() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempCompensate_12_6',
          options: [
            {
              text: '10℃',
              value: '10',
            },
            {
              text: '9℃',
              value: '9',
            },
            {
              text: '8℃',
              value: '8',
            },
            {
              text: '7℃',
              value: '7',
            },
            {
              text: '6℃',
              value: '6',
            },
            {
              text: '5℃',
              value: '5',
            },
            {
              text: '4℃',
              value: '4',
            },
            {
              text: '3℃',
              value: '3',
            },
            {
              text: '2℃',
              value: '2',
            },
            {
              text: '1℃',
              value: '1',
            },
            {
              text: '0℃',
              value: '0',
            },
            {
              text: '-1℃',
              value: '-1',
            },
            {
              text: '-2℃',
              value: '-2',
            },
            {
              text: '-3℃',
              value: '-3',
            },
            {
              text: '-4℃',
              value: '-4',
            },
            {
              text: '-5℃',
              value: '-5',
            },
            {
              text: '-6℃',
              value: '6',
            },
            {
              text: '-7℃',
              value: '-7',
            },
            {
              text: '-8℃',
              value: '-8',
            },
            {
              text: '-9℃',
              value: '-9',
            },
            {
              text: '-10℃',
              value: '-10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempCompensate_12_6.value}`);
            var result = parseInt(value.rightTempCompensate_12_6.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置

                  for (var i = 4; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }

                  for (var i = 18; i <= 22; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }
                  // 设置右箱停机温补-12≤T≤-6℃
                  if (result >= 0) {
                    dataSet[23] = result;
                  } else {
                    dataSet[23] = result + 256;
                  }


                  for (var i = 24; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("右箱停机温补-12≤T≤-6℃指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("右箱停机温补-12≤T≤-6℃指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("右箱停机温补-12≤T≤-6℃指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("右箱停机温补-12≤T≤-6℃指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱温补T≤-12℃温补
  async rightTempCompensate_12() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempCompensate_12',
          options: [
            {
              text: '10℃',
              value: '10',
            },
            {
              text: '9℃',
              value: '9',
            },
            {
              text: '8℃',
              value: '8',
            },
            {
              text: '7℃',
              value: '7',
            },
            {
              text: '6℃',
              value: '6',
            },
            {
              text: '5℃',
              value: '5',
            },
            {
              text: '4℃',
              value: '4',
            },
            {
              text: '3℃',
              value: '3',
            },
            {
              text: '2℃',
              value: '2',
            },
            {
              text: '1℃',
              value: '1',
            },
            {
              text: '0℃',
              value: '0',
            },
            {
              text: '-1℃',
              value: '-1',
            },
            {
              text: '-2℃',
              value: '-2',
            },
            {
              text: '-3℃',
              value: '-3',
            },
            {
              text: '-4℃',
              value: '-4',
            },
            {
              text: '-5℃',
              value: '-5',
            },
            {
              text: '-6℃',
              value: '-6',
            },
            {
              text: '-7℃',
              value: '-7',
            },
            {
              text: '-8℃',
              value: '-8',
            },
            {
              text: '-9℃',
              value: '-9',
            },
            {
              text: '-10℃',
              value: '-10',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempCompensate_12.value}`);
            var result = parseInt(value.rightTempCompensate_12.value);
            var data = new Uint8Array(6);
            data[0] = 0xFE; // 帧头
            data[1] = 0xFE; // 帧头
            data[2] = 0x03; // 数据长度
            data[3] = 0x01; // 查询设置
            data[4] = 0x02; // 校验和
            data[5] = 0x00; // 校验和

            // 发出查询指令
            this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
              data => {
                this.setStatus("查询指令发送成功！" + data);
              },
              error => {
                this.setStatus("查询指令发送失败！" + error);
              }
            );
            var count = 0;
            this.arryComp = new Uint8Array(36);
            this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
              buffer => {
                count = count + 1;
                var data = new Uint8Array(buffer[0]);
                if (count == 1) {
                  for (var i = 0; i < 20; i++) {
                    this.arryComp[i] = data[i]
                  }
                } else if (count == 2) {
                  for (var i = 0; i < 16; i++) {
                    this.arryComp[i + 20] = data[i]
                  }
                  this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
                  var dataSet = new Uint8Array(31);
                  dataSet[0] = 0xFE; // 帧头
                  dataSet[1] = 0xFE; // 帧头
                  dataSet[2] = 0x1C; // 数据长度
                  dataSet[3] = 0x02; // 设置

                  for (var i = 4; i <= 17; i++) {
                    dataSet[i] = this.arryComp[i];
                  }


                  for (var i = 18; i <= 23; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }
                  // 设置右箱T≤-12℃温补
                  if (result >= 0) {
                    dataSet[24] = result;
                  } else {
                    dataSet[24] = result + 256;
                  }
                  for (var i = 25; i <= 25; i++) {
                    dataSet[i] = this.arryComp[i + 4];
                  }

                  dataSet[26] = this.arryComp[33];
                  dataSet[27] = this.arryComp[32];
                  dataSet[28] = 0x00; // 预留

                  // 校验和
                  var checkSum = 0;
                  // 计算高位和低位的校验和
                  for (var i = 0; i <= 28; i++) {
                    checkSum = checkSum + dataSet[i];
                  }

                  dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
                  dataSet[30] = checkSum & 0x00FF; //校验和(低位)

                  // this.power= this.dataSet;
                  // document.getElementById('set').innerHTML='set'+dataSet.toString();
                  // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
                  // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

                  // 前二十个字节
                  var front = new Uint8Array(20);
                  for (var i = 0; i <= 19; i++) {
                    front[i] = dataSet[i];
                  }
                  // 后十一个字节
                  var behind = new Uint8Array(11);
                  for (var i = 0; i <= 10; i++) {
                    behind[i] = dataSet[i + 20];
                  }

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（20）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（20）发出失败" + error);
                    }
                  );

                  this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
                    data => {
                      // var data = new Uint8Array(buffer[0]);
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（11）发出成功！" + data);
                    },
                    error => {
                      this.setStatus("左箱停机温补-12≤T≤-6℃指令（11）发出失败" + error);
                    }

                  );
                  // 捕获设置的回复
                  this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
                  //  刷新页面
                  this.queryInfomation();


                }
                else {
                  // this.arryComp = this.arryComp.concat(data);

                }

              }
            );


          },
        },
      ],
    });
    await picker.present();

  }


  // 温度单位是华氏度下的设置***********************************
  // 最大控制范围
  maxTemperature_fah(e) {
    var result = parseInt(e.detail.value);
    var indexs = [];
    var values = [];
    indexs.push(9);
    values.push(result);
    this.sendInstructions(indexs, values);
  }

  // 最小控制范围
  minTemperature_fah(e) {
    var result = parseInt(e.detail.value);
    var indexs = [];
    var values = [];
    var compensate = 0;
    if (result < 0) {
      compensate = 256;
    }
    result = result + 256;
    indexs.push(10);
    values.push(result);
    this.sendInstructions(indexs, values);

  }


  // 左箱温度回差
  async leftTempReturn_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempReturn_fah',
          options: [
            {
              text: '2℉',
              value: '2',
            },
            {
              text: '3℉',
              value: '3',
            },
            {
              text: '4℉',
              value: '4',
            },
            {
              text: '5℉',
              value: '5',
            },
            {
              text: '6℉',
              value: '6',
            },
            {
              text: '7℉',
              value: '7',
            },
            {
              text: '8℉',
              value: '8',
            },
            {
              text: '9℉',
              value: '9',
            },
            {
              text: '10℉',
              value: '10',
            },
            {
              text: '11℉',
              value: '11',
            },
            {
              text: '12℉',
              value: '12',
            },
            {
              text: '13℉',
              value: '13',
            },
            {
              text: '14℉',
              value: '14',
            },
            {
              text: '15℉',
              value: '15',
            },
            {
              text: '16℉',
              value: '16',
            },
            {
              text: '17℉',
              value: '17',
            },
            {
              text: '18℉',
              value: '18',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempReturn_fah.value}`);
            var result = parseInt(value.leftTempReturn_fah.value);
            var indexs = [];
            var values = [];
            indexs.push(11);
            values.push(result);
            this.sendInstructions(indexs, values);


          },
        },
      ],
    });
    await picker.present();

  }

  // 左箱停机温补
  async leftTempCompensate_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempCompensate_fah',
          options: [
            {
              text: '-18℉',
              value: '-18',
            },
            {
              text: '-17℉',
              value: '-17',
            },
            {
              text: '-16℉',
              value: '-16',
            },
            {
              text: '-15℉',
              value: '-15',
            },
            {
              text: '-14℉',
              value: '-14',
            },
            {
              text: '-13℉',
              value: '-13',
            },
            {
              text: '-12℉',
              value: '-12',
            },
            {
              text: '-11℉',
              value: '-11',
            },
            {
              text: '-10℉',
              value: '-10',
            },
            {
              text: '-9℉',
              value: '-9',
            },
            {
              text: '-8℉',
              value: '-8',
            },
            {
              text: '-7℉',
              value: '-7',
            },
            {
              text: '-6℉',
              value: '-6',
            },
            {
              text: '-5℉',
              value: '-5',
            },
            {
              text: '-4℉',
              value: '-4',
            },
            {
              text: '-3℉',
              value: '-3',
            },
            {
              text: '-2℉',
              value: '-2',
            },
            {
              text: '-1℉',
              value: '-1',
            },
            {
              text: '0℉',
              value: '0',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempCompensate_fah.value}`);
            var result = parseInt(value.leftTempCompensate_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(17);
            values.push(result);
            this.sendInstructions(indexs, values);

          },
        },
      ],
    });
    await picker.present();

  }

  // 左箱温补T≥-6℃温补
  async leftTempCompensate_6_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempCompensate_6_fah',
          options: [
            {
              text: '-18℉',
              value: '-18',
            },
            {
              text: '-17℉',
              value: '-17',
            },
            {
              text: '-16℉',
              value: '-16',
            },
            {
              text: '-15℉',
              value: '-15',
            },
            {
              text: '-14℉',
              value: '-14',
            },
            {
              text: '-13℉',
              value: '-13',
            },
            {
              text: '-12℉',
              value: '-12',
            },
            {
              text: '-11℉',
              value: '-11',
            },
            {
              text: '-10℉',
              value: '-10',
            },
            {
              text: '-9℉',
              value: '-9',
            },
            {
              text: '-8℉',
              value: '-8',
            },
            {
              text: '-7℉',
              value: '-7',
            },
            {
              text: '-6℉',
              value: '-6',
            },
            {
              text: '-5℉',
              value: '-5',
            },
            {
              text: '-4℉',
              value: '-4',
            },
            {
              text: '-3℉',
              value: '-3',
            },
            {
              text: '-2℉',
              value: '-2',
            },
            {
              text: '-1℉',
              value: '-1',
            },
            {
              text: '0℉',
              value: '0',
            },
            {
              text: '1℉',
              value: '1',
            },
            {
              text: '2℉',
              value: '2',
            },
            {
              text: '3℉',
              value: '3',
            },
            {
              text: '4℉',
              value: '4',
            },
            {
              text: '5℉',
              value: '5',
            },
            {
              text: '6℉',
              value: '6',
            },
            {
              text: '7℉',
              value: '7',
            },
            {
              text: '8℉',
              value: '8',
            },
            {
              text: '9℉',
              value: '9',
            },
            {
              text: '10℉',
              value: '10',
            },
            {
              text: '11℉',
              value: '11',
            },
            {
              text: '12℉',
              value: '12',
            },
            {
              text: '13℉',
              value: '13',
            },
            {
              text: '14℉',
              value: '14',
            },
            {
              text: '15℉',
              value: '15',
            },
            {
              text: '16℉',
              value: '16',
            },
            {
              text: '17℉',
              value: '17',
            },
            {
              text: '18℉',
              value: '18',
            }


          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempCompensate_6_fah.value}`);
            var result = parseInt(value.leftTempCompensate_6_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(14);
            values.push(result);
            this.sendInstructions(indexs, values);
          },
        },
      ],
    });
    await picker.present();

  }

  // 左箱温补-12≤T≤-6℃温补
  async leftTempCompensate_12_6_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempCompensate_12_6_fah',
          options: [
            {
              text: '-18℉',
              value: '-18',
            },
            {
              text: '-17℉',
              value: '-17',
            },
            {
              text: '-16℉',
              value: '-16',
            },
            {
              text: '-15℉',
              value: '-15',
            },
            {
              text: '-14℉',
              value: '-14',
            },
            {
              text: '-13℉',
              value: '-13',
            },
            {
              text: '-12℉',
              value: '-12',
            },
            {
              text: '-11℉',
              value: '-11',
            },
            {
              text: '-10℉',
              value: '-10',
            },
            {
              text: '-9℉',
              value: '-9',
            },
            {
              text: '-8℉',
              value: '-8',
            },
            {
              text: '-7℉',
              value: '-7',
            },
            {
              text: '-6℉',
              value: '-6',
            },
            {
              text: '-5℉',
              value: '-5',
            },
            {
              text: '-4℉',
              value: '-4',
            },
            {
              text: '-3℉',
              value: '-3',
            },
            {
              text: '-2℉',
              value: '-2',
            },
            {
              text: '-1℉',
              value: '-1',
            },
            {
              text: '0℉',
              value: '0',
            },
            {
              text: '1℉',
              value: '1',
            },
            {
              text: '2℉',
              value: '2',
            },
            {
              text: '3℉',
              value: '3',
            },
            {
              text: '4℉',
              value: '4',
            },
            {
              text: '5℉',
              value: '5',
            },
            {
              text: '6℉',
              value: '6',
            },
            {
              text: '7℉',
              value: '7',
            },
            {
              text: '8℉',
              value: '8',
            },
            {
              text: '9℉',
              value: '9',
            },
            {
              text: '10℉',
              value: '10',
            },
            {
              text: '11℉',
              value: '11',
            },
            {
              text: '12℉',
              value: '12',
            },
            {
              text: '13℉',
              value: '13',
            },
            {
              text: '14℉',
              value: '14',
            },
            {
              text: '15℉',
              value: '15',
            },
            {
              text: '16℉',
              value: '16',
            },
            {
              text: '17℉',
              value: '17',
            },
            {
              text: '18℉',
              value: '18',
            }


          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempCompensate_12_6_fah.value}`);
            var result = parseInt(value.leftTempCompensate_12_6_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(15);
            values.push(result);
            this.sendInstructions(indexs, values);
          },
        },
      ],
    });
    await picker.present();

  }

  // 左箱温补T≤-12℃温补
  async leftTempCompensate_12_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'leftTempCompensate_12_fah',
          options: [
            {
              text: '-18℉',
              value: '-18',
            },
            {
              text: '-17℉',
              value: '-17',
            },
            {
              text: '-16℉',
              value: '-16',
            },
            {
              text: '-15℉',
              value: '-15',
            },
            {
              text: '-14℉',
              value: '-14',
            },
            {
              text: '-13℉',
              value: '-13',
            },
            {
              text: '-12℉',
              value: '-12',
            },
            {
              text: '-11℉',
              value: '-11',
            },
            {
              text: '-10℉',
              value: '-10',
            },
            {
              text: '-9℉',
              value: '-9',
            },
            {
              text: '-8℉',
              value: '-8',
            },
            {
              text: '-7℉',
              value: '-7',
            },
            {
              text: '-6℉',
              value: '-6',
            },
            {
              text: '-5℉',
              value: '-5',
            },
            {
              text: '-4℉',
              value: '-4',
            },
            {
              text: '-3℉',
              value: '-3',
            },
            {
              text: '-2℉',
              value: '-2',
            },
            {
              text: '-1℉',
              value: '-1',
            },
            {
              text: '0℉',
              value: '0',
            },
            {
              text: '1℉',
              value: '1',
            },
            {
              text: '2℉',
              value: '2',
            },
            {
              text: '3℉',
              value: '3',
            },
            {
              text: '4℉',
              value: '4',
            },
            {
              text: '5℉',
              value: '5',
            },
            {
              text: '6℉',
              value: '6',
            },
            {
              text: '7℉',
              value: '7',
            },
            {
              text: '8℉',
              value: '8',
            },
            {
              text: '9℉',
              value: '9',
            },
            {
              text: '10℉',
              value: '10',
            },
            {
              text: '11℉',
              value: '11',
            },
            {
              text: '12℉',
              value: '12',
            },
            {
              text: '13℉',
              value: '13',
            },
            {
              text: '14℉',
              value: '14',
            },
            {
              text: '15℉',
              value: '15',
            },
            {
              text: '16℉',
              value: '16',
            },
            {
              text: '17℉',
              value: '17',
            },
            {
              text: '18℉',
              value: '18',
            }


          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.leftTempCompensate_12_fah.value}`);
            var result = parseInt(value.leftTempCompensate_12_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(16);
            values.push(result);
            this.sendInstructions(indexs, values);
          },
        },
      ],
    });
    await picker.present();

  }
  // 右箱温度回差
  async rightTempReturn_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempReturn_fah',
          options: [
            {
              text: '2℉',
              value: '2',
            },
            {
              text: '3℉',
              value: '3',
            },
            {
              text: '4℉',
              value: '4',
            },
            {
              text: '5℉',
              value: '5',
            },
            {
              text: '6℉',
              value: '6',
            },
            {
              text: '7℉',
              value: '7',
            },
            {
              text: '8℉',
              value: '8',
            },
            {
              text: '9℉',
              value: '9',
            },
            {
              text: '10℉',
              value: '10',
            },
            {
              text: '11℉',
              value: '11',
            },
            {
              text: '12℉',
              value: '12',
            },
            {
              text: '13℉',
              value: '13',
            },
            {
              text: '14℉',
              value: '14',
            },
            {
              text: '15℉',
              value: '15',
            },
            {
              text: '16℉',
              value: '16',
            },
            {
              text: '17℉',
              value: '17',
            },
            {
              text: '18℉',
              value: '18',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempReturn_fah.value}`);
            var result = parseInt(value.rightTempReturn_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(21);
            values.push(result);
            this.sendInstructions(indexs, values);


          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱停机温补
  async rightTempCompensate_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempCompensate_fah',
          options: [
            {
              text: '-18℉',
              value: '-18',
            },
            {
              text: '-17℉',
              value: '-17',
            },
            {
              text: '-16℉',
              value: '-16',
            },
            {
              text: '-15℉',
              value: '-15',
            },
            {
              text: '-14℉',
              value: '-14',
            },
            {
              text: '-13℉',
              value: '-13',
            },
            {
              text: '-12℉',
              value: '-12',
            },
            {
              text: '-11℉',
              value: '-11',
            },
            {
              text: '-10℉',
              value: '-10',
            },
            {
              text: '-9℉',
              value: '-9',
            },
            {
              text: '-8℉',
              value: '-8',
            },
            {
              text: '-7℉',
              value: '-7',
            },
            {
              text: '-6℉',
              value: '-6',
            },
            {
              text: '-5℉',
              value: '-5',
            },
            {
              text: '-4℉',
              value: '-4',
            },
            {
              text: '-3℉',
              value: '-3',
            },
            {
              text: '-2℉',
              value: '-2',
            },
            {
              text: '-1℉',
              value: '-1',
            },
            {
              text: '0℉',
              value: '0',
            }

          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempCompensate_fah.value}`);
            var result = parseInt(value.rightTempCompensate_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(25);
            values.push(result);
            this.sendInstructions(indexs, values);

          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱温补T≥-6℃温补
  async rightTempCompensate_6_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempCompensate_6_fah',
          options: [
            {
              text: '-18℉',
              value: '-18',
            },
            {
              text: '-17℉',
              value: '-17',
            },
            {
              text: '-16℉',
              value: '-16',
            },
            {
              text: '-15℉',
              value: '-15',
            },
            {
              text: '-14℉',
              value: '-14',
            },
            {
              text: '-13℉',
              value: '-13',
            },
            {
              text: '-12℉',
              value: '-12',
            },
            {
              text: '-11℉',
              value: '-11',
            },
            {
              text: '-10℉',
              value: '-10',
            },
            {
              text: '-9℉',
              value: '-9',
            },
            {
              text: '-8℉',
              value: '-8',
            },
            {
              text: '-7℉',
              value: '-7',
            },
            {
              text: '-6℉',
              value: '-6',
            },
            {
              text: '-5℉',
              value: '-5',
            },
            {
              text: '-4℉',
              value: '-4',
            },
            {
              text: '-3℉',
              value: '-3',
            },
            {
              text: '-2℉',
              value: '-2',
            },
            {
              text: '-1℉',
              value: '-1',
            },
            {
              text: '0℉',
              value: '0',
            },
            {
              text: '1℉',
              value: '1',
            },
            {
              text: '2℉',
              value: '2',
            },
            {
              text: '3℉',
              value: '3',
            },
            {
              text: '4℉',
              value: '4',
            },
            {
              text: '5℉',
              value: '5',
            },
            {
              text: '6℉',
              value: '6',
            },
            {
              text: '7℉',
              value: '7',
            },
            {
              text: '8℉',
              value: '8',
            },
            {
              text: '9℉',
              value: '9',
            },
            {
              text: '10℉',
              value: '10',
            },
            {
              text: '11℉',
              value: '11',
            },
            {
              text: '12℉',
              value: '12',
            },
            {
              text: '13℉',
              value: '13',
            },
            {
              text: '14℉',
              value: '14',
            },
            {
              text: '15℉',
              value: '15',
            },
            {
              text: '16℉',
              value: '16',
            },
            {
              text: '17℉',
              value: '17',
            },
            {
              text: '18℉',
              value: '18',
            }


          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempCompensate_6_fah.value}`);
            var result = parseInt(value.rightTempCompensate_6_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(22);
            values.push(result);
            this.sendInstructions(indexs, values);
          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱温补-12≤T≤-6℃温补
  async rightTempCompensate_12_6_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempCompensate_12_6_fah',
          options: [
            {
              text: '-18℉',
              value: '-18',
            },
            {
              text: '-17℉',
              value: '-17',
            },
            {
              text: '-16℉',
              value: '-16',
            },
            {
              text: '-15℉',
              value: '-15',
            },
            {
              text: '-14℉',
              value: '-14',
            },
            {
              text: '-13℉',
              value: '-13',
            },
            {
              text: '-12℉',
              value: '-12',
            },
            {
              text: '-11℉',
              value: '-11',
            },
            {
              text: '-10℉',
              value: '-10',
            },
            {
              text: '-9℉',
              value: '-9',
            },
            {
              text: '-8℉',
              value: '-8',
            },
            {
              text: '-7℉',
              value: '-7',
            },
            {
              text: '-6℉',
              value: '-6',
            },
            {
              text: '-5℉',
              value: '-5',
            },
            {
              text: '-4℉',
              value: '-4',
            },
            {
              text: '-3℉',
              value: '-3',
            },
            {
              text: '-2℉',
              value: '-2',
            },
            {
              text: '-1℉',
              value: '-1',
            },
            {
              text: '0℉',
              value: '0',
            },
            {
              text: '1℉',
              value: '1',
            },
            {
              text: '2℉',
              value: '2',
            },
            {
              text: '3℉',
              value: '3',
            },
            {
              text: '4℉',
              value: '4',
            },
            {
              text: '5℉',
              value: '5',
            },
            {
              text: '6℉',
              value: '6',
            },
            {
              text: '7℉',
              value: '7',
            },
            {
              text: '8℉',
              value: '8',
            },
            {
              text: '9℉',
              value: '9',
            },
            {
              text: '10℉',
              value: '10',
            },
            {
              text: '11℉',
              value: '11',
            },
            {
              text: '12℉',
              value: '12',
            },
            {
              text: '13℉',
              value: '13',
            },
            {
              text: '14℉',
              value: '14',
            },
            {
              text: '15℉',
              value: '15',
            },
            {
              text: '16℉',
              value: '16',
            },
            {
              text: '17℉',
              value: '17',
            },
            {
              text: '18℉',
              value: '18',
            }


          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempCompensate_12_6_fah.value}`);
            var result = parseInt(value.rightTempCompensate_12_6_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(23);
            values.push(result);
            this.sendInstructions(indexs, values);
          },
        },
      ],
    });
    await picker.present();

  }

  // 右箱温补T≤-12℃温补
  async rightTempCompensate_12_fah() {
    const picker = await this.pickerCtrl.create({
      columns: [
        {
          name: 'rightTempCompensate_12_fah',
          options: [
            {
              text: '-18℉',
              value: '-18',
            },
            {
              text: '-17℉',
              value: '-17',
            },
            {
              text: '-16℉',
              value: '-16',
            },
            {
              text: '-15℉',
              value: '-15',
            },
            {
              text: '-14℉',
              value: '-14',
            },
            {
              text: '-13℉',
              value: '-13',
            },
            {
              text: '-12℉',
              value: '-12',
            },
            {
              text: '-11℉',
              value: '-11',
            },
            {
              text: '-10℉',
              value: '-10',
            },
            {
              text: '-9℉',
              value: '-9',
            },
            {
              text: '-8℉',
              value: '-8',
            },
            {
              text: '-7℉',
              value: '-7',
            },
            {
              text: '-6℉',
              value: '-6',
            },
            {
              text: '-5℉',
              value: '-5',
            },
            {
              text: '-4℉',
              value: '-4',
            },
            {
              text: '-3℉',
              value: '-3',
            },
            {
              text: '-2℉',
              value: '-2',
            },
            {
              text: '-1℉',
              value: '-1',
            },
            {
              text: '0℉',
              value: '0',
            },
            {
              text: '1℉',
              value: '1',
            },
            {
              text: '2℉',
              value: '2',
            },
            {
              text: '3℉',
              value: '3',
            },
            {
              text: '4℉',
              value: '4',
            },
            {
              text: '5℉',
              value: '5',
            },
            {
              text: '6℉',
              value: '6',
            },
            {
              text: '7℉',
              value: '7',
            },
            {
              text: '8℉',
              value: '8',
            },
            {
              text: '9℉',
              value: '9',
            },
            {
              text: '10℉',
              value: '10',
            },
            {
              text: '11℉',
              value: '11',
            },
            {
              text: '12℉',
              value: '12',
            },
            {
              text: '13℉',
              value: '13',
            },
            {
              text: '14℉',
              value: '14',
            },
            {
              text: '15℉',
              value: '15',
            },
            {
              text: '16℉',
              value: '16',
            },
            {
              text: '17℉',
              value: '17',
            },
            {
              text: '18℉',
              value: '18',
            }


          ],
        },
      ],
      buttons: [
        {
          text: 'cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: (value) => {
            window.alert(`You selected: ${value.rightTempCompensate_12_fah.value}`);
            var result = parseInt(value.rightTempCompensate_12_fah.value);
            var indexs = [];
            var values = [];
            var compensate = 0;
            // 如果值小于0则需要进行转换
            if (result < 0) {
              compensate = 256;
            }
            result = result + compensate;
            indexs.push(24);
            values.push(result);
            this.sendInstructions(indexs, values);
          },
        },
      ],
    });
    await picker.present();

  }





  // 模态框中的函数****************



  // 断开连接
  async deviceDisconnected() {
    let toast = await this.toastCtrl.create({
      message: '断开连接',
      duration: 1000,
      position: 'middle'
    });
    toast.present();

    // 清除存储在本地的设备信息
    this.nativeStorage.setItem('device', null)
      .then(
        () => console.log('Stored item!'),
        error => console.error('Error storing item', error)
      );

    // 断开蓝牙连接
    this.ble.disconnect(this.peripheral.id).then(
      () => console.log('Disconnected ' + JSON.stringify(this.peripheral)),
      () => console.log('ERROR disconnecting ' + JSON.stringify(this.peripheral))
    )

    // 跳转搜索设备的界面
    this.router.navigate(['/search']);


  }
  // 重新连接
  async reConnect() {
    this.ble.isConnected(this.id).then(
      success => {
        // 如果已经连接了，则无需其他操作
      },
      error => {
        // 若断开连接，则需重新连接
        this.connect();
      }
    );


  }


  // 锁定面板
  lock() {
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和

    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(31);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x1C; // 数据长度
          dataSet[3] = 0x02; // 设置
          // dataSet[4] = 0x00; // UNLOCK/LOCK

          if (this.arryComp[4] == 0x00) {
            dataSet[4] = 0x01;
          } else {
            dataSet[4] = 0x00;
          }


          for (var i = 5; i <= 17; i++) {
            dataSet[i] = this.arryComp[i];
          }

          for (var i = 18; i <= 25; i++) {
            dataSet[i] = this.arryComp[i + 4];
          }

          dataSet[26] = this.arryComp[33];
          dataSet[27] = this.arryComp[32];
          dataSet[28] = 0x00; // 预留

          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 28; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[30] = checkSum & 0x00FF; //校验和(低位)

          // this.power= this.dataSet;
          // document.getElementById('set').innerHTML='set'+dataSet.toString();
          // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
          // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

          // 前二十个字节
          var front = new Uint8Array(20);
          for (var i = 0; i <= 19; i++) {
            front[i] = dataSet[i];
          }
          // 后十一个字节
          var behind = new Uint8Array(11);
          for (var i = 0; i <= 10; i++) {
            behind[i] = dataSet[i + 20];
          }

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("锁定面板指令（20）发出成功！" + data);
            },
            error => {
              this.setStatus("锁定面板指令（20）发出失败" + error);
            }
          );

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("锁定面板指令（11）发出成功！" + data);
            },
            error => {
              this.setStatus("锁定面板指令（11）发出失败" + error);
            }

          );
          // 刷新页面
          this.queryInfomation();

        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }

      }
    );
  }

  // 设置节能模式
  ecoSet() {
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和

    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(31);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x1C; // 数据长度
          dataSet[3] = 0x02; // 设置
          dataSet[4] = this.arryComp[4]
          dataSet[5] = this.arryComp[5]

          if (this.arryComp[6] == 0x00) {
            dataSet[6] = 0x01;
          } else {
            dataSet[6] = 0x00;
          }

          for (var i = 7; i <= 17; i++) {
            dataSet[i] = this.arryComp[i];
          }

          for (var i = 18; i <= 25; i++) {
            dataSet[i] = this.arryComp[i + 4];
          }

          dataSet[26] = this.arryComp[33];
          dataSet[27] = this.arryComp[32];
          dataSet[28] = 0x00; // 预留

          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 28; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[30] = checkSum & 0x00FF; //校验和(低位)

          // this.power= this.dataSet;
          // document.getElementById('set').innerHTML='set'+dataSet.toString();
          // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
          // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

          // 前二十个字节
          var front = new Uint8Array(20);
          for (var i = 0; i <= 19; i++) {
            front[i] = dataSet[i];
          }
          // 后十一个字节
          var behind = new Uint8Array(11);
          for (var i = 0; i <= 10; i++) {
            behind[i] = dataSet[i + 20];
          }

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("节能指令（20）发出成功！" + data);
            },
            error => {
              this.setStatus("节能指令（20）发出失败" + error);
            }
          );

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("节能指令（11）发出成功！" + data);
            },
            error => {
              this.setStatus("节能指令（11）发出失败" + error);
            }

          );
          // 刷新页面
          this.queryInfomation();

        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }

      }
    );
  }

  // 设置电压模式
  voltageSet() {
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和

    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(31);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x1C; // 数据长度
          dataSet[3] = 0x02; // 设置
          dataSet[4] = this.arryComp[4]
          dataSet[5] = this.arryComp[5]
          dataSet[6] = this.arryComp[6]

          if (this.arryComp[7] == 0x00) {
            dataSet[7] = 0x01;
          } else if (this.arryComp[7] == 0x01) {
            dataSet[7] = 0x02;
          }
          else {
            dataSet[7] = 0x00;
          }

          for (var i = 8; i <= 17; i++) {
            dataSet[i] = this.arryComp[i];
          }

          for (var i = 18; i <= 25; i++) {
            dataSet[i] = this.arryComp[i + 4];
          }

          dataSet[26] = this.arryComp[33];
          dataSet[27] = this.arryComp[32];
          dataSet[28] = 0x00; // 预留

          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 28; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[30] = checkSum & 0x00FF; //校验和(低位)

          // this.power= this.dataSet;
          // document.getElementById('set').innerHTML='set'+dataSet.toString();
          // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
          // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

          // 前二十个字节
          var front = new Uint8Array(20);
          for (var i = 0; i <= 19; i++) {
            front[i] = dataSet[i];
          }
          // 后十一个字节
          var behind = new Uint8Array(11);
          for (var i = 0; i <= 10; i++) {
            behind[i] = dataSet[i + 20];
          }

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("电压指令（20）发出成功！" + data);
            },
            error => {
              this.setStatus("电压指令（20）发出失败" + error);
            }
          );

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("电压指令（11）发出成功！" + data);
            },
            error => {
              this.setStatus("电压指令（11）发出失败" + error);
            }

          );

          // 刷新页面
          this.queryInfomation();

        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }

      }
    );
  }



  onConnected(peripheral) {
    this.ngZone.run(() => {
      this.setStatus('连接成功！');
      this.peripheral = peripheral;
    });

    // 显示设备信息
    this.queryInfomation();
    // this.showInfo();
  }

  // 当温度条发生变化时
  onIonChange(ev: Event) {
    this.lastEmittedValue = (ev as RangeCustomEvent).detail.value;
    console.log(this.lastEmittedValue);
    // console.log(typeof((ev as RangeCustomEvent).detail.value));
    var tempSet=Number((ev as RangeCustomEvent).detail.value);
    // 判断是对左温箱还是右温箱进行设置
    var indexs=[];
    var values=[];
    if(this.house=='left-warehouse'){
      indexs.push(3);
      values.push(0x05);
      if(tempSet>=0){
       indexs.push(4);
       values.push(tempSet);
      }else{
        indexs.push(4);
       values.push(tempSet+256);
      }
    }else{
      indexs.push(3);
      values.push(0x06);
      if(tempSet>=0){
       indexs.push(4);
       values.push(tempSet);
      }else{
        indexs.push(4);
       values.push(tempSet+256);
      }
    }
    // 发送指令
    this.sendInstructions(indexs,values);

  }

  // 蓝牙连接连接失败的处理函数
  async onDeviceDisconnected(peripheral) {
    let toast = await this.toastCtrl.create({
      message: '连接失败',
      duration: 3000,
      position: 'middle'
    });
    toast.present();
    // 清除存储在本地的设备信息
    this.nativeStorage.setItem('device', null)
      .then(
        () => console.log('Stored item!'),
        error => console.error('Error storing item', error)
      );

    // 跳转搜索设备的界面
    this.router.navigate(['/search']);


  }



  readNotify() {
    console.log("read、notify！");

    this.ble.read(this.peripheral.id, SERVICE, READ_NOTIFY).then(
      buffer => {
        let data = new Uint8Array(buffer);
        console.log('dimmer characteristic ' + data[0]);
        this.ngZone.run(() => {
          this.read_notify = data;
          this.setStatus(data);
        });
      }, error => {
        this.setStatus("read_notify失败" + error);
      });

    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        var data = new Uint8Array(buffer);
        this.setStatus('读通知订阅成功' + data);
      },
      error => {
        this.setStatus("subscribe_read_notify失败" + error);
      }
    );

  }

  // 滑动设置温度
  slideSet(ev: Event) {
    this.lastEmittedValue = (ev as RangeCustomEvent).detail.value;
    console.log(this.lastEmittedValue);
  }




  // 与设备进行绑定
  bond() {
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x00; // 请求绑定
    data[4] = 0x01; // 校验和
    data[5] = 0xFF; // 校验和
    this.ble.write(this.peripheral.id, SERVICE, WRITE, data.buffer).then(
      data => {
        this.setStatus("绑定成功！" + data);
      },
      error => {
        this.setStatus("绑定失败失败" + error);
      }
    );

    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        var data = new Uint8Array(buffer[0]);
        this.setStatus('设备同意绑定' + data);
      },
      error => {
        this.setStatus("设备绑定失败" + error);
      }
    );


  }

  // 显示设备的信息
  showInfo() {
    this.queryInfomation();
    this.battery = this.infomation[0][19];//电量
    this.voltage = this.deviceInfo[1][0].toString() + '.' + this.deviceInfo[1][1].toString();//电压
    this.leftHouse = this.deviceInfo[0][18];//左箱温度
    this.rightHouse = this.deviceInfo[1][10];//右箱温度

    // 显示当前温度
    if (this.house == "left-warehouse") {
      this.temperature = this.leftHouse;
    } else {
      this.temperature = this.rightHouse;
    }
  }


  //查询
  queryInfomation() {
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和

    // 每次更新将以前的数据清零
    this.infomation = [];
    // this.battery = [];
    // this.voltage = [];
    // this.temperature = [];
    // this.leftHouse = [];
    // this.rightHouse = [];
    // this.rightHouseSet = [];
    // this.leftHouseSet = [];
    // this.leftRightSet = [];
    // // this.temperatureUnit=[];
    // this.workVoltage = [];
    // this.ecoModel = [];
    // this.isLock = [];
    // this.minTemperatureSet = [];
    // this.maxTemperatureSet = [];
    // this.powerBtnColor=[];
    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;

    var result = this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        this.onDeviceDiscovered(count, buffer);
      }

    );
    this.ngZone.run(() => {
      // // 将设备信息进行显示
      // this.battery = this.infomation[0][19];//电量
      // this.voltage = this.infomation[1][0].toString() + '.' + this.infomation[1][1].toString();//电压
      // this.leftHouse = this.infomation[0][18];//左箱温度
      // this.rightHouse = this.infomation[1][10];//右箱温度

      // // 显示当前温度
      // if(this.house=="left-warehouse"){
      //   this.temperature=this.leftHouse;
      // }else{
      //   this.temperature=this.rightHouse;
      // }
    })

    // var result = document.getElementById('infomation').innerHTML;

  }

  // 设备信息查询成功
  onDeviceDiscovered(count, buffer) {
    this.ngZone.run(() => {
      var data = new Uint8Array(buffer[0]);
      if (count == 1) {
        this.infomation.push(data);
      } else if (count == 2) {

        this.infomation.push(data);

        // 将设备信息进行显示
        // this.battery.push(this.infomation[0][19]);//电量
        if (this.battery.length != 0) {
          if (this.battery[0] != this.infomation[0][19]) {
            this.battery[0] = this.infomation[0][19];
          }
        } else {
          this.battery.push(this.infomation[0][19]);//电量
        }


        // this.voltage.push(this.infomation[1][0].toString() + '.' + this.infomation[1][1].toString());//电压
        if (this.voltage.length != 0) {
          if (this.voltage[0] != (this.infomation[1][0].toString() + '.' + this.infomation[1][1].toString())) {
            this.voltage[0] = (this.infomation[1][0].toString() + '.' + this.infomation[1][1].toString());
          }
        } else {
          this.voltage.push(this.infomation[1][0].toString() + '.' + this.infomation[1][1].toString());//电压
        }

        // 确定冰箱的温度单位
        if (this.infomation[0][13] == 0x00) {
          this.temperatureUnit = 'centigrade'
        } else[
          this.temperatureUnit = 'fahrenheit'
        ]

        // 根据℃温度单位进行显示
        if (this.infomation[0][18] <= 100) {
          // this.leftHouse.push(this.infomation[0][18]);//左箱温度
          if (this.leftHouse.length != 0) {
            if (this.leftHouse[0] != this.infomation[0][18]) {
              this.leftHouse[0] = this.infomation[0][18];
            }
          } else {
            this.leftHouse.push(this.infomation[0][18]);
          }

        } else {
          // this.leftHouse.push(this.infomation[0][18] - 256);//左箱温度
          if (this.leftHouse.length != 0) {
            if (this.leftHouse[0] != (this.infomation[0][18] - 256)) {
              this.leftHouse[0] = (this.infomation[0][18] - 256);
            }
          } else {
            this.leftHouse.push(this.infomation[0][18] - 256);
          }
        }

        if (this.infomation[1][10] <= 100) {
          // this.rightHouse.push(this.infomation[1][10]);//右箱温度
          if (this.rightHouse.length != 0) {
            if (this.rightHouse[0] != this.infomation[1][10]) {
              this.rightHouse[0] = this.infomation[1][10];
            }
          } else {
            this.rightHouse.push(this.infomation[1][10]);
          }

        } else {
          // this.rightHouse.push(this.infomation[1][10] - 256);//右箱温度
          if (this.rightHouse.length != 0) {
            if (this.rightHouse[0] != this.infomation[1][10] - 256) {
              this.rightHouse[0] = this.infomation[1][10] - 256;
            }
          } else {
            this.rightHouse.push(this.infomation[1][10] - 256);
          }

        }

        // 显示当前温度
        if (this.house == "left-warehouse") {
          // this.temperature.push(this.leftHouse);
          this.temperature = this.leftHouse;
        } else {
          // this.temperature.push(this.rightHouse);
          this.temperature = this.rightHouse;
        }

        if (this.infomation[0][8] <= 100) {
          // this.leftHouseSet.push(this.infomation[0][8]);//左箱设置温度
          if (this.leftHouseSet.length != 0) {
            if (this.leftHouseSet[0] != this.infomation[0][8]) {
              this.leftHouseSet[0] = this.infomation[0][8];
            }
          } else {
            this.leftHouseSet.push(this.infomation[0][8]);
          }
        } else {
          // this.leftHouseSet.push(this.infomation[0][8] - 256);//左箱设置温度
          if (this.leftHouseSet.length != 0) {
            if (this.leftHouseSet[0] != this.infomation[0][8] - 256) {
              this.leftHouseSet[0] = this.infomation[0][8] - 256;
            }
          } else {
            this.leftHouseSet.push(this.infomation[0][8] - 256);
          }
        }


        if (this.infomation[1][2] <= 100) {
          // this.rightHouseSet.push(this.infomation[1][2]);//右箱设置温度
          if (this.rightHouseSet.length != 0) {
            if (this.rightHouseSet[0] != this.infomation[1][2]) {
              this.rightHouseSet[0] = this.infomation[1][2];
            }
          } else {
            this.rightHouseSet.push(this.infomation[1][2]);
          }
        } else {
          // this.rightHouseSet.push(this.infomation[1][2] - 256);//右箱设置温度
          if (this.rightHouseSet.length != 0) {
            if (this.rightHouseSet[0] != this.infomation[1][2] - 256) {
              this.rightHouseSet[0] = this.infomation[1][2] - 256;
            }
          } else {
            this.rightHouseSet.push(this.infomation[1][2] - 256);
          }
        }

        // 显示当前（左/右）箱温度设置
        if (this.house == "left-warehouse") {
          // this.leftRightSet.push(this.leftHouseSet);
          this.leftRightSet = this.leftHouseSet;
        } else {
          // this.leftRightSet.push(this.rightHouseSet);
          this.leftRightSet = this.rightHouseSet;
        }

        // 温度控制范围(最大/最小)
        if (this.infomation[0][9] <= 100) {
          // this.maxTemperatureSet.push(this.infomation[0][9]);
          if (this.maxTemperatureSet.length != 0) {
            if (this.maxTemperatureSet[0] != this.infomation[0][9]) {
              this.maxTemperatureSet[0] = this.infomation[0][9];
            }
          } else {
            this.maxTemperatureSet.push(this.infomation[0][9]);
          }
        } else {
          // this.maxTemperatureSet.push(this.infomation[0][9] - 256);
          if (this.maxTemperatureSet.length != 0) {
            if (this.maxTemperatureSet[0] != this.infomation[0][9] - 256) {
              this.maxTemperatureSet[0] = this.infomation[0][9] - 256;
            }
          } else {
            this.maxTemperatureSet.push(this.infomation[0][9] - 256);
          }
        }
        if (this.infomation[0][10] <= 100) {
          // this.minTemperatureSet.push(this.infomation[0][10]);
          if (this.minTemperatureSet.length != 0) {
            if (this.minTemperatureSet[0] != this.infomation[0][10]) {
              this.minTemperatureSet[0] = this.infomation[0][10];
            }
          } else {
            this.minTemperatureSet.push(this.infomation[0][10]);
          }
        } else {
          // this.minTemperatureSet.push(this.infomation[0][10] - 256);
          if (this.minTemperatureSet.length != 0) {
            if (this.minTemperatureSet[0] != this.infomation[0][10] - 256) {
              this.minTemperatureSet[0] = this.infomation[0][10] - 256;
            }
          } else {
            this.minTemperatureSet.push(this.infomation[0][10] - 256);
          }
        }

        // 电池保护
        // this.workVoltage.push(this.infomation[0][7]);
        if (this.infomation[0][7] == 0x00) {
          // this.workVoltage.push('L');
          if (this.workVoltage.length != 0) {
            if (this.workVoltage[0] != 'L') {
              this.workVoltage[0] = 'L';
            }
          } else {
            this.workVoltage.push('L');
          }
        } else if (this.infomation[0][7] == 0x01) {
          // this.workVoltage.push('M');
          if (this.workVoltage.length != 0) {
            if (this.workVoltage[0] != 'M') {
              this.workVoltage[0] = 'M';
            }
          } else {
            this.workVoltage.push('M');
          }
        } else if (this.infomation[0][7] == 0x02) {
          // this.workVoltage.push('H');
          if (this.workVoltage.length != 0) {
            if (this.workVoltage[0] != 'H') {
              this.workVoltage[0] = 'H';
            }
          } else {
            this.workVoltage.push('H');
          }
        } else {
        }

        // 节能模式
        // this.ecoModel.push(this.infomation[0][6]);
        if (this.infomation[0][6] == 0x00) {
          // this.ecoModel.push('MAX');
          if (this.ecoModel.length != 0) {
            if (this.ecoModel[0] != 'MAX') {
              this.ecoModel[0] = 'MAX';
            }
          } else {
            this.ecoModel.push('MAX');
          }
        } else if (this.infomation[0][6] == 0x01) {
          // this.ecoModel.push('ECO');
          if (this.ecoModel.length != 0) {
            if (this.ecoModel[0] != 'ECO') {
              this.ecoModel[0] = 'ECO';
            }
          } else {
            this.ecoModel.push('ECO');
          }
        } else {
        }

        // 锁定面板
        // this.isLock.push(this.infomation[0][4])
        if (this.infomation[0][4] == 0x00) {
          // this.isLock.push('UNLOCK');
          if (this.isLock.length != 0) {
            if (this.isLock[0] != 'UNLOCK') {
              this.isLock[0] = 'UNLOCK';
            }
          } else {
            this.isLock.push('UNLOCK');
          }
        } else if (this.infomation[0][4] == 0x01) {
          // this.isLock.push('LOCK');
          if (this.isLock.length != 0) {
            if (this.isLock[0] != 'LOCK') {
              this.isLock[0] = 'LOCK';
            }
          } else {
            this.isLock.push('LOCK');
          }
        } else {
        }

        // 显示电源按钮的颜色
        if (this.infomation[0][5] == 0x00) {
          // this.powerBtnColor.push('medium');
          if (this.powerBtnColor.length != 0) {
            if (this.powerBtnColor[0] != 'medium') {
              this.powerBtnColor[0] = 'medium';
            }
          } else {
            this.powerBtnColor.push('medium');
          }
        } else {
          // this.powerBtnColor.push('primary');
          if (this.powerBtnColor.length != 0) {
            if (this.powerBtnColor[0] != 'primary') {
              this.powerBtnColor[0] = 'primary';
            }
          } else {
            this.powerBtnColor.push('primary');
          }
        }
      }


      else {
        // this.arryComp = this.arryComp.concat(data);

      }
    });
  }


  // 切换左右箱
  leftClick() {
    this.queryInfomation();
    // 在温度条上显示左箱的设置温度
    this.lastEmittedValue=this.leftHouseSet[0];
  }
  rightClick() {
    this.queryInfomation();
      // 在温度条上显示左箱的设置温度
      this.lastEmittedValue=this.rightHouseSet[0];
  }



  // 温度调高调低
  plus() {
    // 如果上一次函数还没有执行完，等待上一次的执行，本次不执行
    if(this.lockCtr==1){
      return;
    }
    // 给本次操作加上锁
    this.lockCtr=1;
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和
    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(7);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x04; // 数据长度

          // 温度设置的范围不能超出最大/最小温度范围
          if (this.house == 'left-warehouse') {
            dataSet[3] = 0x05;
            // 温度大于等于0℃
            if (this.arryComp[8] < 100) {

              if (this.arryComp[8] >= this.arryComp[9]) {
                 //解锁操作
              this.lockCtr=0;
                // 达到设置的最大温度，不进行响应
                return;
                // dataSet[4] = this.arryComp[8];
              } else {
                dataSet[4] = this.arryComp[8] + 1;
              }
            } else {
              // 温度小于0℃
              dataSet[4] = this.arryComp[8] + 1;
            }

          }
          else {
            dataSet[3] = 0x06;
            if (this.arryComp[22] < 100) {
              if (this.arryComp[22] >= this.arryComp[9]) {
                 //解锁操作
                this.lockCtr=0;
                // 达到设置的最大温度，不进行响应
                return;
                // dataSet[4] = this.arryComp[22];
              } else {
                dataSet[4] = this.arryComp[22] + 1;
              }
            } else {
              // 温度小于0℃
              dataSet[4] = this.arryComp[22] + 1;
            }

          }


          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 4; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[5] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[6] = checkSum & 0x00FF; //校验和(低位)

          // this.power= this.dataSet;
          // document.getElementById('set').innerHTML='set'+dataSet.toString();
          // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
          // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];


          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, dataSet.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("温度设置+1成功！" + data);
              // 解锁操作
              this.lockCtr=0;

            },
            error => {
              this.setStatus("温度设置+1失败" + error);
              //解锁操作
              this.lockCtr=0;
            }

          );

          // 捕获设置的回复
          this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
          //  刷新页面
          this.queryInfomation();


        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }
      }
    );

  }

   minus() {
        // 如果上一次函数还没有执行完，等待上一次的执行，本次不执行
    if(this.lockCtr==1){
      return;
    }
    // 给本次操作加上锁
    this.lockCtr=1;
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和

    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(7);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x04; // 数据长度

          // 温度设置的范围不能超出最大/最小温度范围
          if (this.house == 'left-warehouse') {
            dataSet[3] = 0x05;
            // 温度小于等于0℃
            if (this.arryComp[8] > 100) {

              if (this.arryComp[8] > this.arryComp[10]) {
                dataSet[4] = this.arryComp[8] - 1;
              } else {
                 //解锁操作
              this.lockCtr=0;
                // 达到设置的最小温度，不进行响应
                return;
                // dataSet[4] = this.arryComp[8];
              }
            } else {
              // 温度大于0℃
              dataSet[4] = this.arryComp[8] - 1;
            }

          }
          else {
            dataSet[3] = 0x06;
            if (this.arryComp[22] > 100) {
              if (this.arryComp[22] > this.arryComp[10]) {
                dataSet[4] = this.arryComp[22] - 1;
              } else {
                 //解锁操作
                this.lockCtr=0;
                // dataSet[4] = this.arryComp[22];
                // 达到设置的最小温度，不进行响应
                return;
              }
            } else {
              // 温度小于0℃
              dataSet[4] = this.arryComp[22] - 1;
            }

          }


          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 4; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[5] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[6] = checkSum & 0x00FF; //校验和(低位)

          // this.power= this.dataSet;
          // document.getElementById('set').innerHTML='set'+dataSet.toString();
          // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
          // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];


          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, dataSet.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("温度设置-1成功！" + data);
              // 解锁操作
              this.lockCtr=0;
            },
            error => {
              this.setStatus("温度设置-1失败" + error);
               // 解锁操作
               this.lockCtr=0;
            }

          );
          // 捕获设置的回复
          this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
          //  刷新页面
          this.queryInfomation();
        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }

      }
    );
  }

  // 查询设备信息
  queryInfo() {
    var data = new Uint8Array(6);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x03; // 数据长度
    data[3] = 0x01; // 查询设置
    data[4] = 0x02; // 校验和
    data[5] = 0x00; // 校验和

    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("查询指令发送成功！" + data);
      },
      error => {
        this.setStatus("查询指令发送失败！" + error);
      }
    );
    var count = 0;
    this.arryComp = new Uint8Array(36);
    this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe(
      buffer => {
        count = count + 1;
        var data = new Uint8Array(buffer[0]);
        if (count == 1) {
          for (var i = 0; i < 20; i++) {
            this.arryComp[i] = data[i]
          }
        } else if (count == 2) {
          for (var i = 0; i < 16; i++) {
            this.arryComp[i + 20] = data[i]
          }
          this.setStatus('查询成功！' + data + '次数为' + count + "完整" + this.arryComp[0] + this.arryComp[1] + "时间戳" + Date.parse(new Date().toString()));
          var dataSet = new Uint8Array(31);
          dataSet[0] = 0xFE; // 帧头
          dataSet[1] = 0xFE; // 帧头
          dataSet[2] = 0x1C; // 数据长度
          dataSet[3] = 0x02; // 设置
          // dataSet[4] = 0x00; // UNLOCK/LOCK



          for (var i = 4; i <= 17; i++) {
            dataSet[i] = this.arryComp[i];
          }
          // 如果是开机了就关机，如果关机了就开机
          if (this.arryComp[5] == 0x00) {
            dataSet[5] = 0x01; // 1开机
          } else {
            dataSet[5] = 0x00; // 0关机
          }

          for (var i = 18; i <= 25; i++) {
            dataSet[i] = this.arryComp[i + 4];
          }

          dataSet[26] = this.arryComp[33];
          dataSet[27] = this.arryComp[32];
          dataSet[28] = 0x00; // 预留

          // 校验和
          var checkSum = 0;
          // 计算高位和低位的校验和
          for (var i = 0; i <= 28; i++) {
            checkSum = checkSum + dataSet[i];
          }

          dataSet[29] = (checkSum & 0xFF00) >> 8; //校验和（高位）
          dataSet[30] = checkSum & 0x00FF; //校验和(低位)

          // this.power= this.dataSet;
          // document.getElementById('set').innerHTML='set'+dataSet.toString();
          // document.getElementById('query').innerHTML='query'+this.arryComp.toString();
          // document.getElementById('checkSum').innerHTML='checkSum'+checkSum+' '+dataSet[29]+' '+dataSet[30];

          // 前二十个字节
          var front = new Uint8Array(20);
          for (var i = 0; i <= 19; i++) {
            front[i] = dataSet[i];
          }
          // 后十一个字节
          var behind = new Uint8Array(11);
          for (var i = 0; i <= 10; i++) {
            behind[i] = dataSet[i + 20];
          }

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, front.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("开关机指令（20）发出成功！" + data);
            },
            error => {
              this.setStatus("开关机指令（20）发出失败" + error);
            }
          );

          this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, behind.buffer).then(
            data => {
              // var data = new Uint8Array(buffer[0]);
              this.setStatus("开关机指令（11）发出成功！" + data);
            },
            error => {
              this.setStatus("开关机指令（11）发出失败" + error);
            }

          );

          // 捕获设置的回复
          this.ble.startNotification(this.peripheral.id, SERVICE, READ_NOTIFY).subscribe();
          //  刷新页面
          this.queryInfomation();

        }
        else {
          // this.arryComp = this.arryComp.concat(data);

        }

      }
    );

    return this.arryComp;

  }

  // 设备开机/关机
  onOff() {

    // this.queryInfo();
    var value;
    if (this.infomation[0][5] == 0x00) {
      value = 1;
    } else {
      value = 0;
    }
    var indexs = [];
    var values = [];
    indexs.push(5);
    values.push(value);

    this.sendInstructions(indexs, values);

  }

  // 发出温度设置指令
  write(temperature) {
    var data = new Uint8Array(7);
    data[0] = 0xFE; // 帧头
    data[1] = 0xFE; // 帧头
    data[2] = 0x04; // 数据长度
    data[3] = 0x05; // 0x05左箱温度设置，0x06右箱温度设置
    data[4] = 0x00; // 设置的温度
    data[5] = 0x00; // 校验和
    data[6] = 0x00; // 校验和
    if (this.house == "left-warehouse") {
      data[3] = 0x05;
    } else {
      data[3] = 0x06;
    }

    data[4] = temperature;
    // 校验和
    var checkSum = 0;
    // 计算高位和低位的校验和
    for (var i = 0; i <= 4; i++) {
      checkSum = checkSum + data[i];
    }

    data[5] = (checkSum & 0xFF00) >> 8; //校验和（高位）
    data[6] = checkSum & 0x00FF; //校验和(低位)

    // 发出查询指令
    this.ble.write(this.peripheral.id, SERVICE, WRITENOTIFY, data.buffer).then(
      data => {
        this.setStatus("温度设置指令发送成功！" + data);
      },
      error => {
        this.setStatus("温度设置指令发送失败！" + error);
      }
    );


  }

  writeNotify() {

  }

  // Disconnect peripheral when leaving the page
  ionViewWillLeave() {
    console.log('ionViewWillLeave disconnecting Bluetooth');

    // 离开页面蓝牙不断开
    // this.ble.disconnect(this.peripheral.id).then(
    //   () => console.log('Disconnected ' + JSON.stringify(this.peripheral)),
    //   () => console.log('ERROR disconnecting ' + JSON.stringify(this.peripheral))
    // )
  }

  // 每次进入该页面都会执行
  ionViewDidEnter() {
    console.log("我进来了");
    // 重新连接蓝牙
    this.reConnect();
    // 刷新页面数据
    this.queryInfomation();

  }

  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

}
