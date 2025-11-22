export const clone = function (val) {
  try {
    return structuredClone(val);
  } catch (e) {
    try {
      return JSON.parse(JSON.stringify(val));
    } catch (e2) {
      return val;
    }
  }
};

export const humanize = function (str) {
  return str
    .replace(/^[\s_]+|[\s_]+$/g, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/^[a-z]/, function (m) {
      return m.toUpperCase();
    });
};
