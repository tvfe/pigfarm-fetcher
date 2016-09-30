var autoFetch = require("..");
var test = require("ava").test;
var assert = require("assert");

autoFetch.registerRequestor('timeout', function (cfg, callback) {
	setTimeout(()=> callback(null, cfg.url), 500)
});


test('globalhook', async function() {
	var test = 1;
	autoFetch.registerHook('before', function () {
		test++;
	});

	var request = autoFetch.build({
		url: 'timeout://whatever'
	});

	await request({});
	assert.equal(test, 2);

	try {
		autoFetch.registerHook('invalid', ()=> {});
	} catch(e) {
		return assert.equal(e.message, 'invalid hook');
	}
	assert(false)
});