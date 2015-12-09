"use strict";

var test = require('tape');
var Command = require('../lib/command.js');
var git = require('../index.js');

var repo_dir = __dirname + '/repotest';
var repo = 'git@github.com:korgon/hooke.git';

// repoInit(repo_dir, repo).then(() => {
//   console.log('cloned it');
// }).catch(error => {
//   console.log(error);
// });


/*
test('Gitmo @ clone()', t => {
  var repo = command.exec();

  t.assert(repo instanceof Promise, 'should return a promise');

  p.then(output => {
    t.assert(output, 'promise should resolve with output');
  })

  t.end();
});
*/


repoInit(repo_dir, repo).then(() => {
  return git.setConfig(repo_dir, 'user.name', 'kevin');
}).then(() => {
  console.log('if we clone we do this...');
}).catch(error => {
  console.log('not cloning...');
  console.log(error);
  if (error.message.match('already exists')) {
    console.log('it exists');
  } else {
    throw error;
  }
}).then(() => {
  console.log('doing some other stuff since the repo exists...');
  var user = { name: 'kevin hogg', email: 'kevin@searchspring.net' };
  return repoConfig(repo_dir, user);
}).then(() => {
  console.log('user configured');
}).catch(error => {
  console.log(error);
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

// expects user_data = { name: name, email: email@address }
function repoConfig(repo_dir, user_data) {
  return new Promise(function(resolve, reject) {
    git.setConfig(repo_dir, 'user.name', '"' + user_data.name + '"').then(() => {
      return git.setConfig(repo_dir, 'user.email', '"' + user_data.email + '"');
    }).then(() => {
      return resolve();
    }).catch(error => {
      return reject(error);
    })
  });
}
