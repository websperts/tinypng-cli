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

You may also provide multiple directories or a wildcard at the end to filter some files

	tinypng assets/img1 assets/img2 assets/imagesBeginningWithSomething*

To shrink a single PNG image (`assets/img/demo.png` in this example), you may run the following command.

	tinypng assets/img/demo.png

You may also provide multiple single PNG images.

	tinypng assets/img/demo1.png assets/img/demo2.png

To resize an image, use the `--width` and/or `--height` flag.

	tinypng assets/img/demo.png --width 123
	tinypng assets/img/demo.png --height 123
	tinypng assets/img/demo.png --width 123 --height 123

You may need to resize some large files only, you know, these ones provided by your customers ;)  

	tinypng --if-larger-than 1600 assets/img
	tinypng --if-bigger-than 1572864 assets/img

To avoid the same files to be processed multiple times, a cache is created in the $HOME/.tinypng-cache/ directory.  

You can bypass it:

	tinypng --bypass-cache assets/img

Or clear it:

	tinypng --clear-cache
  
And maybe you need to print all the results on screen, in that case juste activate the verbose mode

	tinypng assets/img/demo.png --width 123 --verbose

That's it. Pretty easy, huh?

## Changelog

* 0.0.9
	* Optimize only if file weight if bigger than the provided value (in bytes)
	* Optimize only if width or height is bigger than the provided value (in pixels)
	* Halt script on invalid argument
	* Use a cache to not optimize the same file twice
	* Verbose mode
	* Add an argument to set the minimal acceptable compression (in %)
	* Returns the number of calls for the current month (value is sent by the tinypng service) 
	* Update README
* 0.0.8
	* Add support for different resize methods (by tomatolicious)
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
- [@zefranck](https://github.com/zefranck)
