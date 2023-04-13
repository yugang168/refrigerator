import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs';
import { RangeCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-test',
  templateUrl: './test.page.html',
  styleUrls: ['./test.page.scss'],
})
export class TestPage implements OnInit {
  testMsg:string="这是测试信息";
  cel=[];//八进制的表示的摄氏度
  cel_real=[];//十进制表示的摄氏度
  cel_fah_real=[];//八进制表示的摄氏度对应的华氏度
  cel_fah=[];//十进制表示的摄氏度对应的华氏度
  cel_all=[];//包含上述四个数组的数组

  fah=[];//八进制表示的华氏度
  fah_real=[];//十进制的华氏度
  fah_cel_real=[];//八进制表示的华氏度对应的摄氏度
  fah_cel=[];//十进制表示的华氏度对应的摄氏度
  fah_all=[];//包含上述四个数组的数组


  //  (-10℃, 10℃) /(-18℉, 18℉) 映射数组
  cel_set_real=[];
  cel_set=[]
  cel_fah_set_real=[];
  cel_fah_set=[];

  //(-18℉, 18℉)(-10℃, 10℃)  映射数组
  fah_set_real=[];
  fah_set=[]
  fah_cel_set_real=[];
  fah_cel_set=[];
  maxValue=20;
  minValue=-20;
  tempValue=0;


  constructor() {

    // 十六进制8位存储的摄氏度
    for(var i=236;i<=255;i++){
      this.cel.push(i);
   }
   for(var i=0;i<=20;i++){
      this.cel.push(i);
   }
   var item:any;
  //  实际温度
  for(var i=0;i<this.cel.length;i++){
    if(this.cel[i]>100){
      this.cel_real.push(this.cel[i]-256);
    }else{
      this.cel_real.push(this.cel[i]);
    }
  }
  //  摄氏度对应的华氏度
   for(var i=0;i<this.cel_real.length;i++){
      this.cel_fah_real.push(Math.round(32+1.8*this.cel_real[i]));
   }

  //  16进制8位存储的华氏度
  for(var i=0;i<this.cel_fah_real.length;i++){
    if(this.cel_fah_real[i]>=0){
      this.cel_fah.push(this.cel_fah_real[i]);
    }else{
      this.cel_fah.push(this.cel_fah_real[i]+256);
    }
    this.cel_all.push(this.cel);
    this.cel_all.push(this.cel_real);
    this.cel_all.push(this.cel_fah_real);
    this.cel_all.push(this.cel_fah);

  }

    // 十六进制8位存储的华氏度
    for(var i=252;i<=255;i++){
      this.fah.push(i);
    }
    for(var i=0;i<=68;i++){
      this.fah.push(i);
    }
    //  实际温度
    for(var i=0;i<this.fah.length;i++){
      if(this.fah[i]>100){
        this.fah_real.push(this.fah[i]-256);
      }else{
        this.fah_real.push(this.fah[i]);
      }
    }

      //  华氏度对应的摄氏度
   for(var i=0;i<this.fah_real.length;i++){
    this.fah_cel_real.push(Math.round((this.fah_real[i]-32)/1.8));
   }
 
  //  16进制8位存储的摄氏度
  for(var i=0;i<this.fah_cel_real.length;i++){
    if(this.fah_cel_real[i]>=0){
      this.fah_cel.push(this.fah_cel_real[i]);
    }else{
      this.fah_cel.push(this.fah_cel_real[i]+256);
    }
  }
    this.fah_all.push(this.fah);
    this.fah_all.push(this.fah_real);
    this.fah_all.push(this.fah_cel_real);
    this.fah_all.push(this.fah_cel);

  // var cel_set_real=[];
  // var cel_set=[]
  // var cel_fah_set_real=[];
  // var cel_fah_set=[];
  // 真实值
  for(var i=-10;i<=10;i++){
    this.cel_set_real.push(i)
  }
  for(var i=0;i<this.cel_set_real.length;i++){
    if(this.cel_set_real[i]<0){
      this.cel_set.push(this.cel_set_real[i]+256);
    }else{
      this.cel_set.push(this.cel_set_real[i]);
    }
  }
  for(var i=0;i<this.cel_set_real.length;i++){
    this.cel_fah_set_real[i]=this.cel_set_real[i]*2;
  }
  this.cel_fah_set_real[0]=-18;
  this.cel_fah_set_real[20]=18;
  for(var i=0;i<this.cel_fah_set_real.length;i++){
    if(this.cel_fah_set_real[i]<0){
      this.cel_fah_set.push(this.cel_fah_set_real[i]+256);
    }else{
      this.cel_fah_set.push(this.cel_fah_set_real[i]);
    }
  }

  // 真实值
  for(var i=-18;i<=18;i++){
    this.fah_set_real.push(i)
  }
  


}

  ngOnInit() {
  }

  test() {
    this.takeLongTime().then(v => { console.log("got", v); });
    console.log("我出现了》。。")
  }
  async test1() {
    const result = await this.takeLongTime();
    console.log("got", result);
    console.log("我也出现了》。。")
  }
  takeLongTime() {
    return new Promise(resolve => { setTimeout(() => resolve("long_time_value"), 5000); });
  }
  test2() {
    var devices = [];
    devices.push({ "name": "王大锤", "id": "5645456", "rename": "三万哥" });
    devices.push({ "name": "王大锤1", "id": "1", "rename": "三万哥1" });
    devices.push({ "name": "王大锤2", "id": "2", "rename": "三万哥2" });
    console.log(devices);
    alert("nihao");
  }
  
  inputChange(){
    console.log(this.testMsg);
  }

  onIonChange(ev: Event) {
    var result= (ev as RangeCustomEvent).detail.value;
    console.log(result);

  }
}
