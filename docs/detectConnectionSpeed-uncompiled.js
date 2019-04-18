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

  function supportsXhrResponseType(type) {
    try {
      var tmpXhr = new XMLHttpRequest();
      tmpXhr.responseType = type;
      return tmpXhr.responseType === type;
    } catch (e) {
      return false;
    }
  }

  var reader = null;

  function fetchRequest(requestUrl, updateCallback, doneCallback) {
    fetch(requestUrl).then(function (response) {
      reader = response.body.getReader();

      (function read() {
        var readerStartTime = Date.now();
        reader.read().then(function (_ref) {
          var done = _ref.done,
              value = _ref.value;

          if (done) {
            doneCallback();
            return;
          }

          var readerEndTime = Date.now();
          var streamTime = readerEndTime - readerStartTime;
          var streamSize = new Uint8Array(value).byteLength;
          updateCallback(streamSize, streamTime);
          read();
        })["catch"](function (error) {
          throw error;
        });
      })();
    });
    return {
      destroy: function destroy() {
        reader && reader.cancel();
      }
    };
  }

  var xhr = null;

  function mozXhrRequest(requestUrl, updateCallback, doneCallback) {
    xhr = new XMLHttpRequest();
    xhr.open('GET', requestUrl, true);
    xhr.responseType = 'moz-chunked-arraybuffer';
    var readerStartTime = null;

    var progress = function progress() {
      var readerEndTime = Date.now();
      var streamTime = readerEndTime - readerStartTime;
      var streamSize = new Uint8Array(xhr.response).byteLength;
      updateCallback(streamSize, streamTime);
      readerStartTime = readerEndTime;
    };

    var readystatechange = function readystatechange() {
      if (xhr.readyState === 2) {
        readerStartTime = Date.now();
      }
    };

    var loadend = function loadend() {
      doneCallback();
    };

    var error = function error() {
      throw error;
    };

    xhr.addEventListener('progress', progress);
    xhr.addEventListener('readystatechange', readystatechange);
    xhr.addEventListener('loadend', loadend);
    xhr.addEventListener('error', error);
    xhr.send();
    return {
      destroy: function destroy() {
        if (xhr) {
          xhr.abort();
          xhr.removeEventListener('progress', progress);
          xhr.removeEventListener('readystatechange', readystatechange);
          xhr.removeEventListener('loadend', loadend);
          xhr.removeEventListener('error', error);
        }
      }
    };
  }

  function getStreamFactory() {
    if (typeof Response !== 'undefined' && Object.prototype.hasOwnProperty.call(Response.prototype, 'body') && typeof Headers === 'function') {
      return fetchRequest;
    }

    var mozChunked = 'moz-chunked-arraybuffer';

    if (supportsXhrResponseType(mozChunked)) {
      return mozXhrRequest;
    }

    throw new Error('Your browser does not currently support stream factory');
  }

  var DetectConnectionSpeed =
  /*#__PURE__*/
  function () {
    function DetectConnectionSpeed(option) {
      classCallCheck(this, DetectConnectionSpeed);

      this.option = objectSpread({
        url: '',
        loop: true,
        detectCallback: function detectCallback(result) {
          return result;
        }
      }, option);
      this.loopTimer = null;
      this.stream = null;
      this.seconds = [];
      this.calculateSecond = 0;
      this.streamFactory = getStreamFactory();
      this.detectStartTime = Date.now();
      this.detect();
    }

    createClass(DetectConnectionSpeed, [{
      key: "detect",
      value: function detect() {
        this.requestUrl = this.option.url + '?time=' + Date.now();
        this.stream = this.streamFactory(this.requestUrl, this.updateCallback.bind(this), this.doneCallback.bind(this));
      }
    }, {
      key: "updateCallback",
      value: function updateCallback(streamSize, streamTime) {
        var item = {
          streamSize: streamSize,
          streamTime: streamTime
        };
        var second = Math.ceil((Date.now() - this.detectStartTime) / 1000);

        if (!this.seconds[second]) {
          this.calculate();
          this.seconds[second] = [item];
        } else {
          this.seconds[second].push(item);
        }
      }
    }, {
      key: "doneCallback",
      value: function doneCallback() {
        if (this.option.loop) {
          if (this.stream && typeof this.stream.destroy === 'function') {
            this.stream.destroy();
          }

          this.detect();
        }
      }
    }, {
      key: "calculate",
      value: function calculate() {
        var item = this.seconds[this.calculateSecond++] || [];
        var downloadTime = this.resultSum(item, 'streamTime') || 0;
        var downloadSize = this.resultSum(item, 'streamSize') || 0;
        var speedKbps = downloadSize / downloadTime || 0;
        var speedMbps = speedKbps / 1024;
        this.option.detectCallback({
          downloadTime: downloadTime,
          downloadSize: downloadSize,
          speedKbps: speedKbps,
          speedMbps: speedMbps
        });
      }
    }, {
      key: "resultSum",
      value: function resultSum(result, key) {
        return result.reduce(function (sum, item) {
          return sum + item[key];
        }, 0);
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.option.loop = false;

        if (this.loopTimer) {
          clearTimeout(this.loopTimer);
        }

        if (this.stream && typeof this.stream.destroy === 'function') {
          this.stream.destroy();
        }
      }
    }]);

    return DetectConnectionSpeed;
  }();

  return DetectConnectionSpeed;

}));
//# sourceMappingURL=detectConnectionSpeed-uncompiled.js.map
