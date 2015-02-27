#ϟǷ®1Πɢß0ȺɌÐ

Notes on getting prepared to run springboard:

Springboard is bleeding edge. It makes use of ecma script 6 by running on iojs. This allows the use of generators and promises (native) as well as other ecma 6 functionality (https://leanpub.com/understandinges6/read/#leanpub-auto-iterators-and-generators). Utilizing the vast array of node.js modules within the package management system (npm) we can quickly create web technologies and adapt to the ever changing ways of the web.

* Javascript
* Use same language on server side as client side
* Increase productivity

---


##Programs to install

node.js (>=0.12.0)  
http://nodejs.org/download/

##Installation instructions

Get the latest springboard from the repo, then install node modules:

```shellsession
# git clone git@github.com:korgon/springboard.git
# cd springboard
# npm install
```

Run it!  
(you must use the harmony flag in node.js to utilize iterators / generators)

```shellsession
# ./springboard
```

###Add springboard to your local path:
``(assuming you use ~/.bin; if you need to, create directory ~/.bin)``

```shellsession
# mkdir ~/.bin
# cp springboard ~/.bin/
# vi ~/.bin/springboard
```

Modify ~/.bin/springboard to read:  
`(where path/to/ is the folder branches where springboard nests)`

```
#!/bin/sh
# code to run node with harmony flag (ecma6 support)
node --harmony ~/{{ path/to/ }} springboard/launch.js
```

Add a line to .bashrc:

```shellsession
# echo "export PATH=\$PATH:~/.bin" >> ~/.bashrc
```

Now you can use the command springboard in your terminal. How exciting!
```shellsession
# springboard
```

##Learn it

To get up to speed on this "node" thing and join the development.  
[Ya gotta learn it...](./learn.md)

##Do it
* allow for multiple watchers (per site instance)
* unit testing (yuno)!!!

##Wish List
####Ordered by implementation
* socket.io for realtime updating.
* database (mongodb or couchdb)
* user class for login (or split project into client/server model)
* online presence
* webhooks for github
* build out client side with emberjs or angularjs
