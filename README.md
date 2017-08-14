# TinyPNG CLI

> Handy command line tool for shrinking PNG images using the TinyPNG API

## Installation

	npm install -g tinypng-cli

## Preamble

To use TinyPNG CLI, you need an API key for TinyPNG. You can get one at [https://tinypng.com/developers](https://tinypng.com/developers).

## Usage

TinyPNG CLI allows you to provide your API key in two different ways. The more convenient one is to save the API key into a file called `.tinypng` within your home directory. The other way is to provide it as an option while running the CLI.

	tinypng demo.png -k E99a18c4f8cb3EL5f2l08u368_922e03

To shrink all PNG images within the current directory, you may run one of the following commands—both do exactly the same.

	tinypng
	tinypng .

To shrink all PNG images within the current directory and subdirectoies, use the `-r` flag

	tinypng -r

To shrink all PNG images within a specific directory (`assets/img` in this example), you may run the following command.

	tinypng assets/img

You may also provide multiple directories.

	tinypng assets/img1 assets/img2

To shrink a single PNG image (`assets/img/demo.png` in this example), you may run the following command.

	tinypng assets/img/demo.png

You may also provide multiple single PNG images.

	tinypng assets/img/demo1.png assets/img/demo2.png

To resize an image, use the `--width` and/or `--height` flag.

	tinypng assets/img/demo.png --width 123
	tinypng assets/img/demo.png --height 123
	tinypng assets/img/demo.png --width 123 --height 123

That's it. Pretty easy, huh?

## Changelog

* 0.0.7
	* Implement support for uppercase file extensions
* 0.0.6
	* Prevent any file changes in case JSON parsing fails or any other HTTP error occurred
* 0.0.5
	* Add support for image resize functionality
* 0.0.4
  * Make recursive directory walking optional
* 0.0.3
  * Updated API endpoint
  * Check for valid JSON response
* 0.0.2
	* JP(E)G support
* 0.0.1
	* Initial version

## TODO

- Documentation
- Tests

## License

Copyright (c) 2017 [websperts](http://websperts.com/)  
Licensed under the MIT license.

See LICENSE for more info.

## Contributors

- [@rasshofer](https://github.com/rasshofer)
- [@maxkueng](https://github.com/maxkueng)
- [@tholu](https://github.com/tholu)
- [@mvenghaus](https://github.com/mvenghaus)
- [@jblok](https://github.com/jblok)
- [@tomatolicious](https://github.com/tomatolicious)
- [@kolya182](https://github.com/kolya182)
