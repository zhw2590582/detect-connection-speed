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
import detectConnectionSpeed from "detect-connection-speed";
```

Or umd builds are also available

```html
<script src="path/to/detect-connection-speed.js"></script>
```

Will expose the global variable to `window.detectConnectionSpeed`.

## Usage

```js
detectConnectionSpeed(
  {
    imageUrl: 'https://avatars3.githubusercontent.com/u/5907357',
    imageSize: 29532,
    time: 1000
  },
  function(result) {
    console.log(result);
    // {
    //     duration,
    //     speedKbps,
    //     speedMbps,
    // }
  }
);
```

## License

MIT © [Harvey Zack](https://www.zhw-island.com/)
