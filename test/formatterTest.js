'use strict';

const assert = require('assert'),
    fs = require('fs-extra'),
    path = require('path'),
    formatter = require('../src/formatter');

describe('formatter', function () {
    describe('#load', function () {
        it('should load an imposter structure from openapi yaml file', async function () {
            const config = { imposters: [{
                    port: 9090,
                    protocol: 'http',
                    name: 'Swagger Petstore',
                    stubs: [{
                        responses: [
                            { is: {
                                headers: { 'Content-Type': 'application/json' },
                                statusCode: 200,
                                body: { id: 0, name: '?' }
                            } }
                        ],
                        predicates: [
                            { equals: { method: 'GET' } },
                            { matches: { path: "/pets/[0-9a-zA-Z-_.~!*'();:@&=+$\\[\\],?%#]+" } }
                        ]
                    }]
                }] },
                imposters = await formatter.load({ configfile: path.join(__dirname, 'templates/petstore.yaml') });

            assert.deepStrictEqual(imposters, config);
            assert.ok(fs.existsSync('Swagger Petstore.json'));
            fs.unlinkSync('Swagger Petstore.json');
        });

        it('should load an imposter structure from openapi json file', async function () {
            const config = { imposters: [{
                    port: 9090,
                    protocol: 'http',
                    name: 'Swagger Petstore',
                    stubs: [{
                        responses: [
                            { is: {
                                headers: { 'Content-Type': 'application/json' },
                                statusCode: 200,
                                body: { id: 0, name: '?' }
                            } }
                        ],
                        predicates: [
                            { equals: { method: 'GET' } },
                            { matches: { path: "/pets/[0-9a-zA-Z-_.~!*'();:@&=+$\\[\\],?%#]+" } }
                        ]
                    }]
                }] },
                imposters = await formatter.load({ configfile: path.join(__dirname, 'templates/petstore.json') });

            assert.deepStrictEqual(imposters, config);
            assert.ok(fs.existsSync('Swagger Petstore.json'));
            fs.unlinkSync('Swagger Petstore.json');
        });
    });

    describe('#save', function () {
        it('should save the file as is', async function () {
            const config = {
                imposters: [{
                    port: 3000,
                    protocol: 'test',
                    name: 'name'
                }]
            };
            formatter.save({ savefile: 'saveTest.json' }, config);

            assert.deepStrictEqual(JSON.parse(fs.readFileSync('saveTest.json', 'utf8')), config);
            fs.unlinkSync('saveTest.json');
        });
    });
});
