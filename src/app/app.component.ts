import { Component,ViewChild ,Input} from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { IonModal } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import { NativeStorage } from '@awesome-cordova-plugins/native-storage/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  @ViewChild(IonModal) modal: IonModal;
  // 判断模态框是“我的冰箱”还是“使用说明”
  func:any;
  savedDevices:any;
  constructor(private storage: Storage,private nativeStorage: NativeStorage) {
    this.nativeStorage.getItem('connectedDevice')
    .then(
      (data) => {
      this.savedDevices=data;

      },
      error => console.error(error)
    );

  }

  async ngOnInit() {
    // If using a custom driver:
    // await this.storage.defineDriver(MyCustomDriver)
    await this.storage.create();
  }
  cancel() {
    console.log("点击了取消");
    this.modal.dismiss(null, '取消');
  }

  confirm() {
    console.log("点击了确定");
    this.modal.dismiss(null, '确定');
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      console.log(`Hello, ${ev.detail.data}!`);
    }
  }
  instructions(){
    this.func="instructions";
    this.nativeStorage.getItem('connectedDevice')
    .then(
      (data) => {
      this.savedDevices=data;

      },
      error => console.error(error)
    );
  }

  refrigerator(){
    this.func="refrigertor";
    this.nativeStorage.getItem('connectedDevice')
    .then(
      (data) => {
      this.savedDevices=data;

      },
      error => console.error(error)
    );
  }
  // rename(){
  //   this.func="rename";
  // }

}
