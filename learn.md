##Getting Started
Many of the concepts used in this project are new concepts...we are forever learning...

Jumping into it all can be very intimidating, as there are some many choices and opinions... not to mention the opionionated choices. So here is an opionionated start on if you want to develop web applications with Javascript today.

Provided are some good starting point to learn programing with Javascript and node.js, or if you need a refresher. Packages used by springboard are also touched on in the specific packages used section.

##Git
The hope is that those who want to contribute can.  
Get started by learning some git basics so that we can all contribute safely.  
Maybe we will decide to use gitflow here eventually.

#####Articles
https://www.atlassian.com/git/tutorials/comparing-workflows/  
http://rogerdudler.github.io/git-guide/  

##Javascript
Learn about new features in Javascript, and those that are quickly coming.

#####ecma 6
* iterators
* generators
* promises
* much more...

#####ecma 7
* will be here sooner than you think ([video](https://www.youtube.com/watch?v=DqMFX91ToLw))

#####Articles
http://eloquentjavascript.net/  
http://speakingjs.com/es5/index.html  
http://chrisbuttery.com/articles/synchronous-asynchronous-javascript-with-es6-generators/  
http://davidwalsh.name/es6-generators  
http://www.2ality.com/2014/09/es6-promises-foundations.html  
http://www.html5rocks.com/en/tutorials/es6/promises/  

##Node.js
Node.js has been forked!  
Some disputes in [node.js](http://nodejs.org/) land created the rift [io.js](https://iojs.org/). It promises to bring ecma standardization into the releases MUCH sooner. This is not required at the moment, but something to think about.

#####Things to learn:
* asynchronous flow
* modules

Learn at school. Learn at [nodescool](http://nodeschool.io/index.html).  
Learn about the [node package manager](https://www.npmjs.com/).  
Learn how to use the [node.js module system](http://nodejs.org/api/modules.html).  

#####Articles
http://www.sitepoint.com/understanding-module-exports-exports-node-js/  

##Unit testing
[Mocha](http://mochajs.org/) for unit testing  
Not sure on which assertion library to use. Need to research unit testing methods.

#####Articles
http://code.tutsplus.com/tutorials/testing-in-nodejs--net-35018  



##Specific packages used
For a full listing see what is in [package.json](./package.json)

[gulp](https://github.com/gulpjs/gulp)  
[browsersync](http://www.browsersync.io/)  
[browserify](http://browserify.org/)  
[co](https://github.com/tj/co)  
[koa](https://github.com/koajs/koa)  
[jade templates](http://jade-lang.com/api/)  

#####Articles
http://www.sitepoint.com/introduction-gulp-js/  
http://travismaynard.com/writing/getting-started-with-gulp  
https://gist.github.com/mlouro/8886076  
http://notjoshmiller.com/understanding-co/  
http://www.jongleberry.com/koa.html  

##Prepare Development Tools
Once you feel comfortable with all of that, feel free to start developing springboard.
When working on the project if possible join the hipchat room springboard so that we can discuss project development and don't duplicate work.
Get the latest springboard from the repo, then install:

node.js (>=0.12.0)  
http://nodejs.org/download/

gulp, nodemon, mocha

###Installation instructions

```shellsession
# sudo npm -g install nodemon gulp mocha
```

Run it!  
(use the development launcher)

```shellsession
# ./devspringboard
```

From the springboard folder run gulp task

```shellsession
# gulp default
```

Goto localhost:1338 for browsersync of springboard

##Software
#####Atom
https://atom.io/  
After learning so much Javascript, why not use an editor that is built with it...  
It is completely hackable using all of your developing Javascript skills.  
Comes with a great set of features out of the box including a package manager.
The seti themes are highly recommended and pleasant to look at.  
