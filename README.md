#ϟǷ®1Πɢß0ȺɌÐ

A tool to be used, and steadily improved upon to start tying in our many processes into one main control system. With future additions within a week or less time to implement, the possibilities would be limited only to APIs. Centralizing this program would take time to build out a secure login system. The current focus of this iteration of this program is on mockup creation. Any centralization of this program would require it to be split into two.

Notes on getting prepared to run springboard:

Springboard is based upon the idea of having a management system for mockups. Springboards forefathers are a collection of bash scripts, and the famous [pyspring.](https://github.com/b7interactive/pyspring) The current iteration of the tool now finds itself written in Javascript with a focus on modularity, objects, and APIs.

It makes use of several of the soon to be standardized ECMA Script 6 (ES6). This allows the use of generators and promises as well as other ES6 functionality. By utilizing the vast array of node.js modules within the package management system (npm), we can quickly create web technologies and adapt to the ever changing ways of the web.

* Use same language on server side as client side
* Clean interface
* Plug and play JS modules and sassy templating
* JS Linting and compiling, Sass compiling and browser synchronization
* Prevent merge conflicts by moving to new branching model
* Increase productivity

---


##Programs to install

node.js (>=0.12.0)  
[nodejs](http://nodejs.org/download/) (with the harmony flag) or [iojs](https://iojs.org/en/index.html) (out of the box).

##Installation instructions

Springboard assumes that you have setup your git account with SSH. If you have not [please do.](https://help.github.com/articles/generating-ssh-keys/)  
Springboard also assumes you have setup your username globally. Springboard will fail to commit changes if you have not setup a [username](https://help.github.com/articles/setting-your-username-in-git/) and email for the searchspring-mockups repo.  
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

##Short Term Goals:
* Easier and maintainable objects (website, module)
* Modular modules (plug and play)
* Theme based (templates)
* Merge conflict prevention

##To Do
####No real order...
* More documentation
* Unit testing (yuno)!!!
* Build out api/ui (new site, publish site, integration request(pull))
* Add site details and screen captures
* Implement simple module mode (use browserify)


##Long Term Ideas:
**Become friends with other APIs**
* Integrate with Kanban, and BaseCamp.
* Create a site ONCE for everyone.
* Login and API Authentication (json web tokens)
* Talk to SMC API (if one doesn't exist build it)
* Get URL for feed data, provide front end for looking at data
* Themes / Automockup / Previewer (create new api manipulator / modify ajaxcatalog)

**Remove our middlemen where possible**
* Create our own forms and store the data in a database (replaces formstack)
* Store and retrieve passwords securely (replaces Teampass)
* With a bit more work Kanban could be replaced as well

##Wish List
####Ordered by implementation... mostly...
* Database (mongodb or couchdb)
* User class for login (or split project into client/server model)
* Online presence
* Webhooks (github mostly)
* Socket.io for realtime updating.
* Build out client side with emberjs or angularjs or somesuch
