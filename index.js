(function(window, factory) {
  if (typeof exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    window.detectConnectionSpeed = factory();
  }
})(this, function() {
  return function detectConnectionSpeed() {
    var opt =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var callback = arguments.length > 1 ? arguments[1] : undefined;
    var option = Object.assign(
      {
        imageUrl: '',
        imageSize: 1024,
        time: 1000
      },
      opt
    );

    function detect() {
      return new Promise(function(resolve) {
        var startTime = 0;
        var endTime = 0;
        var img = new Image();

        img.onload = function() {
          endTime = new Date().getTime();
          var duration = endTime - startTime;
          var speedKbps = option.imageSize / duration;
          var speedMbps = speedKbps / 1024;
          resolve({
            imageSize: option.imageSize,
            duration: duration,
            speedKbps: speedKbps,
            speedMbps: speedMbps
          });
        };

        startTime = new Date().getTime();
        setTimeout(function() {
          img.src = option.imageUrl + '?time=' + startTime;
        }, 0);
      });
    }

    (function loop() {
      setTimeout(function() {
        detect().then(function(result) {
          callback(result);
          loop();
        });
      }, option.time);
    })();
  };
});
