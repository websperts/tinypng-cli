#!/usr/bin/env node

const fs = require('fs');
const request = require('request');
const minimatch = require('minimatch');
const glob = require('glob');
const uniq = require('array-uniq');
const chalk = require('chalk');
const pretty = require('prettysize');
const imageinfo = require('imageinfo');
const md5 = require('js-md5');
const emptyFolder = require('empty-folder');

var argv = require('minimist')(process.argv.slice(2));
var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var version = require('./package.json').version;

var cacheDirectory = home + '/.tinypng-cache/';

if (argv.v || argv.version) {

  console.log(version);

} else if (argv.h || argv.help) {

  console.log(
    'Usage\n' +
    '  tinypng <path>\n' +
    '\n' +
    'Example\n' +
    '  tinypng .\n' +
    '  tinypng assets/img\n' +
    '  tinypng assets/img/test.png\n' +
    '  tinypng assets/img/test.jpg\n' +
    '\n' +
    'Options\n' +
    '  -k, --key        Provide an API key\n' +
    '  -r, --recursive  Walk given directory recursively\n' +
    '  --width          Resize an image to a specified width\n' +
    '  --height         Resize an image to a specified height\n' +
    '  --resize-mode    Specify the resize method to use (scale, fit or cover)\n' +
    '  --if-larger-than Optimize only if width or height is bigger than the provided value (in pixels)\n' +
    '  --if-bigger-than Optimize only if file weight if bigger than the provided value (in bytes)\n' +
    '  --clear-cache 		Clear cache and stop\n' +
    '  -v, --version    Show installed version\n' +
    '  -V								Verbose mode\n' +
    '  -h, --help       Show help'
  );

} else {

  console.log(chalk.underline.bold('TinyPNG CLI'));
  console.log('v' + version + '\n');

  var files = argv._.length ? argv._ : ['.'];

  var key = '';
  var resize = {};
  var resize_modes = ['scale', 'fit', 'cover'];

  var verbose = false;

  if (argv.k || argv.key) {
    key = typeof(argv.k || argv.key) === 'string' ? (argv.k || argv.key).trim() : '';
  } else if (fs.existsSync(home + '/.tinypng')) {
    key = fs.readFileSync(home + '/.tinypng', 'utf8').trim();
  }

  if (!fs.existsSync(cacheDirectory)) {
    fs.mkdirSync(cacheDirectory);
    console.log(chalk.bold(`Cache directory does not exist:`) + ` creating ${cacheDirectory}`);
  }

  if (argv['clear-cache']) {
    if (fs.existsSync(cacheDirectory)) {

      emptyFolder(cacheDirectory, false, (o) => {
        if (o.error) {
          console.log(chalk.bold(`Cannot empty cache directory: ` + err));
          return;
        }
      });
    }
    console.log(chalk.bold(`Cache is clean`));
    process.exit(-1);
  }

  if (argv.V) {
  	console.log('. Verbose mode is ON');
  	verbose = true;
	}

  if (argv.width) {
    if (typeof(argv.width) === 'number') {
      resize.width = argv.width;
    } else {
      console.log(chalk.bold.red('Invalid width specified. Please specify a numeric value only.'));
			process.exit(-1);
    }
  }

  if (argv.height) {
    if (typeof(argv.height) === 'number') {
      resize.height = argv.height;
    } else {
      console.log(chalk.bold.red('Invalid height specified. Please specify a numeric value only.'));
			process.exit(-1);
    }
  }

  if (argv['resize-method']) {
    if (typeof(argv['resize-method']) === 'string' && resize_modes.includes(argv['resize-method'].toLowerCase())) {
      if (argv['resize-method'] != 'scale' && resize.width === undefined || argv['resize-method'] != 'scale' && resize.height === undefined) {
        console.log(chalk.bold.red('This resize mode requires you to specify a width and a height.'));
      } else {
        resize.method = argv['resize-method'];
      }
    } else {
      console.log(chalk.bold.red(`Invalid resize mode specified. Valid modes are: ${resize_modes.join(', ')}`));
			process.exit(-1);
    }
  }

  if (argv['if-larger-than']) {
    if (typeof(argv['if-larger-than']) === 'number') {
      resize.maxSize = argv['if-larger-than'];
      console.log('. Image(s) should be larger than ' + resize.maxSize + ' pixels (width or height) to be processed\n');
    } else {
      console.log(chalk.bold.red(`Invalid size specified. Please use a number (in pixels).`));
			process.exit(-1);
    }
  }

  if (argv['if-bigger-than']) {
    if (typeof(argv['if-bigger-than']) === 'number') {
      resize.maxWeight = argv['if-bigger-than'];
      console.log('. Files should be bigger than ' + pretty(resize.maxWeight) + ' to be processed\n');
    } else {
      console.log(chalk.bold.red(`Invalid weight specified. Please use a number (in bytes).`));
			process.exit(-1);
    }
  }

  if (key.length === 0) {

    console.log(chalk.bold.red('No API key specified. You can get one at ' + chalk.underline('https://tinypng.com/developers') + '.'));
		process.exit(-1);

  } else {

    var images = [];

    files.forEach(function(file) {
      if (fs.existsSync(file)) {
        if (fs.lstatSync(file).isDirectory()) {
          images = images.concat(glob.sync(file + (argv.r || argv.recursive ? '/**' : '') + '/*.+(png|jpg|jpeg|PNG|JPG|JPEG)'));
        } else if (minimatch(file, '*.+(png|jpg|jpeg|PNG|JPG|JPEG)', {
            matchBase: true
          })) {
          images.push(file);
        }
      }
    });

    var unique = uniq(images);

    if (unique.length === 0) {

      console.log(chalk.bold.red('\u2718 No PNG or JPEG images found.'));

    } else {

      var optimizedCounter;
      process.on('exit', function() {
        if (optimizedCounter) console.log(chalk.bold.green('\u2714 Number of optimized files this month: ' + optimizedCounter));
      });

      console.log(chalk.bold.green('\u2714 Found ' + unique.length + ' image' + (unique.length === 1 ? '' : 's')) + '\n');
      console.log(chalk.bold('Processing...'));

      unique.forEach(function(file) {

        fs.readFile(file, function(err, data) {
          if (err) throw err;

          var push = true;
          var info = imageinfo(data);

          if (resize.maxSize) {
            var thisMaxSize = Math.max(info.width, info.height);
            if (thisMaxSize < resize.maxSize) {
              if (verbose) console.log(chalk.red('\u0021 Image is too small (' + info.width + 'x' + info.height + '): `' + file + '`'));
              push = false;
            }
          }

          if (resize.maxWeight) {
            if (data.length < resize.maxWeight) {
              if (verbose) console.log(chalk.red('\u0021 File is too light ' + chalk.bold(pretty(data.length)) + ': `' + file + '`'));
              push = false;
            }
          }

          var hash = md5(file + JSON.stringify(resize));
          if (fs.existsSync(`${cacheDirectory}/${hash}`)) {
            if (verbose) console.log(chalk.red(`\u0021 File already packed: ${file}`));
            push = false;
          }

          if (push === true) {

            fs.createReadStream(file).pipe(request.post('https://api.tinify.com/shrink', {
              auth: {
                'user': 'api',
                'pass': key
              }
            }, function(error, response, body) {

              try {
                body = JSON.parse(body);
              } catch (e) {
                console.log(chalk.red('\u2718 Not a valid JSON response for `' + file + '`'));
                return;
              }

              if (!error && response) {

                if (response.statusCode === 201) {

                  optimizedCounter = response.headers['compression-count'];

                  if (body.output.size < body.input.size) {

                    console.log(chalk.green('\u2714 Panda just saved you ' + chalk.bold(pretty(body.input.size - body.output.size) + ' (' + Math.round(100 - 100 / body.input.size * body.output.size) + '%)') + ' for `' + file + '`'));

                    fs.writeFile(cacheDirectory + hash, hash, (error) => {
                      if (error) {
                        console.log(chalk.red('\u2718 Cannot write cache file'));
                      }
                    });

                    if (resize.hasOwnProperty('height') || resize.hasOwnProperty('width')) {

                      request.get(body.output.url, {
                        auth: {
                          'user': 'api',
                          'pass': key
                        },
                        json: {
                          'resize': resize
                        }
                      }).pipe(fs.createWriteStream(file));

                    } else {

                      request.get(body.output.url).pipe(fs.createWriteStream(file));

                    }
                  } else {

                    console.log(chalk.yellow(`\u2718 Couldn’t compress ${file} any further`));

                  }

                } else {

                  if (body.error === 'TooManyRequests') {
                    console.log(chalk.red('\u2718 Compression failed for `' + file + '` as your monthly limit has been exceeded'));
                  } else if (body.error === 'Unauthorized') {
                    console.log(chalk.red('\u2718 Compression failed for `' + file + '` as your credentials are invalid'));
                  } else {
                    console.log(chalk.red('\u2718 Compression failed for `' + file + '`'));
                  }

                }
              } else {
                console.log(chalk.red('\u2718 Got no response for `' + file + '`'));
              }
            }));

          }
        });
      });
    }
  }
}
