// JavaScript code for the BLE Scan example app.
// The code is inside a closure to avoid polluting the global scope.
;(function()
{

// Dictionary of found devices.
var devices = {}

// Timer that updates the displayed list of devices.
var updateTimer = null

function main()
{
  $(function()
  {
    // When document has loaded we attach FastClick to
    // eliminate the 300 ms delay on click events.
    FastClick.attach(document.body)

    // Event listener for Back button.
    $('.app-back').on('click', function() { history.back() })
  })

  // Event handler called when Cordova plugins have loaded.
  document.addEventListener(
    'deviceready',
    onDeviceReady,
    false)
}

function onDeviceReady()
{
  startScan();
  // Un-gray buttons.
  $('button.app-start-scan')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--green-A700')
  $('button.app-stop-scan')
    .removeClass('mdl-button--disabled')
    .addClass('mdl-color--deep-orange-900')

  // Attach event listeners.
  $('.app-start-scan').on('click', startScan)
  $('.app-stop-scan').on('click', stopScan)
}

function startScan()
{
  // Make sure scan is stopped.
  stopScan()

  // Start scan.
  evothings.ble.startScan(
    function(device)
    {
      // Device found. Sometimes an RSSI of +127 is reported.
      // We filter out these values here.
      if (device.rssi <= 0)
      {
        // Set timeStamp.
        device.timeStamp = Date.now()


        // Store device in table of found devices.
        devices[device.address] = device
      }
    },
    function(error)
    {
      showMessage('Scan error: ' + error)
      stopScan()
    }
  )

  // Start update timer.
  updateTimer = setInterval(updateDeviceList, 500)

  // Update UI.
  $('.mdl-progress').addClass('mdl-progress__indeterminate');
  showMessage('Scan started');
}

function stopScan()
{
  // Stop scan.
  evothings.ble.stopScan();

  // Clear devices.
  devices = {};

  // Stop update timer.
  if (updateTimer)
  {
    clearInterval(updateTimer);
    updateTimer = null;
  }

  // Update UI.
  $('.mdl-progress').removeClass('mdl-progress__indeterminate');
  $('.app-cards').empty();
  hideDrawerIfVisible();

}

function hideDrawerIfVisible()
{
  if ($('.mdl-layout__drawer').hasClass('mdl-layout__drawer is-visible'))
  {
    document.querySelector('.mdl-layout').MaterialLayout.toggleDrawer();
  }
}

function showMessage(message)
{
  document.querySelector('.mdl-snackbar').MaterialSnackbar.showSnackbar(
  {
    message: message
  });
}

function updateDeviceList()
{
  var timeNow = Date.now();

  var closest = -200;
  var add = '';
  var nearest = null;

  $.each(devices, function (key, device) {
    if (device.name == 'raspberrypi' && parseInt(device.rssi) > closest) {
      add = device.address;
      closest = device.rssi;
      nearest = device;
    }

  $('#currentAisle').text(add);
});

  $.each(devices, function(key, device)
  {
    // Only show devices that have been updated during the last 10 seconds.
    if (device.name == 'raspberrypi' && device.timeStamp + 10000 > timeNow)
    {
       //showMessage(device.rssi)
      if (device.address == add)
        //displayDevice(device);
      //else
        highlightDevice(device);
    }
    else
    {
      // Remove inactive device.
      removeDevice(device);
    }
  });


}

function highlightDevice(device) {
  //if (!deviceIsDisplayed(device))
    createAisle(device);
  //updateAisle(device)
}

function displayDevice(device)
{
  if (!deviceIsDisplayed(device))
  {
    createDevice(device);
  }

  updateDevice(device);
}

function deviceIsDisplayed(device)
{
  var deviceId = '#' + getDeviceDomId(device);
  return !!($(deviceId).length);
}

function updateDevice(device)
{
  // Map the RSSI value to a width in percent for the indicator.
  var distanceBarValue = 100; // Used when RSSI is zero or greater.
  if (device.rssi < -100) { distanceBarValue = 1; }
  else if (device.rssi < 0) { distanceBarValue = 100 + device.rssi; }

  var deviceId = '#' + getDeviceDomId(device);

  $(deviceId + ' .device-rssi')
    .text(device.rssi);

  $(deviceId + ' .device-distance-bar')
    .css('width', distanceBarValue + 'px');

  if (!device.advertisementData) return;


  $(deviceId + ' .device-address')
    .text(JSON.stringify(device.address));
  $(deviceId + ' .device-scanRecord')
    .text(JSON.stringify(device.scanRecord));
  $(deviceId + ' .device-kCBAdvDataLocalName')
    .text(device.advertisementData.kCBAdvDataLocalName);
  $(deviceId + ' .device-kCBAdvDataTxPowerLevel')
    .text(device.advertisementData.kCBAdvDataTxPowerLevel);
  $(deviceId + ' .device-kCBAdvDataIsConnectable')
    .text(device.advertisementData.kCBAdvDataIsConnectable);
  $(deviceId + ' .device-kCBAdvDataServiceUUIDs')
    .text(JSON.stringify(device.advertisementData.kCBAdvDataServiceUUIDs));
  delete device['address']
  delete device['rssi']
  delete device['scanRecord']
  $(deviceId + ' .device-kCBAdvDataServiceData')
    .text(JSON.stringify(device))

}

function createDevice(device)
{
  // Create HTML element to display device data.
  var domId = getDeviceDomId(device);
  var element = $(
    '<div id="' + domId + '" class="mdl-card mdl-card--border mdl-shadow--2dp">'
      + '<div class="mdl-card__title">'
      + '<h2 class="mdl-card__title-text">Device: ' + device.name + '</h2>'
    +  '</div>'
    +  '<div class="mdl-card__supporting-text">'
    +    'Address: <span class="device-address"></span><br>'
    +    'RSSI: <span class="device-rssi"></span><br>'
    +     '<div class="device-distance-bar" style="width:0px;height:10px;margin-top:20px;background:rgb(200,200,0)"></div>'
    +  '</div>'
    + '</div>')

  // Add element.
  $('.app-cards').append(element)
}

function createAisle(device)
{
  // Create HTML element to display device data.
  var domId = getDeviceDomId(device);
  var element = $(
    '<div id="' + domId + '" class="mdl-card mdl-card--border mdl-shadow--2dp">'
      + '<div class="mdl-card__title">'
      + '<h2 class="mdl-card__title-text">Aisle: ' + device.name + '</h2>'
    +  '</div>'
    +  '<div class="mdl-card__supporting-text">'
    +    'Address: <span class="device-address">' + device.address + '</span><br>'
    +    'RSSI: <span class="device-rssi"></span><br>'
    +     '<div class="device-distance-bar" style="width:0px;height:10px;margin-top:20px;background:rgb(200,200,0)"></div>'
    +  '</div>'
    + '</div>')

  // Add element.
  $('.app-cards').append(element)
}

function removeDevice(device)
{
  // Remove from UI.
  var deviceId = '#' + getDeviceDomId(device)
  $(deviceId).remove()

  // Delete from model.
  delete devices[devices.address]
}

function getDeviceDomId(device)
{
  return 'device-dom-id-' + device.address.replace(/:/g, "_")
}

main()

})();
