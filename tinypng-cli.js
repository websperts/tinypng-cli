#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var minimatch = require('minimatch');
var glob = require('glob');
var uniq = require('array-uniq');
var chalk = require('chalk');
var pretty = require('prettysize');

var argv = require('minimist')(process.argv.slice(2));
var home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var version = require('./package.json').version;

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
    '  -v, --version    Show installed version\n' +
    '  -h, --help       Show help'
  );

} else {

  console.log(chalk.underline.bold('TinyPNG CLI'));
  console.log('v' + version + '\n');

  var files = argv._.length ? argv._ : ['.'];

  var key = '';
  var resize = {};

  if (argv.k || argv.key) {
    key = typeof(argv.k || argv.key) === 'string' ? (argv.k || argv.key).trim() : '';
  } else if (fs.existsSync(home + '/.tinypng')) {
    key = fs.readFileSync(home + '/.tinypng', 'utf8').trim();
  }

  if (argv.width) {
    if (typeof(argv.width) === 'number') {
      resize.width = argv.width;
    } else {
      console.log(chalk.bold.red('Invalid width specified. Please specify a numeric value only.'));
    }
  }

  if (argv.height) {
    if (typeof(argv.height) === 'number') {
      resize.height = argv.height;
    } else {
      console.log(chalk.bold.red('Invalid height specified. Please specify a numeric value only.'));
    }
  }

  if (key.length === 0) {

    console.log(chalk.bold.red('No API key specified. You can get one at ' + chalk.underline('https://tinypng.com/developers') + '.'));

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

      console.log(chalk.bold.green('\u2714 Found ' + unique.length + ' image' + (unique.length === 1 ? '' : 's')) + '\n');
      console.log(chalk.bold('Processing...'));

      unique.forEach(function(file) {

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

              if (body.output.size < body.input.size) {

                console.log(chalk.green('\u2714 Panda just saved you ' + chalk.bold(pretty(body.input.size - body.output.size) + ' (' + Math.round(100 - 100 / body.input.size * body.output.size) + '%)') + ' for `' + file + '`'));

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

                console.log(chalk.yellow('\u2718 Couldn’t compress `' + file + '` any further'));

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

      });

    }

  }

}
