var co = require('co');
var s3w = require('../../lib/s3w.js');

var keys = {
  s3_key_id: 'PUT KEY HERE',
  s3_key_secret: 'PUT KEY HERE'
};

var s3 = new s3w(keys);

// flow control with co
// execution with promises
// better than callback pyramid schemes
// synchronous code flow
co(function *() {
  var filename = 'rendered_slideout.scss';
  var path = 'mockup/'
  console.log('putting a file into s3...');
  //yield s3.putFile(filename, path);
  //yield s3.putDir('spring.cat', path);
  console.log('done...');
}).catch(function(err) {
  // handle errors in flow
  console.log('ERROR!!!');
  console.error(err);
});
