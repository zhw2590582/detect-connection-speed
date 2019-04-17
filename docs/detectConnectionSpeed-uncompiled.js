(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.DetectConnectionSpeed = factory());
}(this, function () { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var defineProperty = _defineProperty;

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      var ownKeys = Object.keys(source);

      if (typeof Object.getOwnPropertySymbols === 'function') {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }

      ownKeys.forEach(function (key) {
        defineProperty(target, key, source[key]);
      });
    }

    return target;
  }

  var objectSpread = _objectSpread;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var classCallCheck = _classCallCheck;

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  var createClass = _createClass;

  var DetectConnectionSpeed =
  /*#__PURE__*/
  function () {
    function DetectConnectionSpeed(option) {
      classCallCheck(this, DetectConnectionSpeed);

      this.option = objectSpread({
        url: '',
        loop: true,
        time: 1000,
        detectCallback: function detectCallback(result) {
          return result;
        }
      }, option);
      this.transportFactory = this.getStreamFactory();
      this.detect();
    }

    createClass(DetectConnectionSpeed, [{
      key: "supportsXhrResponseType",
      value: function supportsXhrResponseType(type) {
        try {
          var tmpXhr = new XMLHttpRequest();
          tmpXhr.responseType = type;
          return tmpXhr.responseType === type;
        } catch (e) {
          return false;
        }
      }
    }, {
      key: "getStreamFactory",
      value: function getStreamFactory() {
        if (typeof Response !== 'undefined' && Object.prototype.hasOwnProperty.call(Response.prototype, 'body') && typeof Headers === 'function') {
          return this.fetchRequest;
        }

        var mozChunked = 'moz-chunked-arraybuffer';

        if (this.supportsXhrResponseType(mozChunked)) {
          return this.mozXhrRequest;
        }

        return this.xhrRequest;
      }
    }, {
      key: "detect",
      value: function detect() {
        this.timer = null;
        this.result = [];
        this.detectStartTime = new Date().getTime();
        this.requestUrl = this.option.url + '?time=' + this.detectStartTime;
        this.transportFactory();
      }
    }, {
      key: "fetchRequest",
      value: function fetchRequest() {
        var _this = this;

        if (typeof window.fetch !== 'function') {
          throw new Error('fetch function is not supported in your environment');
        }

        this.reader = null;
        return fetch(this.requestUrl).then(function (response) {
          if (typeof response.body.getReader !== 'function') {
            throw new Error('response.body.getReader function is not supported in your environment');
          }

          _this.reader = response.body.getReader();
          (function read() {
            var _this2 = this;

            var readerStartTime = new Date().getTime();
            this.reader.read().then(function (_ref) {
              var done = _ref.done,
                  value = _ref.value;

              if (done) {
                _this2.summary();

                if (_this2.option.loop) {
                  _this2.timer = setTimeout(_this2.detect.bind(_this2), _this2.option.time);
                }

                return;
              }

              var readerEndTime = new Date().getTime();

              _this2.calculate(new Uint8Array(value), readerEndTime - readerStartTime);

              read.call(_this2);
            })["catch"](function (error) {
              throw error;
            });
          }).call(_this);
        });
      }
    }, {
      key: "mozXhrRequest",
      value: function mozXhrRequest() {
        var _this3 = this;

        this.xhr = new XMLHttpRequest();
        this.xhr.open('GET', this.requestUrl, true);
        this.xhr.responseType = 'moz-chunked-arraybuffer';
        var readerStartTime = null;

        var progress = function progress() {
          var readerEndTime = new Date().getTime();
          var streamTime = readerEndTime - readerStartTime;

          _this3.calculate(new Uint8Array(_this3.xhr.response), streamTime);

          readerStartTime = readerEndTime;
        };

        var readystatechange = function readystatechange() {
          if (_this3.xhr.readyState === 2) {
            readerStartTime = new Date().getTime();
          }
        };

        var loadend = function loadend() {
          _this3.summary();

          if (_this3.option.loop) {
            _this3.timer = setTimeout(_this3.detect.bind(_this3), _this3.option.time);
          }
        };

        var error = function error() {
          throw error;
        };

        this.xhr.addEventListener('progress', progress);
        this.xhr.addEventListener('readystatechange', readystatechange);
        this.xhr.addEventListener('loadend', loadend);
        this.xhr.addEventListener('error', error);

        this.xhr.destroy = function () {
          _this3.xhr.removeEventListener('progress', progress);

          _this3.xhr.removeEventListener('readystatechange', readystatechange);

          _this3.xhr.removeEventListener('loadend', loadend);

          _this3.xhr.removeEventListener('error', error);
        };

        this.xhr.send();
      }
    }, {
      key: "calculate",
      value: function calculate(uint8, streamTime) {
        this.result.push({
          streamSize: uint8.byteLength,
          streamTime: streamTime
        });
      }
    }, {
      key: "summary",
      value: function summary() {
        var detectEndTime = new Date().getTime();
        var detectTime = detectEndTime - this.detectStartTime;
        var downloadTime = this.resultSum('streamTime');
        var waitingTime = detectTime - downloadTime;
        var downloadSize = this.resultSum('streamSize');
        var speedKbps = downloadSize / downloadTime;
        var speedMbps = speedKbps / 1024;
        this.option.detectCallback({
          detectTime: detectTime,
          downloadTime: downloadTime,
          downloadSize: downloadSize,
          waitingTime: waitingTime,
          speedKbps: speedKbps,
          speedMbps: speedMbps
        });
      }
    }, {
      key: "resultSum",
      value: function resultSum(key) {
        return this.result.reduce(function (sum, item) {
          return sum + item[key];
        }, 0);
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.option.loop = false;

        if (this.timer) {
          clearTimeout(this.timer);
        }

        if (this.reader && typeof this.reader.cancel === 'function') {
          this.reader.cancel();
        }

        if (this.xhr && typeof this.xhr.abort === 'function') {
          this.xhr.abort();
          this.xhr.destroy();
        }
      }
    }]);

    return DetectConnectionSpeed;
  }();

  return DetectConnectionSpeed;

}));
//# sourceMappingURL=detectConnectionSpeed-uncompiled.js.map
