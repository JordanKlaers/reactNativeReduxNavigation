import { AsyncStorage } from 'react-native';

function pushUpdateState(args){
    if(args.nextState.bluetooth.allSavedDevices != args.state.allSavedDevices){
      var temp = Object.assign({}, args.state, {
        allSavedDevices: args.nextState.bluetooth.allSavedDevices
      });
      args.setState(temp, ()=>{
        args.forceUpdate();
      });
    }
    if(args.nextState.bluetooth.defaultDevice != args.state.defaultDevice) {
      var temp = Object.assign({}, args.state, {
        defaultDevice: args.nextState.bluetooth.defaultDevice
      });
      if(!args.state.allSavedDevices.includes(args.nextState.bluetooth.defaultDevice) && args.nextState.bluetooth.defaultDevice != ""){
        temp.allSavedDevices.push(args.nextState.bluetooth.defaultDevice);
      }
      args.setState(temp);
    }
    if(args.nextState.bluetooth.connectedToDevice != args.state.connectedToDevice) {
      var temp = Object.assign({}, this.state, {
        connectedToDevice: args.nextState.bluetooth.connectedToDevice
      });
      args.setState(temp, () => {
        args.forceUpdate();
      });
    }
    // if (args.nextState.waitedForScan != args.state.waitedForScan) {
    //     var temp = Object.assign({}, args.state, {
    //         waitedForScan: args.nextState.waitedForScan
    //     });
    //     args.setState(temp);
    // }

    // if(args.nextState.bluetooth.connectedToDevice == 'In Progress' && !args.state.waitedForScan) {
    //     var temp = Object.assign({}, args.state, {
    //         waitedForScan: true
    //     });
    //     args.setState(temp, ()=>{
    //         setTimeout(()=>{
    //             var temp = Object.assign({}, args.state, {
    //                 connectedToDevice: "no connection"
    //             });
    //             args.setState(temp, ()=>{
    //                 args.manager.stopDeviceScan();
    //             })
    //         },2000)
    //     })
    // }
}

function updateText(args) {
    var tempState = Object.assign({}, args.state, {
        textInput: args.input
    });
    args.setState(tempState);
}

function saveNewDevice(args){
    if(args.state.textInput != "" && !args.state.allSavedDevices.includes(args.state.textInput.toLowerCase().replace(/\s+/g, ''))) {
        args.dispatch(args.save(args.state.textInput.toLowerCase().replace(/\s+/g, '')))
    }
}

function removeDevice(args) {
    var tempState = Object.assign({}, args.state, {
        allSavedDevices: args.state.allSavedDevices.filter((deviceName)=>{
          return deviceName != args.name;
        })
      })
      args.setState(tempState, ()=> {
        args.dispatch(args.delete(args.name));
      })
}

function selectDefaultDevice(args) {
    AsyncStorage.setItem('defaultDevice', args.name)
    args.dispatch(args.set(args.name))
    console.log('clicked name to connect');
    args.tryToConnect(args.name);
}

function connectionStatus(connectToDevice) {
    if(connectToDevice === "In Progress"){
        return connectToDevice;
    }
    else {
        return connectToDevice ?  "Connected" : "No Connection";
    }
}

function tryToConnect(args, name) {
    console.log('trying to connect via  the bluetooth component');
    var deviceConnectionInfo = {};
    if(args.connectedToDevice != "Connected"){
      args.manager.startDeviceScan(null, null, (error, device) => {
        if(args.connectedToDevice != "In Progress"){
          args.dispatch(args.scan())
          var temp = Object.assign({}, this.state, {
            connectedToDevice: "In Progress"
          })
          args.setState(temp)
        }
        if (error) {
          return
        }
        console.log('searching for: ', name);
        if (device.name == name) {  //should be 'raspberrypi'
        console.log('we found it when scanning: ', device.name);
          var deviceObject = {};
          args.manager.stopDeviceScan();
          console.log('stopped scanning w/device id', device.id);
          args.manager.isDeviceConnected(device.id).then(function ugh(thing) {
             console.log(thing)
          });
          args.manager.connectToDevice(device.id)
          .then((device) => {
              console.log('1. connected');
            deviceObject = device;
            deviceConnectionInfo.device = device;
            return device.discoverAllServicesAndCharacteristics();
          })
          .then((device) => {
              console.log('2. discovery stuff');
            deviceConnectionInfo.deviceID = device.id
            return args.manager.servicesForDevice(device.id)
          })
          .then((services) => {
              console.log('3. service stuff');
            var service = null;
            for(let i=0; i<services.length; i++) {
              if(services[i].uuid == "00112233-4455-6677-8899-aabbccddeeff" && service == null){
                  console.log('found the service uuid');
                service = services[i].uuid
              }
            }
            deviceConnectionInfo.writeServiceUUID = service
            return args.manager.characteristicsForDevice(deviceConnectionInfo.deviceID, deviceConnectionInfo.writeServiceUUID)
          })
          .then((characteristic)=> {
            if (characteristic[0]) {
              deviceConnectionInfo.writeCharacteristicUUID = characteristic[0].uuid
              console.log('dispatching that we are connected');
              args.dispatch(args.save(deviceConnectionInfo, deviceObject))
              args.forceUpdate();
            }
            else {
              console.log("retrieving connection data failed when pairing with the device");
            }
          },
          (error) => {

          });
        }
      });
    }
}

export default {
    pushUpdateState,
    updateText,
    saveNewDevice,
    removeDevice,
    selectDefaultDevice,
    connectionStatus,
    tryToConnect
};