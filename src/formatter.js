'use strict';

// Build the predicate path string for the given route, replacing
// variables inside {} with regex expressions
function buildPredicatePath (route, basepath, params) {
    if (basepath === '/' || basepath === undefined) {
        basepath = '';
    }
    if (route.includes('{')) {
        let predicatePath = route;
        const matches = [...route.matchAll(/{(.*?)}/g)];
        matches.forEach(fieldName => {
            params.forEach(item => {
                if (item.name === fieldName[1]) {
                    switch (item.type || item.schema.type) {
                        case 'integer':
                            predicatePath = predicatePath.replace(`{${fieldName[1]}}`, '\\d+');
                            break;
                        case 'string':
                            predicatePath = predicatePath.replace(`{${fieldName[1]}}`, '[0-9a-zA-Z-_.~!*\'();:@&=+$\\[\\],?%#]+');
                            break;
                        default:
                            predicatePath = predicatePath.replace(`{${fieldName[1]}}`, '.*');
                            break;
                    }
                }
            });
        });
        return basepath + predicatePath;
    }
    else {
        return basepath + route;
    }
}

// Function that generates a default example according to the entry's type
function getExampleGivenType (type) {
    switch (type) {
        case 'string':
            return '?';
        case 'boolean':
            return false;
        case 'null':
            return null;
        case 'dateTime':
            return '0000-00-00T00:00:00';
        case 'date':
            return '0000-00-00';
        case 'time':
            return '00:00:00';
        default:
            return 0;
    }
}

// Recursive function that builds the response body object iterating through
// the response properties object
function treatProperty (propertyObject) {
    if (propertyObject === undefined) {
        return '?';
    }
    const returnObject = {};
    switch (propertyObject.type) {
        case 'array':
            return [treatProperty(propertyObject.items)];
        case 'object' || undefined:
            for (let obj in propertyObject.properties) {
                returnObject[obj] = treatProperty(propertyObject.properties[obj]);
            }
            return returnObject;
        default:
            return getExampleGivenType(propertyObject.type);
    }
}

// Function that builds the imposter response from the openapi response object
function buildResponse (respObj, code, statCode) {
    let body, content;
    if (respObj.responses[code].content !== undefined) {
        content = Object.keys(respObj.responses[code].content)[0];
        body = treatProperty(respObj.responses[code].content[content].schema);
    }
    else {
        body = treatProperty(respObj.responses[code].schema);
    }
    const response = {
        is: {
            headers: {
                'Content-Type': respObj.produces || content || '?'
            },
            statusCode: statCode,
            body: body
        }
    };
    return response;
}

/**
 * Creates the stubs structures from the openapi parsed object
 * @param {Object} api - The parsed and validated openapi object
 * @returns {Array} stubs - The constructed openapi stubs array
 */
function buildStubsStruct (api) {
    const stubs = [];
    for (const route in api.paths) {
        for (const verb in api.paths[route]) {
            const predicate = [
                { equals: { method: verb.toUpperCase() } },
                { matches: { path: buildPredicatePath(route, api.basePath, api.paths[route][verb].parameters) } }
            ];
            const response = [];
            for (const code in api.paths[route][verb].responses) {
                const statCode = code === 'default' ? 200 : parseInt(code);
                response.push(buildResponse(api.paths[route][verb], code, statCode));
            }
            stubs.push({ responses: response, predicates: predicate });
        }
    }
    return stubs;
}

function load (options) {
    const fs = require('fs-extra'),
        SwaggerParser = require('swagger-parser');
    return SwaggerParser.validate(options.configfile).then(validatedApi => {
        const filename = validatedApi.info.title + '.json',
            imposters = {
                port: 9090,
                protocol: validatedApi.schemes !== undefined ? validatedApi.schemes : 'http',
                name: validatedApi.info.title,
                stubs: buildStubsStruct(validatedApi)
            };
        fs.writeFileSync(filename, JSON.stringify(imposters, null, '\t'));
        return { imposters: [imposters] };
    }).catch(e => {
        console.error('Unable to build imposters from OpenApi configfile.');
        throw e;
    });
}

function save (options, imposters) {
    const fs = require('fs-extra');
    fs.writeFileSync(options.savefile, JSON.stringify(imposters, null, 2));
}

module.exports = {
    load,
    save
};
