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
 let HistoricalDates2 = [ [ 1602692586000, 76.79519570823453 ],
 [ 1602731916000, 108.43771385888962 ],
 [ 1603125075000, 102.2641057039438 ],
 [ 1603250277000, 107.99940177155712 ] ]
 let array3 = HistoricalDates2.concat(ts).unique();
 
     



 let HistoricalDates = [4, 2, 10]
 let test = 2 * HistoricalDates
 console.log(test)
    // for(let i=0; i<ts.length; i++) {
    //         if(ts[i][0] == HistoricalDates){
    //             console.log('testing');
    //         }   
    //     }

    //     console.log(ts);
//    console.log(HistoricalDates)     
//     for(let i=0; i<ts.length; i++) {
//         let array_test = (ts[i][0])
//         console.log(array_test);
//         }
// array_total = array_test.push(array_test)
// console.log(array_total);

    // for(let i=0; i<ts.length; i++) {
      //  let total = array_test.filter(val => !HistoricalDates.includes(val))
      //  console.log(total)
    //         }   
    //     }
    //     console.log(array_test);
 //array4 = (array1[1][0])
 //let array3 = ts.filter(val => !HistoricalDates.includes(val));
// const arrayColumn = (arr, n) => arr.map(x => x[n]);
//console.log(i)





 //array2 = RemoveHist(array2, array1)
