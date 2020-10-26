const ee = require('@google/earthengine');
const PRIVATE_KEY = require('./privatekey.json');

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = './privatekey.json'

ee.data.authenticateViaPrivateKey(PRIVATE_KEY, () => {
  ee.initialize(null, null, () => {
    console.log('Exporting a single reservoir ...')
    const exportS1 = require('./exportS1');
    
    // let toConsole = (a) => { console.log(a) }
    exportS1.exportReservoirData('Massingir', (m) => {}, (m) => {})
  });
});
