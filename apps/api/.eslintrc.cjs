const base = require('../../packages/config/eslint.base.cjs');

module.exports = {
  ...base,
  env: { ...base.env, jest: true },
};
