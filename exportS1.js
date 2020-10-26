const fs = require('fs');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('mz-reservoir-data');

const ee = require('@google/earthengine');

const PRIVATE_KEY = require('./privatekey.json');

const { reservoirs } = require('./reservoirs');



// some test results:
/*
- original results show some weird peaks and drops, probably wrong results from algorithm
  first tests do indeed show that this is the case
  however, the drops are mostly caused by the data itself (wind effects?), so harder to fix...
  perhaps with some historic data, e.g. Bayesian updating? but that might be a bit too much for now...
- without initial threshold, directly on VV did not work well, gives agriculture or other areas in edges, multimodal histogram...
- smoothing seems to cause some issues, especially with the 'get only largest single water body' approach, as it can connect
  water outside of the reservoir to the reservoir, causing overestimation of reservoir area
  however, reducing the size of the smoothing causes other issues (patches within reservoir not properly smoothed, not picked up as water)
  so perhaps we should start using a 'real' SAR smoothing algorithm (e.g. Refined Lee)?
- using rectangular bounds instead of the more complex reservoir geometry did not seem to have a strong effect on results,
  so went back to using reservoir geometry (see function prepS1)
*/

// threshold for image inclusion, fraction cover of reservoir
var frac_cover = 1;

// threshold for preliminary water
var initThresh = -16;

// set threshold for when there's no data in histogram
var thresh_no_data = -20; // could also just use the maximum allowed threshold here, but this is more conservative/safe

// maximum allowed threshold
var maxThresh = -12; // have never actually seen this being crossed, but good to have in place just in case

// (pre)processing
var band = 'VV';
var smoothing = 100;
var connected_pixels = 200;
var edge_length = 100;
var smooth_edges = 300;
var scale = 20
var temporalSmoothingDays = 5

// canny edges
var canny_threshold = 1;
var canny_sigma = 1;
var canny_lt = 0.05;

// histogram
var reductionScale = 90; // higher value for quicker calculation, should probably be at highest resolution (10) for final product?
var maxBuckets = 255;

var minBucketWidth = 0.01; // currently unused (part is commented out)
var maxRaw = 1e6; // currently unused (part is commented out)

/***
 * Computes Otsu threshold
 */
function otsu(histogram) {
  // make sure histogram is an ee.Dictionary object
  histogram = ee.Dictionary(histogram);
  // extract relevant values into arrays
  var counts = ee.Array(histogram.get('histogram'));
  var means = ee.Array(histogram.get('bucketMeans'));
  // calculate single statistics over arrays
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);
  // compute between sum of squares, where each mean partitions the data
  var indices = ee.List.sequence(1, size);
  var bss = indices.map(function (i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans = means.slice(0, 0, i);
    var aMean = aMeans.multiply(aCounts)
      .reduce(ee.Reducer.sum(), [0]).get([0])
      .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(aMean.subtract(mean).pow(2)).add(
      bCount.multiply(bMean.subtract(mean).pow(2)));
  });
  // return the mean value corresponding to the maximum BSS
  return means.sort(bss).get([-1]);
}

/***
 * Gets image histogran, assummes clipped image
 */
function getHist(img) {
  // get preliminary water
  var binary = img.lt(initThresh).rename('binary');
  // get canny edges
  var canny = ee.Algorithms.CannyEdgeDetector(binary, canny_threshold, canny_sigma);
  // process canny edges
  var connected = canny.updateMask(canny).lt(canny_lt).connectedPixelCount(connected_pixels, true);
  var edges = connected.gte(edge_length);
  edges = edges.updateMask(edges);
  var edgeBuffer = edges.focal_max(smooth_edges, 'square', 'meters');
  // get histogram for Otsu
  var histogram_image = img.updateMask(edgeBuffer);
  var histogram = ee.Dictionary(histogram_image.reduceRegion({
    // reducer: ee.Reducer.histogram(maxBuckets, 2),
    // reducer: ee.Reducer.histogram(maxBuckets, minBucketWidth, maxRaw),
    reducer: ee.Reducer.histogram(maxBuckets),
    scale: reductionScale,
    bestEffort: true,
    maxPixels: 1e12
  }).get(band));
  return histogram;
}

/***
 * Returns threshold or null 
 */
function getThreshold(histogram) {
  // var threshold = otsu(histogram);  // does not work when there's no data in the histogram
  var threshold = ee.Number(ee.Algorithms.If(histogram.contains('bucketMeans'), otsu(histogram), thresh_no_data)); // works for no data cases
  return threshold;
}

/***
 * Temporal smoothing of every image given list of images to use for search and time window in days
 */
function TemporalSmoothing(images, days) {
  return function (image) {
    var t0 = image.date()
    var tStart = t0.advance(-days, 'day')
    var tStop = t0.advance(days, 'day')

    var images2 = images.filterDate(tStart, tStop)

    return images2.median()
      .copyProperties(image)
      .copyProperties(image, ['system:time_start'])
      .set({ imageCount: images2.size() })
  }
}

/***
 * Some clean-up
 * 
 * TODO: this is slow
 */
function prepS1(img) {
  // get nodata mask
  var nodata_mask = ee.Image(img).mask();
  // apply smoothing
  var S1_img = ee.Image(img).focal_median(smoothing, 'circle', 'meters');
  // apply nodata mask
  // S1_img = S1_img.updateMask(nodata_mask).clip(bounds);
  S1_img = S1_img.updateMask(nodata_mask).clip(reservoir_geom);
  return S1_img;
}

/***
 * Returns water from S1 image
 */
function getWater(img) {
  // prep image
  // img = prepS1(img);
  
  // get histogram
  var hist = getHist(img);
  
  // Otsu thresholding
  var thresh = getThreshold(hist);
  thresh = thresh.min(maxThresh);
  
  // get water
  var water = img.lt(thresh);
  
  return water;
}

/***
 * Returns largerst blob area
 */
function getLargestWaterArea(img) {
  // convert to vector
  var water_fc = img.updateMask(img).reduceToVectors({
    reducer: ee.Reducer.countEvery(),
    geometry: reservoir_geom,
    scale: 10,
    geometryType: 'polygon',
    eightConnected: true,
    labelProperty: 'water',
    // crs: ,
    // crsTransform: ,
    // bestEffort: ,
    maxPixels: 1e12,
    // tileScale: ,
    // geometryInNativeProjection: 
  });

  // calculate area of each object
  water_fc = water_fc.map(function (f) {
    return f.set('area', f.area(ee.ErrorMargin(10)));
  });
  
  // filter down to single object with largest area
  var max_area = water_fc.aggregate_max('area');
  max_area = ee.Algorithms.If(max_area, max_area, 0);
  
  return max_area;
}

/***
 * Computes surface water area for a single reservoir r
 */
function exportReservoirData(reservoir, resolve, reject) {
  console.log(`Exporting time series for: ${reservoir} ...`)

  let geom = reservoirs[reservoir]
  let scale = 30

  let images = ee.ImageCollection("COPERNICUS/S1_GRD")

  // define export time interval: [-15 days, now]
  let dateStop = ee.Date(new Date());
  let dateStart = dateStop.advance(-15, 'day');

  images = images.filterBounds(geom)
    .filterDate(dateStart, dateStop)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band))
    .select(band)

  // images = images.map(TemporalSmoothing(images, temporalSmoothingDays))

  let features = images.map(i => {
    let water = getWater(i)
    
    let area = water.multiply(ee.Image.pixelArea()).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: geom,
      scale: scale
    })

    area = ee.Number(area.values().get(0))

    // convert from m2 to km2
    area = area.divide(1e6); 

    return ee.Feature(null, {
      date: i.date().millis(),
      area: area
    })
  })

  features = ee.FeatureCollection(features)
  
  let times = features.aggregate_array('date')
  let area = features.aggregate_array('area')
  let timeSeries = times.zip(area)

  timeSeries.evaluate((timeSeries) => {
    // TODO: merge current time series with historical ...
    // 1. download time series from GS
    // 2. merge with current time series
    // 3. store merged results

    // mergeTimeSeries(ts1, timeSeries)

    console.log(timeSeries)

    let json = JSON.stringify(timeSeries)
    let filename = `/tmp/water-area-${reservoir}.json`

    fs.writeFile(filename, json, {
      flag: 'w'
    }, (err) => {
      if (err) {
        console.error(err)
        reject()
      }
    });

    const options = { destination: 'exported/' + filename.substring(5) }

    console.log(`Uploading ${filename} to storage bucket ...`)
    bucket.upload(filename, options, (err, file, apiResponse) => {
      if (err) {
        console.error(err)
        reject()
      }
    });

    resolve('Computed time series and uploaded to GS bucket')
  });
}

/***
 * Main export loop, export time series for every reservoir
 */
exports.exportTimeSeries = function (send) {
  return Object.keys(reservoirs).map((reservoir) => {
    return new Promise((resolve, reject) => {  
      exportReservoirData(reservoir, resolve, reject)
    })
  })
}

exports.exportReservoirData = exportReservoirData