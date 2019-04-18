import getStreamFactory from './getStreamFactory';

export default class DetectConnectionSpeed {
  constructor(option) {
    this.option = {
      url: '',
      loop: true,
      detectCallback: result => result,
      ...option
    };
    this.loopTimer = null;
    this.stream = null;
    this.seconds = [];
    this.calculateSecond = 0;
    this.streamFactory = getStreamFactory();
    this.detectStartTime = Date.now();
    this.detect();
  }

  detect() {
    this.requestUrl = this.option.url + '?time=' + Date.now();
    this.stream = this.streamFactory(
      this.requestUrl,
      this.updateCallback.bind(this),
      this.doneCallback.bind(this)
    );
  }

  updateCallback(streamSize, streamTime) {
    const item = { streamSize, streamTime };
    const second = Math.ceil((Date.now() - this.detectStartTime) / 1000);
    if (!this.seconds[second]) {
      this.calculate();
      this.seconds[second] = [item];
    } else {
      this.seconds[second].push(item);
    }
  }

  doneCallback() {
    if (this.option.loop) {
      if (this.stream && typeof this.stream.destroy === 'function') {
        this.stream.destroy();
      }
      this.detect();
    }
  }

  calculate() {
    const item = this.seconds[this.calculateSecond++] || [];
    const downloadTime = this.resultSum(item, 'streamTime') || 0;
    const downloadSize = this.resultSum(item, 'streamSize') || 0;
    const speedKbps = downloadSize / downloadTime || 0;
    const speedMbps = speedKbps / 1024;
    this.option.detectCallback({
      downloadTime,
      downloadSize,
      speedKbps,
      speedMbps
    });
  }

  resultSum(result, key) {
    return result.reduce((sum, item) => {
      return sum + item[key];
    }, 0);
  }

  destroy() {
    this.option.loop = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
    }
    if (this.stream && typeof this.stream.destroy === 'function') {
      this.stream.destroy();
    }
  }
}
