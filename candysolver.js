/* eslint no-param-reassign : "off", no-use-before-define : "off" */

'use strict';

const FILTER = [
  'E...', '....', '....',
  '....', 'A...', '...5',
  '.6..', '....', '..D.',
].map(e => new RegExp(e));

const FILTERENABLED = true;

const timed = (func, ...args) => {
  const start = Date.now();
  func(...args);
  return `${(Date.now() - start)}ms`;
};

const transpose = m => m[0].map((_, i) => m.map(r => r[i]));
const col = n => String.fromCharCode(n + 65);
const row = n => `${n + 1}`;
const boardEmpty = m => m.find(line => line.join('').match(/[BYGPRO]+/) !== null) === undefined;
const deepCopy = m => m.map(line => line.slice());
const enumerate = n => Array(n).keys();

const [RIGHT, RIGHTREVERSE, DOWN, DOWNREVERSE] = enumerate(4);

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
    this.node = move ? [move] : [];
    this.children = [];
  }

  add(move) {
    const child = new MOVES(move);
    this.children.push(child);
    return child;
  }
}

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
          heading: t ? DOWN : RIGHT,
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
  const MOVE = d === RIGHT
    ? `${col(x)}${row(y)}${col(x + 1)}${row(y)}`
    : `${col(x)}${row(y)}${col(x)}${row(y + 1)}`;
  if (!FILTERENABLED || MOVE.match(FILTER[FILTER.length - n])) {
    if (swap(m, y, x, d)) {
      const matches = findMatches(m);
      if (matches.length) { // make child board for recursion
        const m2 = removeMatches(deepCopy(m), matches);
        findMoves(m2, n - 1, moves.add(MOVE));
      }
      swap(m, y, x, d + 1);
    }
  }
};

const collapseBoard = (m) => {
  m = transpose(m);
  m.forEach((line) => {
    line.splice(0,
      line.length,
      ...line.join('')
        .replace(/[^BYGPRO]/g, '')
        .padStart(line.length, EMPTY)
        .split(''));
  });
  m = transpose(m);
  const matches = findMatches(m); // cascade clear support
  if (matches.length) return removeMatches(m, matches);
  return m;
};

const removeMatches = (m, matches) => {
  let mt;
  matches.forEach((match) => {
    const {
      x, y, length, heading,
    } = match;
    switch (heading) {
      case RIGHT:
        m[y].splice(x, length, ...Array(length + 1).join(EMPTY));
        break;
      case DOWN:
        mt = transpose(m);
        mt[x].splice(y, length, ...Array(length + 1).join(EMPTY));
        m = transpose(mt);
        break;
      default: break;
    }
  });
  return collapseBoard(m);
};

const findMoves = (m, n, moves) => {
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

let total = 0;

const treeToArray = (moves, arr) => {
  if (moves.children.length === 0) {
    if (moves.node.length === FILTER.length) {
      total += 1;
      if (moves.boardCleared === true) {
        arr.push(moves.node.join(' '));
      }
    }
  } else { // tree is mutated since it won't be needed later
    moves.children.forEach((n) => {
      n.node.unshift(...moves.node);
      treeToArray(n, arr);
    });
  }
  return arr;
};

const movesTree = new MOVES();
console.log(`${timed(findMoves, BOARD, FILTER.length, movesTree)}`);
const boardClearingMoves = treeToArray(movesTree, []); // must follow findMoves
console.log(`\n${boardClearingMoves.length} solutions out of ${total} possible move sets\n`);
boardClearingMoves.forEach(m => console.log(m));
