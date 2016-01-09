var fs = require('fs');

var wordBank = __dirname + '/words';
var words = {};

module.exports = new Dictionary();

function Dictionary() {
  var self = this;

  return new Promise((resolve, reject) => {
    console.log('initializing...');
  });



  // self.add = function(word) {
  //   words.push(word);
  //   console.log('added ' + word);
  // };
  //
  // self.read = function() {
  //   console.log([words]);
  // }


}

Dictionary.prototype.print = function() {

}

Dictionary.prototype.init = function(base) {
  return new Promise((resolve, reject) => {
    if (base) {
      for (word in base) {
        addWord(word, base[word]).then(() => {
          return resolve();;
        }).catch(err => {
          return reject(err);
        });
      }
    } else {
      return resolve();
    }
  });
}

function loadWords() {

}

function addWord(word, details) {
  return new Promise((resolve, reject) => {
    checkWord(word).then((exists) => {
      if (exists) {
        throw new Error(word + ' is in the dictionary already!');
      } else {
        console.log ('creating...');
        return createWordFile(word, details)
      }
    }).then(() => {
      console.log('added ' + word);
      console.log(details.type + ' ' + details.definition);
      resolve();
    }).catch(error => {
      reject(error);
    });
  });
}

function createWordFile(word, details) {
  console.log('create?');
  return new Promise((resolve, reject) => {
    fs.writeFile(wordBank + '/' + word + '.json', JSON.stringify(details, null, 2), (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
}

function checkWord(word) {
  return new Promise((resolve, reject) => {
    fs.stat(wordBank + '/' + word + '.json', (err, stats) => {
      if (err) {
        return resolve(false);
      } else {
        return resolve(true);
      }
    });
  });
}
