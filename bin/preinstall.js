var fs = require('fs');
var resolve = require('path').resolve;
var join = require('path').join;
var childproc = require('child_process');

// get library path
var lib = resolve(__dirname, '../lib/')

fs.readdirSync(lib).forEach(function (mod) {
	var modPath = join(lib, mod)

	// ensure path has package.json
	if (!fs.existsSync(join(modPath, 'package.json'))) return

	// install folder
	childproc.spawn('npm', ['i'], { env: process.env, cwd: modPath, stdio: 'inherit' })
});
