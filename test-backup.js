// Imports the Google Cloud client library
const {Storage} = require('@google-cloud/storage');
const {path} = require('path');

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = './privatekey.json'

  // Copies the file to the other bucket
const srcBucketName = 'mz-reservoir-data';
const srcFilename = 'Massingir_WL.geojson';
const destBucketName = 'mz-reservoir-data';
const destFilename = 'COPY.json';
const storage = new Storage();

async function copyFile() {
    // Copies the file to the other bucket
    await storage
      .bucket(srcBucketName)
      .file(srcFilename)
      .copy(storage.bucket(destBucketName).file(destFilename));
  
    console.log(
      `gs://${srcBucketName}/${srcFilename} copied to gs://${destBucketName}/${destFilename}.`
    );
  }
  
  copyFile().catch(console.error);








