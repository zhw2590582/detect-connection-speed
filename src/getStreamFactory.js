function supportsXhrResponseType(type) {
  try {
    const tmpXhr = new XMLHttpRequest();
    tmpXhr.responseType = type;
    return tmpXhr.responseType === type;
  } catch (e) {
    return false;
  }
}

let reader = null;
function fetchRequest(requestUrl, updateCallback, doneCallback) {
  fetch(requestUrl).then(response => {
    reader = response.body.getReader();
    (function read() {
      const readerStartTime = Date.now();
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            doneCallback();
            return;
          }
          const readerEndTime = Date.now();
          const streamTime = readerEndTime - readerStartTime;
          const streamSize = new Uint8Array(value).byteLength;
          updateCallback(streamSize, streamTime);
          read();
        })
        .catch(error => {
          throw error;
        });
    })();
  });
  return {
    destroy() {
      reader && reader.cancel();
    }
  };
}

let xhr = null;
function mozXhrRequest(requestUrl, updateCallback, doneCallback) {
  xhr = new XMLHttpRequest();
  xhr.open('GET', requestUrl, true);
  xhr.responseType = 'moz-chunked-arraybuffer';

  let readerStartTime = null;
  const progress = () => {
    const readerEndTime = Date.now();
    const streamTime = readerEndTime - readerStartTime;
    const streamSize = new Uint8Array(xhr.response).byteLength;
    updateCallback(streamSize, streamTime);
    readerStartTime = readerEndTime;
  };

  const readystatechange = () => {
    if (xhr.readyState === 2) {
      readerStartTime = Date.now();
    }
  };

  const loadend = () => {
    doneCallback();
  };

  const error = () => {
    throw error;
  };

  xhr.addEventListener('progress', progress);
  xhr.addEventListener('readystatechange', readystatechange);
  xhr.addEventListener('loadend', loadend);
  xhr.addEventListener('error', error);
  xhr.send();
  return {
    destroy() {
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

export default function getStreamFactory() {
  if (
    typeof Response !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(Response.prototype, 'body') &&
    typeof Headers === 'function'
  ) {
    return fetchRequest;
  }

  const mozChunked = 'moz-chunked-arraybuffer';
  if (supportsXhrResponseType(mozChunked)) {
    return mozXhrRequest;
  }

  throw new Error('Your browser does not currently support stream factory');
}
