//   ____                _    ____
//  / ___|_ __ __ _  ___| | _|  _ \  _____      ___ __
// | |   | '__/ _` |/ __| |/ / | | |/ _ \ \ /\ / / '_ \
// | |___| | | (_| | (__|   <| |_| | (_) \ V  V /| | | |
//  \____|_|  \__,_|\___|_|\_\____/ \___/ \_/\_/ |_| |_|
//
//
//  _ __   __ _ _ __ ___  ___ _ __
// | '_ \ / _` | '__/ __|/ _ \ '__|
// | |_) | (_| | |  \__ \  __/ |
// | .__/ \__,_|_|  |___/\___|_|
// |_|
export function crackdown(text) {
  console.debug("starting crack parsing");
  console.debug(text);
  return text
    .replace(/[&<>"'`]/g, (c) => {
      switch (c) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#039;";
        case "`":
          return "&#096;";
        default:
          return c;
      }
    })
    .replace(
      /---(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])---/g,
      '<span class="strike">$1</span>',
    ) // line-through
    .replace(
      /___(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])___/g,
      '<span class="underline">$1</span>',
    ) // underline
    .replace(
      /_(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])_/g,
      '<span class="italic">$1</span>',
    ) // italic
    .replace(
      /\*(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])\*/g,
      '<span class="bold">$1</span>',
    ) // bold
    .replace(
      /\.{3}(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])\.{3}/g,
      '<span class="undercurl">$1</span>',
    ) // undercurl
    .replace(
      /\({3}(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])\){3}/g,
      '<span class="faint">($1)</span>',
    ) // faint with parentheses
    .replace(
      /\({2}(([a-zA-Z0-9:].*?[a-zA-Z0-9:])|[a-zA-Z0-9:])\){2}/g,
      '<span class="faint">$1</span>',
    ); // faint with parentheses

  console.debug("crack output", text);

  return text;
}
