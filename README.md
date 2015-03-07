#ϟǷ®1Πɢß0ȺɌÐ

Notes on getting prepared to run springboard:

Springboard is based upon the idea of having a management system for mockups. Springboards forefathers are a collection of bash scripts, and the famous [pyspring.](https://github.com/b7interactive/pyspring) The current iteration of the tool now finds itself written in Javascript.

It makes use of several of the new ecma script 6 (ES6) by running on nodejs (with the harmony flag) or iojs (out of the box). This allows the use of generators and promises as well as other ES6 functionality (https://leanpub.com/understandinges6/read/#leanpub-auto-iterators-and-generators). Utilizing the vast array of node.js modules within the package management system (npm) we can quickly create web technologies and adapt to the ever changing ways of the web.

* Javascript
* Use same language on server side as client side
* Increase productivity

---


##Programs to install

node.js (>=0.12.0)  
http://nodejs.org/download/

##Installation instructions

Springboard assumes that you have setup your git account with SSH. If you have not [please do.](https://help.github.com/articles/generating-ssh-keys/)  
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

###Add springboard to your local path (optional):
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
# code to run node with harmony flag (ES6 support)
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

###Learn it

To get up to speed on this "node" thing and join the development.  
[Ya gotta learn it...](./learn.md)

##Do it! (todo)
####No real order...
* unit testing (yuno)!!!
* build out api/ui (new site, publish site, integration request(pull))
* add site details and screen captures
* implement simple module mode (use browserify)
* themes / automockup / previewer (create new api manipulator / modify ajaxcatalog)
* api authentication (json web tokens)
* tie into smc (data and feed viewing)?

##Wish List
####Ordered by implementation... mostly...
* allow for multiple watchers (per site instance)
* database (mongodb or couchdb)
* user class for login (or split project into client/server model)
* online presence
* webhooks for github
* socket.io for realtime updating.
* build out client side with emberjs or angularjs or somesuch
