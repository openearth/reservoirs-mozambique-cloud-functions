const ee = require('@google/earthengine');
const PRIVATE_KEY = require('./privatekey.json');

// for GS
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = './privatekey.json'

/**
 * HTTP Cloud Function to start export of reservoir time series
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
exports.exportReservoirTimeSeries = function exportReservoirTimeSeries(req, res) {
  // Enable CORS, allowing client in Cloud Storage to see response data.
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');

  ee.data.authenticateViaPrivateKey(PRIVATE_KEY, () => {
    ee.initialize(null, null, () => {
      const exportS1 = require('./exportS1');

      Promise.all(exportS1.exportTimeSeries()).then(() => {
        res.send('Uploaded all time series')
      })
    });
  });
};

exports.mergeTimeSeries = function mergeTimeSeries(req, res) {
  res.send('All time series are merged!')
};
