git = require('../index.js');

var repo_dir = '/Users/khogg/Workbox/springboard/searchspring-sites';
var repo = 'git@github.com:korgon/searchspring-sites.git';

// repoInit(repo_dir, repo).then(() => {
//   console.log('cloned it');
// }).catch(error => {
//   console.log(error);
// });

repoInit(repo_dir, repo).then(() => {
  return git.setConfig(repo_dir, 'user.name', 'kevin');
}).then(() => {
  console.log('if we clone we do this...');
}).catch(error => {
  console.log('not cloning...');
  console.log(error);
}).then(() => {
  console.log('doing some other stuff anyways...');
});

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

function repoInit(repo_dir, repo_url) {
  return new Promise(function(resolve, reject) {
    git.clone(repo_dir, repo_url).then(() => {
      console.log('CLoned!!!');
      return resolve();
    }).catch(error => {
      reject(error);
    });
  });
}
