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
    this.state = {                      //should be just the ones that i need to worry about changing
      localRedirectBool: true,
      manager: this.props.bluetooth.manager,
      currentBluetoothState: this.props.bluetooth.subscription || null,
      deviceName: this.props.bluetooth.deviceNameFromStorage || null,
      dispatch: this.props.navigation.dispatch,
      initiatedSetTimeout: false,
      connectedToDevice: false
    }
  }

  componentWillMount(){
    console.log("component Will Mount");
    this.state.manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        if(this.state.currentBluetoothState == false || this.state.currentBluetoothState == null){
          this.state.currentBluetoothState = true;
          this.state.dispatch(saveBluetoothState(this.state.currentBluetoothState))
        }
      }
      else {
        if(this.state.currentBluetoothState == true || this.state.currentBluetoothState == null){
          this.state.currentBluetoothState = false;
          this.state.dispatch(saveBluetoothState(this.state.currentBluetoothState))
        }
      }
    }, true);

    AsyncStorage.getAllKeys().then((value)=>{
      if(value.includes('savedDeviceName')){
        AsyncStorage.getItem("savedDeviceName").then((name)=>{
          if(this.state.deviceNameFromStorage != name){
            this.state.dispatch(saveDeviceNameFROMStorage(name))
          }
        })
      }
      else{
        if(this.deviceNameFromStorage != "noSavedDeviceName"){
          this.state.dispatch(saveDeviceNameFROMStorage({name:"noSavedDeviceName"}))
        }
      }
      }).catch((err)=>{

      })
  }

  componentDidUpdate(state){
    var redirectBool = this.state.localRedirectBool
    var connectedToDevice = this.state.connectedToDevice
    var deviceName = this.state.deviceName
    var bluetoothON_OFF = state.bluetooth.bluetoothON_OFF
    var manager = state.bluetooth.manager

    if(redirectBool){ //are we still on splash page
      if(connectedToDevice){  //are we connected to the device
        console.log("on splash page and connected to the device");

        if(this.state.initiatedSetTimeout == false){
          console.log("connected to device but have not initiated redirect");
          var tempState = Object.assign({}, this.state, {
            initiatedSetTimeout: true
          });
          this.setState(tempState, ()=>{
            console.log("initiaed redirect");
            setTimeout(()=>{
              {this.state.dispatch({
                type: 'Redirect Is Triggered',
                action: this.state.dispatch(NavigationActions.navigate({
                  routeName: 'controller'
                }))
              })}
            },2000);

          })
        }




      }
      else {
        if(deviceName != null && bluetoothON_OFF != null && deviceName !=  "noSavedDeviceName" && bluetoothON_OFF != false){ // if we have a device name and bluetooth is on try to connect
          this.tryToConnect(deviceName, connectedToDevice, manager)
        }
        else if((deviceName ==  "noSavedDeviceName" && bluetoothON_OFF != null) || (deviceName != null && bluetoothON_OFF == false)){
          if(this.state.initiatedSetTimeout == false){
            console.log("locally initiate redirect for bluetooth tab");
            var tempState = Object.assign({}, this.state, {
              initiatedSetTimeout: true
            });
            this.setState(tempState, ()=>{
              console.log("initiated redirect to bluetooth");
              setTimeout(()=>{
                {this.state.dispatch({
                  type: 'Redirect Is Triggered',
                  action: this.state.dispatch(NavigationActions.navigate({
                    routeName: 'bluetooth'
                  }))
                })}
              },2000);

            })
          }
          // console.log(this.state);
          // console.log("device name", deviceName);
          // console.log("bluetoothON_OFF", bluetoothON_OFF);

        }

      }
    }
    else {
      // console.log("if I see this - we have already redirected but splash is getting updated");
    }

  }

  componentWillReceiveProps(nextState){
    if(nextState.bluetooth.shouldRedirect != this.state.localRedirectBool){
      console.log("locally updating that we have redirected");
      this.setState({localRedirectBool: nextState.bluetooth.shouldRedirect})
    }
    // console.log(nextState);
    if(nextState.bluetooth.deviceNameFromStorage != this.state.deviceName){
      console.log("device name dont match so updating");
      // console.log(this.state.deviceName);
      var tempState = Object.assign({}, this.state, {
        deviceName: nextState.bluetooth.deviceNameFromStorage
      });
      this.setState(tempState)
    }
    if(nextState.bluetooth.bluetoothON_OFF != this.state.bluetoothON_OFF){
      console.log("locally updating buetooth state");
      var tempState = Object.assign({}, this.state, {
        bluetoothON_OFF: nextState.bluetooth.bluetoothON_OFF
      });
      this.setState(tempState)
    }

    if(nextState.bluetooth.connectedToDevice != this.state.connectedToDevice){
      console.log("locally updating device connection status");
      var tempState = Object.assign({}, this.state, {
        connectedToDevice: nextState.bluetooth.connectedToDevice
      });
      this.setState(tempState)
    }

  }


  tryToConnect = (deviceName, connectedToDevice, manager)=>{
    var deviceConnectionInfo = {};
    manager.startDeviceScan(null, null, (error, device) => {
      if(connectedToDevice != "In Progress"){
        this.state.dispatch(scanInProgress())
      }
      if (error) {
        return
      }
      if (deviceName === this.state.deviceName) {  //should be 'raspberrypi'
        manager.stopDeviceScan();
        manager.connectToDevice(device.id)
        .then((device) => {
          deviceConnectionInfo.device = device;
          return device.discoverAllServicesAndCharacteristics();
        })
        .then((device) => {
          deviceConnectionInfo.deviceID = device.id
          return manager.servicesForDevice(device.id)
        })
        .then((services) => {
          deviceConnectionInfo.writeServiceUUID = services[2].uuid
          return manager.characteristicsForDevice(deviceConnectionInfo.deviceID, deviceConnectionInfo.writeServiceUUID)
        })
        .then((characteristic)=> {
          deviceConnectionInfo.writeCharacteristicUUID = characteristic[0].uuid
          this.state.dispatch(saveConnectionData(deviceConnectionInfo))
        },
        (error) => {

        });
      }
    });
  }

  //

  navigationOptions = {
    header: null
  }


  render() {
    return (
      <View>
        <Text style={{margin: '40%'}}>{this.state.status}</Text>
        <Button onPress={()=>{
          {this.state.dispatch({
            type: 'Redirect Is Triggered',
            action: this.state.dispatch(NavigationActions.navigate({
              routeName: 'bluetooth'
            }))
          })}
        }} title="dispatch button"  />
      </View>
    );
  }
}


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
