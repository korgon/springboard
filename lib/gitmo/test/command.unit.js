"use strict";

var test = require('tape');
var Command = require('../lib/command.js');

var home_dir = process.env.HOME;
var command = new Command(home_dir, '', ['--help']);

test('Command @ constructor', t => {
  t.assert(command instanceof Command, 'command is an instance of Command');

  t.equal(command.repo, home_dir, 'should save the working path');

  t.equal(command.command, 'git  --help ', 'should construct command');

  t.end();
});

test('Command @ exec()', t => {
  var p = command.exec();

  t.assert(p instanceof Promise, 'should return a promise');

  p.then(output => {
    t.assert(output, 'promise should resolve with output');
  })

  t.end();
});
