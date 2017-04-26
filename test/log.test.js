'use strict';
let test = require("ava").test;
let assert = require("assert");
let fetcherFactory = require("..");

fetcherFactory.registerRequestor('logtest', function () {
    this.log('hehe');
});

test('log', async function() {
    let request = fetcherFactory.build({
        url: "logtest://"
    });
    return await new Promise((resolve, reject)=> {
        fetcherFactory.on('log', function (config, text) {
            try {
                assert.equal(text, 'hehe');
                resolve()
            } catch(e) {
                reject(e);
            }
        });
        request({});
    });
});