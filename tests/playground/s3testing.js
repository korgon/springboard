// awshit s3
// used for testing s3

// some sample objects
/*
{
  Key: 'ajax_search/sites/0yow0h/img/',
   LastModified: Mon Mar 04 2013 08:37:05 GMT-0700 (MST),
   ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
   Size: 0,
   StorageClass: 'STANDARD',
   Owner: [Object]
},
{
  Key: 'ajax_search/sites/0yow0h/img/toggleminus.png',
  LastModified: Mon Mar 04 2013 08:37:58 GMT-0700 (MST),
  ETag: '"ae178faf1eaea94fa470f553031001b2"',
  Size: 430,
  StorageClass: 'STANDARD',
  Owner: [Object]
}

*/
var fs = require('fs');
var AWS = require('aws-sdk');

var user = {
  name: 'anon',
  s3_key_id: 'PUT KEY HERE',
  s3_key_secret: 'PUT KEY HERE'
};

var options = {
  accessKeyId: user.s3_key_id,
  secretAccessKey: user.s3_key_secret,
  endpoint: 'https://s3.amazonaws.com',
  sslEnabled: true
};

var params = {
  Bucket: 'a.cdn.searchspring.net'
};

var s3 = new AWS.S3(options);

s3.getBucketLocation(params, function(err, data) {
  if (err) console.error(err);
  else {
    console.log('got something...');
    console.log(data);
  }
});

// // list the buckets
// s3.listBuckets(function(err, data) {
//   if (err) console.error(err);
//   else {
//     console.log(data);
//   }
// });



// // list the objects in the bucket
// var listparams = {
//   Bucket: 'a.cdn.searchspring.net',
//   Prefix: 'ajax_search/sites'
// };
//
// s3.listObjects(listparams, function(err, data) {
//   if (err) console.error(err);
//   else {
//     console.log(data);
//   }
// });
