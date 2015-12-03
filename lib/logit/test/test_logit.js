// not sure best way to test a console output...
// just running through the different input combinations for now...

var logit = require('_/logit');

logit.log({ alert: 'legit', message: 'You can use the color cyan.', color: 'cyan' });
logit.log({ alert: 'not legit', message: 'You cannot use the color teal!', color: 'teal' });
logit.log('initialization');
logit.log('initialization', '', 'pass');
logit.log('initialization', 'created new config file', 'warn');
logit.log('initialization', 'failed', 'fail');
