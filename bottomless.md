Got it — you’d like the chain of accessed properties to “remember” its path, so you can do things like:

```js
console.log(foo.bar.baz.toString()); // "bar.baz"
```

You can extend the Proxy trick for that:

```js
function Bottomless(path = []) {
  return new Proxy(() => {}, {
    get(_, prop) {
      if (prop === "toString" || prop === "valueOf") {
        return () => path.join(".");
      }
      return Bottomless([...path, prop]);
    },
  });
}

const foo = Bottomless();

console.log(foo.bar.baz.toString()); // "bar.baz"
console.log(foo.hello.world.toString()); // "hello.world"
```

⚡ Notes:

- `toString` (and `valueOf`) are trapped so you can stringify naturally.
- The chain isn’t “real” objects anymore, but function proxies that track their path.
- You could also add a `.path` property if you prefer structured access.

Want me to make it so it **still supports assignment** (`foo.bar = 123`) _and_ path stringifying?
