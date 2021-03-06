'use strict';

// node core modules
const url = require('url');

// 3rd party modules
const _ = require('lodash');

// internal modules
const { formatHref, formatQuery } = require('./utils');

const defaultPluginOptions = {
  applyToUrl: true,
  applyToQueryString: false,
  valuesMap: {
    authType: {
      oauth: 'oauth',
      basic: 'basic',
      saml: 'form',
      cookie: 'form',
    },
  },
};

const processUri = (requestOptions, { applyToUrl, valuesMap }) => {
  const { uri } = requestOptions;
  if (!applyToUrl || !uri) {
    return uri;
  }
  const { href } = uri;

  const formattedHref = formatHref(href, requestOptions, valuesMap);

  // automatically escapes characters for us (https://nodejs.org/dist/latest-v6.x/docs/api/url.html#url_escaped_characters)
  // [aj] needed to use encodeURI before parsing a URL, since it supports UTF-8 encoding,
  // and can encode special characters that different countries have(e.x. German umlauts)
  return url.parse(encodeURI(formattedHref));
};

const processQuerystring = (requestOptions, { applyToQueryString, valuesMap }) => {
  const { qs } = requestOptions;
  if (!applyToQueryString || !qs) {
    return qs;
  }
  return formatQuery(qs, requestOptions, valuesMap);
};

/**
 * Replace templateStrings in your requestOptions's `uri` and `qs` with values extracted from other
 * properties in `requestOptions`
 *
 * @param {Object}  [params]                            the plugin params
 * @param {Object}  [params.valuesMap]                  map templateValues to a custom value
 * @param {Boolean} [params.applyToUrl=true]            parse template strings in url parameter?
 * @param {Boolean} [params.applyToQueryString=false]   parse template strings in query parameter?
 * @example
 * // disables modifying request url
 * pluginFactory({ applyToUrl: false });
 * @example
 * // enables modifying request querystring
 * pluginFactory({ applyToQueryString: true });
 * @example
 * // provides custom values map for { authType } templateString
 * pluginFactory({ valuesMap: { authType: { oauth: 'oauth2' } } });
 * @return {*}
 */
const pluginFactory = (params = {}) => {
  const pluginOptions = _.merge({}, defaultPluginOptions, params);

  /**
   * the actual plugin execution (runs per-request)
   *
   * @method load
   * @param  {Object}   req            HTTP request object
   * @param  {Object}   requestOptions options for executing HTTP request with oniyi-http-client
   * @param  {Function} callback       [description]
   * @example
   * // simplified `req` and `requestOptions.uri` args
   * load(null, { uri: '/api/foo/{ authType }/bar', authType: 'oauth' }, (err, requestOptions) => {
   *  console.log(requestOptions.uri); // '/api/foo/oauth/bar'
   * });
   */
  const load = (req, requestOptions, callback) => {
    const { plugins: { formatUrlTemplate: pluginOptionsParam = {} } = {} } = requestOptions;
    const options = _.merge({}, pluginOptions, pluginOptionsParam);

    const uri = processUri(requestOptions, options);
    const qs = processQuerystring(requestOptions, options);


    callback(null, Object.assign({}, requestOptions, { uri, qs }));
  };

  return {
    name: 'format-url-template',
    load,
  };
};

module.exports = pluginFactory;
