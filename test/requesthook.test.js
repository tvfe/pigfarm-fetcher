var autoFetch = require("..");
var assert = require("assert");
var test = require("ava").test;

autoFetch.registerRequestor('timeout', function (cfg, callback) {
	setTimeout(()=> callback(null, cfg.url), 500)
});

test('err will be null if onError return false or notdefined', async function () {
	await autoFetch.build({
		url: 'timeout://',
		fixAfter: function () {
			return false;
		}
	})();
});

test('throw error in onError', async function() {

	try {
		await autoFetch.build({
			url: 'timeout://',
			fixAfter: function () {
				return false;
			},
			onError: function () {
				throw new Error('hehe')
			}
		})();
	} catch(e) {
		return assert.equal(e.message, 'hehe');
	}
	assert(false)
});
test('throw error in fixAfter', async function() {

	try {
		await autoFetch.build({
			url: 'timeout://',
			fixAfter: function () {
				throw new Error('hehe')
			},
			onError: function (e) {
				return e
			}
		})();
	} catch(e) {
		return assert.equal(e.message, 'hehe');
	}
	assert(false)
});
test('throw error in fixBefore', async function() {

	try {
		await autoFetch.build({
			url: 'timeout://',
			fixBefore: function () {
				throw new Error('hehe')
			},
			onError: function (e) {
				return e
			}
		})();
	} catch(e) {
		return assert.equal(e.message, 'hehe');
	}
	assert(false)
});
test('return non-error in onError', async function() {

	var data = await autoFetch.build({
		url: 'timeout://',
		fixAfter: function () {
			return false;
		},
		onError: function () {
			return {success: true}
		}
	})();
	assert(data.result.success);
});
test('return empty string in onError', async function () {

	var data = await autoFetch.build({
		url: 'timeout://',
		fixBefore: function () {
		    throw new Error('123')
		},
		onError: function () {
		    return ''
		}
	})();
	assert.equal(data.result, '')
});