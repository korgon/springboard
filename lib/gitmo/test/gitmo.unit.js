'use strict';

var test = require('tape');
var fs = require('fs');
var git = require('../index.js');
var helper = require('./helper.js');

var repo_dir = __dirname + '/repo';
var repo = 'git@github.com:korgon/hooke.git';
var username = 'testing guy';

test('Gitmo @ clone()', t => {
  helper.setupClone(repo_dir);

  var clone = git.clone(repo_dir, repo);

  t.assert(clone instanceof Promise, 'should return a promise');

  clone.then(() => {
    t.assert(fs.lstatSync(repo_dir), 'should clone the repo');

    t.end();
  });
});

test('Gitmo @ getConfig()', t => {
  var getConf = git.getConfig(repo_dir, 'remote.origin.url');

  t.assert(getConf instanceof Promise, 'should return a promise');

  getConf.then(value => {
    t.equal(value, repo, 'promise should return URL of cloned repo');

    t.end();
  })
});

test('Gitmo @ setConfig()', t => {
  var setConf = git.setConfig(repo_dir, 'user.name', username);

  t.assert(setConf instanceof Promise, 'should return a promise');

  setConf.then(() => {
    t.assert(true, 'promise should resolve');

    return git.getConfig(repo_dir, 'user.name');
  }).then(value => {
    t.equal(value, username, 'promise should return new username value');

    t.end();
    helper.teardownClone(repo_dir);
  })
});




/*

repoInit(repo_dir, repo).then(() => {
  console.log('cloned it');
}).catch(error => {
  console.log(error);
});

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

repo.checkout('master').then(pull => {
  console.log('checked out!');
  return repo.status();
}).then(stats => {
  console.log(stats);
  return repo.pull('origin', stats.branch);
}).then(() => {
  console.log('pulled!');
}).catch(error => {
  console.log(error);
});

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
    git.setConfig(repo_dir, 'user.name', user_data.name).then(() => {
      return git.setConfig(repo_dir, 'user.email', user_data.email);
    }).then(() => {
      return resolve();
    }).catch(error => {
      return reject(error);
    })
  });
}

*/
