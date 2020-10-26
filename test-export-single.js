const ee = require('@google/earthengine');
const PRIVATE_KEY = require('./privatekey.json');

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = './privatekey.json'

ee.data.authenticateViaPrivateKey(PRIVATE_KEY, () => {
  ee.initialize(null, null, () => {
    const exportS1 = require('./exportS1');
    let toConsole = (a) => { console.log(a) }
    exportS1.exportReservoirData('Corumana', toConsole, toConsole)
  });
});

/*


const fetch = require('node-fetch');
let accessToken = fetch("https://observable-cors.glitch.me/https://us-central1-aqua-monitor.cloudfunctions.net/getAccessToken").then(response => {
  return response.text()
})

accessToken.then(token => {
    console.log(`Access token: ${token}`)

    ee.apiclient.setAuthToken('', 'Bearer', token, 3600, [], undefined, false);
    ee.apiclient.setCloudApiEnabled(true);
    console.log('initializing ...')
    ee.initialize(null, null, () => {

    const exportS1 = require('./exportS1');
    exportS1.exportReservoirData('Massingir')
  })
})
*/