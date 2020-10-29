const { SSL_OP_NO_TLSv1_1 } = require('constants');
const PRIVATE_KEY = require('./privatekey.json');
const ee = require('@google/earthengine');
const srcFilename = 'Massingir_A.geojson';
const destFilename = '/tmp/download/Massingir_A.geojson';
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('mz-reservoir-data');

bucket.file(srcFilename).download({ destination: destFilename }, () => {

  // Read file
  console.log('Started reading data')
  const fs = require('fs')
  let rawdata = fs.readFileSync(destFilename);
  let historical = JSON.parse(rawdata);

  let ts = JSON.parse(fs.readFileSync('/tmp/water-area-Massingir.json'));
  // remove existing time stamps
 console.log('real time time series', ts)
  Array.prototype.unique = function () {
    var a = this.concat();
    for (var i = 0; i < a.length; ++i) {
      for (var j = i + 1; j < a.length; ++j) {
        if (a[i][0] === a[j][0])
          a.splice(j--, 1);
      }
    }

    return a;
  };

  let historicalDates = historical.features.map(f => f.properties.date)
  let historicalArea = historical.features.map(f => f.properties.area) 
  var historicaltimeSeries = historicalArea.map(function(e, i) {
    return [historicalDates[i],e];
  });
  // console.log('historical area', historicalArea)
  // console.log('historical dates', historicalDates)
  console.log('historical timeseries', historicaltimeSeries)

  // merge
  let all = historicaltimeSeries.concat(ts).unique()
  let features = all.map(o => { return { geometry: null, type: 'Feature', properties: { area: o[1], date: o[0] } } })

  let total = JSON.stringify(features)
  fs.writeFileSync('/tmp/final/water-area-Massingir-all.json', total)
});

