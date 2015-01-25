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
var version = '0.0.1';

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
        '  -k, --key         Provide an API key\n' +
        '  -v, --version     Show installed version\n' +
        '  -h, --help        Show help'
    );

} else {

    console.log(chalk.underline.bold('TinyPNG CLI'));
    console.log('v' + version + '\n');

    var files = argv._.length ? argv._ : ['.'];

    var key = '';

    if (argv.k || argv.key) {
        key = typeof (argv.k || argv.key) === 'string' ? (argv.k || argv.key).trim() : '';
    } else if (fs.existsSync(home + '/.tinypng')) {
        key = fs.readFileSync(home + '/.tinypng', 'utf8').trim();
    }

    if (key.length === 0) {

        console.log(chalk.bold.red('No API key specified. You can get one at ' + chalk.underline('https://tinypng.com/developers') + '.'));

    } else {

        var images = [];

        files.forEach(function(file) {
            if (fs.existsSync(file)) {
                if (fs.lstatSync(file).isDirectory()) {
                    images = images.concat(glob.sync(file + '/**/*.+(png|jpg|jpeg)'));
                } else if(minimatch(file, '*.+(png|jpg|jpeg)', {
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
                
                file = file.replace(/^\.\//, '');

                fs.createReadStream(file).pipe(request.post('https://api.tinypng.com/shrink', {
                    auth: {
                        'user': 'api',
                        'pass': key
                    }
                }, function (error, response, body) {

                    body = JSON.parse(body);

                    if (response.statusCode === 201) {

                        if (body.output.size < body.input.size) {

                            console.log(chalk.green('\u2714 Panda just saved you ' + chalk.bold(pretty(body.input.size - body.output.size) + ' (' + Math.round(100 - 100 / body.input.size * body.output.size) + '%)') + ' for `' + file + '`'));
                            request.get(body.output.url).pipe(fs.createWriteStream(file));

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
                }));

            });

        }

    }

}
