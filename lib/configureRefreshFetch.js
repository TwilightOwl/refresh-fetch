"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function configureRefreshFetch(configuration) {
  var refreshToken = configuration.refreshToken,
      shouldRefreshToken = configuration.shouldRefreshToken,
      fetch = configuration.fetch,
      _configuration$minimu = configuration.minimumRefreshPeriod,
      minimumRefreshPeriod = _configuration$minimu === void 0 ? 90000 : _configuration$minimu;
  var refreshingTokenPromise = null;
  var lastRefreshTime = Number.NEGATIVE_INFINITY;
  return function (url, options) {
    if (refreshingTokenPromise !== null) {
      return refreshingTokenPromise.then(function () {
        return fetch(url, options);
      }) // Even if the refreshing fails, do the fetch so we reject with
      // error of that request
      ["catch"](function () {
        return fetch(url, options);
      });
    }

    return fetch(url, options)["catch"](function (error) {
      if (shouldRefreshToken(error)) {
        var timeFromLastRefresh = Date.now() - lastRefreshTime;

        if (timeFromLastRefresh > minimumRefreshPeriod) {
          lastRefreshTime = Date.now();
          refreshingTokenPromise = new Promise(function (resolve, reject) {
            refreshToken().then(function () {
              resolve();
            })["catch"](function (refreshTokenError) {
              reject(refreshTokenError);
            });
          });
        }

        return refreshingTokenPromise["catch"](function () {
          // If refreshing fails, continue with original error
          throw error;
        }).then(function () {
          return fetch(url, options);
        });
      } else {
        throw error;
      }
    });
  };
}

var _default = configureRefreshFetch;
exports["default"] = _default;