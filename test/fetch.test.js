'use strict';
var autoFetch = require("..");
var test = require("ava").test;
var assert = require("assert");

autoFetch.registerRequestor('timeout', function (cfg, callback) {
    setTimeout(()=> callback(null, cfg.url), 500)
});

test('request with array', async function() {
	var request = autoFetch.build('timeout://whatever');

	var ret = await request([{}, {}]);
	assert.equal(ret.result, 'timeout://whatever');
});

test('multi', async function() {
    var request = autoFetch({
	    test: {
		    url: 'timeout://whatever'
	    }
    }).test;

	var ret = await request({});
	assert.equal(ret.result, 'timeout://whatever');
});

autoFetch.registerRequestor('error', function (cfg, callback) {
    // setTimeout(()=> callback(new Error(cfg.url)), 500)
	throw new Error(cfg.url)
});

test('request error', async function() {
	var request = autoFetch.build({
		url: 'error://',
		onError: e=>e
	});
	try {
		await request();
	} catch(e) {
		assert.equal(e.message, 'error://');
		return;
	}
	assert(false);
});


test('unsupport protocol', async function() {
	try {
		autoFetch.build({
			url: 'wtf://'
		})
	} catch(e) {
		return assert.notEqual(e.message.indexOf('unsupport protocol'), -1);
	}
	assert(false);
});