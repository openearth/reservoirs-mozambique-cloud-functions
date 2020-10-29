const { SSL_OP_NO_TLSv1_1 } = require('constants');
const PRIVATE_KEY = require('./privatekey.json');
const ee = require('@google/earthengine');
const bucketName = 'mz-reservoir-data';
const srcFilename = 'Massingir_A.geojson';
const destFilename = '/tmp/download/Massingir_A.geojson';
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('mz-reservoir-data');

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i][0] === a[j][0])
                a.splice(j--, 1);
        }
    }

    return a;
};

 let ts = [ [ 1602692586001, 76.79519570823453 ],
 [ 1602731916002, 108.43771385888962 ],
 [ 1603125075000, 102.2641057039438 ]]
 let HistoricalDates = [ [ 1602692586000, 76.79519570823453 ],
 [ 1602731916000, 108.43771385888962 ],
 [ 1603125075000, 102.2641057039438 ],
 [ 1603250277000, 107.99940177155712 ] ]
 let array3 = HistoricalDates.concat(ts).unique();
 



 console.log(array3)
 
