/* eslint no-param-reassign : "off" */
/* eslint no-use-before-define : "off" */

'use strict';

// puzzle solution is one that matches filter
// but you can see even more solutions by turning filter off
const FILTERENABLED = true;

const FILTER = [
  'E...', '....', '....',
  '....', 'A...', '...5',
  '.6..', '....', '..D.',
].map(e => new RegExp(e));

// utils
const timed = (func, ...args) => {
  const start = Date.now();
  func(...args);
  return `${func.name}(..) ran for ${(Date.now() - start) / 1000}s`;
};

const transpose = m => m[0].map((_, i) => m.map(r => r[i]));
const col = n => String.fromCharCode(n + 65);
const row = n => `${n + 1}`;
const boardEmpty = m => m.find(line => line.join('').match(/[BYGPRO]+/) !== null) === undefined;
const deepCopy = m => m.map(line => line.slice());
const enumerate = n => Array(n).keys();

const [RIGHT, RIGHTREVERSE, DOWN, DOWNREVERSE] = enumerate(4);

const colours = {
  B: 'Blue',
  Y: 'Yellow',
  G: 'Green',
  P: 'Purple',
  R: 'Red',
  O: 'Orange',
};

// . will indicate an empty position once matches occurs
// const BOARD = [
//   ['B', 'R', 'Y', 'B', 'Y', 'Y'],
//   ['P', 'O', 'R', 'B', 'Y', 'R'],
//   ['O', 'G', 'B', 'R', 'B', 'Y'],
//   ['G', 'P', 'O', 'G', 'O', 'O'],
//   ['P', 'O', 'P', 'B', 'P', 'P'],
//   ['G', 'G', 'R', 'G', 'R', 'Y'],
// ];

const BOARD = [
  ['B', 'R', 'Y', 'B', 'Y', 'Y'],
  ['P', 'O', 'R', 'B', 'Y', 'R'],
  ['O', 'G', 'B', 'R', 'B', 'Y'],
  ['G', 'P', 'O', 'G', 'O', 'O'],
  ['P', 'O', 'P', 'B', 'P', 'P'],
  ['G', 'G', 'R', 'G', 'R', 'Y'],
];

const EMPTY = '.';

class MOVES {
  constructor(move) {
    this.boardCleared = false;
    this.node = move;
    this.children = [];
  }

  add(move) {
    const child = new MOVES(move);
    this.children.push(child);
    return child;
  }
}

// uses regex to find 3 or more
const findMatches = (m) => {
  const matches = [];
  const mt = transpose(m);

  const search = (b, t) => {
    b.forEach((line, i) => {
      const re = /([BYGPRO])\1{2,}/g;
      let match;
      const find = () => { match = re.exec(line.join('')); };
      find();
      while (match !== null) {
        const { 0: pattern, index } = match;
        matches.push({
          x: t ? i : index,
          y: t ? index : i,
          length: pattern.length,
          at: t ? col(i) + row(index) : col(index) + row(i),
          pattern: `${pattern.length}x ${colours[pattern[0]]}`,
          heading: t ? 'down' : 'right',
        });
        find();
      }
    });
  };

  search(m);
  search(mt, true);

  return matches;
};

const swap = (m, y, x, d) => {
  // console.log('swap started with', m);
  // if we are on an empty tile don't do anything
  if (m[y][x] === EMPTY) return false;

  switch (d) {
    case RIGHTREVERSE:
    case RIGHT: // no right edge or same swaps or swaps with empty
      if (x > m[0].length - 2 || m[y][x] === m[y][x + 1] || m[y][x + 1] === EMPTY) return false;
      ([m[y][x], m[y][x + 1]] = [m[y][x + 1], m[y][x]]);
      return true;
    case DOWNREVERSE:
    case DOWN: // no bottom row or same swaps or swaps with empty
      if (y > m.length - 2 || m[y][x] === m[y + 1][x] || m[y + 1][x] === EMPTY) return false;
      ([m[y][x], m[y + 1][x]] = [m[y + 1][x], m[y][x]]);
      return true;
    default: return false;
  }
};

const attemptMove = (m, y, x, d, n, moves) => {
  // console.log('attemptMove d/n/y/x', d, n, y, x);
  const MOVE = d === RIGHT
    ? `${col(x)}${row(y)}${col(x + 1)}${row(y)}`
    : `${col(x)}${row(y)}${col(x)}${row(y + 1)}`;
  if (!FILTERENABLED || MOVE.match(FILTER[FILTER.length - n])) {
    if (swap(m, y, x, d)) {
      const matches = findMatches(m);
      if (matches.length) { // match found
        // console.log(`attemptMove ${MOVE} created matches\n`, m);
        const child = moves.add(MOVE); // save move
        // console.log(`Move #${FILTER.length - n + 1} ${MOVE}:\n${JSON.stringify(matches, null, 2)}`);
        let m2 = deepCopy(m);
        m2 = removeMatches(m2, matches);
        findMoves(m2, n - 1, child);
      } else { // reverse move
        // console.log('attemptMove MATCH FAIL');
      }
      swap(m, y, x, d + 1);
    } else {
      // console.log('attemptMove SWAP FAIL');
    }
  } else {
    // console.log('attemptMove filter FAIL');
  }
};

const collapseBoard = (m) => {
// board collapse code
  // console.log('collapse Board Start', m);
  const mt = transpose(m);
  const mw = [];
  mt.forEach((line) => {
    const str = line.join('');
    mw.push(str.replace(/[^BYGPRO]/g, '').padStart(6, EMPTY).split(''));
  });
  m = transpose(mw);
  // console.log('collapse Board Finish', m);
  return m;
};

const removeMatches = (m, matches) => {
  // console.log('before removeMatches', m);
  let mt;
  matches.forEach((match) => {
    const {
      x, y, length, heading,
    } = match;
    switch (heading) {
      case 'right':
        m[y].splice(x, length, ...Array(length + 1).join(EMPTY));
        break;
      case 'down':
        mt = transpose(m);
        // console.log('down interim 1 transposed', mt);
        mt[x].splice(y, length, ...Array(length + 1).join(EMPTY));
        // console.log('down interim 2 transposed', mt);
        m = transpose(mt);
        break;
      default: break;
    }
  });
  // console.log('after removeMatches', m);
  return collapseBoard(m);
};

const findMoves = (m, n, moves) => {
  // console.log('find moves called with\n', m, n);
  if (n === 0) {
    if (boardEmpty(m)) { moves.boardCleared = true; }
    return;
  }
  m.forEach((line, y) => {
    line.forEach((_, x) => {
      attemptMove(m, y, x, RIGHT, n, moves);
      attemptMove(m, y, x, DOWN, n, moves);
    });
  });
};

// findMoves(BOARD, FILTER.length);
const movesRoot = new MOVES('');
console.log(`\n${timed(findMoves, BOARD, FILTER.length, movesRoot)}`);
console.log(JSON.stringify(movesRoot));
// create function to display all move sets found
// const printOut = (moves) => {
//   console.log(moves.node);
// };
