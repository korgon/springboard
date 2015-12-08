git = require('../index.js');

var repo_dir = '/Users/khogg/Workbox/springboard/searchspring-sites';
var repo = 'git@github.com:korgon/searchspring-sites.git';

//
//
// repo.checkout('master').then(pull => {
//   console.log('checked out!');
//   return repo.status();
// }).then(stats => {
//   console.log(stats);
//   return repo.pull('origin', stats.branch);
// }).then(() => {
//   console.log('pulled!');
// }).catch(error => {
//   console.log(error);
// });

function repoInit(repo_dir, repo) {
  return new Promise(function(resolve, reject) {
    git.clone(repo).then(() => {
      console.log('CLoned!!!');
    }).catch(error => {
      console.log(error);
    });
  });
}
