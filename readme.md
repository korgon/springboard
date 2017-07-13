# ϟǷ®1Πɢß0ȺɌÐ

Springboard is a tool to be used, and steadily improved upon, to start tying in our many processes and programs into one unified system. The current focus of this iteration of this program is on Mockup creation and management.

Springboard's forefathers are a collection of bash script which became the famous [pyspring.](https://github.com/b7interactive/pyspring) The current iteration of the idea now finds itself written in Javascript with a focus on modular site creation.

Features:
* Sass compiling
* Browser synchronization (reload)
* JS Linting and concatenation
* Searchable Site Library
* Plug and play Catalog Module Library
* UI Construction Interface
* Built in Proxy
* Git Repositories

---

### Getting Started

##### Pre-requisites

node.js (>=v6.11.1)  
[nodejs](http://nodejs.org/download/)
##### Installation

Springboard assumes that you have setup your git account with SSH. If you have not [please do.](https://confluence.atlassian.com/display/BITBUCKET/Use+the+SSH+protocol+with+Bitbucket)

Get the latest springboard from the repo, then install node modules:

```shellsession
$ git clone git@github.com:korgon/springboard.git
$ cd springboard
$ npm install
```

Run it!  

```shellsession
$ ./springboard
```

##### Add springboard to your local path (optional):
``(assuming you use ~/.bin; if you need to, create directory ~/.bin)``

```shellsession
$ mkdir ~/.bin
$ cp springboard ~/.bin/
$ vi ~/.bin/springboard
```

~/.bin/springboard contents:  
```
#!/bin/sh
# launch springboard using node
node ~/{{ path/to/ }} springboard/index.js
```
`(where {{ path/to/ }} is the folder branches where springboard nests)`

Add a line to .bashrc:

```shellsession
$ echo "export PATH=\$PATH:~/.bin" >> ~/.bashrc
```

Now you can use the command springboard in your terminal. How exciting!
```shellsession
$ springboard
```
