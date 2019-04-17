# detect-connection-speed

Detect connection speed with JavaScript

## Install

Install with `npm`

```
$ npm install detect-connection-speed
```

Or install with `yarn`

```
$ yarn add detect-connection-speed
```

```js
import DetectConnectionSpeed from 'detect-connection-speed';
```

Or umd builds are also available

```html
<script src="path/to/detectConnectionSpeed.js"></script>
```

Will expose the global variable to `window.DetectConnectionSpeed`.

## Usage

```js
// Init
var detect = new DetectConnectionSpeed({
  url: '',
  loop: true,
  time: 1000,
  detectCallback: function(result) {
    console.log(result);
  }
});

// Destroy
detect.destroy();
```

## License

MIT © [Harvey Zack](https://sleepy.im/)
