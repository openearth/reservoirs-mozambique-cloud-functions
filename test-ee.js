const ee = require('@google/earthengine');

const PRIVATE_KEY = require('./privatekey.json');

console.log('before initialize')

ee.data.authenticateViaPrivateKey(PRIVATE_KEY, () => {
    console.log('auth')

    ee.initialize(null, null, () => {

        console.log('initialized')
        console.log(ee.Image().getInfo())
    });
});