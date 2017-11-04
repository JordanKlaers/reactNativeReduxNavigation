import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button, StyleSheet, Text, View } from 'react-native';
import { NavigationActions, } from 'react-navigation';
import {
  saveConnectionData,
  saveBluetoothState,
  saveDeviceNameFROMStorage,
  onlyRedirectOnce,
  redirectForBluetoothConnection,
  scanInProgress,
  connected,
  triggered
} from '../actions'
import { AsyncStorage } from 'react-native';

const styles = StyleSheet.create({
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});


class Splash extends Component {

  constructor(props) {
    super(props)
    this.state = { localRedirectBool: true } ;
    this.manager = this.props.bluetooth.manager;
    this.currentBluetoothState = this.props.bluetooth.subscription;
    this.dispatch = this.props.navigation.dispatch;
    this.deviceNameFromStorage = this.props.bluetooth.deviceNameFromStorage
    this.nav = this.props.navigation.navigate
  }

  componentWillMount(){
    this.manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        if(this.currentBluetoothState == false || this.currentBluetoothState == null){
          this.currentBluetoothState = true;
          console.log("updating bluetooth state");
          this.dispatch(saveBluetoothState(this.currentBluetoothState))
        }
      }
      else {
        if(this.currentBluetoothState == true || this.currentBluetoothState == null){
          this.currentBluetoothState = false;
          console.log("updating bluetooth state");
          this.dispatch(saveBluetoothState(this.currentBluetoothState))
        }
      }
    }, true);

    AsyncStorage.getAllKeys().then((value)=>{
      if(value.includes('savedDeviceName')){
        AsyncStorage.getItem("savedDeviceName").then((name)=>{
          if(this.deviceNameFromStorage != name){
            this.dispatch(saveDeviceNameFROMStorage(name))
          }
        })
      }
      else{
        if(this.deviceNameFromStorage != "noSavedDeviceName"){
          this.dispatch(saveDeviceNameFROMStorage("noSavedDeviceName"))
        }
      }
      // return value
      }).catch((err)=>{

      })

  }
  componentDidUpdate(nextState){

    console.log("huh?----");
    console.log(nextState.bluetooth.shouldRedirect);
    console.log(this.state);


  }

  componentWillReceiveProps(nextState){
    console.log("NEXT STATE");
    console.log(nextState.bluetooth.shouldRedirect);
    if(nextState.bluetooth.shouldRedirect != this.state.localRedirectBool){
      this.state.localRedirectBool = nextState.bluetooth.shouldRedirect
      console.log("GOT CHANGED YO");
      this.setState({localRedirectBool: nextState.bluetooth.shouldRedirect})
    }

  }

  // componentWillReceiveProps(nextState){
  //   // console.log(nextState);
  //   if(!nextState.shouldRedirect){
  //     console.log("if I see this - we have already redirected");
  //   }
  //   if(nextState.bluetooth.scanAndConnect == true && nextState.shouldRedirect == true){
  //     setTimeout(()=>{
  //       console.log("connected and abuot to auto nav to controller");
  //       this.dispatch(NavigationActions.navigate({
  //         routeName: 'TabNav',
  //         action: NavigationActions.navigate({ routeName: 'controller'}),
  //         redirectKey: true
  //       }))
  //     },2000);
  //   }
  //   if(nextState.bluetooth.scanAndConnect == false){
  //     this.setState({status: "Engaging main thrusters"})
  //   }
  //   if(nextState.bluetooth.scanAndConnect == "In Progress"){
  //     this.setState({status: "Calibrating quantum fluxuations"})
  //   }
  //   if(nextState.bluetooth.scanAndConnect == true){
  //     this.setState({status: "Initiating warp drive"})
  //   }
  //   if(nextState.bluetooth.deviceNameFromStorage != null && nextState.bluetooth.bluetoothON_OFF != null){
  //
  //     if ( nextState.bluetooth.deviceNameFromStorage == "noSavedDeviceName" || nextState.bluetooth.bluetoothON_OFF == false && nextState.shouldRedirect == true){
  //       setTimeout(()=>{
  //         console.log("no deviceNameFromStorage or bluetooth is off and we havent redirected yet so now we ganna");
  //         console.log(nextState.shouldRedirect);
  //         this.dispatch(NavigationActions.navigate({
  //         routeName: 'TabNav',
  //         action: NavigationActions.navigate({ routeName: 'bluetooth'}),
  //         redirectKey: true
  //       }))},5000);
  //     }
  //     else if (nextState.bluetooth.bluetoothON_OFF == true && nextState.shouldRedirect == true){
  //       var deviceConnectionInfo = {}
  //       if(nextState.bluetooth.scanAndConnect == false){
  //           nextState.bluetooth.manager.startDeviceScan(null, null, (error, device) => {
  //
  //             if(nextState.bluetooth.scanAndConnect != "In Progress"){
  //               nextState.dispatch(scanInProgress(nextState))
  //             }
  //             if (error) {
  //
  //               return
  //             }
  //             if (device.name === nextState.bluetooth.deviceNameFromStorage) {  //should be 'raspberrypi'
  //             nextState.bluetooth.manager.stopDeviceScan();
  //             nextState.bluetooth.manager.connectToDevice(device.id)
  //             .then((device) => {
  //               deviceConnectionInfo.device = device;
  //               return device.discoverAllServicesAndCharacteristics();
  //             })
  //             .then((device) => {
  //               deviceConnectionInfo.deviceID = device.id
  //               return nextState.bluetooth.manager.servicesForDevice(device.id)
  //             })
  //             .then((services) => {
  //               deviceConnectionInfo.writeServiceUUID = services[2].uuid
  //               return nextState.bluetooth.manager.characteristicsForDevice(deviceConnectionInfo.deviceID, deviceConnectionInfo.writeServiceUUID)
  //             })
  //             .then((characteristic)=> {
  //
  //               deviceConnectionInfo.writeCharacteristicUUID = characteristic[0].uuid
  //               nextState.dispatch(saveConnectionData(deviceConnectionInfo))
  //             }, (error) => {
  //
  //             });
  //           }
  //         });
  //       }
  //
  //     }
  //     else if (nextState.shouldRedirect == true){
  //
  //       //TODO try to connect
  //
  //
  //       // setTimeout(()=>{this.dispatch(NavigationActions.navigate({
  //       //   routeName: 'TabNav',
  //       //   action: NavigationActions.navigate({ routeName: 'controller'}),
  //       //   redirectKey: true
  //       // }))},5000);
  //     }
  //   }
  // }




  navigationOptions = {
    header: null
  }
  magicalFunction(){
    this.dispatch(triggered(this.state))
  };

  render() {
    return (
      <View>
        <Text style={{margin: '40%'}}>{this.state.status}</Text>
        <Button onPress={()=>{this.magicalFunction()}
        } title="dispatch button"  />
      </View>
    );
  }
}
// {this.dispatch(
//   {
//     type: 'Redirect Is Triggered',
//     action: this.dispatch(NavigationActions.navigate({
//       routeName: 'Splash',
//       action: this.dispatch(NavigationActions.navigate({
//         routeName: 'TabNav',
//         action: NavigationActions.navigate({
//           routeName: 'bluetooth'
//         }),
//       }))
//     }))
//
//   }
// )}

Splash.propTypes = {
  dispatch: PropTypes.func.isRequired,
};
Splash.navigationOptions = {
  header: null
}

const mapStateToProps = state => ({
  myNav: state.NavReducer,
  bluetooth: state.BluetoothReducer
});

export default connect(mapStateToProps)(Splash);















// AsyncStorage.getItem('savedDeviceName').then((value)=>{
//   if (value !== null){
//   }
// }).catch((error) => {

// })
//
// var manager = Props.nav.manager
// var tempState = {};
// const subscription = manager.onStateChange((state) => {
//       if (state === 'PoweredOn') {


//           scanAndConnect();
//           // subscription.remove();
//       }
//       else {
//
//       }
//   }, true);
//
// var scanAndConnect = () => {
//
//   manager.startDeviceScan(null, null, (error, device) => {
//
//       if (error) {
//           return
//       }
//       if (device.name === 'raspberrypi') {
//           manager.stopDeviceScan();
//
//           manager.connectToDevice(device.id)
//               .then((device) => {
//                 tempState.device = device;
//                 return device.discoverAllServicesAndCharacteristics();
//               })
//               .then((device) => {
//                 tempState.deviceID = device.id
//                 return manager.servicesForDevice(device.id)
//               })
//               .then((services) => {
//
//                 tempState.writeServiceUUID = services[2].uuid
//
//                 return manager.characteristicsForDevice(tempState.deviceID, tempState.writeServiceUUID)
//               }).then((characteristic)=> {
//
//                 tempState.writeCharacteristicUUID = characteristic[0].uuid
//                 dispatch(saveConnectionData(tempState))
//               }, (error) => {

//               });
//       }
//   });
// }
//
