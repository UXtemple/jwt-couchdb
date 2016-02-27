import babel from 'rollup-plugin-babel';

export default {
  dest: 'cjs.js', 
  entry: 'index.js',
  format: 'cjs',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
