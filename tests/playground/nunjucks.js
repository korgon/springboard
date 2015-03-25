var nja = require('nunjucks');
var co = require('co');
var fs = require('fs-extra');

// variables
var repo_dir = '/home/korgon/Work/springboard/searchspring-sites/';
var templates_dir = repo_dir + 'templates/';
var modules_dir = repo_dir + 'modules/';
var js_dir = templates_dir + 'js/';
var scss_dir = templates_dir + 'scss/';
var theme = 'skeleton';



// flow control with co
// execution with promises
// better than callback pyramid schemes
// synchronous code flow

co(function *() {
  // testing on js file
  var jsfile = modules_dir + 'slideout/1.1.1/js/slideout.js';
  var jsdata = {
    hideOnClick: false,
    respondAt: 600
  };

  yield njaRenderTo(jsfile, 'rendered_slideout.js', jsdata);

  // testing on scss file
  var scssfile = modules_dir + 'slideout/1.1.1/scss/_slideout.scss';
  var scssdata = {
    width: 300,
    respondAt: 600,
    speed: 400
  };

  yield njaRenderTo(scssfile, 'rendered_slideout.scss', scssdata);

  console.log('done...');
}).catch(function(err) {
  // handle errors in flow
  console.log('ERROR!!!');
  console.error(err);
})




// functions for dealing with nunjucks templates

// pass in the directory of the view and the data
function njaRenderTo(inputfile, outputfile, data) {
  // promisified
  return new Promise(function(resolve, reject) {
    console.log('starting render...');
    var filename = inputfile.replace(/^.*[\\\/]/, '');
    if (fs.existsSync(inputfile)) {
      var filestring = fs.readFileSync(inputfile).toString();
      console.log('read file...');
      nja.configure({ watch: false, autoescape: false });
      nja.renderString(filestring, data, function(err, result) {
        if (err) return reject(err);
        console.log('writing ' + filename + ' to ' + outputfile);
        fs.writeFileSync(outputfile, result);
        console.log('written...');
        return resolve();
      });
    } else {
      return reject(new Error(inputfile + ': file not found'));
    }
  });
}
