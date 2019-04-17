const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const { uglify } = require('rollup-plugin-uglify');
const { version } = require('./package.json');
const isProd = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.js',
  output: {
    name: 'DetectConnectionSpeed',
    file: isProd
      ? 'dist/detectConnectionSpeed.js'
      : 'docs/detectConnectionSpeed-uncompiled.js',
    format: 'umd'
  },
  plugins: [
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
      plugins: [
        '@babel/plugin-external-helpers',
        '@babel/plugin-transform-runtime'
      ]
    }),
    nodeResolve(),
    commonjs(),
    replace({
      __ENV__: JSON.stringify(process.env.NODE_ENV || 'development'),
      __VERSION__: version
    }),
    isProd && uglify()
  ]
};
