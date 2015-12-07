git = require('../index.js');

repo = git('/Users/khogg/Workbox/springboard');

var promised = repo.status();

promised.then(stats => {
  console.log('promise success!');
  console.log(stats);
}).catch(error => {
  console.log(error.message);
});
