(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.itemsjs = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

module.exports = require('./src/index');

},{"./src/index":7}],2:[function(require,module,exports){
/* FastBitSet.js : a fast bit set implementation in JavaScript.
 * (c) the authors
 * Licensed under the Apache License, Version 2.0.
 *
 * Speed-optimized BitSet implementation for modern browsers and JavaScript engines.
 *
 * A BitSet is an ideal data structure to implement a Set when values being stored are
 * reasonably small integers. It can be orders of magnitude faster than a generic set implementation.
 * The FastBitSet implementation optimizes for speed, leveraging commonly available features
 * like typed arrays.
 *
 * Simple usage :
 *  // const FastBitSet = require("fastbitset");// if you use node
 *  const b = new FastBitSet();// initially empty
 *  b.add(1);// add the value "1"
 *  b.has(1); // check that the value is present! (will return true)
 *  b.add(2);
 *  console.log(""+b);// should display {1,2}
 *  b.add(10);
 *  b.array(); // would return [1,2,10]
 *
 *  let c = new FastBitSet([1,2,3,10]); // create bitset initialized with values 1,2,3,10
 *  c.difference(b); // from c, remove elements that are in b (modifies c)
 *  c.difference2(b); // from c, remove elements that are in b (modifies b)
 *  c.change(b); // c will contain elements that are in b or in c, but not both
 *  const su = c.union_size(b);// compute the size of the union (bitsets are unchanged)
 *  c.union(b); // c will contain all elements that are in c and b
 *  const s1 = c.intersection_size(b);// compute the size of the intersection (bitsets are unchanged)
 *  c.intersection(b); // c will only contain elements that are in both c and b
 *  c = b.clone(); // create a (deep) copy of b and assign it to c.
 *  c.equals(b); // check whether c and b are equal
 *
 *   See README.md file for a more complete description.
 *
 * You can install the library under node with the command line
 *   npm install fastbitset
 */

"use strict";

// you can provide an iterable
function FastBitSet(iterable) {
  this.words = [];

  if (iterable) {
    if (Symbol && Symbol.iterator && iterable[Symbol.iterator] !== undefined) {
      const iterator = iterable[Symbol.iterator]();
      let current = iterator.next();
      while (!current.done) {
        this.add(current.value);
        current = iterator.next();
      }
    } else {
      for (let i = 0; i < iterable.length; i++) {
        this.add(iterable[i]);
      }
    }
  }
}

// Creates a bitmap from words
FastBitSet.prototype.fromWords = function (words) {
  const bitSet = Object.create(FastBitSet.prototype);
  bitSet.words = words;
  return bitSet;
};

// Add the value (Set the bit at index to true)
FastBitSet.prototype.add = function (index) {
  this.resize(index);
  this.words[index >>> 5] |= 1 << index;
};

// If the value was not in the set, add it, otherwise remove it (flip bit at index)
FastBitSet.prototype.flip = function (index) {
  this.resize(index);
  this.words[index >>> 5] ^= 1 << index;
};

// Remove all values, reset memory usage
FastBitSet.prototype.clear = function () {
  this.words.length = 0;
};

// Set the bit at index to false
FastBitSet.prototype.remove = function (index) {
  this.resize(index);
  this.words[index >>> 5] &= ~(1 << index);
};

// Return true if no bit is set
FastBitSet.prototype.isEmpty = function (index) {
  const c = this.words.length;
  for (let i = 0; i < c; i++) {
    if (this.words[i] !== 0) return false;
  }
  return true;
};

// Is the value contained in the set? Is the bit at index true or false? Returns a boolean
FastBitSet.prototype.has = function (index) {
  return (this.words[index >>> 5] & (1 << index)) !== 0;
};

// Tries to add the value (Set the bit at index to true), return 1 if the
// value was added, return 0 if the value was already present
FastBitSet.prototype.checkedAdd = function (index) {
  this.resize(index);
  const word = this.words[index >>> 5];
  const newword = word | (1 << index);
  this.words[index >>> 5] = newword;
  return (newword ^ word) >>> index;
};

// Reduce the memory usage to a minimum
FastBitSet.prototype.trim = function (index) {
  let nl = this.words.length;
  while (nl > 0 && this.words[nl - 1] === 0) {
    nl--;
  }
  this.words = this.words.slice(0, nl);
};

// Resize the bitset so that we can write a value at index
FastBitSet.prototype.resize = function (index) {
  const count = (index + 32) >>> 5; // just what is needed
  for (let i = this.words.length; i < count; i++) this.words[i] = 0;
};

// fast function to compute the Hamming weight of a 32-bit unsigned integer
FastBitSet.prototype.hammingWeight = function (v) {
  v -= (v >>> 1) & 0x55555555; // works with signed or unsigned shifts
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
};

// fast function to compute the Hamming weight of four 32-bit unsigned integers
FastBitSet.prototype.hammingWeight4 = function (v1, v2, v3, v4) {
  v1 -= (v1 >>> 1) & 0x55555555; // works with signed or unsigned shifts
  v2 -= (v2 >>> 1) & 0x55555555; // works with signed or unsigned shifts
  v3 -= (v3 >>> 1) & 0x55555555; // works with signed or unsigned shifts
  v4 -= (v4 >>> 1) & 0x55555555; // works with signed or unsigned shifts

  v1 = (v1 & 0x33333333) + ((v1 >>> 2) & 0x33333333);
  v2 = (v2 & 0x33333333) + ((v2 >>> 2) & 0x33333333);
  v3 = (v3 & 0x33333333) + ((v3 >>> 2) & 0x33333333);
  v4 = (v4 & 0x33333333) + ((v4 >>> 2) & 0x33333333);

  v1 = (v1 + (v1 >>> 4)) & 0xf0f0f0f;
  v2 = (v2 + (v2 >>> 4)) & 0xf0f0f0f;
  v3 = (v3 + (v3 >>> 4)) & 0xf0f0f0f;
  v4 = (v4 + (v4 >>> 4)) & 0xf0f0f0f;
  return ((v1 + v2 + v3 + v4) * 0x1010101) >>> 24;
};

// How many values stored in the set? How many set bits?
FastBitSet.prototype.size = function () {
  let answer = 0;
  const c = this.words.length;
  const w = this.words;
  for (let i = 0; i < c; i++) {
    answer += this.hammingWeight(w[i]);
  }
  return answer;
};

// Return an array with the set bit locations (values)
FastBitSet.prototype.array = function () {
  const answer = new Array(this.size());
  let pos = 0 | 0;
  const c = this.words.length;
  for (let k = 0; k < c; ++k) {
    let w = this.words[k];
    while (w != 0) {
      const t = w & -w;
      answer[pos++] = (k << 5) + this.hammingWeight((t - 1) | 0);
      w ^= t;
    }
  }
  return answer;
};

// Return an array with the set bit locations (values)
FastBitSet.prototype.forEach = function (fnc) {
  const c = this.words.length;
  for (let k = 0; k < c; ++k) {
    let w = this.words[k];
    while (w != 0) {
      const t = w & -w;
      fnc((k << 5) + this.hammingWeight((t - 1) | 0));
      w ^= t;
    }
  }
};

// Returns an iterator of set bit locations (values)
FastBitSet.prototype[Symbol.iterator] = function* () {
  const c = this.words.length;
  for (let k = 0; k < c; ++k) {
    let w = this.words[k];
    while (w != 0) {
      const t = w & -w;
      yield (k << 5) + this.hammingWeight((t - 1) | 0);
      w ^= t;
    }
  }
};

// Creates a copy of this bitmap
FastBitSet.prototype.clone = function () {
  const clone = Object.create(FastBitSet.prototype);
  clone.words = this.words.slice();
  return clone;
};

// Check if this bitset intersects with another one,
// no bitmap is modified
FastBitSet.prototype.intersects = function (otherbitmap) {
  const newcount = Math.min(this.words.length, otherbitmap.words.length);
  for (let k = 0 | 0; k < newcount; ++k) {
    if ((this.words[k] & otherbitmap.words[k]) !== 0) return true;
  }
  return false;
};

// Computes the intersection between this bitset and another one,
// the current bitmap is modified  (and returned by the function)
FastBitSet.prototype.intersection = function (otherbitmap) {
  const newcount = Math.min(this.words.length, otherbitmap.words.length);
  let k = 0 | 0;
  for (; k + 7 < newcount; k += 8) {
    this.words[k] &= otherbitmap.words[k];
    this.words[k + 1] &= otherbitmap.words[k + 1];
    this.words[k + 2] &= otherbitmap.words[k + 2];
    this.words[k + 3] &= otherbitmap.words[k + 3];
    this.words[k + 4] &= otherbitmap.words[k + 4];
    this.words[k + 5] &= otherbitmap.words[k + 5];
    this.words[k + 6] &= otherbitmap.words[k + 6];
    this.words[k + 7] &= otherbitmap.words[k + 7];
  }
  for (; k < newcount; ++k) {
    this.words[k] &= otherbitmap.words[k];
  }
  const c = this.words.length;
  for (k = newcount; k < c; ++k) {
    this.words[k] = 0;
  }
  return this;
};

// Computes the size of the intersection between this bitset and another one
FastBitSet.prototype.intersection_size = function (otherbitmap) {
  const newcount = Math.min(this.words.length, otherbitmap.words.length);
  let answer = 0 | 0;
  for (let k = 0 | 0; k < newcount; ++k) {
    answer += this.hammingWeight(this.words[k] & otherbitmap.words[k]);
  }

  return answer;
};

// Computes the intersection between this bitset and another one,
// a new bitmap is generated
FastBitSet.prototype.new_intersection = function (otherbitmap) {
  const answer = Object.create(FastBitSet.prototype);
  const count = Math.min(this.words.length, otherbitmap.words.length);
  answer.words = new Array(count);
  let k = 0 | 0;
  for (; k + 7 < count; k += 8) {
    answer.words[k] = this.words[k] & otherbitmap.words[k];
    answer.words[k + 1] = this.words[k + 1] & otherbitmap.words[k + 1];
    answer.words[k + 2] = this.words[k + 2] & otherbitmap.words[k + 2];
    answer.words[k + 3] = this.words[k + 3] & otherbitmap.words[k + 3];
    answer.words[k + 4] = this.words[k + 4] & otherbitmap.words[k + 4];
    answer.words[k + 5] = this.words[k + 5] & otherbitmap.words[k + 5];
    answer.words[k + 6] = this.words[k + 6] & otherbitmap.words[k + 6];
    answer.words[k + 7] = this.words[k + 7] & otherbitmap.words[k + 7];
  }
  for (; k < count; ++k) {
    answer.words[k] = this.words[k] & otherbitmap.words[k];
  }
  return answer;
};

// Computes the intersection between this bitset and another one,
// the current bitmap is modified
FastBitSet.prototype.equals = function (otherbitmap) {
  const mcount = Math.min(this.words.length, otherbitmap.words.length);
  for (let k = 0 | 0; k < mcount; ++k) {
    if (this.words[k] != otherbitmap.words[k]) return false;
  }
  if (this.words.length < otherbitmap.words.length) {
    const c = otherbitmap.words.length;
    for (let k = this.words.length; k < c; ++k) {
      if (otherbitmap.words[k] != 0) return false;
    }
  } else if (otherbitmap.words.length < this.words.length) {
    const c = this.words.length;
    for (let k = otherbitmap.words.length; k < c; ++k) {
      if (this.words[k] != 0) return false;
    }
  }
  return true;
};

// Computes the difference between this bitset and another one,
// the current bitset is modified (and returned by the function)
// (for this set A and other set B,
//   this computes A = A - B  and returns A)
FastBitSet.prototype.difference = function (otherbitmap) {
  const newcount = Math.min(this.words.length, otherbitmap.words.length);
  let k = 0 | 0;
  for (; k + 7 < newcount; k += 8) {
    this.words[k] &= ~otherbitmap.words[k];
    this.words[k + 1] &= ~otherbitmap.words[k + 1];
    this.words[k + 2] &= ~otherbitmap.words[k + 2];
    this.words[k + 3] &= ~otherbitmap.words[k + 3];
    this.words[k + 4] &= ~otherbitmap.words[k + 4];
    this.words[k + 5] &= ~otherbitmap.words[k + 5];
    this.words[k + 6] &= ~otherbitmap.words[k + 6];
    this.words[k + 7] &= ~otherbitmap.words[k + 7];
  }
  for (; k < newcount; ++k) {
    this.words[k] &= ~otherbitmap.words[k];
  }
  return this;
};

// Computes the difference between this bitset and another one,
// the other bitset is modified (and returned by the function)
// (for this set A and other set B,
//   this computes B = A - B  and returns B)
FastBitSet.prototype.difference2 = function (otherbitmap) {
  const mincount = Math.min(this.words.length, otherbitmap.words.length);
  let k = 0 | 0;
  for (; k + 7 < mincount; k += 8) {
    otherbitmap.words[k] = this.words[k] & ~otherbitmap.words[k];
    otherbitmap.words[k + 1] = this.words[k + 1] & ~otherbitmap.words[k + 1];
    otherbitmap.words[k + 2] = this.words[k + 2] & ~otherbitmap.words[k + 2];
    otherbitmap.words[k + 3] = this.words[k + 3] & ~otherbitmap.words[k + 3];
    otherbitmap.words[k + 4] = this.words[k + 4] & ~otherbitmap.words[k + 4];
    otherbitmap.words[k + 5] = this.words[k + 5] & ~otherbitmap.words[k + 5];
    otherbitmap.words[k + 6] = this.words[k + 6] & ~otherbitmap.words[k + 6];
    otherbitmap.words[k + 7] = this.words[k + 7] & ~otherbitmap.words[k + 7];
  }
  for (; k < mincount; ++k) {
    otherbitmap.words[k] = this.words[k] & ~otherbitmap.words[k];
  }
  // remaining words are all part of difference
  for (k = this.words.length - 1; k >= mincount; --k) {
    otherbitmap.words[k] = this.words[k];
  }
  otherbitmap.words = otherbitmap.words.slice(0, this.words.length);
  return otherbitmap;
};

// Computes the difference between this bitset and another one,
// a new bitmap is generated
FastBitSet.prototype.new_difference = function (otherbitmap) {
  return this.clone().difference(otherbitmap); // should be fast enough
};

// Computes the size of the difference between this bitset and another one
FastBitSet.prototype.difference_size = function (otherbitmap) {
  const newcount = Math.min(this.words.length, otherbitmap.words.length);
  let answer = 0 | 0;
  let k = 0 | 0;
  for (; k < newcount; ++k) {
    answer += this.hammingWeight(this.words[k] & ~otherbitmap.words[k]);
  }
  const c = this.words.length;
  for (; k < c; ++k) {
    answer += this.hammingWeight(this.words[k]);
  }
  return answer;
};

// Computes the changed elements (XOR) between this bitset and another one,
// the current bitset is modified (and returned by the function)
FastBitSet.prototype.change = function (otherbitmap) {
  const mincount = Math.min(this.words.length, otherbitmap.words.length);
  let k = 0 | 0;
  for (; k + 7 < mincount; k += 8) {
    this.words[k] ^= otherbitmap.words[k];
    this.words[k + 1] ^= otherbitmap.words[k + 1];
    this.words[k + 2] ^= otherbitmap.words[k + 2];
    this.words[k + 3] ^= otherbitmap.words[k + 3];
    this.words[k + 4] ^= otherbitmap.words[k + 4];
    this.words[k + 5] ^= otherbitmap.words[k + 5];
    this.words[k + 6] ^= otherbitmap.words[k + 6];
    this.words[k + 7] ^= otherbitmap.words[k + 7];
  }
  for (; k < mincount; ++k) {
    this.words[k] ^= otherbitmap.words[k];
  }
  // remaining words are all part of change
  for (k = otherbitmap.words.length - 1; k >= mincount; --k) {
    this.words[k] = otherbitmap.words[k];
  }
  return this;
};

// Computes the change between this bitset and another one,
// a new bitmap is generated
FastBitSet.prototype.new_change = function (otherbitmap) {
  const answer = Object.create(FastBitSet.prototype);
  const count = Math.max(this.words.length, otherbitmap.words.length);
  answer.words = new Array(count);
  const mcount = Math.min(this.words.length, otherbitmap.words.length);
  let k = 0;
  for (; k + 7 < mcount; k += 8) {
    answer.words[k] = this.words[k] ^ otherbitmap.words[k];
    answer.words[k + 1] = this.words[k + 1] ^ otherbitmap.words[k + 1];
    answer.words[k + 2] = this.words[k + 2] ^ otherbitmap.words[k + 2];
    answer.words[k + 3] = this.words[k + 3] ^ otherbitmap.words[k + 3];
    answer.words[k + 4] = this.words[k + 4] ^ otherbitmap.words[k + 4];
    answer.words[k + 5] = this.words[k + 5] ^ otherbitmap.words[k + 5];
    answer.words[k + 6] = this.words[k + 6] ^ otherbitmap.words[k + 6];
    answer.words[k + 7] = this.words[k + 7] ^ otherbitmap.words[k + 7];
  }
  for (; k < mcount; ++k) {
    answer.words[k] = this.words[k] ^ otherbitmap.words[k];
  }

  const c = this.words.length;
  for (k = mcount; k < c; ++k) {
    answer.words[k] = this.words[k];
  }
  const c2 = otherbitmap.words.length;
  for (k = mcount; k < c2; ++k) {
    answer.words[k] = otherbitmap.words[k];
  }
  return answer;
};

// Computes the number of changed elements between this bitset and another one
FastBitSet.prototype.change_size = function (otherbitmap) {
  const mincount = Math.min(this.words.length, otherbitmap.words.length);
  let answer = 0 | 0;
  let k = 0 | 0;
  for (; k < mincount; ++k) {
    answer += this.hammingWeight(this.words[k] ^ otherbitmap.words[k]);
  }
  const longer =
    this.words.length > otherbitmap.words.length ? this : otherbitmap;
  const c = longer.words.length;
  for (; k < c; ++k) {
    answer += this.hammingWeight(longer.words[k]);
  }
  return answer;
};

// Returns a string representation
FastBitSet.prototype.toString = function () {
  return "{" + this.array().join(",") + "}";
};

// Computes the union between this bitset and another one,
// the current bitset is modified  (and returned by the function)
FastBitSet.prototype.union = function (otherbitmap) {
  const mcount = Math.min(this.words.length, otherbitmap.words.length);
  let k = 0 | 0;
  for (; k + 7 < mcount; k += 8) {
    this.words[k] |= otherbitmap.words[k];
    this.words[k + 1] |= otherbitmap.words[k + 1];
    this.words[k + 2] |= otherbitmap.words[k + 2];
    this.words[k + 3] |= otherbitmap.words[k + 3];
    this.words[k + 4] |= otherbitmap.words[k + 4];
    this.words[k + 5] |= otherbitmap.words[k + 5];
    this.words[k + 6] |= otherbitmap.words[k + 6];
    this.words[k + 7] |= otherbitmap.words[k + 7];
  }
  for (; k < mcount; ++k) {
    this.words[k] |= otherbitmap.words[k];
  }
  if (this.words.length < otherbitmap.words.length) {
    this.resize((otherbitmap.words.length << 5) - 1);
    const c = otherbitmap.words.length;
    for (let k = mcount; k < c; ++k) {
      this.words[k] = otherbitmap.words[k];
    }
  }
  return this;
};

FastBitSet.prototype.new_union = function (otherbitmap) {
  const answer = Object.create(FastBitSet.prototype);
  const count = Math.max(this.words.length, otherbitmap.words.length);
  answer.words = new Array(count);
  const mcount = Math.min(this.words.length, otherbitmap.words.length);
  let k = 0;
  for (; k + 7 < mcount; k += 8) {
    answer.words[k] = this.words[k] | otherbitmap.words[k];
    answer.words[k + 1] = this.words[k + 1] | otherbitmap.words[k + 1];
    answer.words[k + 2] = this.words[k + 2] | otherbitmap.words[k + 2];
    answer.words[k + 3] = this.words[k + 3] | otherbitmap.words[k + 3];
    answer.words[k + 4] = this.words[k + 4] | otherbitmap.words[k + 4];
    answer.words[k + 5] = this.words[k + 5] | otherbitmap.words[k + 5];
    answer.words[k + 6] = this.words[k + 6] | otherbitmap.words[k + 6];
    answer.words[k + 7] = this.words[k + 7] | otherbitmap.words[k + 7];
  }
  for (; k < mcount; ++k) {
    answer.words[k] = this.words[k] | otherbitmap.words[k];
  }
  const c = this.words.length;
  for (k = mcount; k < c; ++k) {
    answer.words[k] = this.words[k];
  }
  const c2 = otherbitmap.words.length;
  for (k = mcount; k < c2; ++k) {
    answer.words[k] = otherbitmap.words[k];
  }
  return answer;
};

// Computes the size union between this bitset and another one
FastBitSet.prototype.union_size = function (otherbitmap) {
  const mcount = Math.min(this.words.length, otherbitmap.words.length);
  let answer = 0 | 0;
  for (let k = 0 | 0; k < mcount; ++k) {
    answer += this.hammingWeight(this.words[k] | otherbitmap.words[k]);
  }
  if (this.words.length < otherbitmap.words.length) {
    const c = otherbitmap.words.length;
    for (let k = this.words.length; k < c; ++k) {
      answer += this.hammingWeight(otherbitmap.words[k] | 0);
    }
  } else {
    const c = this.words.length;
    for (let k = otherbitmap.words.length; k < c; ++k) {
      answer += this.hammingWeight(this.words[k] | 0);
    }
  }
  return answer;
};

///////////////

module.exports = FastBitSet;

},{}],3:[function(require,module,exports){
/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 1.0.0
 * Copyright (C) 2017 Oliver Nightingale
 * @license MIT
 */

;(function(){

/**
 * Convenience function for instantiating a new lunr index and configuring it
 * with the default pipeline functions and the passed config function.
 *
 * When using this convenience function a new index will be created with the
 * following functions already in the pipeline:
 *
 * lunr.StopWordFilter - filters out any stop words before they enter the
 * index
 *
 * lunr.stemmer - stems the tokens before entering the index.
 *
 * Example:
 *
 *     var idx = lunr(function () {
 *       this.field('title', 10)
 *       this.field('tags', 100)
 *       this.field('body')
 *       
 *       this.ref('cid')
 *       
 *       this.pipeline.add(function () {
 *         // some custom pipeline function
 *       })
 *       
 *     })
 *
 * @param {Function} config A function that will be called with the new instance
 * of the lunr.Index as both its context and first parameter. It can be used to
 * customize the instance of new lunr.Index.
 * @namespace
 * @module
 * @returns {lunr.Index}
 *
 */
var lunr = function (config) {
  var idx = new lunr.Index

  idx.pipeline.add(
    lunr.trimmer,
    lunr.stopWordFilter,
    lunr.stemmer
  )

  if (config) config.call(idx, idx)

  return idx
}

lunr.version = "1.0.0"
/*!
 * lunr.utils
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * A namespace containing utils for the rest of the lunr library
 */
lunr.utils = {}

/**
 * Print a warning message to the console.
 *
 * @param {String} message The message to be printed.
 * @memberOf Utils
 */
lunr.utils.warn = (function (global) {
  return function (message) {
    if (global.console && console.warn) {
      console.warn(message)
    }
  }
})(this)

/**
 * Convert an object to a string.
 *
 * In the case of `null` and `undefined` the function returns
 * the empty string, in all other cases the result of calling
 * `toString` on the passed object is returned.
 *
 * @param {Any} obj The object to convert to a string.
 * @return {String} string representation of the passed object.
 * @memberOf Utils
 */
lunr.utils.asString = function (obj) {
  if (obj === void 0 || obj === null) {
    return ""
  } else {
    return obj.toString()
  }
}
/*!
 * lunr.EventEmitter
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * lunr.EventEmitter is an event emitter for lunr. It manages adding and removing event handlers and triggering events and their handlers.
 *
 * @constructor
 */
lunr.EventEmitter = function () {
  this.events = {}
}

/**
 * Binds a handler function to a specific event(s).
 *
 * Can bind a single function to many different events in one call.
 *
 * @param {String} [eventName] The name(s) of events to bind this function to.
 * @param {Function} fn The function to call when an event is fired.
 * @memberOf EventEmitter
 */
lunr.EventEmitter.prototype.addListener = function () {
  var args = Array.prototype.slice.call(arguments),
      fn = args.pop(),
      names = args

  if (typeof fn !== "function") throw new TypeError ("last argument must be a function")

  names.forEach(function (name) {
    if (!this.hasHandler(name)) this.events[name] = []
    this.events[name].push(fn)
  }, this)
}

/**
 * Removes a handler function from a specific event.
 *
 * @param {String} eventName The name of the event to remove this function from.
 * @param {Function} fn The function to remove from an event.
 * @memberOf EventEmitter
 */
lunr.EventEmitter.prototype.removeListener = function (name, fn) {
  if (!this.hasHandler(name)) return

  var fnIndex = this.events[name].indexOf(fn)
  this.events[name].splice(fnIndex, 1)

  if (!this.events[name].length) delete this.events[name]
}

/**
 * Calls all functions bound to the given event.
 *
 * Additional data can be passed to the event handler as arguments to `emit`
 * after the event name.
 *
 * @param {String} eventName The name of the event to emit.
 * @memberOf EventEmitter
 */
lunr.EventEmitter.prototype.emit = function (name) {
  if (!this.hasHandler(name)) return

  var args = Array.prototype.slice.call(arguments, 1)

  this.events[name].forEach(function (fn) {
    fn.apply(undefined, args)
  })
}

/**
 * Checks whether a handler has ever been stored against an event.
 *
 * @param {String} eventName The name of the event to check.
 * @private
 * @memberOf EventEmitter
 */
lunr.EventEmitter.prototype.hasHandler = function (name) {
  return name in this.events
}

/*!
 * lunr.tokenizer
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * A function for splitting a string into tokens ready to be inserted into
 * the search index. Uses `lunr.tokenizer.separator` to split strings, change
 * the value of this property to change how strings are split into tokens.
 *
 * @module
 * @param {String} obj The string to convert into tokens
 * @see lunr.tokenizer.separator
 * @returns {Array}
 */
lunr.tokenizer = function (obj) {
  if (!arguments.length || obj == null || obj == undefined) return []
  if (Array.isArray(obj)) return obj.map(function (t) { return lunr.utils.asString(t).toLowerCase() })

  return obj.toString().trim().toLowerCase().split(lunr.tokenizer.separator)
}

/**
 * The sperator used to split a string into tokens. Override this property to change the behaviour of
 * `lunr.tokenizer` behaviour when tokenizing strings. By default this splits on whitespace and hyphens.
 *
 * @static
 * @see lunr.tokenizer
 */
lunr.tokenizer.separator = /[\s\-]+/

/**
 * Loads a previously serialised tokenizer.
 *
 * A tokenizer function to be loaded must already be registered with lunr.tokenizer.
 * If the serialised tokenizer has not been registered then an error will be thrown.
 *
 * @param {String} label The label of the serialised tokenizer.
 * @returns {Function}
 * @memberOf tokenizer
 */
lunr.tokenizer.load = function (label) {
  var fn = this.registeredFunctions[label]

  if (!fn) {
    throw new Error('Cannot load un-registered function: ' + label)
  }

  return fn
}

lunr.tokenizer.label = 'default'

lunr.tokenizer.registeredFunctions = {
  'default': lunr.tokenizer
}

/**
 * Register a tokenizer function.
 *
 * Functions that are used as tokenizers should be registered if they are to be used with a serialised index.
 *
 * Registering a function does not add it to an index, functions must still be associated with a specific index for them to be used when indexing and searching documents.
 *
 * @param {Function} fn The function to register.
 * @param {String} label The label to register this function with
 * @memberOf tokenizer
 */
lunr.tokenizer.registerFunction = function (fn, label) {
  if (label in this.registeredFunctions) {
    lunr.utils.warn('Overwriting existing tokenizer: ' + label)
  }

  fn.label = label
  this.registeredFunctions[label] = fn
}
/*!
 * lunr.Pipeline
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * lunr.Pipelines maintain an ordered list of functions to be applied to all
 * tokens in documents entering the search index and queries being ran against
 * the index.
 *
 * An instance of lunr.Index created with the lunr shortcut will contain a
 * pipeline with a stop word filter and an English language stemmer. Extra
 * functions can be added before or after either of these functions or these
 * default functions can be removed.
 *
 * When run the pipeline will call each function in turn, passing a token, the
 * index of that token in the original list of all tokens and finally a list of
 * all the original tokens.
 *
 * The output of functions in the pipeline will be passed to the next function
 * in the pipeline. To exclude a token from entering the index the function
 * should return undefined, the rest of the pipeline will not be called with
 * this token.
 *
 * For serialisation of pipelines to work, all functions used in an instance of
 * a pipeline should be registered with lunr.Pipeline. Registered functions can
 * then be loaded. If trying to load a serialised pipeline that uses functions
 * that are not registered an error will be thrown.
 *
 * If not planning on serialising the pipeline then registering pipeline functions
 * is not necessary.
 *
 * @constructor
 */
lunr.Pipeline = function () {
  this._stack = []
}

lunr.Pipeline.registeredFunctions = {}

/**
 * Register a function with the pipeline.
 *
 * Functions that are used in the pipeline should be registered if the pipeline
 * needs to be serialised, or a serialised pipeline needs to be loaded.
 *
 * Registering a function does not add it to a pipeline, functions must still be
 * added to instances of the pipeline for them to be used when running a pipeline.
 *
 * @param {Function} fn The function to check for.
 * @param {String} label The label to register this function with
 * @memberOf Pipeline
 */
lunr.Pipeline.registerFunction = function (fn, label) {
  if (label in this.registeredFunctions) {
    lunr.utils.warn('Overwriting existing registered function: ' + label)
  }

  fn.label = label
  lunr.Pipeline.registeredFunctions[fn.label] = fn
}

/**
 * Warns if the function is not registered as a Pipeline function.
 *
 * @param {Function} fn The function to check for.
 * @private
 * @memberOf Pipeline
 */
lunr.Pipeline.warnIfFunctionNotRegistered = function (fn) {
  var isRegistered = fn.label && (fn.label in this.registeredFunctions)

  if (!isRegistered) {
    lunr.utils.warn('Function is not registered with pipeline. This may cause problems when serialising the index.\n', fn)
  }
}

/**
 * Loads a previously serialised pipeline.
 *
 * All functions to be loaded must already be registered with lunr.Pipeline.
 * If any function from the serialised data has not been registered then an
 * error will be thrown.
 *
 * @param {Object} serialised The serialised pipeline to load.
 * @returns {lunr.Pipeline}
 * @memberOf Pipeline
 */
lunr.Pipeline.load = function (serialised) {
  var pipeline = new lunr.Pipeline

  serialised.forEach(function (fnName) {
    var fn = lunr.Pipeline.registeredFunctions[fnName]

    if (fn) {
      pipeline.add(fn)
    } else {
      throw new Error('Cannot load un-registered function: ' + fnName)
    }
  })

  return pipeline
}

/**
 * Adds new functions to the end of the pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {Function} functions Any number of functions to add to the pipeline.
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.add = function () {
  var fns = Array.prototype.slice.call(arguments)

  fns.forEach(function (fn) {
    lunr.Pipeline.warnIfFunctionNotRegistered(fn)
    this._stack.push(fn)
  }, this)
}

/**
 * Adds a single function after a function that already exists in the
 * pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {Function} existingFn A function that already exists in the pipeline.
 * @param {Function} newFn The new function to add to the pipeline.
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.after = function (existingFn, newFn) {
  lunr.Pipeline.warnIfFunctionNotRegistered(newFn)

  var pos = this._stack.indexOf(existingFn)
  if (pos == -1) {
    throw new Error('Cannot find existingFn')
  }

  pos = pos + 1
  this._stack.splice(pos, 0, newFn)
}

/**
 * Adds a single function before a function that already exists in the
 * pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {Function} existingFn A function that already exists in the pipeline.
 * @param {Function} newFn The new function to add to the pipeline.
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.before = function (existingFn, newFn) {
  lunr.Pipeline.warnIfFunctionNotRegistered(newFn)

  var pos = this._stack.indexOf(existingFn)
  if (pos == -1) {
    throw new Error('Cannot find existingFn')
  }

  this._stack.splice(pos, 0, newFn)
}

/**
 * Removes a function from the pipeline.
 *
 * @param {Function} fn The function to remove from the pipeline.
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.remove = function (fn) {
  var pos = this._stack.indexOf(fn)
  if (pos == -1) {
    return
  }

  this._stack.splice(pos, 1)
}

/**
 * Runs the current list of functions that make up the pipeline against the
 * passed tokens.
 *
 * @param {Array} tokens The tokens to run through the pipeline.
 * @returns {Array}
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.run = function (tokens) {
  var out = [],
      tokenLength = tokens.length,
      stackLength = this._stack.length

  for (var i = 0; i < tokenLength; i++) {
    var token = tokens[i]

    for (var j = 0; j < stackLength; j++) {
      token = this._stack[j](token, i, tokens)
      if (token === void 0 || token === '') break
    };

    if (token !== void 0 && token !== '') out.push(token)
  };

  return out
}

/**
 * Resets the pipeline by removing any existing processors.
 *
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.reset = function () {
  this._stack = []
}

/**
 * Returns a representation of the pipeline ready for serialisation.
 *
 * Logs a warning if the function has not been registered.
 *
 * @returns {Array}
 * @memberOf Pipeline
 */
lunr.Pipeline.prototype.toJSON = function () {
  return this._stack.map(function (fn) {
    lunr.Pipeline.warnIfFunctionNotRegistered(fn)

    return fn.label
  })
}
/*!
 * lunr.Vector
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * lunr.Vectors implement vector related operations for
 * a series of elements.
 *
 * @constructor
 */
lunr.Vector = function () {
  this._magnitude = null
  this.list = undefined
  this.length = 0
}

/**
 * lunr.Vector.Node is a simple struct for each node
 * in a lunr.Vector.
 *
 * @private
 * @param {Number} The index of the node in the vector.
 * @param {Object} The data at this node in the vector.
 * @param {lunr.Vector.Node} The node directly after this node in the vector.
 * @constructor
 * @memberOf Vector
 */
lunr.Vector.Node = function (idx, val, next) {
  this.idx = idx
  this.val = val
  this.next = next
}

/**
 * Inserts a new value at a position in a vector.
 *
 * @param {Number} The index at which to insert a value.
 * @param {Object} The object to insert in the vector.
 * @memberOf Vector.
 */
lunr.Vector.prototype.insert = function (idx, val) {
  this._magnitude = undefined;
  var list = this.list

  if (!list) {
    this.list = new lunr.Vector.Node (idx, val, list)
    return this.length++
  }

  if (idx < list.idx) {
    this.list = new lunr.Vector.Node (idx, val, list)
    return this.length++
  }

  var prev = list,
      next = list.next

  while (next != undefined) {
    if (idx < next.idx) {
      prev.next = new lunr.Vector.Node (idx, val, next)
      return this.length++
    }

    prev = next, next = next.next
  }

  prev.next = new lunr.Vector.Node (idx, val, next)
  return this.length++
}

/**
 * Calculates the magnitude of this vector.
 *
 * @returns {Number}
 * @memberOf Vector
 */
lunr.Vector.prototype.magnitude = function () {
  if (this._magnitude) return this._magnitude
  var node = this.list,
      sumOfSquares = 0,
      val

  while (node) {
    val = node.val
    sumOfSquares += val * val
    node = node.next
  }

  return this._magnitude = Math.sqrt(sumOfSquares)
}

/**
 * Calculates the dot product of this vector and another vector.
 *
 * @param {lunr.Vector} otherVector The vector to compute the dot product with.
 * @returns {Number}
 * @memberOf Vector
 */
lunr.Vector.prototype.dot = function (otherVector) {
  var node = this.list,
      otherNode = otherVector.list,
      dotProduct = 0

  while (node && otherNode) {
    if (node.idx < otherNode.idx) {
      node = node.next
    } else if (node.idx > otherNode.idx) {
      otherNode = otherNode.next
    } else {
      dotProduct += node.val * otherNode.val
      node = node.next
      otherNode = otherNode.next
    }
  }

  return dotProduct
}

/**
 * Calculates the cosine similarity between this vector and another
 * vector.
 *
 * @param {lunr.Vector} otherVector The other vector to calculate the
 * similarity with.
 * @returns {Number}
 * @memberOf Vector
 */
lunr.Vector.prototype.similarity = function (otherVector) {
  return this.dot(otherVector) / (this.magnitude() * otherVector.magnitude())
}
/*!
 * lunr.SortedSet
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * lunr.SortedSets are used to maintain an array of uniq values in a sorted
 * order.
 *
 * @constructor
 */
lunr.SortedSet = function () {
  this.length = 0
  this.elements = []
}

/**
 * Loads a previously serialised sorted set.
 *
 * @param {Array} serialisedData The serialised set to load.
 * @returns {lunr.SortedSet}
 * @memberOf SortedSet
 */
lunr.SortedSet.load = function (serialisedData) {
  var set = new this

  set.elements = serialisedData
  set.length = serialisedData.length

  return set
}

/**
 * Inserts new items into the set in the correct position to maintain the
 * order.
 *
 * @param {Object} The objects to add to this set.
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.add = function () {
  var i, element

  for (i = 0; i < arguments.length; i++) {
    element = arguments[i]
    if (~this.indexOf(element)) continue
    this.elements.splice(this.locationFor(element), 0, element)
  }

  this.length = this.elements.length
}

/**
 * Converts this sorted set into an array.
 *
 * @returns {Array}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.toArray = function () {
  return this.elements.slice()
}

/**
 * Creates a new array with the results of calling a provided function on every
 * element in this sorted set.
 *
 * Delegates to Array.prototype.map and has the same signature.
 *
 * @param {Function} fn The function that is called on each element of the
 * set.
 * @param {Object} ctx An optional object that can be used as the context
 * for the function fn.
 * @returns {Array}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.map = function (fn, ctx) {
  return this.elements.map(fn, ctx)
}

/**
 * Executes a provided function once per sorted set element.
 *
 * Delegates to Array.prototype.forEach and has the same signature.
 *
 * @param {Function} fn The function that is called on each element of the
 * set.
 * @param {Object} ctx An optional object that can be used as the context
 * @memberOf SortedSet
 * for the function fn.
 */
lunr.SortedSet.prototype.forEach = function (fn, ctx) {
  return this.elements.forEach(fn, ctx)
}

/**
 * Returns the index at which a given element can be found in the
 * sorted set, or -1 if it is not present.
 *
 * @param {Object} elem The object to locate in the sorted set.
 * @returns {Number}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.indexOf = function (elem) {
  var start = 0,
      end = this.elements.length,
      sectionLength = end - start,
      pivot = start + Math.floor(sectionLength / 2),
      pivotElem = this.elements[pivot]

  while (sectionLength > 1) {
    if (pivotElem === elem) return pivot

    if (pivotElem < elem) start = pivot
    if (pivotElem > elem) end = pivot

    sectionLength = end - start
    pivot = start + Math.floor(sectionLength / 2)
    pivotElem = this.elements[pivot]
  }

  if (pivotElem === elem) return pivot

  return -1
}

/**
 * Returns the position within the sorted set that an element should be
 * inserted at to maintain the current order of the set.
 *
 * This function assumes that the element to search for does not already exist
 * in the sorted set.
 *
 * @param {Object} elem The elem to find the position for in the set
 * @returns {Number}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.locationFor = function (elem) {
  var start = 0,
      end = this.elements.length,
      sectionLength = end - start,
      pivot = start + Math.floor(sectionLength / 2),
      pivotElem = this.elements[pivot]

  while (sectionLength > 1) {
    if (pivotElem < elem) start = pivot
    if (pivotElem > elem) end = pivot

    sectionLength = end - start
    pivot = start + Math.floor(sectionLength / 2)
    pivotElem = this.elements[pivot]
  }

  if (pivotElem > elem) return pivot
  if (pivotElem < elem) return pivot + 1
}

/**
 * Creates a new lunr.SortedSet that contains the elements in the intersection
 * of this set and the passed set.
 *
 * @param {lunr.SortedSet} otherSet The set to intersect with this set.
 * @returns {lunr.SortedSet}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.intersect = function (otherSet) {
  var intersectSet = new lunr.SortedSet,
      i = 0, j = 0,
      a_len = this.length, b_len = otherSet.length,
      a = this.elements, b = otherSet.elements

  while (true) {
    if (i > a_len - 1 || j > b_len - 1) break

    if (a[i] === b[j]) {
      intersectSet.add(a[i])
      i++, j++
      continue
    }

    if (a[i] < b[j]) {
      i++
      continue
    }

    if (a[i] > b[j]) {
      j++
      continue
    }
  };

  return intersectSet
}

/**
 * Makes a copy of this set
 *
 * @returns {lunr.SortedSet}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.clone = function () {
  var clone = new lunr.SortedSet

  clone.elements = this.toArray()
  clone.length = clone.elements.length

  return clone
}

/**
 * Creates a new lunr.SortedSet that contains the elements in the union
 * of this set and the passed set.
 *
 * @param {lunr.SortedSet} otherSet The set to union with this set.
 * @returns {lunr.SortedSet}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.union = function (otherSet) {
  var longSet, shortSet, unionSet

  if (this.length >= otherSet.length) {
    longSet = this, shortSet = otherSet
  } else {
    longSet = otherSet, shortSet = this
  }

  unionSet = longSet.clone()

  for(var i = 0, shortSetElements = shortSet.toArray(); i < shortSetElements.length; i++){
    unionSet.add(shortSetElements[i])
  }

  return unionSet
}

/**
 * Returns a representation of the sorted set ready for serialisation.
 *
 * @returns {Array}
 * @memberOf SortedSet
 */
lunr.SortedSet.prototype.toJSON = function () {
  return this.toArray()
}
/*!
 * lunr.Index
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * lunr.Index is object that manages a search index.  It contains the indexes
 * and stores all the tokens and document lookups.  It also provides the main
 * user facing API for the library.
 *
 * @constructor
 */
lunr.Index = function () {
  this._fields = []
  this._ref = 'id'
  this.pipeline = new lunr.Pipeline
  this.documentStore = new lunr.Store
  this.tokenStore = new lunr.TokenStore
  this.corpusTokens = new lunr.SortedSet
  this.eventEmitter =  new lunr.EventEmitter
  this.tokenizerFn = lunr.tokenizer

  this._idfCache = {}

  this.on('add', 'remove', 'update', (function () {
    this._idfCache = {}
  }).bind(this))
}

/**
 * Bind a handler to events being emitted by the index.
 *
 * The handler can be bound to many events at the same time.
 *
 * @param {String} [eventName] The name(s) of events to bind the function to.
 * @param {Function} fn The serialised set to load.
 * @memberOf Index
 */
lunr.Index.prototype.on = function () {
  var args = Array.prototype.slice.call(arguments)
  return this.eventEmitter.addListener.apply(this.eventEmitter, args)
}

/**
 * Removes a handler from an event being emitted by the index.
 *
 * @param {String} eventName The name of events to remove the function from.
 * @param {Function} fn The serialised set to load.
 * @memberOf Index
 */
lunr.Index.prototype.off = function (name, fn) {
  return this.eventEmitter.removeListener(name, fn)
}

/**
 * Loads a previously serialised index.
 *
 * Issues a warning if the index being imported was serialised
 * by a different version of lunr.
 *
 * @param {Object} serialisedData The serialised set to load.
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.load = function (serialisedData) {
  if (serialisedData.version !== lunr.version) {
    lunr.utils.warn('version mismatch: current ' + lunr.version + ' importing ' + serialisedData.version)
  }

  var idx = new this

  idx._fields = serialisedData.fields
  idx._ref = serialisedData.ref

  idx.tokenizer(lunr.tokenizer.load(serialisedData.tokenizer))
  idx.documentStore = lunr.Store.load(serialisedData.documentStore)
  idx.tokenStore = lunr.TokenStore.load(serialisedData.tokenStore)
  idx.corpusTokens = lunr.SortedSet.load(serialisedData.corpusTokens)
  idx.pipeline = lunr.Pipeline.load(serialisedData.pipeline)

  return idx
}

/**
 * Adds a field to the list of fields that will be searchable within documents
 * in the index.
 *
 * An optional boost param can be passed to affect how much tokens in this field
 * rank in search results, by default the boost value is 1.
 *
 * Fields should be added before any documents are added to the index, fields
 * that are added after documents are added to the index will only apply to new
 * documents added to the index.
 *
 * @param {String} fieldName The name of the field within the document that
 * should be indexed
 * @param {Number} boost An optional boost that can be applied to terms in this
 * field.
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.prototype.field = function (fieldName, opts) {
  var opts = opts || {},
      field = { name: fieldName, boost: opts.boost || 1 }

  this._fields.push(field)
  return this
}

/**
 * Sets the property used to uniquely identify documents added to the index,
 * by default this property is 'id'.
 *
 * This should only be changed before adding documents to the index, changing
 * the ref property without resetting the index can lead to unexpected results.
 *
 * The value of ref can be of any type but it _must_ be stably comparable and
 * orderable.
 *
 * @param {String} refName The property to use to uniquely identify the
 * documents in the index.
 * @param {Boolean} emitEvent Whether to emit add events, defaults to true
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.prototype.ref = function (refName) {
  this._ref = refName
  return this
}

/**
 * Sets the tokenizer used for this index.
 *
 * By default the index will use the default tokenizer, lunr.tokenizer. The tokenizer
 * should only be changed before adding documents to the index. Changing the tokenizer
 * without re-building the index can lead to unexpected results.
 *
 * @param {Function} fn The function to use as a tokenizer.
 * @returns {lunr.Index}
 * @memberOf Index
 */
lunr.Index.prototype.tokenizer = function (fn) {
  var isRegistered = fn.label && (fn.label in lunr.tokenizer.registeredFunctions)

  if (!isRegistered) {
    lunr.utils.warn('Function is not a registered tokenizer. This may cause problems when serialising the index')
  }

  this.tokenizerFn = fn
  return this
}

/**
 * Add a document to the index.
 *
 * This is the way new documents enter the index, this function will run the
 * fields from the document through the index's pipeline and then add it to
 * the index, it will then show up in search results.
 *
 * An 'add' event is emitted with the document that has been added and the index
 * the document has been added to. This event can be silenced by passing false
 * as the second argument to add.
 *
 * @param {Object} doc The document to add to the index.
 * @param {Boolean} emitEvent Whether or not to emit events, default true.
 * @memberOf Index
 */
lunr.Index.prototype.add = function (doc, emitEvent) {
  var docTokens = {},
      allDocumentTokens = new lunr.SortedSet,
      docRef = doc[this._ref],
      emitEvent = emitEvent === undefined ? true : emitEvent

  this._fields.forEach(function (field) {
    var fieldTokens = this.pipeline.run(this.tokenizerFn(doc[field.name]))

    docTokens[field.name] = fieldTokens

    for (var i = 0; i < fieldTokens.length; i++) {
      var token = fieldTokens[i]
      allDocumentTokens.add(token)
      this.corpusTokens.add(token)
    }
  }, this)

  this.documentStore.set(docRef, allDocumentTokens)

  for (var i = 0; i < allDocumentTokens.length; i++) {
    var token = allDocumentTokens.elements[i]
    var tf = 0;

    for (var j = 0; j < this._fields.length; j++){
      var field = this._fields[j]
      var fieldTokens = docTokens[field.name]
      var fieldLength = fieldTokens.length

      if (!fieldLength) continue

      var tokenCount = 0
      for (var k = 0; k < fieldLength; k++){
        if (fieldTokens[k] === token){
          tokenCount++
        }
      }

      tf += (tokenCount / fieldLength * field.boost)
    }

    this.tokenStore.add(token, { ref: docRef, tf: tf })
  };

  if (emitEvent) this.eventEmitter.emit('add', doc, this)
}

/**
 * Removes a document from the index.
 *
 * To make sure documents no longer show up in search results they can be
 * removed from the index using this method.
 *
 * The document passed only needs to have the same ref property value as the
 * document that was added to the index, they could be completely different
 * objects.
 *
 * A 'remove' event is emitted with the document that has been removed and the index
 * the document has been removed from. This event can be silenced by passing false
 * as the second argument to remove.
 *
 * @param {Object} doc The document to remove from the index.
 * @param {Boolean} emitEvent Whether to emit remove events, defaults to true
 * @memberOf Index
 */
lunr.Index.prototype.remove = function (doc, emitEvent) {
  var docRef = doc[this._ref],
      emitEvent = emitEvent === undefined ? true : emitEvent

  if (!this.documentStore.has(docRef)) return

  var docTokens = this.documentStore.get(docRef)

  this.documentStore.remove(docRef)

  docTokens.forEach(function (token) {
    this.tokenStore.remove(token, docRef)
  }, this)

  if (emitEvent) this.eventEmitter.emit('remove', doc, this)
}

/**
 * Updates a document in the index.
 *
 * When a document contained within the index gets updated, fields changed,
 * added or removed, to make sure it correctly matched against search queries,
 * it should be updated in the index.
 *
 * This method is just a wrapper around `remove` and `add`
 *
 * An 'update' event is emitted with the document that has been updated and the index.
 * This event can be silenced by passing false as the second argument to update. Only
 * an update event will be fired, the 'add' and 'remove' events of the underlying calls
 * are silenced.
 *
 * @param {Object} doc The document to update in the index.
 * @param {Boolean} emitEvent Whether to emit update events, defaults to true
 * @see Index.prototype.remove
 * @see Index.prototype.add
 * @memberOf Index
 */
lunr.Index.prototype.update = function (doc, emitEvent) {
  var emitEvent = emitEvent === undefined ? true : emitEvent

  this.remove(doc, false)
  this.add(doc, false)

  if (emitEvent) this.eventEmitter.emit('update', doc, this)
}

/**
 * Calculates the inverse document frequency for a token within the index.
 *
 * @param {String} token The token to calculate the idf of.
 * @see Index.prototype.idf
 * @private
 * @memberOf Index
 */
lunr.Index.prototype.idf = function (term) {
  var cacheKey = "@" + term
  if (Object.prototype.hasOwnProperty.call(this._idfCache, cacheKey)) return this._idfCache[cacheKey]

  var documentFrequency = this.tokenStore.count(term),
      idf = 1

  if (documentFrequency > 0) {
    idf = 1 + Math.log(this.documentStore.length / documentFrequency)
  }

  return this._idfCache[cacheKey] = idf
}

/**
 * Searches the index using the passed query.
 *
 * Queries should be a string, multiple words are allowed and will lead to an
 * AND based query, e.g. `idx.search('foo bar')` will run a search for
 * documents containing both 'foo' and 'bar'.
 *
 * All query tokens are passed through the same pipeline that document tokens
 * are passed through, so any language processing involved will be run on every
 * query term.
 *
 * Each query term is expanded, so that the term 'he' might be expanded to
 * 'hello' and 'help' if those terms were already included in the index.
 *
 * Matching documents are returned as an array of objects, each object contains
 * the matching document ref, as set for this index, and the similarity score
 * for this document against the query.
 *
 * @param {String} query The query to search the index with.
 * @returns {Object}
 * @see Index.prototype.idf
 * @see Index.prototype.documentVector
 * @memberOf Index
 */
lunr.Index.prototype.search = function (query) {
  var queryTokens = this.pipeline.run(this.tokenizerFn(query)),
      queryVector = new lunr.Vector,
      documentSets = [],
      fieldBoosts = this._fields.reduce(function (memo, f) { return memo + f.boost }, 0)

  var hasSomeToken = queryTokens.some(function (token) {
    return this.tokenStore.has(token)
  }, this)

  if (!hasSomeToken) return []

  queryTokens
    .forEach(function (token, i, tokens) {
      var tf = 1 / tokens.length * this._fields.length * fieldBoosts,
          self = this

      var set = this.tokenStore.expand(token).reduce(function (memo, key) {
        var pos = self.corpusTokens.indexOf(key),
            idf = self.idf(key),
            similarityBoost = 1,
            set = new lunr.SortedSet

        // if the expanded key is not an exact match to the token then
        // penalise the score for this key by how different the key is
        // to the token.
        if (key !== token) {
          var diff = Math.max(3, key.length - token.length)
          similarityBoost = 1 / Math.log(diff)
        }

        // calculate the query tf-idf score for this token
        // applying an similarityBoost to ensure exact matches
        // these rank higher than expanded terms
        if (pos > -1) queryVector.insert(pos, tf * idf * similarityBoost)

        // add all the documents that have this key into a set
        // ensuring that the type of key is preserved
        var matchingDocuments = self.tokenStore.get(key),
            refs = Object.keys(matchingDocuments),
            refsLen = refs.length

        for (var i = 0; i < refsLen; i++) {
          set.add(matchingDocuments[refs[i]].ref)
        }

        return memo.union(set)
      }, new lunr.SortedSet)

      documentSets.push(set)
    }, this)

  var documentSet = documentSets.reduce(function (memo, set) {
    return memo.intersect(set)
  })

  return documentSet
    .map(function (ref) {
      return { ref: ref, score: queryVector.similarity(this.documentVector(ref)) }
    }, this)
    .sort(function (a, b) {
      return b.score - a.score
    })
}

/**
 * Generates a vector containing all the tokens in the document matching the
 * passed documentRef.
 *
 * The vector contains the tf-idf score for each token contained in the
 * document with the passed documentRef.  The vector will contain an element
 * for every token in the indexes corpus, if the document does not contain that
 * token the element will be 0.
 *
 * @param {Object} documentRef The ref to find the document with.
 * @returns {lunr.Vector}
 * @private
 * @memberOf Index
 */
lunr.Index.prototype.documentVector = function (documentRef) {
  var documentTokens = this.documentStore.get(documentRef),
      documentTokensLength = documentTokens.length,
      documentVector = new lunr.Vector

  for (var i = 0; i < documentTokensLength; i++) {
    var token = documentTokens.elements[i],
        tf = this.tokenStore.get(token)[documentRef].tf,
        idf = this.idf(token)

    documentVector.insert(this.corpusTokens.indexOf(token), tf * idf)
  };

  return documentVector
}

/**
 * Returns a representation of the index ready for serialisation.
 *
 * @returns {Object}
 * @memberOf Index
 */
lunr.Index.prototype.toJSON = function () {
  return {
    version: lunr.version,
    fields: this._fields,
    ref: this._ref,
    tokenizer: this.tokenizerFn.label,
    documentStore: this.documentStore.toJSON(),
    tokenStore: this.tokenStore.toJSON(),
    corpusTokens: this.corpusTokens.toJSON(),
    pipeline: this.pipeline.toJSON()
  }
}

/**
 * Applies a plugin to the current index.
 *
 * A plugin is a function that is called with the index as its context.
 * Plugins can be used to customise or extend the behaviour the index
 * in some way. A plugin is just a function, that encapsulated the custom
 * behaviour that should be applied to the index.
 *
 * The plugin function will be called with the index as its argument, additional
 * arguments can also be passed when calling use. The function will be called
 * with the index as its context.
 *
 * Example:
 *
 *     var myPlugin = function (idx, arg1, arg2) {
 *       // `this` is the index to be extended
 *       // apply any extensions etc here.
 *     }
 *
 *     var idx = lunr(function () {
 *       this.use(myPlugin, 'arg1', 'arg2')
 *     })
 *
 * @param {Function} plugin The plugin to apply.
 * @memberOf Index
 */
lunr.Index.prototype.use = function (plugin) {
  var args = Array.prototype.slice.call(arguments, 1)
  args.unshift(this)
  plugin.apply(this, args)
}
/*!
 * lunr.Store
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * lunr.Store is a simple key-value store used for storing sets of tokens for
 * documents stored in index.
 *
 * @constructor
 * @module
 */
lunr.Store = function () {
  this.store = {}
  this.length = 0
}

/**
 * Loads a previously serialised store
 *
 * @param {Object} serialisedData The serialised store to load.
 * @returns {lunr.Store}
 * @memberOf Store
 */
lunr.Store.load = function (serialisedData) {
  var store = new this

  store.length = serialisedData.length
  store.store = Object.keys(serialisedData.store).reduce(function (memo, key) {
    memo[key] = lunr.SortedSet.load(serialisedData.store[key])
    return memo
  }, {})

  return store
}

/**
 * Stores the given tokens in the store against the given id.
 *
 * @param {Object} id The key used to store the tokens against.
 * @param {Object} tokens The tokens to store against the key.
 * @memberOf Store
 */
lunr.Store.prototype.set = function (id, tokens) {
  if (!this.has(id)) this.length++
  this.store[id] = tokens
}

/**
 * Retrieves the tokens from the store for a given key.
 *
 * @param {Object} id The key to lookup and retrieve from the store.
 * @returns {Object}
 * @memberOf Store
 */
lunr.Store.prototype.get = function (id) {
  return this.store[id]
}

/**
 * Checks whether the store contains a key.
 *
 * @param {Object} id The id to look up in the store.
 * @returns {Boolean}
 * @memberOf Store
 */
lunr.Store.prototype.has = function (id) {
  return id in this.store
}

/**
 * Removes the value for a key in the store.
 *
 * @param {Object} id The id to remove from the store.
 * @memberOf Store
 */
lunr.Store.prototype.remove = function (id) {
  if (!this.has(id)) return

  delete this.store[id]
  this.length--
}

/**
 * Returns a representation of the store ready for serialisation.
 *
 * @returns {Object}
 * @memberOf Store
 */
lunr.Store.prototype.toJSON = function () {
  return {
    store: this.store,
    length: this.length
  }
}

/*!
 * lunr.stemmer
 * Copyright (C) 2017 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */

/**
 * lunr.stemmer is an english language stemmer, this is a JavaScript
 * implementation of the PorterStemmer taken from http://tartarus.org/~martin
 *
 * @module
 * @param {String} str The string to stem
 * @returns {String}
 * @see lunr.Pipeline
 */
lunr.stemmer = (function(){
  var step2list = {
      "ational" : "ate",
      "tional" : "tion",
      "enci" : "ence",
      "anci" : "ance",
      "izer" : "ize",
      "bli" : "ble",
      "alli" : "al",
      "entli" : "ent",
      "eli" : "e",
      "ousli" : "ous",
      "ization" : "ize",
      "ation" : "ate",
      "ator" : "ate",
      "alism" : "al",
      "iveness" : "ive",
      "fulness" : "ful",
      "ousness" : "ous",
      "aliti" : "al",
      "iviti" : "ive",
      "biliti" : "ble",
      "logi" : "log"
    },

    step3list = {
      "icate" : "ic",
      "ative" : "",
      "alize" : "al",
      "iciti" : "ic",
      "ical" : "ic",
      "ful" : "",
      "ness" : ""
    },

    c = "[^aeiou]",          // consonant
    v = "[aeiouy]",          // vowel
    C = c + "[^aeiouy]*",    // consonant sequence
    V = v + "[aeiou]*",      // vowel sequence

    mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
    meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
    mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
    s_v = "^(" + C + ")?" + v;                   // vowel in stem

  var re_mgr0 = new RegExp(mgr0);
  var re_mgr1 = new RegExp(mgr1);
  var re_meq1 = new RegExp(meq1);
  var re_s_v = new RegExp(s_v);

  var re_1a = /^(.+?)(ss|i)es$/;
  var re2_1a = /^(.+?)([^s])s$/;
  var re_1b = /^(.+?)eed$/;
  var re2_1b = /^(.+?)(ed|ing)$/;
  var re_1b_2 = /.$/;
  var re2_1b_2 = /(at|bl|iz)$/;
  var re3_1b_2 = new RegExp("([^aeiouylsz])\\1$");
  var re4_1b_2 = new RegExp("^" + C + v + "[^aeiouwxy]$");

  var re_1c = /^(.+?[^aeiou])y$/;
  var re_2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;

  var re_3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;

  var re_4 = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  var re2_4 = /^(.+?)(s|t)(ion)$/;

  var re_5 = /^(.+?)e$/;
  var re_5_1 = /ll$/;
  var re3_5 = new RegExp("^" + C + v + "[^aeiouwxy]$");

  var porterStemmer = function porterStemmer(w) {
    var   stem,
      suffix,
      firstch,
      re,
      re2,
      re3,
      re4;

    if (w.length < 3) { return w; }

    firstch = w.substr(0,1);
    if (firstch == "y") {
      w = firstch.toUpperCase() + w.substr(1);
    }

    // Step 1a
    re = re_1a
    re2 = re2_1a;

    if (re.test(w)) { w = w.replace(re,"$1$2"); }
    else if (re2.test(w)) { w = w.replace(re2,"$1$2"); }

    // Step 1b
    re = re_1b;
    re2 = re2_1b;
    if (re.test(w)) {
      var fp = re.exec(w);
      re = re_mgr0;
      if (re.test(fp[1])) {
        re = re_1b_2;
        w = w.replace(re,"");
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1];
      re2 = re_s_v;
      if (re2.test(stem)) {
        w = stem;
        re2 = re2_1b_2;
        re3 = re3_1b_2;
        re4 = re4_1b_2;
        if (re2.test(w)) {  w = w + "e"; }
        else if (re3.test(w)) { re = re_1b_2; w = w.replace(re,""); }
        else if (re4.test(w)) { w = w + "e"; }
      }
    }

    // Step 1c - replace suffix y or Y by i if preceded by a non-vowel which is not the first letter of the word (so cry -> cri, by -> by, say -> say)
    re = re_1c;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      w = stem + "i";
    }

    // Step 2
    re = re_2;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = re_mgr0;
      if (re.test(stem)) {
        w = stem + step2list[suffix];
      }
    }

    // Step 3
    re = re_3;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = re_mgr0;
      if (re.test(stem)) {
        w = stem + step3list[suffix];
      }
    }

    // Step 4
    re = re_4;
    re2 = re2_4;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = re_mgr1;
      if (re.test(stem)) {
        w = stem;
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1] + fp[2];
      re2 = re_mgr1;
      if (re2.test(stem)) {
        w = stem;
      }
    }

    // Step 5
    re = re_5;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = re_mgr1;
      re2 = re_meq1;
      re3 = re3_5;
      if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
        w = stem;
      }
    }

    re = re_5_1;
    re2 = re_mgr1;
    if (re.test(w) && re2.test(w)) {
      re = re_1b_2;
      w = w.replace(re,"");
    }

    // and turn initial Y back to y

    if (firstch == "y") {
      w = firstch.toLowerCase() + w.substr(1);
    }

    return w;
  };

  return porterStemmer;
})();

lunr.Pipeline.registerFunction(lunr.stemmer, 'stemmer')
/*!
 * lunr.stopWordFilter
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * lunr.generateStopWordFilter builds a stopWordFilter function from the provided
 * list of stop words.
 *
 * The built in lunr.stopWordFilter is built using this generator and can be used
 * to generate custom stopWordFilters for applications or non English languages.
 *
 * @module
 * @param {Array} token The token to pass through the filter
 * @returns {Function}
 * @see lunr.Pipeline
 * @see lunr.stopWordFilter
 */
lunr.generateStopWordFilter = function (stopWords) {
  var words = stopWords.reduce(function (memo, stopWord) {
    memo[stopWord] = stopWord
    return memo
  }, {})

  return function (token) {
    if (token && words[token] !== token) return token
  }
}

/**
 * lunr.stopWordFilter is an English language stop word list filter, any words
 * contained in the list will not be passed through the filter.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @returns {String}
 * @see lunr.Pipeline
 */
lunr.stopWordFilter = lunr.generateStopWordFilter([
  'a',
  'able',
  'about',
  'across',
  'after',
  'all',
  'almost',
  'also',
  'am',
  'among',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'but',
  'by',
  'can',
  'cannot',
  'could',
  'dear',
  'did',
  'do',
  'does',
  'either',
  'else',
  'ever',
  'every',
  'for',
  'from',
  'get',
  'got',
  'had',
  'has',
  'have',
  'he',
  'her',
  'hers',
  'him',
  'his',
  'how',
  'however',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'least',
  'let',
  'like',
  'likely',
  'may',
  'me',
  'might',
  'most',
  'must',
  'my',
  'neither',
  'no',
  'nor',
  'not',
  'of',
  'off',
  'often',
  'on',
  'only',
  'or',
  'other',
  'our',
  'own',
  'rather',
  'said',
  'say',
  'says',
  'she',
  'should',
  'since',
  'so',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'tis',
  'to',
  'too',
  'twas',
  'us',
  'wants',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'yet',
  'you',
  'your'
])

lunr.Pipeline.registerFunction(lunr.stopWordFilter, 'stopWordFilter')
/*!
 * lunr.trimmer
 * Copyright (C) 2017 Oliver Nightingale
 */

/**
 * lunr.trimmer is a pipeline function for trimming non word
 * characters from the begining and end of tokens before they
 * enter the index.
 *
 * This implementation may not work correctly for non latin
 * characters and should either be removed or adapted for use
 * with languages with non-latin characters.
 *
 * @module
 * @param {String} token The token to pass through the filter
 * @returns {String}
 * @see lunr.Pipeline
 */
lunr.trimmer = function (token) {
  return token.replace(/^\W+/, '').replace(/\W+$/, '')
}

lunr.Pipeline.registerFunction(lunr.trimmer, 'trimmer')
/*!
 * lunr.stemmer
 * Copyright (C) 2017 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */

/**
 * lunr.TokenStore is used for efficient storing and lookup of the reverse
 * index of token to document ref.
 *
 * @constructor
 */
lunr.TokenStore = function () {
  this.root = { docs: {} }
  this.length = 0
}

/**
 * Loads a previously serialised token store
 *
 * @param {Object} serialisedData The serialised token store to load.
 * @returns {lunr.TokenStore}
 * @memberOf TokenStore
 */
lunr.TokenStore.load = function (serialisedData) {
  var store = new this

  store.root = serialisedData.root
  store.length = serialisedData.length

  return store
}

/**
 * Adds a new token doc pair to the store.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to store the doc under
 * @param {Object} doc The doc to store against the token
 * @param {Object} root An optional node at which to start looking for the
 * correct place to enter the doc, by default the root of this lunr.TokenStore
 * is used.
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.add = function (token, doc, root) {
  var root = root || this.root,
      key = token.charAt(0),
      rest = token.slice(1)

  if (!(key in root)) root[key] = {docs: {}}

  if (rest.length === 0) {
    root[key].docs[doc.ref] = doc
    this.length += 1
    return
  } else {
    return this.add(rest, doc, root[key])
  }
}

/**
 * Checks whether this key is contained within this lunr.TokenStore.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to check for
 * @param {Object} root An optional node at which to start
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.has = function (token) {
  if (!token) return false

  var node = this.root

  for (var i = 0; i < token.length; i++) {
    if (!node[token.charAt(i)]) return false

    node = node[token.charAt(i)]
  }

  return true
}

/**
 * Retrieve a node from the token store for a given token.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to get the node for.
 * @param {Object} root An optional node at which to start.
 * @returns {Object}
 * @see TokenStore.prototype.get
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.getNode = function (token) {
  if (!token) return {}

  var node = this.root

  for (var i = 0; i < token.length; i++) {
    if (!node[token.charAt(i)]) return {}

    node = node[token.charAt(i)]
  }

  return node
}

/**
 * Retrieve the documents for a node for the given token.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to get the documents for.
 * @param {Object} root An optional node at which to start.
 * @returns {Object}
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.get = function (token, root) {
  return this.getNode(token, root).docs || {}
}

lunr.TokenStore.prototype.count = function (token, root) {
  return Object.keys(this.get(token, root)).length
}

/**
 * Remove the document identified by ref from the token in the store.
 *
 * By default this function starts at the root of the current store, however
 * it can start at any node of any token store if required.
 *
 * @param {String} token The token to get the documents for.
 * @param {String} ref The ref of the document to remove from this token.
 * @param {Object} root An optional node at which to start.
 * @returns {Object}
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.remove = function (token, ref) {
  if (!token) return
  var node = this.root

  for (var i = 0; i < token.length; i++) {
    if (!(token.charAt(i) in node)) return
    node = node[token.charAt(i)]
  }

  delete node.docs[ref]
}

/**
 * Find all the possible suffixes of the passed token using tokens
 * currently in the store.
 *
 * @param {String} token The token to expand.
 * @returns {Array}
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.expand = function (token, memo) {
  var root = this.getNode(token),
      docs = root.docs || {},
      memo = memo || []

  if (Object.keys(docs).length) memo.push(token)

  Object.keys(root)
    .forEach(function (key) {
      if (key === 'docs') return

      memo.concat(this.expand(token + key, memo))
    }, this)

  return memo
}

/**
 * Returns a representation of the token store ready for serialisation.
 *
 * @returns {Object}
 * @memberOf TokenStore
 */
lunr.TokenStore.prototype.toJSON = function () {
  return {
    root: this.root,
    length: this.length
  }
}

  /**
   * export the module via AMD, CommonJS or as a browser global
   * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
   */
  ;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(factory)
    } else if (typeof exports === 'object') {
      /**
       * Node. Does not work with strict CommonJS, but
       * only CommonJS-like enviroments that support module.exports,
       * like Node.
       */
      module.exports = factory()
    } else {
      // Browser globals (root is window)
      root.lunr = factory()
    }
  }(this, function () {
    /**
     * Just return a value to define the module export.
     * This example returns an object, but the module
     * can return a function as the exported value.
     */
    return lunr
  }))
})();

},{}],4:[function(require,module,exports){
"use strict";

var _ = require('./../vendor/lodash');

var helpers = require('./helpers');

var FastBitSet = require('fastbitset');
/**
 * responsible for making faceted search
 */


var Facets = function Facets(items, config) {
  var _this = this;

  config = config || {};
  this.items = items;
  this.config = config;
  this.facets = helpers.index(items, config);
  this._items_map = {};
  this._ids = [];
  var i = 1;

  _.map(items, function (item) {
    _this._ids.push(i);

    _this._items_map[i] = item;
    item._id = i;
    ++i;
  });

  this.ids_map = {};

  if (items) {
    items.forEach(function (v) {
      if (v.id && v._id) {
        _this.ids_map[v.id] = v._id;
      }
    });
  }

  this._bits_ids = new FastBitSet(this._ids);
};

Facets.prototype = {
  items: function items() {
    return this.items;
  },
  bits_ids: function bits_ids(ids) {
    if (ids) {
      return new FastBitSet(ids);
    }

    return this._bits_ids;
  },
  internal_ids_from_ids_map: function internal_ids_from_ids_map(ids) {
    var _this2 = this;

    return ids.map(function (v) {
      return _this2.ids_map[v];
    });
  },
  index: function index() {
    return this.facets;
  },
  get_item: function get_item(_id) {
    return this._items_map[_id];
  },

  /*
   *
   * ids is optional only when there is query
   */
  search: function search(input, data) {
    var config = this.config;
    data = data || {}; // clone does not make sensee here

    var temp_facet = _.clone(this.facets);

    _.mapValues(temp_facet['bits_data'], function (values, key) {
      _.mapValues(temp_facet['bits_data'][key], function (facet_indexes, key2) {
        temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data'][key][key2];
      });
    }); // -------------------------------


    var combination = helpers.combination(temp_facet['bits_data_temp'], input, config); // -------------------------------

    /**
     * calculating not ids
     */

    temp_facet.not_ids = helpers.facets_ids(temp_facet['bits_data_temp'], input.not_filters, config);
    /**
     * not filters calculations
     */

    _.mapValues(temp_facet['bits_data_temp'], function (values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function (facet_indexes, key2) {
        if (temp_facet.not_ids) {
          //var result = RoaringBitmap32.andNot(facet_indexes, temp_facet.not_ids);
          var result = facet_indexes.new_difference(temp_facet.not_ids);
          temp_facet['bits_data_temp'][key][key2] = result;
        }
      });
    }); // -------------------------------


    _.mapValues(temp_facet['bits_data_temp'], function (values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function (facet_indexes, key2) {
        if (combination[key]) {
          //temp_facet['bits_data_temp'][key][key2] = RoaringBitmap32.and(facet_indexes, combination[key]);
          temp_facet['bits_data_temp'][key][key2] = facet_indexes.new_intersection(combination[key]);
        }
      });
    });

    _.mapValues(temp_facet['bits_data_temp'], function (values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function (facet_indexes, key2) {
        if (data.query_ids) {
          //temp_facet['bits_data_temp'][key][key2] = RoaringBitmap32.and(temp_facet['bits_data_temp'][key][key2], data.query_ids);
          temp_facet['bits_data_temp'][key][key2] = data.query_ids.new_intersection(temp_facet['bits_data_temp'][key][key2]);
        }

        if (data.test) {
          temp_facet['data'][key][key2] = temp_facet['bits_data_temp'][key][key2].array();
        }
      });
    });
    /**
     * calculating ids
     */


    temp_facet.ids = helpers.facets_ids(temp_facet['bits_data_temp'], input.filters, config);
    return temp_facet;
  }
};
module.exports = Facets;

},{"./../vendor/lodash":9,"./helpers":6,"fastbitset":2}],5:[function(require,module,exports){
"use strict";

var _ = require('./../vendor/lodash');

var lunr = require('lunr');
/**
 * responsible for making full text searching on items
 * config provide only searchableFields
 */


var Fulltext = function Fulltext(items, config) {
  var _this = this;

  config = config || {};
  config.searchableFields = config.searchableFields || [];
  this.items = items; // creating index

  this.idx = lunr(function () {
    // currently schema hardcoded
    this.field('name', {
      boost: 10
    });
    var self = this;

    _.forEach(config.searchableFields, function (field) {
      self.field(field);
    });

    this.ref('_id');
    /**
     * Remove the stemmer and stopWordFilter from the pipeline
     * stemmer: https://github.com/olivernn/lunr.js/issues/328
     * stopWordFilter: https://github.com/olivernn/lunr.js/issues/233
     */

    if (config.isExactSearch) {
      this.pipeline.remove(lunr.stemmer);
      this.pipeline.remove(lunr.stopWordFilter);
    }
  });
  var i = 1;

  _.map(items, function (item) {
    item._id = i;
    ++i;

    _this.idx.add(item);
  });

  this.store = _.mapKeys(items, function (doc) {
    return doc._id;
  });
};

Fulltext.prototype = {
  search_full: function search_full(query, filter) {
    var _this2 = this;

    return this.search(query, filter).map(function (v) {
      return _this2.store[v];
    });
  },
  search: function search(query, filter) {
    var _this3 = this;

    if (!query && !filter) {
      return this.items ? this.items.map(function (v) {
        return v._id;
      }) : [];
    }

    var items;

    if (query) {
      items = _.map(this.idx.search(query), function (val) {
        var item = _this3.store[val.ref];
        return item;
      });
    }

    if (filter instanceof Function) {
      items = (items || this.items).filter(filter);
    }

    return items.map(function (v) {
      return v._id;
    });
  }
};
module.exports = Fulltext;

},{"./../vendor/lodash":9,"lunr":3}],6:[function(require,module,exports){
"use strict";

var _ = require('./../vendor/lodash');

var FastBitSet = require('fastbitset');

var clone = function clone(val) {
  try {
    return JSON.parse(JSON.stringify(val));
  } catch (e) {
    return val;
  }
};

var humanize = function humanize(str) {
  return str.replace(/^[\s_]+|[\s_]+$/g, '').replace(/[_\s]+/g, ' ').replace(/^[a-z]/, function (m) {
    return m.toUpperCase();
  });
};

var findex = function findex(items, config) {
  var facets = {
    data: {},
    bits_data: {},
    bits_data_temp: {}
  };
  var i = 1;

  var fields = _.keys(config);

  items = _.map(items, function (item) {
    if (!item['_id']) {
      item['_id'] = i;
      ++i;
    }

    return item;
  }); // replace chain with forEach

  _.chain(items).map(function (item) {
    fields.forEach(function (field) {
      //if (!item || !item[field]) {
      if (!item) {
        return;
      }

      if (!facets['data'][field]) {
        facets['data'][field] = {};
      }

      if (Array.isArray(item[field])) {
        item[field].forEach(function (v) {
          if (!item[field]) {
            return;
          }

          if (!facets['data'][field][v]) {
            facets['data'][field][v] = [];
          }

          facets['data'][field][v].push(parseInt(item._id));
        });
      } else if (typeof item[field] !== 'undefined') {
        var v = item[field];

        if (!facets['data'][field][v]) {
          facets['data'][field][v] = [];
        }

        facets['data'][field][v].push(parseInt(item._id));
      }
    });
    return item;
  }).value();

  facets['data'] = _.mapValues(facets['data'], function (values, field) {
    if (!facets['bits_data'][field]) {
      facets['bits_data'][field] = {};
      facets['bits_data_temp'][field] = {};
    } //console.log(values);


    return _.mapValues(values, function (indexes, filter) {
      var sorted_indexes = _.sortBy(indexes);

      facets['bits_data'][field][filter] = new FastBitSet(sorted_indexes);
      return sorted_indexes;
    });
  });
  return facets;
};
/**
 * it calculates new indexes for each facet group
 * @TODO config should be in filters data already
 */


var combination = function combination(facets_data, input, config) {
  var output = {};

  var filters_array = _.map(input.filters, function (filter, key) {
    return {
      key: key,
      values: filter,
      conjunction: config[key].conjunction !== false
    };
  });

  filters_array.sort(function (a, b) {
    return a.conjunction > b.conjunction ? 1 : -1;
  }); // @TODO we could forEach here only by list of keys
  // @TODO we don't need full  facets_data. filters_data should be enough

  _.mapValues(facets_data, function (values, key) {
    _.map(filters_array, function (object) {
      var filters = object.values;
      var field = object.key;
      filters.forEach(function (filter) {
        var result;

        if (config[key].conjunction === false && key !== field || config[key].conjunction !== false) {
          if (!output[key]) {
            result = facets_data[field][filter];
          } else {
            if (config[field].conjunction !== false) {
              result = output[key].new_intersection(facets_data[field][filter]);
            } else {
              result = output[key].new_union(facets_data[field][filter]);
            }
          }
        }

        if (result) {
          output[key] = result;
        }
      });
    });
  });

  return output;
};
/**
 * calculates ids for facets
 * if there is no facet input then return null to not save resources for OR calculation
 * null means facets haven't crossed searched items
 */


var facets_ids = function facets_ids(facets_data, filters) {
  var output = new FastBitSet([]);
  var i = 0;

  _.mapValues(filters, function (filters, field) {
    //console.log(facets_data);
    filters.forEach(function (filter) {
      ++i;
      output = output.new_union(facets_data[field][filter]);
    });
  });

  if (i === 0) {
    return null;
  }

  return output;
};

var getBuckets = function getBuckets(data, input, aggregations) {
  var position = 1;
  return _.mapValues(data['bits_data_temp'], function (v, k) {
    var order;
    var sort;
    var size;

    if (aggregations[k]) {
      order = aggregations[k].order;
      sort = aggregations[k].sort;
      size = aggregations[k].size;
    }

    var buckets = _.chain(v).toPairs().map(function (v2) {
      var filters = [];

      if (input && input.filters && input.filters[k]) {
        filters = input.filters[k];
      }

      return {
        key: v2[0],
        doc_count: v2[1].array().length,
        selected: filters.indexOf(v2[0]) !== -1
      };
    }).value();

    if (sort === 'term') {
      buckets = _.orderBy(buckets, ['selected', 'key'], ['desc', order || 'asc']);
    } else {
      buckets = _.orderBy(buckets, ['selected', 'doc_count', 'key'], ['desc', order || 'desc', 'asc']);
    }

    buckets = buckets.slice(0, size || 10);
    return {
      name: k,
      title: humanize(k),
      position: position++,
      buckets: buckets
    };
  });
};

var mergeAggregations = function mergeAggregations(aggregations, input) {
  return _.mapValues(clone(aggregations), function (val, key) {
    if (!val.field) {
      val.field = key;
    }

    var filters = [];

    if (input.filters && input.filters[key]) {
      filters = input.filters[key];
    }

    val.filters = filters;
    var not_filters = [];

    if (input.not_filters && input.not_filters[key]) {
      not_filters = input.not_filters[key];
    }

    if (input.exclude_filters && input.exclude_filters[key]) {
      not_filters = input.exclude_filters[key];
    }

    val.not_filters = not_filters;
    return val;
  });
};

module.exports.facets_ids = facets_ids;
module.exports.clone = clone;
module.exports.humanize = humanize;
module.exports.combination = combination;
module.exports.index = findex;
module.exports.getBuckets = getBuckets;
module.exports.getFacets = getBuckets;
module.exports.mergeAggregations = mergeAggregations;

},{"./../vendor/lodash":9,"fastbitset":2}],7:[function(require,module,exports){
"use strict";

var service = require('./lib');

var helpers = require('./helpers');

var Fulltext = require('./fulltext');

var Facets = require('./facets');

module.exports = function itemsjs(items, configuration) {
  configuration = configuration || {}; // upsert id to items
  // throw error in tests if id does not exists

  var fulltext;

  if (configuration.native_search_enabled !== false) {
    fulltext = new Fulltext(items, configuration);
  } // index facets


  var facets = new Facets(items, configuration.aggregations);
  return {
    /**
     * per_page
     * page
     * query
     * sort
     * filters
     */
    search: function search(input) {
      input = input || {};
      /**
       * merge configuration aggregation with user input
       */

      input.aggregations = helpers.mergeAggregations(configuration.aggregations, input);
      return service.search(items, input, configuration, fulltext, facets);
    },

    /**
     * returns list of similar elements to specified item id
     * id
     */
    similar: function similar(id, options) {
      return service.similar(items, id, options);
    },

    /**
     * returns list of elements for specific aggregation i.e. list of tags
     * name (aggregation name)
     * query
     * per_page
     * page
     */
    aggregation: function aggregation(input) {
      return service.aggregation(items, input, configuration, fulltext, facets);
    },

    /**
     * reindex items
     * reinitialize fulltext search
     */
    reindex: function reindex(newItems) {
      items = newItems;
      fulltext = new Fulltext(items, configuration);
      facets = new Facets(items, configuration.aggregations);
    }
  };
};

},{"./facets":4,"./fulltext":5,"./helpers":6,"./lib":8}],8:[function(require,module,exports){
"use strict";

var _ = require('./../vendor/lodash');

var helpers = require('./helpers');

var FastBitSet = require('fastbitset');
/**
 * search by filters
 */


module.exports.search = function (items, input, configuration, fulltext, facets) {
  input = input || {};
  var per_page = parseInt(input.per_page || 12);
  var page = parseInt(input.page || 1);

  if (configuration.native_search_enabled === false && (input.query || input.filter)) {
    throw new Error('"query" and "filter" options are not working once native search is disabled');
  }

  var search_time = 0;
  var total_time_start = new Date().getTime();
  var query_ids; // all ids bitmap

  var filtered_indexes_bitmap = facets.bits_ids();

  var _ids;

  if (input._ids) {
    query_ids = new FastBitSet(input._ids);
    _ids = input._ids;
  } else if (input.ids) {
    _ids = facets.internal_ids_from_ids_map(input.ids); //console.log(_ids);

    query_ids = new FastBitSet(_ids);
  } else if (fulltext && (input.query || input.filter)) {
    var search_start_time = new Date().getTime();
    _ids = fulltext.search(input.query, input.filter);
    search_time = new Date().getTime() - search_start_time;
    query_ids = new FastBitSet(_ids);
  }

  var facets_time = new Date().getTime();
  var facet_result = facets.search(input, {
    query_ids: query_ids
  });
  facets_time = new Date().getTime() - facets_time;

  if (query_ids) {
    filtered_indexes_bitmap = query_ids;
  }

  if (facet_result.ids) {
    filtered_indexes_bitmap = filtered_indexes_bitmap.new_intersection(facet_result.ids);
  }

  if (facet_result.not_ids) {
    filtered_indexes_bitmap = filtered_indexes_bitmap.new_difference(facet_result.not_ids);
  } // new filters to items
  // -------------------------------------


  var filtered_indexes = filtered_indexes_bitmap.array();
  var filtered_items = filtered_indexes.map(function (_id) {
    return facets.get_item(_id);
  });
  /**
   * sorting items
   */

  var sorting_start_time = new Date().getTime();
  var sorting_time = 0;

  if (input.sort) {
    filtered_items = module.exports.sorted_items(filtered_items, input.sort, configuration.sortings);
  } else {
    if (_ids) {
      filtered_indexes = _ids.filter(function (v) {
        return filtered_indexes_bitmap.has(v);
      });
      var filtered_items_indexes = filtered_indexes.slice((page - 1) * per_page, page * per_page);
      filtered_items = filtered_items_indexes.map(function (_id) {
        return facets.get_item(_id);
      });
    }
  } // pagination


  filtered_items = filtered_items.slice((page - 1) * per_page, page * per_page);
  sorting_time = new Date().getTime() - sorting_start_time;
  var total_time = new Date().getTime() - total_time_start; //console.log(facet_result);

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: filtered_indexes.length
    },
    timings: {
      total: total_time,
      facets: facets_time,
      //filter: filter_time,
      search: search_time,
      sorting: sorting_time
    },
    data: {
      items: filtered_items,
      //aggregations: aggregations,
      aggregations: helpers.getBuckets(facet_result, input, configuration.aggregations)
    }
  };
};
/**
 * return items by sort
 */


module.exports.sorted_items = function (items, sort, sortings) {
  if (sortings && sortings[sort]) {
    sort = sortings[sort];
  }

  if (sort.field) {
    return _.orderBy(items, sort.field, sort.order || 'asc');
  }

  return items;
};
/**
 * returns list of elements in aggregation
 * useful for autocomplete or list all aggregation options
 */


module.exports.similar = function (items, id, options) {
  var per_page = options.per_page || 10;
  var minimum = options.minimum || 0;
  var page = options.page || 1;
  var item;

  for (var i = 0; i < items.length; ++i) {
    if (items[i].id == id) {
      item = items[i];
      break;
    }
  }

  if (!options.field) {
    throw new Error('Please define field in options');
  }

  var field = options.field;
  var sorted_items = [];

  for (var _i = 0; _i < items.length; ++_i) {
    if (items[_i].id !== id) {
      var intersection = _.intersection(item[field], items[_i][field]);

      if (intersection.length >= minimum) {
        sorted_items.push(items[_i]);
        sorted_items[sorted_items.length - 1].intersection_length = intersection.length;
      }
    }
  }

  sorted_items = _.orderBy(sorted_items, ['intersection_length'], ['desc']);
  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: sorted_items.length
    },
    data: {
      items: sorted_items.slice((page - 1) * per_page, page * per_page)
    }
  };
};
/**
 * returns list of elements in specific facet
 * useful for autocomplete or list all aggregation options
 */


module.exports.aggregation = function (items, input, configuration, fulltext, facets) {
  var per_page = input.per_page || 10;
  var page = input.page || 1;

  if (input.name && (!configuration.aggregations || !configuration.aggregations[input.name])) {
    throw new Error('Please define aggregation "'.concat(input.name, '" in config'));
  }

  var search_input = helpers.clone(input);
  search_input.page = 1;
  search_input.per_page = 0;

  if (!input.name) {
    throw new Error('field name is required');
  }

  configuration.aggregations[input.name].size = 10000;
  var result = module.exports.search(items, search_input, configuration, fulltext, facets);
  var buckets = result.data.aggregations[input.name].buckets;
  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: buckets.length
    },
    data: {
      buckets: buckets.slice((page - 1) * per_page, page * per_page)
    }
  };
};

},{"./../vendor/lodash":9,"./helpers":6,"fastbitset":2}],9:[function(require,module,exports){
(function (global){(function (){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * @license
 * Lodash (Custom Build) lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 * Build: `lodash include="map,mapKeys,clone,forEach,filter,mapValues,intersection,chain,sortBy,toPairs,orderBy" -o vendor/lodash.js -p`
 */
;
(function () {
  function t(t, e, r) {
    switch (r.length) {
      case 0:
        return t.call(e);

      case 1:
        return t.call(e, r[0]);

      case 2:
        return t.call(e, r[0], r[1]);

      case 3:
        return t.call(e, r[0], r[1], r[2]);
    }

    return t.apply(e, r);
  }

  function e(t, e) {
    for (var r = -1, n = null == t ? 0 : t.length; ++r < n && false !== e(t[r], r, t);) {
      ;
    }

    return t;
  }

  function r(t, e) {
    for (var r = -1, n = null == t ? 0 : t.length, o = 0, u = []; ++r < n;) {
      var i = t[r];
      e(i, r, t) && (u[o++] = i);
    }

    return u;
  }

  function n(t, e) {
    var r;

    if (r = !(null == t || !t.length)) {
      if (e === e) t: {
        r = -1;

        for (var n = t.length; ++r < n;) {
          if (t[r] === e) break t;
        }

        r = -1;
      } else t: {
        r = c;

        for (var n = t.length, o = -1; ++o < n;) {
          if (r(t[o], o, t)) {
            r = o;
            break t;
          }
        }

        r = -1;
      }
      r = -1 < r;
    }

    return r;
  }

  function o(t, e) {
    for (var r = -1, n = null == t ? 0 : t.length, o = Array(n); ++r < n;) {
      o[r] = e(t[r], r, t);
    }

    return o;
  }

  function u(t, e) {
    for (var r = -1, n = e.length, o = t.length; ++r < n;) {
      t[o + r] = e[r];
    }

    return t;
  }

  function i(t, e, r) {
    for (var n = -1, o = null == t ? 0 : t.length; ++n < o;) {
      r = e(r, t[n], n, t);
    }

    return r;
  }

  function a(t, e) {
    for (var r = -1, n = null == t ? 0 : t.length; ++r < n;) {
      if (e(t[r], r, t)) return true;
    }

    return false;
  }

  function c(t) {
    return t !== t;
  }

  function f(t) {
    return function (e) {
      return null == e ? ye : e[t];
    };
  }

  function s(t, e) {
    var r = t.length;

    for (t.sort(e); r--;) {
      t[r] = t[r].c;
    }

    return t;
  }

  function _(t, e) {
    return o(e, function (e) {
      return [e, t[e]];
    });
  }

  function l(t) {
    return function (e) {
      return t(e);
    };
  }

  function h(t, e) {
    return o(e, function (e) {
      return t[e];
    });
  }

  function p(t) {
    var e = -1,
        r = Array(t.size);
    return t.forEach(function (t, n) {
      r[++e] = [n, t];
    }), r;
  }

  function b(t) {
    var e = Object;
    return function (r) {
      return t(e(r));
    };
  }

  function y(t) {
    var e = -1,
        r = Array(t.size);
    return t.forEach(function (t) {
      r[++e] = t;
    }), r;
  }

  function v(t) {
    var e = -1,
        r = Array(t.size);
    return t.forEach(function (t) {
      r[++e] = [t, t];
    }), r;
  }

  function d(t) {
    if (Ht(t) && !rn(t) && !(t instanceof w)) {
      if (t instanceof j) return t;
      if (rr.call(t, "__wrapped__")) return Ft(t);
    }

    return new j(t);
  }

  function g() {}

  function j(t, e) {
    this.__wrapped__ = t, this.__actions__ = [], this.__chain__ = !!e, this.__index__ = 0, this.__values__ = ye;
  }

  function w(t) {
    this.__wrapped__ = t, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = false, this.__iteratees__ = [], this.__takeCount__ = 4294967295, this.__views__ = [];
  }

  function A(t) {
    var e = -1,
        r = null == t ? 0 : t.length;

    for (this.clear(); ++e < r;) {
      var n = t[e];
      this.set(n[0], n[1]);
    }
  }

  function m(t) {
    var e = -1,
        r = null == t ? 0 : t.length;

    for (this.clear(); ++e < r;) {
      var n = t[e];
      this.set(n[0], n[1]);
    }
  }

  function k(t) {
    var e = -1,
        r = null == t ? 0 : t.length;

    for (this.clear(); ++e < r;) {
      var n = t[e];
      this.set(n[0], n[1]);
    }
  }

  function O(t) {
    var e = -1,
        r = null == t ? 0 : t.length;

    for (this.__data__ = new k(); ++e < r;) {
      this.add(t[e]);
    }
  }

  function S(t) {
    this.size = (this.__data__ = new m(t)).size;
  }

  function x(t, e) {
    var r = rn(t),
        n = !r && en(t),
        o = !r && !n && nn(t),
        u = !r && !n && !o && an(t);

    if (r = r || n || o || u) {
      for (var n = t.length, i = String, a = -1, c = Array(n); ++a < n;) {
        c[a] = i(a);
      }

      n = c;
    } else n = [];

    var f,
        i = n.length;

    for (f in t) {
      !e && !rr.call(t, f) || r && ("length" == f || o && ("offset" == f || "parent" == f) || u && ("buffer" == f || "byteLength" == f || "byteOffset" == f) || mt(f, i)) || n.push(f);
    }

    return n;
  }

  function z(t, e, r) {
    var n = t[e];
    rr.call(t, e) && Wt(n, r) && (r !== ye || e in t) || $(t, e, r);
  }

  function E(t, e) {
    for (var r = t.length; r--;) {
      if (Wt(t[r][0], e)) return r;
    }

    return -1;
  }

  function R(t, e) {
    return t && at(e, ue(e), t);
  }

  function M(t, e) {
    return t && at(e, ie(e), t);
  }

  function $(t, e, r) {
    "__proto__" == e && vr ? vr(t, e, {
      configurable: true,
      enumerable: true,
      value: r,
      writable: true
    }) : t[e] = r;
  }

  function F(t, r, n, o, u, i) {
    var a,
        c = 1 & r,
        f = 2 & r,
        s = 4 & r;
    if (n && (a = u ? n(t, o, u, i) : n(t)), a !== ye) return a;
    if (!Jt(t)) return t;

    if (o = rn(t)) {
      if (a = jt(t), !c) return it(t, a);
    } else {
      var _ = Hr(t),
          l = "[object Function]" == _ || "[object GeneratorFunction]" == _;

      if (nn(t)) return ot(t, c);

      if ("[object Object]" == _ || "[object Arguments]" == _ || l && !u) {
        if (a = f || l ? {} : typeof t.constructor != "function" || St(t) ? {} : Nr(sr(t)), !c) return f ? ft(t, M(a, t)) : ct(t, R(a, t));
      } else {
        if (!Le[_]) return u ? t : {};
        a = wt(t, _, c);
      }
    }

    if (i || (i = new S()), u = i.get(t)) return u;
    if (i.set(t, a), un(t)) return t.forEach(function (e) {
      a.add(F(e, r, n, e, t, i));
    }), a;
    if (on(t)) return t.forEach(function (e, o) {
      a.set(o, F(e, r, n, o, t, i));
    }), a;
    var f = s ? f ? bt : pt : f ? ie : ue,
        h = o ? ye : f(t);
    return e(h || t, function (e, o) {
      h && (o = e, e = t[o]), z(a, o, F(e, r, n, o, t, i));
    }), a;
  }

  function I(t, e) {
    var r = [];
    return Vr(t, function (t, n, o) {
      e(t, n, o) && r.push(t);
    }), r;
  }

  function B(t, e, r, n, o) {
    var i = -1,
        a = t.length;

    for (r || (r = At), o || (o = []); ++i < a;) {
      var c = t[i];
      0 < e && r(c) ? 1 < e ? B(c, e - 1, r, n, o) : u(o, c) : n || (o[o.length] = c);
    }

    return o;
  }

  function C(t, e) {
    return t && Wr(t, e, ue);
  }

  function U(t, e) {
    return r(e, function (e) {
      return Kt(t[e]);
    });
  }

  function D(t, e) {
    e = nt(e, t);

    for (var r = 0, n = e.length; null != t && r < n;) {
      t = t[Rt(e[r++])];
    }

    return r && r == n ? t : ye;
  }

  function L(t, e, r) {
    return e = e(t), rn(t) ? e : u(e, r(t));
  }

  function P(t) {
    if (null == t) t = t === ye ? "[object Undefined]" : "[object Null]";else if (yr && yr in Object(t)) {
      var e = rr.call(t, yr),
          r = t[yr];

      try {
        t[yr] = ye;
        var n = true;
      } catch (t) {}

      var o = or.call(t);
      n && (e ? t[yr] = r : delete t[yr]), t = o;
    } else t = or.call(t);
    return t;
  }

  function N(t) {
    return Ht(t) && "[object Arguments]" == P(t);
  }

  function V(t, e, r, n, o) {
    if (t === e) e = true;else if (null == t || null == e || !Ht(t) && !Ht(e)) e = t !== t && e !== e;else t: {
      var u = rn(t),
          i = rn(e),
          a = u ? "[object Array]" : Hr(t),
          c = i ? "[object Array]" : Hr(e),
          a = "[object Arguments]" == a ? "[object Object]" : a,
          c = "[object Arguments]" == c ? "[object Object]" : c,
          f = "[object Object]" == a,
          i = "[object Object]" == c;

      if ((c = a == c) && nn(t)) {
        if (!nn(e)) {
          e = false;
          break t;
        }

        u = true, f = false;
      }

      if (c && !f) o || (o = new S()), e = u || an(t) ? lt(t, e, r, n, V, o) : ht(t, e, a, r, n, V, o);else {
        if (!(1 & r) && (u = f && rr.call(t, "__wrapped__"), a = i && rr.call(e, "__wrapped__"), u || a)) {
          t = u ? t.value() : t, e = a ? e.value() : e, o || (o = new S()), e = V(t, e, r, n, o);
          break t;
        }

        if (c) {
          e: if (o || (o = new S()), u = 1 & r, a = pt(t), i = a.length, c = pt(e).length, i == c || u) {
            for (f = i; f--;) {
              var s = a[f];

              if (!(u ? s in e : rr.call(e, s))) {
                e = false;
                break e;
              }
            }

            if ((c = o.get(t)) && o.get(e)) e = c == e;else {
              c = true, o.set(t, e), o.set(e, t);

              for (var _ = u; ++f < i;) {
                var s = a[f],
                    l = t[s],
                    h = e[s];
                if (n) var p = u ? n(h, l, s, e, t, o) : n(l, h, s, t, e, o);

                if (p === ye ? l !== h && !V(l, h, r, n, o) : !p) {
                  c = false;
                  break;
                }

                _ || (_ = "constructor" == s);
              }

              c && !_ && (r = t.constructor, n = e.constructor, r != n && "constructor" in t && "constructor" in e && !(typeof r == "function" && r instanceof r && typeof n == "function" && n instanceof n) && (c = false)), o["delete"](t), o["delete"](e), e = c;
            }
          } else e = false;
        } else e = false;
      }
    }
    return e;
  }

  function W(t) {
    return Ht(t) && "[object Map]" == Hr(t);
  }

  function T(t, e) {
    var r = e.length,
        n = r;
    if (null == t) return !n;

    for (t = Object(t); r--;) {
      var o = e[r];
      if (o[2] ? o[1] !== t[o[0]] : !(o[0] in t)) return false;
    }

    for (; ++r < n;) {
      var o = e[r],
          u = o[0],
          i = t[u],
          a = o[1];

      if (o[2]) {
        if (i === ye && !(u in t)) return false;
      } else if (o = new S(), void 0 === ye ? !V(a, i, 3, void 0, o) : 1) return false;
    }

    return true;
  }

  function G(t) {
    return Ht(t) && "[object Set]" == Hr(t);
  }

  function K(t) {
    return Ht(t) && qt(t.length) && !!De[P(t)];
  }

  function q(t) {
    return typeof t == "function" ? t : null == t ? fe : _typeof(t) == "object" ? rn(t) ? Q(t[0], t[1]) : H(t) : he(t);
  }

  function J(t, e) {
    var r = -1,
        n = Tt(t) ? Array(t.length) : [];
    return Vr(t, function (t, o, u) {
      n[++r] = e(t, o, u);
    }), n;
  }

  function H(t) {
    var e = dt(t);
    return 1 == e.length && e[0][2] ? xt(e[0][0], e[0][1]) : function (r) {
      return r === t || T(r, e);
    };
  }

  function Q(t, e) {
    return Ot(t) && e === e && !Jt(e) ? xt(Rt(t), e) : function (r) {
      var n = ne(r, t);
      return n === ye && n === e ? oe(r, t) : V(e, n, 3);
    };
  }

  function X(t, e, r) {
    var n = -1;
    return e = o(e.length ? e : [fe], l(yt())), t = J(t, function (t) {
      return {
        a: o(e, function (e) {
          return e(t);
        }),
        b: ++n,
        c: t
      };
    }), s(t, function (t, e) {
      var n;

      t: {
        n = -1;

        for (var o = t.a, u = e.a, i = o.length, a = r.length; ++n < i;) {
          var c;

          e: {
            c = o[n];
            var f = u[n];

            if (c !== f) {
              var s = c !== ye,
                  _ = null === c,
                  l = c === c,
                  h = Xt(c),
                  p = f !== ye,
                  b = null === f,
                  y = f === f,
                  v = Xt(f);

              if (!b && !v && !h && c > f || h && p && y && !b && !v || _ && p && y || !s && y || !l) {
                c = 1;
                break e;
              }

              if (!_ && !h && !v && c < f || v && s && l && !_ && !h || b && s && l || !p && l || !y) {
                c = -1;
                break e;
              }
            }

            c = 0;
          }

          if (c) {
            n = n >= a ? c : c * ("desc" == r[n] ? -1 : 1);
            break t;
          }
        }

        n = t.b - e.b;
      }

      return n;
    });
  }

  function Y(t) {
    return function (e) {
      return D(e, t);
    };
  }

  function Z(t) {
    return Xr(zt(t, void 0, fe), t + "");
  }

  function tt(t) {
    if (typeof t == "string") return t;
    if (rn(t)) return o(t, tt) + "";
    if (Xt(t)) return Pr ? Pr.call(t) : "";
    var e = t + "";
    return "0" == e && 1 / t == -ve ? "-0" : e;
  }

  function et(t, e) {
    var r = t;
    return r instanceof w && (r = r.value()), i(e, function (t, e) {
      return e.func.apply(e.thisArg, u([t], e.args));
    }, r);
  }

  function rt(t) {
    return Gt(t) ? t : [];
  }

  function nt(t, e) {
    return rn(t) ? t : Ot(t, e) ? [t] : Yr(re(t));
  }

  function ot(t, e) {
    if (e) return t.slice();
    var r = t.length,
        r = fr ? fr(r) : new t.constructor(r);
    return t.copy(r), r;
  }

  function ut(t) {
    var e = new t.constructor(t.byteLength);
    return new cr(e).set(new cr(t)), e;
  }

  function it(t, e) {
    var r = -1,
        n = t.length;

    for (e || (e = Array(n)); ++r < n;) {
      e[r] = t[r];
    }

    return e;
  }

  function at(t, e, r) {
    var n = !r;
    r || (r = {});

    for (var o = -1, u = e.length; ++o < u;) {
      var i = e[o],
          a = ye;
      a === ye && (a = t[i]), n ? $(r, i, a) : z(r, i, a);
    }

    return r;
  }

  function ct(t, e) {
    return at(t, qr(t), e);
  }

  function ft(t, e) {
    return at(t, Jr(t), e);
  }

  function st(t) {
    return function () {
      var e = arguments;

      switch (e.length) {
        case 0:
          return new t();

        case 1:
          return new t(e[0]);

        case 2:
          return new t(e[0], e[1]);

        case 3:
          return new t(e[0], e[1], e[2]);

        case 4:
          return new t(e[0], e[1], e[2], e[3]);

        case 5:
          return new t(e[0], e[1], e[2], e[3], e[4]);

        case 6:
          return new t(e[0], e[1], e[2], e[3], e[4], e[5]);

        case 7:
          return new t(e[0], e[1], e[2], e[3], e[4], e[5], e[6]);
      }

      var r = Nr(t.prototype),
          e = t.apply(r, e);
      return Jt(e) ? e : r;
    };
  }

  function _t(t, e, r, n, o, u, i, a, c, f) {
    function s() {
      for (var v = arguments.length, g = Array(v), j = v; j--;) {
        g[j] = arguments[j];
      }

      if (p) {
        var A;
        A = (rr.call(d, "placeholder") ? d : s).placeholder;
        var m;

        for (m = g.length, j = 0; m--;) {
          g[m] === A && ++j;
        }

        m = j;
      }

      if (n) {
        for (var k = p, j = -1, O = g.length, S = o.length, x = -1, z = n.length, E = wr(O - S, 0), R = Array(z + E), k = !k; ++x < z;) {
          R[x] = n[x];
        }

        for (; ++j < S;) {
          (k || j < O) && (R[o[j]] = g[j]);
        }

        for (; E--;) {
          R[x++] = g[j++];
        }

        g = R;
      }

      if (u) {
        for (var M = p, j = -1, O = g.length, S = -1, x = i.length, z = -1, E = u.length, k = wr(O - x, 0), R = Array(k + E), M = !M; ++j < k;) {
          R[j] = g[j];
        }

        for (k = j; ++z < E;) {
          R[k + z] = u[z];
        }

        for (; ++S < x;) {
          (M || j < O) && (R[k + i[S]] = g[j++]);
        }

        g = R;
      }

      if (v -= m, p && v < f) {
        for (m = g, O = -1, S = m.length, x = 0, j = []; ++O < S;) {
          z = m[O], (z === A || "__lodash_placeholder__" === z) && (m[O] = "__lodash_placeholder__", j[x++] = O);
        }

        A = e, m = s.placeholder, S = (O = 8 & A) ? j : ye, j = O ? ye : j, x = O ? g : ye, g = O ? ye : g, A = (A | (O ? 32 : 64)) & ~(O ? 64 : 32), 4 & A || (A &= -4), g = [t, A, r, x, S, g, j, a, c, f - v], v = _t.apply(ye, g);

        t: for (j = t.name + "", O = $r[j], S = rr.call($r, j) ? O.length : 0; S--;) {
          if (x = O[S], z = x.func, null == z || z == t) {
            j = x.name;
            break t;
          }
        }

        return O = d[j], typeof O == "function" && j in w.prototype ? t === O ? j = true : (j = Kr(O), j = !!j && t === j[0]) : j = false, j && Qr(v, g), v.placeholder = m, g = A, m = t + "", A = Xr, j = $t, O = (O = m.match(Oe)) ? O[1].split(Se) : [], g = j(O, g), (j = g.length) && (O = j - 1, g[O] = (1 < j ? "& " : "") + g[O], g = g.join(2 < j ? ", " : " "), m = m.replace(ke, "{\n/* [wrapped with " + g + "] */\n")), A(v, m);
      }

      if (A = l ? r : this, m = h ? A[t] : t, v = g.length, a) for (j = g.length, O = Ar(a.length, j), S = it(g); O--;) {
        x = a[O], g[O] = mt(x, j) ? S[x] : ye;
      } else b && 1 < v && g.reverse();
      return _ && c < v && (g.length = c), this && this !== Te && this instanceof s && (m = y || st(m)), m.apply(A, g);
    }

    var _ = 128 & e,
        l = 1 & e,
        h = 2 & e,
        p = 24 & e,
        b = 512 & e,
        y = h ? ye : st(t);

    return s;
  }

  function lt(t, e, r, n, o, u) {
    var i = 1 & r,
        c = t.length,
        f = e.length;
    if (c != f && !(i && f > c)) return false;
    if ((f = u.get(t)) && u.get(e)) return f == e;

    var f = -1,
        s = true,
        _ = 2 & r ? new O() : ye;

    for (u.set(t, e), u.set(e, t); ++f < c;) {
      var l = t[f],
          h = e[f];
      if (n) var p = i ? n(h, l, f, e, t, u) : n(l, h, f, t, e, u);

      if (p !== ye) {
        if (p) continue;
        s = false;
        break;
      }

      if (_) {
        if (!a(e, function (t, e) {
          if (!_.has(e) && (l === t || o(l, t, r, n, u))) return _.push(e);
        })) {
          s = false;
          break;
        }
      } else if (l !== h && !o(l, h, r, n, u)) {
        s = false;
        break;
      }
    }

    return u["delete"](t), u["delete"](e), s;
  }

  function ht(t, e, r, n, o, u, i) {
    switch (r) {
      case "[object DataView]":
        if (t.byteLength != e.byteLength || t.byteOffset != e.byteOffset) break;
        t = t.buffer, e = e.buffer;

      case "[object ArrayBuffer]":
        if (t.byteLength != e.byteLength || !u(new cr(t), new cr(e))) break;
        return true;

      case "[object Boolean]":
      case "[object Date]":
      case "[object Number]":
        return Wt(+t, +e);

      case "[object Error]":
        return t.name == e.name && t.message == e.message;

      case "[object RegExp]":
      case "[object String]":
        return t == e + "";

      case "[object Map]":
        var a = p;

      case "[object Set]":
        if (a || (a = y), t.size != e.size && !(1 & n)) break;
        return (r = i.get(t)) ? r == e : (n |= 2, i.set(t, e), e = lt(a(t), a(e), n, o, u, i), i["delete"](t), e);

      case "[object Symbol]":
        if (Lr) return Lr.call(t) == Lr.call(e);
    }

    return false;
  }

  function pt(t) {
    return L(t, ue, qr);
  }

  function bt(t) {
    return L(t, ie, Jr);
  }

  function yt() {
    var t = d.iteratee || se,
        t = t === se ? q : t;
    return arguments.length ? t(arguments[0], arguments[1]) : t;
  }

  function vt(t, e) {
    var r = t.__data__,
        n = _typeof(e);

    return ("string" == n || "number" == n || "symbol" == n || "boolean" == n ? "__proto__" !== e : null === e) ? r[typeof e == "string" ? "string" : "hash"] : r.map;
  }

  function dt(t) {
    for (var e = ue(t), r = e.length; r--;) {
      var n = e[r],
          o = t[n];
      e[r] = [n, o, o === o && !Jt(o)];
    }

    return e;
  }

  function gt(t, e) {
    var r = null == t ? ye : t[e];
    return (!Jt(r) || nr && nr in r ? 0 : (Kt(r) ? ur : Me).test(Mt(r))) ? r : ye;
  }

  function jt(t) {
    var e = t.length,
        r = new t.constructor(e);
    return e && "string" == typeof t[0] && rr.call(t, "index") && (r.index = t.index, r.input = t.input), r;
  }

  function wt(t, e, r) {
    var n = t.constructor;

    switch (e) {
      case "[object ArrayBuffer]":
        return ut(t);

      case "[object Boolean]":
      case "[object Date]":
        return new n(+t);

      case "[object DataView]":
        return e = r ? ut(t.buffer) : t.buffer, new t.constructor(e, t.byteOffset, t.byteLength);

      case "[object Float32Array]":
      case "[object Float64Array]":
      case "[object Int8Array]":
      case "[object Int16Array]":
      case "[object Int32Array]":
      case "[object Uint8Array]":
      case "[object Uint8ClampedArray]":
      case "[object Uint16Array]":
      case "[object Uint32Array]":
        return e = r ? ut(t.buffer) : t.buffer, new t.constructor(e, t.byteOffset, t.length);

      case "[object Map]":
        return new n();

      case "[object Number]":
      case "[object String]":
        return new n(t);

      case "[object RegExp]":
        return e = new t.constructor(t.source, ze.exec(t)), e.lastIndex = t.lastIndex, e;

      case "[object Set]":
        return new n();

      case "[object Symbol]":
        return Lr ? Object(Lr.call(t)) : {};
    }
  }

  function At(t) {
    return rn(t) || en(t) || !!(pr && t && t[pr]);
  }

  function mt(t, e) {
    var r = _typeof(t);

    return e = null == e ? 9007199254740991 : e, !!e && ("number" == r || "symbol" != r && Fe.test(t)) && -1 < t && 0 == t % 1 && t < e;
  }

  function kt(t, e, r) {
    if (!Jt(r)) return false;

    var n = _typeof(e);

    return !!("number" == n ? Tt(r) && mt(e, r.length) : "string" == n && e in r) && Wt(r[e], t);
  }

  function Ot(t, e) {
    if (rn(t)) return false;

    var r = _typeof(t);

    return !("number" != r && "symbol" != r && "boolean" != r && null != t && !Xt(t)) || we.test(t) || !je.test(t) || null != e && t in Object(e);
  }

  function St(t) {
    var e = t && t.constructor;
    return t === (typeof e == "function" && e.prototype || Ze);
  }

  function xt(t, e) {
    return function (r) {
      return null != r && r[t] === e && (e !== ye || t in Object(r));
    };
  }

  function zt(e, r, n) {
    return r = wr(r === ye ? e.length - 1 : r, 0), function () {
      for (var o = arguments, u = -1, i = wr(o.length - r, 0), a = Array(i); ++u < i;) {
        a[u] = o[r + u];
      }

      for (u = -1, i = Array(r + 1); ++u < r;) {
        i[u] = o[u];
      }

      return i[r] = n(a), t(e, this, i);
    };
  }

  function Et(t) {
    var e = 0,
        r = 0;
    return function () {
      var n = mr(),
          o = 16 - (n - r);

      if (r = n, 0 < o) {
        if (800 <= ++e) return arguments[0];
      } else e = 0;

      return t.apply(ye, arguments);
    };
  }

  function Rt(t) {
    if (typeof t == "string" || Xt(t)) return t;
    var e = t + "";
    return "0" == e && 1 / t == -ve ? "-0" : e;
  }

  function Mt(t) {
    if (null != t) {
      try {
        return er.call(t);
      } catch (t) {}

      return t + "";
    }

    return "";
  }

  function $t(t, r) {
    return e(ge, function (e) {
      var o = "_." + e[0];
      r & e[1] && !n(t, o) && t.push(o);
    }), t.sort();
  }

  function Ft(t) {
    if (t instanceof w) return t.clone();
    var e = new j(t.__wrapped__, t.__chain__);
    return e.__actions__ = it(t.__actions__), e.__index__ = t.__index__, e.__values__ = t.__values__, e;
  }

  function It(t) {
    return (null == t ? 0 : t.length) ? B(t, 1) : [];
  }

  function Bt(t) {
    var e = null == t ? 0 : t.length;
    return e ? t[e - 1] : ye;
  }

  function Ct(t) {
    return null == t ? t : kr.call(t);
  }

  function Ut(t) {
    return t = d(t), t.__chain__ = true, t;
  }

  function Dt(t, e) {
    return e(t);
  }

  function Lt() {
    return this;
  }

  function Pt(t, r) {
    return (rn(t) ? e : Vr)(t, yt(r, 3));
  }

  function Nt(t, e) {
    function r() {
      var n = arguments,
          o = e ? e.apply(this, n) : n[0],
          u = r.cache;
      return u.has(o) ? u.get(o) : (n = t.apply(this, n), r.cache = u.set(o, n) || u, n);
    }

    if (typeof t != "function" || null != e && typeof e != "function") throw new TypeError("Expected a function");
    return r.cache = new (Nt.Cache || k)(), r;
  }

  function Vt(t) {
    if (typeof t != "function") throw new TypeError("Expected a function");
    return function () {
      var e = arguments;

      switch (e.length) {
        case 0:
          return !t.call(this);

        case 1:
          return !t.call(this, e[0]);

        case 2:
          return !t.call(this, e[0], e[1]);

        case 3:
          return !t.call(this, e[0], e[1], e[2]);
      }

      return !t.apply(this, e);
    };
  }

  function Wt(t, e) {
    return t === e || t !== t && e !== e;
  }

  function Tt(t) {
    return null != t && qt(t.length) && !Kt(t);
  }

  function Gt(t) {
    return Ht(t) && Tt(t);
  }

  function Kt(t) {
    return !!Jt(t) && (t = P(t), "[object Function]" == t || "[object GeneratorFunction]" == t || "[object AsyncFunction]" == t || "[object Proxy]" == t);
  }

  function qt(t) {
    return typeof t == "number" && -1 < t && 0 == t % 1 && 9007199254740991 >= t;
  }

  function Jt(t) {
    var e = _typeof(t);

    return null != t && ("object" == e || "function" == e);
  }

  function Ht(t) {
    return null != t && _typeof(t) == "object";
  }

  function Qt(t) {
    return typeof t == "string" || !rn(t) && Ht(t) && "[object String]" == P(t);
  }

  function Xt(t) {
    return _typeof(t) == "symbol" || Ht(t) && "[object Symbol]" == P(t);
  }

  function Yt(t) {
    if (!t) return [];
    if (Tt(t)) return Qt(t) ? Ue.test(t) ? t.match(Ce) || [] : t.split("") : it(t);

    if (br && t[br]) {
      t = t[br]();

      for (var e, r = []; !(e = t.next()).done;) {
        r.push(e.value);
      }

      return r;
    }

    return e = Hr(t), ("[object Map]" == e ? p : "[object Set]" == e ? y : ae)(t);
  }

  function Zt(t) {
    return t ? (t = ee(t), t === ve || t === -ve ? 1.7976931348623157e308 * (0 > t ? -1 : 1) : t === t ? t : 0) : 0 === t ? t : 0;
  }

  function te(t) {
    t = Zt(t);
    var e = t % 1;
    return t === t ? e ? t - e : t : 0;
  }

  function ee(t) {
    if (typeof t == "number") return t;
    if (Xt(t)) return de;
    if (Jt(t) && (t = typeof t.valueOf == "function" ? t.valueOf() : t, t = Jt(t) ? t + "" : t), typeof t != "string") return 0 === t ? t : +t;
    t = t.replace(me, "");
    var e = Re.test(t);
    return e || $e.test(t) ? Ne(t.slice(2), e ? 2 : 8) : Ee.test(t) ? de : +t;
  }

  function re(t) {
    return null == t ? "" : tt(t);
  }

  function ne(t, e, r) {
    return t = null == t ? ye : D(t, e), t === ye ? r : t;
  }

  function oe(t, e) {
    var r;

    if (r = null != t) {
      r = t;
      var n;
      n = nt(e, r);

      for (var o = -1, u = n.length, i = false; ++o < u;) {
        var a = Rt(n[o]);
        if (!(i = null != r && null != r && a in Object(r))) break;
        r = r[a];
      }

      i || ++o != u ? r = i : (u = null == r ? 0 : r.length, r = !!u && qt(u) && mt(a, u) && (rn(r) || en(r)));
    }

    return r;
  }

  function ue(t) {
    if (Tt(t)) t = x(t);else if (St(t)) {
      var e,
          r = [];

      for (e in Object(t)) {
        rr.call(t, e) && "constructor" != e && r.push(e);
      }

      t = r;
    } else t = jr(t);
    return t;
  }

  function ie(t) {
    if (Tt(t)) t = x(t, true);else if (Jt(t)) {
      var e,
          r = St(t),
          n = [];

      for (e in t) {
        ("constructor" != e || !r && rr.call(t, e)) && n.push(e);
      }

      t = n;
    } else {
      if (e = [], null != t) for (r in Object(t)) {
        e.push(r);
      }
      t = e;
    }
    return t;
  }

  function ae(t) {
    return null == t ? [] : h(t, ue(t));
  }

  function ce(t) {
    return function () {
      return t;
    };
  }

  function fe(t) {
    return t;
  }

  function se(t) {
    return q(typeof t == "function" ? t : F(t, 1));
  }

  function _e(t, r, n) {
    var o = ue(r),
        i = U(r, o);
    null != n || Jt(r) && (i.length || !o.length) || (n = r, r = t, t = this, i = U(r, ue(r)));
    var a = !(Jt(n) && "chain" in n && !n.chain),
        c = Kt(t);
    return e(i, function (e) {
      var n = r[e];
      t[e] = n, c && (t.prototype[e] = function () {
        var e = this.__chain__;

        if (a || e) {
          var r = t(this.__wrapped__);
          return (r.__actions__ = it(this.__actions__)).push({
            func: n,
            args: arguments,
            thisArg: t
          }), r.__chain__ = e, r;
        }

        return n.apply(t, u([this.value()], arguments));
      });
    }), t;
  }

  function le() {}

  function he(t) {
    return Ot(t) ? f(Rt(t)) : Y(t);
  }

  function pe() {
    return [];
  }

  function be() {
    return false;
  }

  var ye,
      ve = 1 / 0,
      de = NaN,
      ge = [["ary", 128], ["bind", 1], ["bindKey", 2], ["curry", 8], ["curryRight", 16], ["flip", 512], ["partial", 32], ["partialRight", 64], ["rearg", 256]],
      je = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      we = /^\w*$/,
      Ae = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
      me = /^\s+|\s+$/g,
      ke = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,
      Oe = /\{\n\/\* \[wrapped with (.+)\] \*/,
      Se = /,? & /,
      xe = /\\(\\)?/g,
      ze = /\w*$/,
      Ee = /^[-+]0x[0-9a-f]+$/i,
      Re = /^0b[01]+$/i,
      Me = /^\[object .+?Constructor\]$/,
      $e = /^0o[0-7]+$/i,
      Fe = /^(?:0|[1-9]\d*)$/,
      Ie = "[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|\\ud83c[\\udffb-\\udfff])?(?:\\u200d(?:[^\\ud800-\\udfff]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|\\ud83c[\\udffb-\\udfff])?)*",
      Be = "(?:[^\\ud800-\\udfff][\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]?|[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\ud800-\\udfff])",
      Ce = RegExp("\\ud83c[\\udffb-\\udfff](?=\\ud83c[\\udffb-\\udfff])|" + Be + Ie, "g"),
      Ue = RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\ufe0e\\ufe0f]"),
      De = {};
  De["[object Float32Array]"] = De["[object Float64Array]"] = De["[object Int8Array]"] = De["[object Int16Array]"] = De["[object Int32Array]"] = De["[object Uint8Array]"] = De["[object Uint8ClampedArray]"] = De["[object Uint16Array]"] = De["[object Uint32Array]"] = true, De["[object Arguments]"] = De["[object Array]"] = De["[object ArrayBuffer]"] = De["[object Boolean]"] = De["[object DataView]"] = De["[object Date]"] = De["[object Error]"] = De["[object Function]"] = De["[object Map]"] = De["[object Number]"] = De["[object Object]"] = De["[object RegExp]"] = De["[object Set]"] = De["[object String]"] = De["[object WeakMap]"] = false;
  var Le = {};
  Le["[object Arguments]"] = Le["[object Array]"] = Le["[object ArrayBuffer]"] = Le["[object DataView]"] = Le["[object Boolean]"] = Le["[object Date]"] = Le["[object Float32Array]"] = Le["[object Float64Array]"] = Le["[object Int8Array]"] = Le["[object Int16Array]"] = Le["[object Int32Array]"] = Le["[object Map]"] = Le["[object Number]"] = Le["[object Object]"] = Le["[object RegExp]"] = Le["[object Set]"] = Le["[object String]"] = Le["[object Symbol]"] = Le["[object Uint8Array]"] = Le["[object Uint8ClampedArray]"] = Le["[object Uint16Array]"] = Le["[object Uint32Array]"] = true, Le["[object Error]"] = Le["[object Function]"] = Le["[object WeakMap]"] = false;
  var Pe,
      Ne = parseInt,
      Ve = (typeof global === "undefined" ? "undefined" : _typeof(global)) == "object" && global && global.Object === Object && global,
      We = (typeof self === "undefined" ? "undefined" : _typeof(self)) == "object" && self && self.Object === Object && self,
      Te = Ve || We || Function("return this")(),
      Ge = (typeof exports === "undefined" ? "undefined" : _typeof(exports)) == "object" && exports && !exports.nodeType && exports,
      Ke = Ge && (typeof module === "undefined" ? "undefined" : _typeof(module)) == "object" && module && !module.nodeType && module,
      qe = Ke && Ke.exports === Ge,
      Je = qe && Ve.process;

  t: {
    try {
      Pe = Je && Je.binding && Je.binding("util");
      break t;
    } catch (t) {}

    Pe = void 0;
  }

  var He = Pe && Pe.isMap,
      Qe = Pe && Pe.isSet,
      Xe = Pe && Pe.isTypedArray,
      Ye = Array.prototype,
      Ze = Object.prototype,
      tr = Te["__core-js_shared__"],
      er = Function.prototype.toString,
      rr = Ze.hasOwnProperty,
      nr = function () {
    var t = /[^.]+$/.exec(tr && tr.keys && tr.keys.IE_PROTO || "");
    return t ? "Symbol(src)_1." + t : "";
  }(),
      or = Ze.toString,
      ur = RegExp("^" + er.call(rr).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"),
      ir = qe ? Te.Buffer : ye,
      ar = Te.Symbol,
      cr = Te.Uint8Array,
      fr = ir ? ir.f : ye,
      sr = b(Object.getPrototypeOf),
      _r = Object.create,
      lr = Ze.propertyIsEnumerable,
      hr = Ye.splice,
      pr = ar ? ar.isConcatSpreadable : ye,
      br = ar ? ar.iterator : ye,
      yr = ar ? ar.toStringTag : ye,
      vr = function () {
    try {
      var t = gt(Object, "defineProperty");
      return t({}, "", {}), t;
    } catch (t) {}
  }(),
      dr = Object.getOwnPropertySymbols,
      gr = ir ? ir.isBuffer : ye,
      jr = b(Object.keys),
      wr = Math.max,
      Ar = Math.min,
      mr = Date.now,
      kr = Ye.reverse,
      Or = gt(Te, "DataView"),
      Sr = gt(Te, "Map"),
      xr = gt(Te, "Promise"),
      zr = gt(Te, "Set"),
      Er = gt(Te, "WeakMap"),
      Rr = gt(Object, "create"),
      Mr = Er && new Er(),
      $r = {},
      Fr = Mt(Or),
      Ir = Mt(Sr),
      Br = Mt(xr),
      Cr = Mt(zr),
      Ur = Mt(Er),
      Dr = ar ? ar.prototype : ye,
      Lr = Dr ? Dr.valueOf : ye,
      Pr = Dr ? Dr.toString : ye,
      Nr = function () {
    function t() {}

    return function (e) {
      return Jt(e) ? _r ? _r(e) : (t.prototype = e, e = new t(), t.prototype = ye, e) : {};
    };
  }();

  d.prototype = g.prototype, d.prototype.constructor = d, j.prototype = Nr(g.prototype), j.prototype.constructor = j, w.prototype = Nr(g.prototype), w.prototype.constructor = w, A.prototype.clear = function () {
    this.__data__ = Rr ? Rr(null) : {}, this.size = 0;
  }, A.prototype["delete"] = function (t) {
    return t = this.has(t) && delete this.__data__[t], this.size -= t ? 1 : 0, t;
  }, A.prototype.get = function (t) {
    var e = this.__data__;
    return Rr ? (t = e[t], "__lodash_hash_undefined__" === t ? ye : t) : rr.call(e, t) ? e[t] : ye;
  }, A.prototype.has = function (t) {
    var e = this.__data__;
    return Rr ? e[t] !== ye : rr.call(e, t);
  }, A.prototype.set = function (t, e) {
    var r = this.__data__;
    return this.size += this.has(t) ? 0 : 1, r[t] = Rr && e === ye ? "__lodash_hash_undefined__" : e, this;
  }, m.prototype.clear = function () {
    this.__data__ = [], this.size = 0;
  }, m.prototype["delete"] = function (t) {
    var e = this.__data__;
    return t = E(e, t), !(0 > t) && (t == e.length - 1 ? e.pop() : hr.call(e, t, 1), --this.size, true);
  }, m.prototype.get = function (t) {
    var e = this.__data__;
    return t = E(e, t), 0 > t ? ye : e[t][1];
  }, m.prototype.has = function (t) {
    return -1 < E(this.__data__, t);
  }, m.prototype.set = function (t, e) {
    var r = this.__data__,
        n = E(r, t);
    return 0 > n ? (++this.size, r.push([t, e])) : r[n][1] = e, this;
  }, k.prototype.clear = function () {
    this.size = 0, this.__data__ = {
      hash: new A(),
      map: new (Sr || m)(),
      string: new A()
    };
  }, k.prototype["delete"] = function (t) {
    return t = vt(this, t)["delete"](t), this.size -= t ? 1 : 0, t;
  }, k.prototype.get = function (t) {
    return vt(this, t).get(t);
  }, k.prototype.has = function (t) {
    return vt(this, t).has(t);
  }, k.prototype.set = function (t, e) {
    var r = vt(this, t),
        n = r.size;
    return r.set(t, e), this.size += r.size == n ? 0 : 1, this;
  }, O.prototype.add = O.prototype.push = function (t) {
    return this.__data__.set(t, "__lodash_hash_undefined__"), this;
  }, O.prototype.has = function (t) {
    return this.__data__.has(t);
  }, S.prototype.clear = function () {
    this.__data__ = new m(), this.size = 0;
  }, S.prototype["delete"] = function (t) {
    var e = this.__data__;
    return t = e["delete"](t), this.size = e.size, t;
  }, S.prototype.get = function (t) {
    return this.__data__.get(t);
  }, S.prototype.has = function (t) {
    return this.__data__.has(t);
  }, S.prototype.set = function (t, e) {
    var r = this.__data__;

    if (r instanceof m) {
      var n = r.__data__;
      if (!Sr || 199 > n.length) return n.push([t, e]), this.size = ++r.size, this;
      r = this.__data__ = new k(n);
    }

    return r.set(t, e), this.size = r.size, this;
  };

  var Vr = function (t, e) {
    return function (r, n) {
      if (null == r) return r;
      if (!Tt(r)) return t(r, n);

      for (var o = r.length, u = e ? o : -1, i = Object(r); (e ? u-- : ++u < o) && false !== n(i[u], u, i);) {
        ;
      }

      return r;
    };
  }(C),
      Wr = function (t) {
    return function (e, r, n) {
      var o = -1,
          u = Object(e);
      n = n(e);

      for (var i = n.length; i--;) {
        var a = n[t ? i : ++o];
        if (false === r(u[a], a, u)) break;
      }

      return e;
    };
  }(),
      Tr = Mr ? function (t, e) {
    return Mr.set(t, e), t;
  } : fe,
      Gr = vr ? function (t, e) {
    return vr(t, "toString", {
      configurable: true,
      enumerable: false,
      value: ce(e),
      writable: true
    });
  } : fe,
      Kr = Mr ? function (t) {
    return Mr.get(t);
  } : le,
      qr = dr ? function (t) {
    return null == t ? [] : (t = Object(t), r(dr(t), function (e) {
      return lr.call(t, e);
    }));
  } : pe,
      Jr = dr ? function (t) {
    for (var e = []; t;) {
      u(e, qr(t)), t = sr(t);
    }

    return e;
  } : pe,
      Hr = P;

  (Or && "[object DataView]" != Hr(new Or(new ArrayBuffer(1))) || Sr && "[object Map]" != Hr(new Sr()) || xr && "[object Promise]" != Hr(xr.resolve()) || zr && "[object Set]" != Hr(new zr()) || Er && "[object WeakMap]" != Hr(new Er())) && (Hr = function Hr(t) {
    var e = P(t);
    if (t = (t = "[object Object]" == e ? t.constructor : ye) ? Mt(t) : "") switch (t) {
      case Fr:
        return "[object DataView]";

      case Ir:
        return "[object Map]";

      case Br:
        return "[object Promise]";

      case Cr:
        return "[object Set]";

      case Ur:
        return "[object WeakMap]";
    }
    return e;
  });

  var Qr = Et(Tr),
      Xr = Et(Gr),
      Yr = function (t) {
    t = Nt(t, function (t) {
      return 500 === e.size && e.clear(), t;
    });
    var e = t.cache;
    return t;
  }(function (t) {
    var e = [];
    return 46 === t.charCodeAt(0) && e.push(""), t.replace(Ae, function (t, r, n, o) {
      e.push(n ? o.replace(xe, "$1") : r || t);
    }), e;
  }),
      Zr = Z(function (t) {
    var e = o(t, rt);

    if (e.length && e[0] === t[0]) {
      t = e[0].length;

      for (var r = e.length, u = r, i = Array(r), a = 1 / 0, c = []; u--;) {
        var f = e[u],
            a = Ar(f.length, a);
        i[u] = 120 <= t && 120 <= f.length ? new O(u && f) : ye;
      }

      var f = e[0],
          s = -1,
          _ = i[0];

      t: for (; ++s < t && c.length < a;) {
        var l = f[s],
            h = l,
            l = 0 !== l ? l : 0;

        if (_ ? !_.has(h) : !n(c, h)) {
          for (u = r; --u;) {
            var p = i[u];
            if (p ? !p.has(h) : !n(e[u], h)) continue t;
          }

          _ && _.push(h), c.push(l);
        }
      }

      e = c;
    } else e = [];

    return e;
  });

  (function (t) {
    return Xr(zt(t, ye, It), t + "");
  })(function (t) {
    function e(e) {
      for (var r = -1, n = t.length, o = Array(n), u = null == e; ++r < n;) {
        o[r] = u ? ye : ne(e, t[r]);
      }

      return o;
    }

    var r = t.length,
        n = r ? t[0] : 0,
        o = this.__wrapped__;
    return !(1 < r || this.__actions__.length) && o instanceof w && mt(n) ? (o = o.slice(n, +n + (r ? 1 : 0)), o.__actions__.push({
      func: Dt,
      args: [e],
      thisArg: ye
    }), new j(o, this.__chain__).thru(function (t) {
      return r && !t.length && t.push(ye), t;
    })) : this.thru(e);
  });

  var tn = Z(function (t, e) {
    if (null == t) return [];
    var r = e.length;
    return 1 < r && kt(t, e[0], e[1]) ? e = [] : 2 < r && kt(e[0], e[1], e[2]) && (e = [e[0]]), X(t, B(e, 1), []);
  });
  Nt.Cache = k;

  var en = N(function () {
    return arguments;
  }()) ? N : function (t) {
    return Ht(t) && rr.call(t, "callee") && !lr.call(t, "callee");
  },
      rn = Array.isArray,
      nn = gr || be,
      on = He ? l(He) : W,
      un = Qe ? l(Qe) : G,
      an = Xe ? l(Xe) : K,
      cn = function (t) {
    return function (e) {
      var r = Hr(e);
      return "[object Map]" == r ? p(e) : "[object Set]" == r ? v(e) : _(e, t(e));
    };
  }(ue);

  d.chain = Ut, d.constant = ce, d.filter = function (t, e) {
    return (rn(t) ? r : I)(t, yt(e, 3));
  }, d.flatten = It, d.intersection = Zr, d.iteratee = se, d.keys = ue, d.keysIn = ie, d.map = function (t, e) {
    return (rn(t) ? o : J)(t, yt(e, 3));
  }, d.mapKeys = function (t, e) {
    var r = {};
    return e = yt(e, 3), C(t, function (t, n, o) {
      $(r, e(t, n, o), t);
    }), r;
  }, d.mapValues = function (t, e) {
    var r = {};
    return e = yt(e, 3), C(t, function (t, n, o) {
      $(r, n, e(t, n, o));
    }), r;
  }, d.memoize = Nt, d.mixin = _e, d.negate = Vt, d.orderBy = function (t, e, r, n) {
    return null == t ? [] : (rn(e) || (e = null == e ? [] : [e]), r = n ? ye : r, rn(r) || (r = null == r ? [] : [r]), X(t, e, r));
  }, d.property = he, d.reverse = Ct, d.sortBy = tn, d.tap = function (t, e) {
    return e(t), t;
  }, d.thru = Dt, d.toArray = Yt, d.toPairs = cn, d.values = ae, d.entries = cn, _e(d, d), d.clone = function (t) {
    return F(t, 4);
  }, d.eq = Wt, d.forEach = Pt, d.get = ne, d.hasIn = oe, d.identity = fe, d.isArguments = en, d.isArray = rn, d.isArrayLike = Tt, d.isArrayLikeObject = Gt, d.isBuffer = nn, d.isFunction = Kt, d.isLength = qt, d.isMap = on, d.isObject = Jt, d.isObjectLike = Ht, d.isSet = un, d.isString = Qt, d.isSymbol = Xt, d.isTypedArray = an, d.last = Bt, d.stubArray = pe, d.stubFalse = be, d.noop = le, d.toFinite = Zt, d.toInteger = te, d.toNumber = ee, d.toString = re, d.each = Pt, _e(d, function () {
    var t = {};
    return C(d, function (e, r) {
      rr.call(d.prototype, r) || (t[r] = e);
    }), t;
  }(), {
    chain: false
  }), d.VERSION = "4.17.5", e(["drop", "take"], function (t, e) {
    w.prototype[t] = function (r) {
      r = r === ye ? 1 : wr(te(r), 0);
      var n = this.__filtered__ && !e ? new w(this) : this.clone();
      return n.__filtered__ ? n.__takeCount__ = Ar(r, n.__takeCount__) : n.__views__.push({
        size: Ar(r, 4294967295),
        type: t + (0 > n.__dir__ ? "Right" : "")
      }), n;
    }, w.prototype[t + "Right"] = function (e) {
      return this.reverse()[t](e).reverse();
    };
  }), e(["filter", "map", "takeWhile"], function (t, e) {
    var r = e + 1,
        n = 1 == r || 3 == r;

    w.prototype[t] = function (t) {
      var e = this.clone();
      return e.__iteratees__.push({
        iteratee: yt(t, 3),
        type: r
      }), e.__filtered__ = e.__filtered__ || n, e;
    };
  }), e(["head", "last"], function (t, e) {
    var r = "take" + (e ? "Right" : "");

    w.prototype[t] = function () {
      return this[r](1).value()[0];
    };
  }), e(["initial", "tail"], function (t, e) {
    var r = "drop" + (e ? "" : "Right");

    w.prototype[t] = function () {
      return this.__filtered__ ? new w(this) : this[r](1);
    };
  }), w.prototype.compact = function () {
    return this.filter(fe);
  }, w.prototype.find = function (t) {
    return this.filter(t).head();
  }, w.prototype.findLast = function (t) {
    return this.reverse().find(t);
  }, w.prototype.invokeMap = Z(function (e, r) {
    return typeof e == "function" ? new w(this) : this.map(function (n) {
      var o = n;
      n = e;
      var u = n = nt(n, o);

      if (!(2 > u.length)) {
        var i = 0,
            a = -1,
            c = -1,
            f = u.length;

        for (0 > i && (i = -i > f ? 0 : f + i), a = a > f ? f : a, 0 > a && (a += f), f = i > a ? 0 : a - i >>> 0, i >>>= 0, a = Array(f); ++c < f;) {
          a[c] = u[c + i];
        }

        o = D(o, a);
      }

      return n = null == o ? o : o[Rt(Bt(n))], null == n ? ye : t(n, o, r);
    });
  }), w.prototype.reject = function (t) {
    return this.filter(Vt(yt(t)));
  }, w.prototype.slice = function (t, e) {
    t = te(t);
    var r = this;
    return r.__filtered__ && (0 < t || 0 > e) ? new w(r) : (0 > t ? r = r.takeRight(-t) : t && (r = r.drop(t)), e !== ye && (e = te(e), r = 0 > e ? r.dropRight(-e) : r.take(e - t)), r);
  }, w.prototype.takeRightWhile = function (t) {
    return this.reverse().takeWhile(t).reverse();
  }, w.prototype.toArray = function () {
    return this.take(4294967295);
  }, C(w.prototype, function (t, e) {
    var r = /^(?:filter|find|map|reject)|While$/.test(e),
        n = /^(?:head|last)$/.test(e),
        o = d[n ? "take" + ("last" == e ? "Right" : "") : e],
        i = n || /^find/.test(e);
    o && (d.prototype[e] = function () {
      function e(t) {
        return t = o.apply(d, u([t], c)), n && l ? t[0] : t;
      }

      var a = this.__wrapped__,
          c = n ? [1] : arguments,
          f = a instanceof w,
          s = c[0],
          _ = f || rn(a);

      _ && r && typeof s == "function" && 1 != s.length && (f = _ = false);
      var l = this.__chain__,
          h = !!this.__actions__.length,
          s = i && !l,
          f = f && !h;
      return !i && _ ? (a = f ? a : new w(this), a = t.apply(a, c), a.__actions__.push({
        func: Dt,
        args: [e],
        thisArg: ye
      }), new j(a, l)) : s && f ? t.apply(this, c) : (a = this.thru(e), s ? n ? a.value()[0] : a.value() : a);
    });
  }), e("pop push shift sort splice unshift".split(" "), function (t) {
    var e = Ye[t],
        r = /^(?:push|sort|unshift)$/.test(t) ? "tap" : "thru",
        n = /^(?:pop|shift)$/.test(t);

    d.prototype[t] = function () {
      var t = arguments;

      if (n && !this.__chain__) {
        var o = this.value();
        return e.apply(rn(o) ? o : [], t);
      }

      return this[r](function (r) {
        return e.apply(rn(r) ? r : [], t);
      });
    };
  }), C(w.prototype, function (t, e) {
    var r = d[e];

    if (r) {
      var n = r.name + "";
      ($r[n] || ($r[n] = [])).push({
        name: e,
        func: r
      });
    }
  }), $r[_t(ye, 2).name] = [{
    name: "wrapper",
    func: ye
  }], w.prototype.clone = function () {
    var t = new w(this.__wrapped__);
    return t.__actions__ = it(this.__actions__), t.__dir__ = this.__dir__, t.__filtered__ = this.__filtered__, t.__iteratees__ = it(this.__iteratees__), t.__takeCount__ = this.__takeCount__, t.__views__ = it(this.__views__), t;
  }, w.prototype.reverse = function () {
    if (this.__filtered__) {
      var t = new w(this);
      t.__dir__ = -1, t.__filtered__ = true;
    } else t = this.clone(), t.__dir__ *= -1;

    return t;
  }, w.prototype.value = function () {
    var t,
        e = this.__wrapped__.value(),
        r = this.__dir__,
        n = rn(e),
        o = 0 > r,
        u = n ? e.length : 0;

    t = u;

    for (var i = this.__views__, a = 0, c = -1, f = i.length; ++c < f;) {
      var s = i[c],
          _ = s.size;

      switch (s.type) {
        case "drop":
          a += _;
          break;

        case "dropRight":
          t -= _;
          break;

        case "take":
          t = Ar(t, a + _);
          break;

        case "takeRight":
          a = wr(a, t - _);
      }
    }

    if (t = {
      start: a,
      end: t
    }, i = t.start, a = t.end, t = a - i, i = o ? a : i - 1, a = this.__iteratees__, c = a.length, f = 0, s = Ar(t, this.__takeCount__), !n || !o && u == t && s == t) return et(e, this.__actions__);
    n = [];

    t: for (; t-- && f < s;) {
      for (i += r, o = -1, u = e[i]; ++o < c;) {
        var l = a[o],
            _ = l.type,
            l = (0, l.iteratee)(u);
        if (2 == _) u = l;else if (!l) {
          if (1 == _) continue t;
          break t;
        }
      }

      n[f++] = u;
    }

    return n;
  }, d.prototype.chain = function () {
    return Ut(this);
  }, d.prototype.commit = function () {
    return new j(this.value(), this.__chain__);
  }, d.prototype.next = function () {
    this.__values__ === ye && (this.__values__ = Yt(this.value()));
    var t = this.__index__ >= this.__values__.length;
    return {
      done: t,
      value: t ? ye : this.__values__[this.__index__++]
    };
  }, d.prototype.plant = function (t) {
    for (var e, r = this; r instanceof g;) {
      var n = Ft(r);
      n.__index__ = 0, n.__values__ = ye, e ? o.__wrapped__ = n : e = n;
      var o = n,
          r = r.__wrapped__;
    }

    return o.__wrapped__ = t, e;
  }, d.prototype.reverse = function () {
    var t = this.__wrapped__;
    return t instanceof w ? (this.__actions__.length && (t = new w(this)), t = t.reverse(), t.__actions__.push({
      func: Dt,
      args: [Ct],
      thisArg: ye
    }), new j(t, this.__chain__)) : this.thru(Ct);
  }, d.prototype.toJSON = d.prototype.valueOf = d.prototype.value = function () {
    return et(this.__wrapped__, this.__actions__);
  }, d.prototype.first = d.prototype.head, br && (d.prototype[br] = Lt), typeof define == "function" && _typeof(define.amd) == "object" && define.amd ? (Te._ = d, define(function () {
    return d;
  })) : Ke ? ((Ke.exports = d)._ = d, Ge._ = d) : Te._ = d;
}).call(void 0);

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});
