'use strict';
var aotuFetch = require("..");
var test = require("ava").test;
var assert = require("assert");

aotuFetch.registerRequestor('test', function(cfg, cb) {
	process.nextTick(() =>{
		cb(null, {
			url: cfg.url,
			data: cfg.data
		});
	});
});

test('param can named with dot', async function () {
	var ret = await aotuFetch.build({
		url: 'test://?id={QUERY.id}'
	}).call(null, {'QUERY': {id:1}});
	assert(ret.result.url.indexOf('id=1') != -1)
});

test('compiler', async function () {
	aotuFetch.registerCompiler('compiler', function(cfg) { temp = cfg.url });
	aotuFetch.registerRequestor('compiler', function(cfg, cb) {
		process.nextTick(() =>{
			cb(null, {
				url: cfg.url,
				data: cfg.data
			});
		});
	});

	var temp = await aotuFetch.build({
		url: "compiler://hehe"
	})();

	assert.equal(temp.result.url, "compiler://hehe");
});