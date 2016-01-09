var dictionary = require('./singleton');

dictionary.init( { dog: { type: 'n.', definition: 'A furry four legged beast.' },
                   cat: { type: 'n.', definition: 'A furry four legged beast.' }
                } ).then(() => {
  console.log(dictionary);
}).catch(error => {
  console.log(error.message);
}).then(() => {
  dictionary.addWord( { dog: { type: 'n.', definition: 'A furry four legged beast.' } } );
});
