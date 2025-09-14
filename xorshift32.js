 const [XSgetSeed, XSgetNext, XSrand] = (() => {
  const m = 2 ** 32;
  const XSgetSeed = () => Math.floor(Math.random() * (m - 1)) + 1;
  const s = Uint32Array.of(XSgetSeed());
  return [XSgetSeed, XSgetNext, (seed) => XSgetNext(seed) / m];
}

  function XSgetNext(seed) {
    if (seed !== undefined) s[0] = seed;
    s[0] ^= s[0] << 13;
    s[0] ^= s[0] >>> 17;
    s[0] ^= s[0] << 5;
    return s[0];
  }
