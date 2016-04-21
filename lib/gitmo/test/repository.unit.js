'use strict';

var test = require('tape');
var fs = require('fs');
var path = require('path');
var git = require('../index.js');
var Repository = require('../lib/repository');
var helper = require('./helper.js');

var repo_dir = __dirname + '/repo';
var repo = 'git@github.com:korgon/hooke.git';
var repository;
var oldBranch = 'newbranch';
var newBranch = 'newerbranch';


test('Preparing test repository using Gitmo.clone()', t => {
  helper.setupClone(repo_dir);

  var clone = git.clone(repo_dir, repo);

  t.assert(clone instanceof Promise, 'should return a promise');

  clone.then(() => {
    t.assert(fs.statSync(repo_dir), 'should clone the repo');
    repository = git(repo_dir);
    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ constructor', t => {
  t.assert(repository instanceof Repository, 'repository is an instance of Repository');

  t.equal(repository.path, repo_dir, 'repository should have the correct path');

  t.equal(repository.name, path.basename(repo_dir), 'repository should be named correctly');

  t.assert(repository._ready, 'repository should be verified and ready');

  t.end();
});

test('Repository @ branch()', t => {
  var branch = repository.branch(['-r']);

  t.assert(branch instanceof Promise, 'should return a promise');

  branch.then(branches => {
    t.assert(true, 'promise should resolve');

    t.assert(branches instanceof Array, 'should return an array');

    var expected_branch = 'origin/master';
    var found = false;
    branches.forEach(branch => {
      if (branch.match(expected_branch)) {
        found = true;
      }
    });

    t.equal(found, true, 'branch array should contain "origin/master"');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ status()', t => {
  var status = repository.status();

  t.assert(status instanceof Promise, 'should return a promise');

  status.then(stats => {
    t.assert(true, 'promise should resolve');

    t.equal(stats.branch, 'master', 'should be on the master branch');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ checkout()', t => {
  var checkout = repository.checkout(newBranch, ['-b']);


  t.assert(checkout instanceof Promise, 'should return a promise');

  checkout.then(() => {
    t.assert(true, 'promise should resolve');

    return repository.status();
  }).then(stats => {
    t.equal(stats.branch, newBranch, 'should be on the new branch');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ pull()', t => {
  var pull = repository.pull('origin', newBranch);


  t.assert(pull instanceof Promise, 'should return a promise');

  pull.then(() => {
    t.assert(true, 'promise should resolve');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ add()', t => {
  var newFile = 'testfile_' + Math.floor(Math.random() * 144000) + '.js';
  fs.writeFileSync(repo_dir + '/' + newFile, 'console.log("hello world!")');

  var add = repository.add(null, ['-A']);

  t.assert(add instanceof Promise, 'should return a promise');

  add.then(() => {
    t.assert(true, 'promise should resolve');

    return repository.status();
  }).then(stats => {
    t.equal(stats.changes[0].change, newFile, 'added file should be in the status');
    t.equal(stats.changes[0].state, 'A', 'change should be "A"');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ commit()', t => {
  var commit = repository.commit('commited with gitmo!');

  t.assert(commit instanceof Promise, 'should return a promise');

  commit.then(resp => {
    t.assert(true, 'promise should resolve');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ push()', t => {
  var push = repository.push('origin', newBranch, ['-u']);

  t.assert(push instanceof Promise, 'should return a promise');

  push.then(() => {
    t.assert(true, 'promise should resolve');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ merge()', t => {
  repository.checkout(oldBranch).then(() => {
    return repository.status();
  }).then(stats => {
    t.equal(stats.branch, oldBranch, 'should be on branch ' + oldBranch);

    var merge = repository.merge(newBranch, ['--commit', '-m "merged using gitmo"']);

    t.assert(merge instanceof Promise, 'should return a promise');

    return merge;
  }).then(() => {
    t.assert(true, 'promise should resolve');

    return repository.push('origin', oldBranch);
  }).then(() => {
    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ clean()', t => {
  var newFile = 'testfile_' + Math.floor(Math.random() * 144000) + '.js';
  fs.writeFileSync(repo_dir + '/' + newFile, 'console.log("hello world!")');

  var clean = repository.clean(['-f', '-d']);

  t.assert(clean instanceof Promise, 'should return a promise');

  clean.then(() => {
    t.assert(true, 'promise should resolve');

    return repository.status();
  }).then(stats => {
    t.equal(stats.changes, undefined, 'changes should not exist');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Repository @ reset()', t => {
  t.assert(fs.existsSync(repo_dir + '/src'), 'source folder should exist');

  helper.deleteFolderRecursive(repo_dir + '/src');

  t.assert(!fs.existsSync(repo_dir + '/src'), 'source folder should not exist');

  var reset = repository.reset(['--hard']);

  t.assert(reset instanceof Promise, 'should return a promise');

  reset.then(() => {
    t.assert(true, 'promise should resolve');

    t.assert(fs.existsSync(repo_dir + '/src'), 'source folder should exist (branch reset)');

    t.end();
  }).catch(error => {
    console.log(error);
  });
});

test('Tearing down test repository', t => {
  helper.teardownClone(repo_dir);

  t.assert(!fs.existsSync(repo_dir), 'repository removed');

  t.end();
});
