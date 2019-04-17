export default class DetectConnectionSpeed {
  constructor(option) {
    this.option = {
      url: '',
      loop: true,
      time: 1000,
      detectCallback: result => result,
      ...option
    };
    this.transportFactory = this.getStreamFactory();
    this.detect();
  }

  supportsXhrResponseType(type) {
    try {
      const tmpXhr = new XMLHttpRequest();
      tmpXhr.responseType = type;
      return tmpXhr.responseType === type;
    } catch (e) {
      return false;
    }
  }

  getStreamFactory() {
    if (
      typeof Response !== 'undefined' &&
      Object.prototype.hasOwnProperty.call(Response.prototype, 'body') &&
      typeof Headers === 'function'
    ) {
      return this.fetchRequest;
    }

    const mozChunked = 'moz-chunked-arraybuffer';
    if (this.supportsXhrResponseType(mozChunked)) {
      return this.mozXhrRequest;
    }

    return this.xhrRequest;
  }

  detect() {
    this.timer = null;
    this.result = [];
    this.detectStartTime = new Date().getTime();
    this.requestUrl = this.option.url + '?time=' + this.detectStartTime;
    this.transportFactory();
  }

  fetchRequest() {
    if (typeof window.fetch !== 'function') {
      throw new Error('fetch function is not supported in your environment');
    }
    this.reader = null;
    return fetch(this.requestUrl).then(response => {
      if (typeof response.body.getReader !== 'function') {
        throw new Error(
          'response.body.getReader function is not supported in your environment'
        );
      }
      this.reader = response.body.getReader();
      (function read() {
        const readerStartTime = new Date().getTime();
        this.reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              this.summary();
              if (this.option.loop) {
                this.timer = setTimeout(
                  this.detect.bind(this),
                  this.option.time
                );
              }
              return;
            }
            const readerEndTime = new Date().getTime();
            this.calculate(
              new Uint8Array(value),
              readerEndTime - readerStartTime
            );
            read.call(this);
          })
          .catch(error => {
            throw error;
          });
      }.call(this));
    });
  }

  mozXhrRequest() {
    this.xhr = new XMLHttpRequest();
    this.xhr.open('GET', this.requestUrl, true);
    this.xhr.responseType = 'moz-chunked-arraybuffer';

    let readerStartTime = null;
    const progress = () => {
      const readerEndTime = new Date().getTime();
      const streamTime = readerEndTime - readerStartTime;
      this.calculate(new Uint8Array(this.xhr.response), streamTime);
      readerStartTime = readerEndTime;
    };

    const readystatechange = () => {
      if (this.xhr.readyState === 2) {
        readerStartTime = new Date().getTime();
      }
    };

    const loadend = () => {
      this.summary();
      if (this.option.loop) {
        this.timer = setTimeout(this.detect.bind(this), this.option.time);
      }
    };

    const error = () => {
      throw error;
    };

    this.xhr.addEventListener('progress', progress);
    this.xhr.addEventListener('readystatechange', readystatechange);
    this.xhr.addEventListener('loadend', loadend);
    this.xhr.addEventListener('error', error);
    this.xhr.destroy = () => {
      this.xhr.removeEventListener('progress', progress);
      this.xhr.removeEventListener('readystatechange', readystatechange);
      this.xhr.removeEventListener('loadend', loadend);
      this.xhr.removeEventListener('error', error);
    };

    this.xhr.send();
  }

  calculate(uint8, streamTime) {
    this.result.push({
      streamSize: uint8.byteLength,
      streamTime
    });
  }

  summary() {
    const detectEndTime = new Date().getTime();
    const detectTime = detectEndTime - this.detectStartTime;
    const downloadTime = this.resultSum('streamTime');
    const waitingTime = detectTime - downloadTime;
    const downloadSize = this.resultSum('streamSize');
    const speedKbps = downloadSize / downloadTime;
    const speedMbps = speedKbps / 1024;
    this.option.detectCallback({
      detectTime,
      downloadTime,
      downloadSize,
      waitingTime,
      speedKbps,
      speedMbps
    });
  }

  resultSum(key) {
    return this.result.reduce((sum, item) => {
      return sum + item[key];
    }, 0);
  }

  destroy() {
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
}
