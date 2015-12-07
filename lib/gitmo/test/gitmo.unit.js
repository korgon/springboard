git = require('../index.js');

repo = git('/home/korgon/Work/springboard/searchspring-sites');

var promised = repo.status();

console.log(promised);

promised.then(stats => {
  console.log(stats);
})



console.log(repo);

setTimeout(() => {
  console.log('why');  
}, 3000);
