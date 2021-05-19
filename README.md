# Mountebank OpenAPI Formatter

This is a custom formatter for [mountebank](https://github.com/bbyars/mountebank) that builds an imposter structure from an OpenAPI specification file when it is passed as a configuration file.

The formatter parse the OpenAPI structure and try to build the stubs based on the definitions of the requests, responses and schemas found. It returns the built imposter object to mountebank and saves it on a json file as well so it can be more easily customized and optimized. The name of the created json file is the service title found in the OpenAPI specification file.

## Requirements

- [mountebank](http://www.mbtest.org)
- [NodeJS and npm](https://www.nodejs.org)

## Installation
````bash
npm install
````

## Usage
````bash
mb --configfile path/to/openapi.yaml --formatter ./src/formatter.js
````
