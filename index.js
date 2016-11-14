'use strict';
var extend = require("extend");
var debug = require('debug')("pigfarm-fetcher");
var hrtime = require("process.hrtime");

var getProtocol = {
	parse: function (str) {
		var protocol = str.indexOf('//') == -1 ? null : str.split('//')[0];
		return {
			protocol: protocol.slice(0, -1)
		}
	}
};

function buildRequestMethod(config) {
	// compat when user only pass the url as config
	if (typeof config == 'string') {
		config = {url: config};
	}

	// default hook function
	config.fixParam = config.fixParam || config.fixBefore || function (a) {
			return a
		};
	config.fixResult = config.fixResult || config.fixAfter || function (a) {
			return a;
		};
	config.onError = config.onError || function (a) {
			return false;
		};

	// get protocol
	var protocol = getProtocol.parse(config.url).protocol;

	var requestor;
	if (!(requestors[protocol] || requestors['default'])) {
		throw new Error('unsupport protocol: ' + protocol);
	} else {
		requestor = requestors[protocol] || requestors['default'];
	}
	var compiler = compilers[protocol];

	var urltemplate = config.url;
	var matcher;
	while (matcher = urltemplate.match(/(\{([\w\.]*)\})/)) {
		urltemplate = urltemplate.replace(matcher[1], '" + data.' + matcher[2] + ' + "');
	}
	urltemplate = '"' + urltemplate + '"';

	urltemplate = new Function("var data = arguments[0]; return " + urltemplate);
	compiler && compiler(config);
	/**
	 * here is the function will be returned from this factory function.
	 * data: request data
	 * callback: callback after the request is ended
	 */
	return function (data) {
		var timestat = {}; // request time stat
		var param; // real request param
		var result;

		return new Promise((resolve, reject)=> {
			data = data || {};

			// invoke the fixParam to adjust the request data
			// the context of fix functions will be the same as this function.
			var err;

			debug('call fixParam');
			timestat.fixParam = hrtime();
			try {
				param = config.fixParam.call(this, data);
			} catch (e) {
				err = e;
			}
			timestat.fixParam = hrtime(timestat.fixParam, 'us');
			debug('called fixParam');

			if (isInvalid(param) || err) {
				debug('fixParam failed', param);
				param = data; // revert the param to before the fixParam status
				return reject(err || new Error('fixParam(fixBefore) returned ' + param));
			}

			debug('start fixUrl');
			timestat.fixUrl = hrtime();
			// make a copy for request data;
			var requestData;
			if (param instanceof Array) {
				requestData = param.slice(0);
			} else {
				requestData = extend({}, param, config.data);
			}

			// if there is symbol like {var}, replace it
			var url = urltemplate(param);

			timestat.fixUrl = hrtime(timestat.fixUrl, 'us');
			debug('end fixUrl');

			// make a copy for config
			var requestCfg = {};
			Object.keys(config).forEach(function (key) {
				if (typeof config[key] != 'function') {
					requestCfg[key] = config[key];
				}
			});

			requestCfg.url = url;
			debug('start globalBeforeHook');
			globalBeforeHook.forEach(function (hook) {
				var hookData = requestData;
				try {
					hookData = hook(hookData);
					hookData != void 0 && (requestData = hookData);
				} catch (e) {
				}
			});
			requestCfg.data = requestData;
			debug('end globalBeforeHook');

			timestat.request = hrtime();
			// call requestors.
			debug('do request');
			try {
				requestor.call(this, requestCfg, function (err, res) {
				    err ? reject(err) : resolve(res);
				});
			} catch (e) {
				reject(e);
			}

		}).then(res=> {
			timestat.request = hrtime(timestat.request, 'us');

			debug('call fixResult');
			timestat.fixResult = hrtime();
			try {
				// check if the result is legal by invoking fixResult。
				result = config.fixResult.call(this, res, param, {
					time: timestat.request
				});
			} catch (e) {
				throw e;
			}
			// if fixResult returned false, treat as an error
			if (isInvalid(result)) {
				throw new Error('fixResult(fixAfter) returned false');
			}
			timestat.fixResult = hrtime(timestat.fixResult, 'us');
			debug('called fixResult');
			return result

		}, e=> {
			timestat.request = hrtime(timestat.request, 'us');
			throw e

		}).catch(err=> {
			// call oEerror

			// if there is an error, use the onError fixer
			//
			// and the user can ignore the error by returning false in onError fixer.
			debug('call onError');
			timestat.onError = hrtime();
			try {
				err = config.onError.call(this, err, result, param);
			} catch (e) {
				err = e;
			}
			// if onError returned something and it is not an Error
			// treat it as a result
			if (!isInvalid(err) && !(err instanceof Error)) {
				var ret = err;
				err = null;
			}

			timestat.onError = hrtime(timestat.onError, 'us');
			debug('called onError');
			if (err) {
				throw err

			} else {
				return ret;
			}

		}).then(function (ret) {
			timestat.all = Object.keys(timestat)
				.map(function (key) {
					return timestat[key]
				})
				.reduce(function (prev, cur) {
					return prev + cur
				});
			// otherwise, return result or null
			return {
				result: isInvalid(ret) ? null : ret,
				timestat
			}

		}, function (err) {
			err.timestat = timestat;
			throw err;
		});
	}
}


var requestors = {};
var compilers = {};

/**
 * entry
 *
 * @param configs: request configs.
 * @returns the request methods.
 */
function factory(configs) {
	var exportee = {};
	for (var i in configs) {
		exportee[i] = buildRequestMethod(configs[i]);
	}

	return exportee;
}
/**
 * parse single config
 * @param config
 * @returns the request method.
 */
factory.build = buildRequestMethod;

/**
 * @param protocol: which protocol will the requestor serve.
 * @param fn: request behavior
 */

factory.registerRequestor = function (protocol, fn) {
	requestors[protocol] = fn;
};

factory.registerCompiler = function (protocol, fn) {
	compilers[protocol] = fn;
};

var globalBeforeHook = [];
// var afterHook = [];
factory.registerHook = function (type, cb) {
	if (type == 'before') {
		globalBeforeHook.push(cb);

		// } else if (type == 'after') {
		//    afterHook.push(cb);

	} else {
		throw new Error('invalid hook');
	}
};

module.exports = factory;

function isInvalid(e) {
    return e === null || e === void 0 || e === false;
}