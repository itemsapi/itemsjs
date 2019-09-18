(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.itemsjs = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

module.exports = require('./src/index');

},{"./src/index":5}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

    this.ref('id');
    /**
     * Remove the stemmer and stopWordFilter from the pipeline 
     * stemmer: https://github.com/olivernn/lunr.js/issues/328
     * stopWordFilter: https://github.com/olivernn/lunr.js/issues/233
     */

    if (config.isExactSearch) {
      this.pipeline.remove(lunr.stemmer);
      this.pipeline.remove(lunr.stopWordFilter);
    }
  }); //var items2 = _.clone(items)

  var i = 1;

  _.map(items, function (doc) {
    if (!doc.id) {
      doc.id = i;
      ++i;
    }

    _this.idx.add(doc);
  });

  this.store = _.mapKeys(items, function (doc) {
    return doc.id;
  });
};

Fulltext.prototype = {
  search: function search(query) {
    var _this2 = this;

    if (!query) {
      return this.items;
    }

    return _.map(this.idx.search(query), function (val) {
      var item = _this2.store[val.ref]; //delete item.id;

      return item;
    });
  }
};
module.exports = Fulltext;

},{"./../vendor/lodash":7,"lunr":2}],4:[function(require,module,exports){
"use strict";

var _ = require('./../vendor/lodash');

module.exports.includes = function (items, filters) {
  return !filters || _.every(filters, function (val) {
    // Do not match substring when using filters
    if (typeof items === 'string' || items instanceof String) return val === items;else return _.includes(items, val); // If collection is a string, it's checked for a substring of value
  });
};
/**
 * not sure if mathematically correct
 */


module.exports.includes_any = function (items, filters) {
  //return !filters || (_.isArray(filters) && !filters.length) || _.some(filters, (val) => {
  return !filters || filters instanceof Array && filters.length === 0 || _.some(filters, function (val) {
    // Do not match substring when using filters
    if (typeof items === 'string' || items instanceof String) return val === items;else return _.includes(items, val); // If collection is a string, it's checked for a substring of value
  });
};
/**
 * if included particular elements (not array)
 */


module.exports.includes_any_element = function (items, filters) {
  return _.some(filters, function (val) {
    // Do not match substring when using filters
    if (typeof items === 'string' || items instanceof String) return val === items;else return _.includes(items, val); // If collection is a string, it's checked for a substring of value
  });
};

module.exports.intersection = function (a, b) {
  if (!b) {
    return a;
  }

  return _.intersection(a, _.flatten(b));
};

var clone = function clone(val) {
  try {
    return JSON.parse(JSON.stringify(val));
  } catch (e) {
    return val;
  }
};

module.exports.mergeAggregations = function (aggregations, input) {
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
/**
 * should be moved to the new facet class
 */


var is_conjunctive_agg = function is_conjunctive_agg(aggregation) {
  return aggregation.conjunction !== false;
};

var is_disjunctive_agg = function is_disjunctive_agg(aggregation) {
  return aggregation.conjunction === false;
};

var is_not_filters_agg = function is_not_filters_agg(aggregation) {
  return aggregation.not_filters instanceof Array && aggregation.not_filters.length > 0;
};

var is_empty_agg = function is_empty_agg(aggregation) {
  return aggregation.type === 'is_empty';
};

var conjunctive_field = function conjunctive_field(set, filters) {
  return module.exports.includes(set, filters);
};

var disjunctive_field = function disjunctive_field(set, filters) {
  return module.exports.includes_any(set, filters);
};

var not_filters_field = function not_filters_field(set, filters) {
  return !module.exports.includes_any_element(set, filters);
};

var check_empty_field = function check_empty_field(set, filters) {
  var output = ['not_empty'];

  if (set === '' || set === undefined || set === null || set instanceof Array && set.length === 0) {
    //return true;
    output = ['empty'];
  } // check also if filters is not empty array


  if (filters && !module.exports.includes(output, filters)) {
    return false;
  }

  return output;
};
/*var empty_field = function(set, filters) {
  if (set === undefined || set === null || (set instanceof Array && set.length === 0)) {
    return true;
  }

  return false;
}*/


module.exports.is_conjunctive_agg = is_conjunctive_agg;
module.exports.is_disjunctive_agg = is_disjunctive_agg;
module.exports.is_not_filters_agg = is_not_filters_agg;
module.exports.is_empty_agg = is_empty_agg;
module.exports.conjunctive_field = conjunctive_field;
module.exports.disjunctive_field = disjunctive_field;
module.exports.not_filters_field = not_filters_field;
module.exports.check_empty_field = check_empty_field;

},{"./../vendor/lodash":7}],5:[function(require,module,exports){
"use strict";

var service = require('./lib');

var _ = require('./../vendor/lodash');

var helpers = require('./helpers');

var Fulltext = require('./fulltext');

module.exports = function itemsjs(items, configuration) {
  configuration = configuration || {}; // responsible for full text search over the items
  // it makes inverted index and it is very fast

  var fulltext = new Fulltext(items, configuration);
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
      return service.search(items, input, configuration, fulltext);
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
      return service.aggregation(items, input, configuration.aggregations);
    },

    /**
     * reindex items
     * reinitialize fulltext search
     */
    reindex: function reindex(newItems) {
      items = newItems;
      fulltext = new Fulltext(items, configuration);
    }
  };
};

},{"./../vendor/lodash":7,"./fulltext":3,"./helpers":4,"./lib":6}],6:[function(require,module,exports){
"use strict";

var _ = require('./../vendor/lodash');

var helpers = require('./helpers');

var Fulltext = require('./fulltext');
/**
 * search by filters
 */


module.exports.search = function (items, input, configuration, fulltext) {
  input = input || {};
  var search_time = 0; // make search by query first

  if (fulltext) {
    var search_start_time = new Date().getTime();
    items = fulltext.search(input.query);
    search_time = new Date().getTime() - search_start_time;
  }
  /**
   * making a items filtering after search and before faceting
   * after search because search is very fast (faster than O(n) while filtering is O(n) and faceting is like O(n x m))
   * the goal is to make a library more customizable for developers
   */


  if (input.filter instanceof Function) {
    items = items.filter(input.filter);
  } // @deprecated


  if (input.prefilter instanceof Function) {
    items = input.prefilter(items);
  }
  /**
   * responsible for filtering items by aggregation values (processed input)
   * not sure now about the reason but probably performance
   */


  var filtered_items = module.exports.items_by_aggregations(items, input.aggregations);
  var per_page = input.per_page || 12;
  var page = input.page || 1;
  /**
   * sorting items
   */

  var sorting_time = 0;

  if (input.sort) {
    var sorting_start_time = new Date().getTime();
    filtered_items = module.exports.sorted_items(filtered_items, input.sort, configuration.sortings);
    sorting_time = new Date().getTime() - sorting_start_time;
  }
  /**
   * calculating facets
   */


  var facets_start_time = new Date().getTime();
  var aggregations = module.exports.aggregations(items, input.aggregations);
  var facets_time = new Date().getTime() - facets_start_time;
  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: filtered_items.length
    },
    timings: {
      facets: facets_time,
      search: search_time,
      sorting: sorting_time
    },
    data: {
      items: filtered_items.slice((page - 1) * per_page, page * per_page),
      aggregations: aggregations
    }
  };
};
/**
 * returns list of elements in aggregation
 * useful for autocomplete or list all aggregation options
 */


module.exports.aggregation = function (items, input, aggregations) {
  var per_page = input.per_page || 10;
  var page = input.page || 1;

  if (input.name && (!aggregations || !aggregations[input.name])) {
    throw new Error("Please define aggregation \"".concat(input.name, "\" in config"));
  }

  var buckets = module.exports.buckets(items, input.name, aggregations[input.name], aggregations);

  if (input.query) {
    buckets = _.filter(buckets, function (val) {
      // responsible for query
      // counterpart to startsWith
      return val.key.toLowerCase().indexOf(input.query.toLowerCase()) === 0;
    });
  }

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
 * return items which pass filters (aggregations)
 */


module.exports.items_by_aggregations = function (items, aggregations) {
  return _.filter(items, function (item) {
    return module.exports.filterable_item(item, aggregations);
  });
};
/**
 * it returns list of aggregations with buckets
 * it calculates based on object filters like {tags: ['drama', '1980s']} against list of items
 * in realtime
 *
 * @TODO
 * consider caching aggregations results in startup time
 */


module.exports.aggregations = function (items, aggregations) {
  var position = 0;
  return _.mapValues(aggregations, function (val, key) {
    // key is a 'tags' and val is ['drama', '1980s']
    ++position;
    return {
      name: key,
      title: val.title || key.charAt(0).toUpperCase() + key.slice(1),
      position: position,
      buckets: module.exports.buckets(items, key, val, aggregations).slice(0, val.size || 10)
    };
  });
};
/**
 * checks if item is passing aggregations - if it's filtered or not
 * @TODO should accept filters (user input) as the parameter
 * and not user params merged with global config
 * should be is_filterable_item
 */


module.exports.filterable_item = function (item, aggregations) {
  var keys = _.keys(aggregations);

  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i];

    if (helpers.is_empty_agg(aggregations[key])) {
      if (helpers.check_empty_field(item[aggregations[key].field], aggregations[key].filters)) {
        continue;
      }

      return false;
    } else if (helpers.is_not_filters_agg(aggregations[key]) && !helpers.not_filters_field(item[key], aggregations[key].not_filters)) {
      return false;
    } else if (helpers.is_disjunctive_agg(aggregations[key]) && !helpers.disjunctive_field(item[key], aggregations[key].filters)) {
      return false;
    } else if (helpers.is_conjunctive_agg(aggregations[key]) && !helpers.conjunctive_field(item[key], aggregations[key].filters)) {
      return false;
    }
  }

  return true;
};
/*
 * returns array of item key values only if they are passing aggregations criteria
 */


module.exports.bucket_field = function (item, aggregations, key) {
  var keys = _.keys(aggregations);
  /**
   * responsible for narrowing facets with not_filter filter
   */


  for (var i = 0; i < keys.length; ++i) {
    var it = keys[i];

    if (helpers.is_not_filters_agg(aggregations[it])) {
      if (!helpers.not_filters_field(item[it], aggregations[it].not_filters)) {
        return [];
      }
    }
  }

  for (var i = 0; i < keys.length; ++i) {
    if (keys[i] === key) {
      continue;
    }

    var it = keys[i];

    if (helpers.is_empty_agg(aggregations[it])) {
      if (!helpers.check_empty_field(item[aggregations[it].field], aggregations[it].filters)) {
        return [];
      } else {
        continue;
      }
    } else if (helpers.is_disjunctive_agg(aggregations[it]) && !helpers.disjunctive_field(item[it], aggregations[it].filters)) {
      return [];
    } else if (helpers.is_conjunctive_agg(aggregations[it]) && !helpers.conjunctive_field(item[it], aggregations[it].filters)) {
      return [];
    }
  }

  if (helpers.is_empty_agg(aggregations[key])) {
    var temp = helpers.check_empty_field(item[aggregations[key].field], aggregations[key].filters);

    if (temp) {
      return temp;
    }

    return [];
  }

  if (helpers.is_disjunctive_agg(aggregations[key]) || helpers.includes(item[key], aggregations[key].filters)) {
    return item[key] ? _.flatten([item[key]]) : [];
  }

  return [];
};
/*
 * fields count for one item based on aggregation options
 * returns buckets objects
 */


module.exports.bucket = function (item, aggregations) {
  return _.mapValues(aggregations, function (val, key) {
    return module.exports.bucket_field(item, aggregations, key);
  });
};
/**
 * returns buckets list for items for specific key and aggregation configuration
 *
 * @TODO it should be more lower level and should not be dependent directly on user configuration
 * should be able to sort buckets alphabetically, by count and by asc or desc
 */


module.exports.buckets = function (items, field, agg, aggregations) {
  var buckets = _.transform(items, function (result, item) {
    item = module.exports.bucket(item, aggregations);
    var elements = item[field];

    if (agg.conjunction !== false && helpers.includes(elements, agg.filters) //|| agg.conjunction === false && helpers.includes_any(elements, agg.filters)
    || agg.conjunction === false) {
      // go through elements in item field
      for (var i = 0; elements && i < elements.length; ++i) {
        var key = elements[i];

        if (!result[key]) {
          result[key] = 1;
        } else {
          result[key] += 1;
        }
      }
    }
  }, {}); // transform object of objects to array of objects


  buckets = _.map(buckets, function (val, key) {
    return {
      key: key,
      doc_count: val,
      selected: _.includes(agg.filters, key)
    };
  });

  if (agg.sort === 'term') {
    buckets = _.orderBy(buckets, ['selected', 'key'], ['desc', agg.order || 'asc']);
  } else {
    buckets = _.orderBy(buckets, ['selected', 'doc_count', 'key'], ['desc', agg.order || 'desc', 'asc']);
  }

  return buckets;
};
/**
 * returns list of elements in aggregation
 * useful for autocomplete or list all aggregation options
 */


module.exports.similar = function (items, id, options) {
  var result = [];
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
    throw new Error("Please define field in options");
  }

  var field = options.field;
  var sorted_items = [];

  for (var i = 0; i < items.length; ++i) {
    if (items[i].id !== id) {
      var intersection = _.intersection(item[field], items[i][field]);

      if (intersection.length >= minimum) {
        sorted_items.push(items[i]);
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

},{"./../vendor/lodash":7,"./fulltext":3,"./helpers":4}],7:[function(require,module,exports){
(function (global){
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * @license
 * Lodash (Custom Build) lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 * Build: `lodash include="some,forEach,map,mapKeys,mapValues,every,includes,intersection,filter,keys,clone,flatten,transform,sortBy,orderBy" -o lib/lodash.js -p`
 */
;
(function () {
  function t(t, e) {
    return t.set(e[0], e[1]), t;
  }

  function e(t, e) {
    return t.add(e), t;
  }

  function n(t, e, n) {
    switch (n.length) {
      case 0:
        return t.call(e);

      case 1:
        return t.call(e, n[0]);

      case 2:
        return t.call(e, n[0], n[1]);

      case 3:
        return t.call(e, n[0], n[1], n[2]);
    }

    return t.apply(e, n);
  }

  function r(t, e) {
    for (var n = -1, r = null == t ? 0 : t.length; ++n < r && false !== e(t[n], n, t);) {
      ;
    }

    return t;
  }

  function o(t, e) {
    for (var n = -1, r = null == t ? 0 : t.length; ++n < r;) {
      if (!e(t[n], n, t)) return false;
    }

    return true;
  }

  function u(t, e) {
    for (var n = -1, r = null == t ? 0 : t.length, o = 0, u = []; ++n < r;) {
      var c = t[n];
      e(c, n, t) && (u[o++] = c);
    }

    return u;
  }

  function c(t, e) {
    return !(null == t || !t.length) && -1 < (e === e ? d(t, e, 0) : s(t, b, 0));
  }

  function i(t, e) {
    for (var n = -1, r = null == t ? 0 : t.length, o = Array(r); ++n < r;) {
      o[n] = e(t[n], n, t);
    }

    return o;
  }

  function a(t, e) {
    for (var n = -1, r = e.length, o = t.length; ++n < r;) {
      t[o + n] = e[n];
    }

    return t;
  }

  function f(t, e, n) {
    for (var r = -1, o = null == t ? 0 : t.length; ++r < o;) {
      n = e(n, t[r], r, t);
    }

    return n;
  }

  function l(t, e) {
    for (var n = -1, r = null == t ? 0 : t.length; ++n < r;) {
      if (e(t[n], n, t)) return true;
    }

    return false;
  }

  function s(t, e, n) {
    var r = t.length;

    for (n += -1; ++n < r;) {
      if (e(t[n], n, t)) return n;
    }

    return -1;
  }

  function b(t) {
    return t !== t;
  }

  function h(t) {
    return function (e) {
      return null == e ? Zt : e[t];
    };
  }

  function p(t, e) {
    var n = t.length;

    for (t.sort(e); n--;) {
      t[n] = t[n].c;
    }

    return t;
  }

  function y(t) {
    return function (e) {
      return t(e);
    };
  }

  function j(t, e) {
    return i(e, function (e) {
      return t[e];
    });
  }

  function v(t) {
    var e = -1,
        n = Array(t.size);
    return t.forEach(function (t, r) {
      n[++e] = [r, t];
    }), n;
  }

  function g(t) {
    var e = Object;
    return function (n) {
      return t(e(n));
    };
  }

  function _(t) {
    var e = -1,
        n = Array(t.size);
    return t.forEach(function (t) {
      n[++e] = t;
    }), n;
  }

  function d(t, e, n) {
    --n;

    for (var r = t.length; ++n < r;) {
      if (t[n] === e) return n;
    }

    return -1;
  }

  function A() {}

  function m(t) {
    var e = -1,
        n = null == t ? 0 : t.length;

    for (this.clear(); ++e < n;) {
      var r = t[e];
      this.set(r[0], r[1]);
    }
  }

  function w(t) {
    var e = -1,
        n = null == t ? 0 : t.length;

    for (this.clear(); ++e < n;) {
      var r = t[e];
      this.set(r[0], r[1]);
    }
  }

  function O(t) {
    var e = -1,
        n = null == t ? 0 : t.length;

    for (this.clear(); ++e < n;) {
      var r = t[e];
      this.set(r[0], r[1]);
    }
  }

  function S(t) {
    var e = -1,
        n = null == t ? 0 : t.length;

    for (this.__data__ = new O(); ++e < n;) {
      this.add(t[e]);
    }
  }

  function k(t) {
    this.size = (this.__data__ = new w(t)).size;
  }

  function z(t, e) {
    var n = On(t),
        r = !n && wn(t),
        o = !n && !r && Sn(t),
        u = !n && !r && !o && kn(t);

    if (n = n || r || o || u) {
      for (var r = t.length, c = String, i = -1, a = Array(r); ++i < r;) {
        a[i] = c(i);
      }

      r = a;
    } else r = [];

    var f,
        c = r.length;

    for (f in t) {
      !e && !Ie.call(t, f) || n && ("length" == f || o && ("offset" == f || "parent" == f) || u && ("buffer" == f || "byteLength" == f || "byteOffset" == f) || _t(f, c)) || r.push(f);
    }

    return r;
  }

  function x(t, e, n) {
    var r = t[e];
    Ie.call(t, e) && Ft(r, n) && (n !== Zt || e in t) || $(t, e, n);
  }

  function F(t, e) {
    for (var n = t.length; n--;) {
      if (Ft(t[n][0], e)) return n;
    }

    return -1;
  }

  function I(t, e) {
    return t && ut(e, Wt(e), t);
  }

  function E(t, e) {
    return t && ut(e, Gt(e), t);
  }

  function $(t, e, n) {
    "__proto__" == e && We ? We(t, e, {
      configurable: true,
      enumerable: true,
      value: n,
      writable: true
    }) : t[e] = n;
  }

  function B(t, e, n, o, u, c) {
    var i,
        a = 1 & e,
        f = 2 & e,
        l = 4 & e;
    if (n && (i = u ? n(t, o, u, c) : n(t)), i !== Zt) return i;
    if (!Mt(t)) return t;

    if (o = On(t)) {
      if (i = jt(t), !a) return ot(t, i);
    } else {
      var s = gn(t),
          b = "[object Function]" == s || "[object GeneratorFunction]" == s;
      if (Sn(t)) return nt(t, a);

      if ("[object Object]" == s || "[object Arguments]" == s || b && !u) {
        if (i = f || b ? {} : typeof t.constructor != "function" || mt(t) ? {} : bn(Pe(t)), !a) return f ? it(t, E(i, t)) : ct(t, I(i, t));
      } else {
        if (!ye[s]) return u ? t : {};
        i = vt(t, s, B, a);
      }
    }

    if (c || (c = new k()), u = c.get(t)) return u;
    c.set(t, i);
    var f = l ? f ? st : lt : f ? Gt : Wt,
        h = o ? Zt : f(t);
    return r(h || t, function (r, o) {
      h && (o = r, r = t[o]), x(i, o, B(r, e, n, o, t, c));
    }), i;
  }

  function M(t, e) {
    var n = true;
    return hn(t, function (t, r, o) {
      return n = !!e(t, r, o);
    }), n;
  }

  function U(t, e) {
    var n = [];
    return hn(t, function (t, r, o) {
      e(t, r, o) && n.push(t);
    }), n;
  }

  function D(t, e, n, r, o) {
    var u = -1,
        c = t.length;

    for (n || (n = gt), o || (o = []); ++u < c;) {
      var i = t[u];
      0 < e && n(i) ? 1 < e ? D(i, e - 1, n, r, o) : a(o, i) : r || (o[o.length] = i);
    }

    return o;
  }

  function L(t, e) {
    return t && pn(t, e, Wt);
  }

  function P(t, e) {
    e = et(e, t);

    for (var n = 0, r = e.length; null != t && n < r;) {
      t = t[St(e[n++])];
    }

    return n && n == r ? t : Zt;
  }

  function N(t, e, n) {
    return e = e(t), On(t) ? e : a(e, n(t));
  }

  function V(t) {
    if (null == t) t = t === Zt ? "[object Undefined]" : "[object Null]";else if (Te && Te in Object(t)) {
      var e = Ie.call(t, Te),
          n = t[Te];

      try {
        t[Te] = Zt;
        var r = true;
      } catch (t) {}

      var o = $e.call(t);
      r && (e ? t[Te] = n : delete t[Te]), t = o;
    } else t = $e.call(t);
    return t;
  }

  function C(t) {
    return Ut(t) && "[object Arguments]" == V(t);
  }

  function R(t, e, n, r, o) {
    if (t === e) e = true;else if (null == t || null == e || !Ut(t) && !Ut(e)) e = t !== t && e !== e;else t: {
      var u = On(t),
          c = On(e),
          i = u ? "[object Array]" : gn(t),
          a = c ? "[object Array]" : gn(e),
          i = "[object Arguments]" == i ? "[object Object]" : i,
          a = "[object Arguments]" == a ? "[object Object]" : a,
          f = "[object Object]" == i,
          c = "[object Object]" == a;

      if ((a = i == a) && Sn(t)) {
        if (!Sn(e)) {
          e = false;
          break t;
        }

        u = true, f = false;
      }

      if (a && !f) o || (o = new k()), e = u || kn(t) ? at(t, e, n, r, R, o) : ft(t, e, i, n, r, R, o);else {
        if (!(1 & n) && (u = f && Ie.call(t, "__wrapped__"), i = c && Ie.call(e, "__wrapped__"), u || i)) {
          t = u ? t.value() : t, e = i ? e.value() : e, o || (o = new k()), e = R(t, e, n, r, o);
          break t;
        }

        if (a) {
          e: if (o || (o = new k()), u = 1 & n, i = lt(t), c = i.length, a = lt(e).length, c == a || u) {
            for (f = c; f--;) {
              var l = i[f];

              if (!(u ? l in e : Ie.call(e, l))) {
                e = false;
                break e;
              }
            }

            if ((a = o.get(t)) && o.get(e)) e = a == e;else {
              a = true, o.set(t, e), o.set(e, t);

              for (var s = u; ++f < c;) {
                var l = i[f],
                    b = t[l],
                    h = e[l];
                if (r) var p = u ? r(h, b, l, e, t, o) : r(b, h, l, t, e, o);

                if (p === Zt ? b !== h && !R(b, h, n, r, o) : !p) {
                  a = false;
                  break;
                }

                s || (s = "constructor" == l);
              }

              a && !s && (n = t.constructor, r = e.constructor, n != r && "constructor" in t && "constructor" in e && !(typeof n == "function" && n instanceof n && typeof r == "function" && r instanceof r) && (a = false)), o.delete(t), o.delete(e), e = a;
            }
          } else e = false;
        } else e = false;
      }
    }
    return e;
  }

  function T(t, e) {
    var n = e.length,
        r = n;
    if (null == t) return !r;

    for (t = Object(t); n--;) {
      var o = e[n];
      if (o[2] ? o[1] !== t[o[0]] : !(o[0] in t)) return false;
    }

    for (; ++n < r;) {
      var o = e[n],
          u = o[0],
          c = t[u],
          i = o[1];

      if (o[2]) {
        if (c === Zt && !(u in t)) return false;
      } else if (o = new k(), void 0 === Zt ? !R(i, c, 3, void 0, o) : 1) return false;
    }

    return true;
  }

  function W(t) {
    return Ut(t) && Bt(t.length) && !!pe[V(t)];
  }

  function G(t) {
    return typeof t == "function" ? t : null == t ? Ht : _typeof(t) == "object" ? On(t) ? H(t[0], t[1]) : K(t) : Qt(t);
  }

  function q(t, e) {
    var n = -1,
        r = It(t) ? Array(t.length) : [];
    return hn(t, function (t, o, u) {
      r[++n] = e(t, o, u);
    }), r;
  }

  function K(t) {
    var e = pt(t);
    return 1 == e.length && e[0][2] ? wt(e[0][0], e[0][1]) : function (n) {
      return n === t || T(n, e);
    };
  }

  function H(t, e) {
    return At(t) && e === e && !Mt(e) ? wt(St(t), e) : function (n) {
      var r = Rt(n, t);
      return r === Zt && r === e ? Tt(n, t) : R(e, r, 3);
    };
  }

  function J(t, e, n) {
    var r = -1;
    return e = i(e.length ? e : [Ht], y(bt())), t = q(t, function (t) {
      return {
        a: i(e, function (e) {
          return e(t);
        }),
        b: ++r,
        c: t
      };
    }), p(t, function (t, e) {
      var r;

      t: {
        r = -1;

        for (var o = t.a, u = e.a, c = o.length, i = n.length; ++r < c;) {
          var a;

          e: {
            a = o[r];
            var f = u[r];

            if (a !== f) {
              var l = a !== Zt,
                  s = null === a,
                  b = a === a,
                  h = Lt(a),
                  p = f !== Zt,
                  y = null === f,
                  j = f === f,
                  v = Lt(f);

              if (!y && !v && !h && a > f || h && p && j && !y && !v || s && p && j || !l && j || !b) {
                a = 1;
                break e;
              }

              if (!s && !h && !v && a < f || v && l && b && !s && !h || y && l && b || !p && b || !j) {
                a = -1;
                break e;
              }
            }

            a = 0;
          }

          if (a) {
            r = r >= i ? a : a * ("desc" == n[r] ? -1 : 1);
            break t;
          }
        }

        r = t.b - e.b;
      }

      return r;
    });
  }

  function Q(t) {
    return function (e) {
      return P(e, t);
    };
  }

  function X(t) {
    return _n(Ot(t, Ht), t + "");
  }

  function Y(t, e) {
    var n;
    return hn(t, function (t, r, o) {
      return n = e(t, r, o), !n;
    }), !!n;
  }

  function Z(t) {
    if (typeof t == "string") return t;
    if (On(t)) return i(t, Z) + "";
    if (Lt(t)) return sn ? sn.call(t) : "";
    var e = t + "";
    return "0" == e && 1 / t == -te ? "-0" : e;
  }

  function tt(t) {
    return Et(t) ? t : [];
  }

  function et(t, e) {
    return On(t) ? t : At(t, e) ? [t] : dn(Ct(t));
  }

  function nt(t, e) {
    if (e) return t.slice();
    var n = t.length,
        n = Le ? Le(n) : new t.constructor(n);
    return t.copy(n), n;
  }

  function rt(t) {
    var e = new t.constructor(t.byteLength);
    return new De(e).set(new De(t)), e;
  }

  function ot(t, e) {
    var n = -1,
        r = t.length;

    for (e || (e = Array(r)); ++n < r;) {
      e[n] = t[n];
    }

    return e;
  }

  function ut(t, e, n) {
    var r = !n;
    n || (n = {});

    for (var o = -1, u = e.length; ++o < u;) {
      var c = e[o],
          i = Zt;
      i === Zt && (i = t[c]), r ? $(n, c, i) : x(n, c, i);
    }

    return n;
  }

  function ct(t, e) {
    return ut(t, jn(t), e);
  }

  function it(t, e) {
    return ut(t, vn(t), e);
  }

  function at(t, e, n, r, o, u) {
    var c = 1 & n,
        i = t.length,
        a = e.length;
    if (i != a && !(c && a > i)) return false;
    if ((a = u.get(t)) && u.get(e)) return a == e;
    var a = -1,
        f = true,
        s = 2 & n ? new S() : Zt;

    for (u.set(t, e), u.set(e, t); ++a < i;) {
      var b = t[a],
          h = e[a];
      if (r) var p = c ? r(h, b, a, e, t, u) : r(b, h, a, t, e, u);

      if (p !== Zt) {
        if (p) continue;
        f = false;
        break;
      }

      if (s) {
        if (!l(e, function (t, e) {
          if (!s.has(e) && (b === t || o(b, t, n, r, u))) return s.push(e);
        })) {
          f = false;
          break;
        }
      } else if (b !== h && !o(b, h, n, r, u)) {
        f = false;
        break;
      }
    }

    return u.delete(t), u.delete(e), f;
  }

  function ft(t, e, n, r, o, u, c) {
    switch (n) {
      case "[object DataView]":
        if (t.byteLength != e.byteLength || t.byteOffset != e.byteOffset) break;
        t = t.buffer, e = e.buffer;

      case "[object ArrayBuffer]":
        if (t.byteLength != e.byteLength || !u(new De(t), new De(e))) break;
        return true;

      case "[object Boolean]":
      case "[object Date]":
      case "[object Number]":
        return Ft(+t, +e);

      case "[object Error]":
        return t.name == e.name && t.message == e.message;

      case "[object RegExp]":
      case "[object String]":
        return t == e + "";

      case "[object Map]":
        var i = v;

      case "[object Set]":
        if (i || (i = _), t.size != e.size && !(1 & r)) break;
        return (n = c.get(t)) ? n == e : (r |= 2, c.set(t, e), e = at(i(t), i(e), r, o, u, c), c.delete(t), e);

      case "[object Symbol]":
        if (ln) return ln.call(t) == ln.call(e);
    }

    return false;
  }

  function lt(t) {
    return N(t, Wt, jn);
  }

  function st(t) {
    return N(t, Gt, vn);
  }

  function bt() {
    var t = A.iteratee || Jt,
        t = t === Jt ? G : t;
    return arguments.length ? t(arguments[0], arguments[1]) : t;
  }

  function ht(t, e) {
    var n = t.__data__,
        r = _typeof(e);

    return ("string" == r || "number" == r || "symbol" == r || "boolean" == r ? "__proto__" !== e : null === e) ? n[typeof e == "string" ? "string" : "hash"] : n.map;
  }

  function pt(t) {
    for (var e = Wt(t), n = e.length; n--;) {
      var r = e[n],
          o = t[r];
      e[n] = [r, o, o === o && !Mt(o)];
    }

    return e;
  }

  function yt(t, e) {
    var n = null == t ? Zt : t[e];
    return (!Mt(n) || Ee && Ee in n ? 0 : ($t(n) ? Be : se).test(kt(n))) ? n : Zt;
  }

  function jt(t) {
    var e = t.length,
        n = t.constructor(e);
    return e && "string" == typeof t[0] && Ie.call(t, "index") && (n.index = t.index, n.input = t.input), n;
  }

  function vt(n, r, o, u) {
    var c = n.constructor;

    switch (r) {
      case "[object ArrayBuffer]":
        return rt(n);

      case "[object Boolean]":
      case "[object Date]":
        return new c(+n);

      case "[object DataView]":
        return r = u ? rt(n.buffer) : n.buffer, new n.constructor(r, n.byteOffset, n.byteLength);

      case "[object Float32Array]":
      case "[object Float64Array]":
      case "[object Int8Array]":
      case "[object Int16Array]":
      case "[object Int32Array]":
      case "[object Uint8Array]":
      case "[object Uint8ClampedArray]":
      case "[object Uint16Array]":
      case "[object Uint32Array]":
        return r = u ? rt(n.buffer) : n.buffer, new n.constructor(r, n.byteOffset, n.length);

      case "[object Map]":
        return r = u ? o(v(n), 1) : v(n), f(r, t, new n.constructor());

      case "[object Number]":
      case "[object String]":
        return new c(n);

      case "[object RegExp]":
        return r = new n.constructor(n.source, ae.exec(n)), r.lastIndex = n.lastIndex, r;

      case "[object Set]":
        return r = u ? o(_(n), 1) : _(n), f(r, e, new n.constructor());

      case "[object Symbol]":
        return ln ? Object(ln.call(n)) : {};
    }
  }

  function gt(t) {
    return On(t) || wn(t) || !!(Re && t && t[Re]);
  }

  function _t(t, e) {
    return e = null == e ? 9007199254740991 : e, !!e && (typeof t == "number" || he.test(t)) && -1 < t && 0 == t % 1 && t < e;
  }

  function dt(t, e, n) {
    if (!Mt(n)) return false;

    var r = _typeof(e);

    return !!("number" == r ? It(n) && _t(e, n.length) : "string" == r && e in n) && Ft(n[e], t);
  }

  function At(t, e) {
    if (On(t)) return false;

    var n = _typeof(t);

    return !("number" != n && "symbol" != n && "boolean" != n && null != t && !Lt(t)) || re.test(t) || !ne.test(t) || null != e && t in Object(e);
  }

  function mt(t) {
    var e = t && t.constructor;
    return t === (typeof e == "function" && e.prototype || ze);
  }

  function wt(t, e) {
    return function (n) {
      return null != n && n[t] === e && (e !== Zt || t in Object(n));
    };
  }

  function Ot(t, e) {
    var r = void 0,
        r = He(r === Zt ? t.length - 1 : r, 0);
    return function () {
      for (var o = arguments, u = -1, c = He(o.length - r, 0), i = Array(c); ++u < c;) {
        i[u] = o[r + u];
      }

      for (u = -1, c = Array(r + 1); ++u < r;) {
        c[u] = o[u];
      }

      return c[r] = e(i), n(t, this, c);
    };
  }

  function St(t) {
    if (typeof t == "string" || Lt(t)) return t;
    var e = t + "";
    return "0" == e && 1 / t == -te ? "-0" : e;
  }

  function kt(t) {
    if (null != t) {
      try {
        return Fe.call(t);
      } catch (t) {}

      return t + "";
    }

    return "";
  }

  function zt(t, e) {
    return (On(t) ? r : hn)(t, bt(e, 3));
  }

  function xt(t, e) {
    function n() {
      var r = arguments,
          o = e ? e.apply(this, r) : r[0],
          u = n.cache;
      return u.has(o) ? u.get(o) : (r = t.apply(this, r), n.cache = u.set(o, r) || u, r);
    }

    if (typeof t != "function" || null != e && typeof e != "function") throw new TypeError("Expected a function");
    return n.cache = new (xt.Cache || O)(), n;
  }

  function Ft(t, e) {
    return t === e || t !== t && e !== e;
  }

  function It(t) {
    return null != t && Bt(t.length) && !$t(t);
  }

  function Et(t) {
    return Ut(t) && It(t);
  }

  function $t(t) {
    return !!Mt(t) && (t = V(t), "[object Function]" == t || "[object GeneratorFunction]" == t || "[object AsyncFunction]" == t || "[object Proxy]" == t);
  }

  function Bt(t) {
    return typeof t == "number" && -1 < t && 0 == t % 1 && 9007199254740991 >= t;
  }

  function Mt(t) {
    var e = _typeof(t);

    return null != t && ("object" == e || "function" == e);
  }

  function Ut(t) {
    return null != t && _typeof(t) == "object";
  }

  function Dt(t) {
    return typeof t == "string" || !On(t) && Ut(t) && "[object String]" == V(t);
  }

  function Lt(t) {
    return _typeof(t) == "symbol" || Ut(t) && "[object Symbol]" == V(t);
  }

  function Pt(t) {
    return t ? (t = Vt(t), t === te || t === -te ? 1.7976931348623157e308 * (0 > t ? -1 : 1) : t === t ? t : 0) : 0 === t ? t : 0;
  }

  function Nt(t) {
    t = Pt(t);
    var e = t % 1;
    return t === t ? e ? t - e : t : 0;
  }

  function Vt(t) {
    if (typeof t == "number") return t;
    if (Lt(t)) return ee;
    if (Mt(t) && (t = typeof t.valueOf == "function" ? t.valueOf() : t, t = Mt(t) ? t + "" : t), typeof t != "string") return 0 === t ? t : +t;
    t = t.replace(ce, "");
    var e = le.test(t);
    return e || be.test(t) ? ve(t.slice(2), e ? 2 : 8) : fe.test(t) ? ee : +t;
  }

  function Ct(t) {
    return null == t ? "" : Z(t);
  }

  function Rt(t, e, n) {
    return t = null == t ? Zt : P(t, e), t === Zt ? n : t;
  }

  function Tt(t, e) {
    var n;

    if (n = null != t) {
      n = t;
      var r;
      r = et(e, n);

      for (var o = -1, u = r.length, c = false; ++o < u;) {
        var i = St(r[o]);
        if (!(c = null != n && null != n && i in Object(n))) break;
        n = n[i];
      }

      c || ++o != u ? n = c : (u = null == n ? 0 : n.length, n = !!u && Bt(u) && _t(i, u) && (On(n) || wn(n)));
    }

    return n;
  }

  function Wt(t) {
    if (It(t)) t = z(t);else if (mt(t)) {
      var e,
          n = [];

      for (e in Object(t)) {
        Ie.call(t, e) && "constructor" != e && n.push(e);
      }

      t = n;
    } else t = Ke(t);
    return t;
  }

  function Gt(t) {
    if (It(t)) t = z(t, true);else if (Mt(t)) {
      var e,
          n = mt(t),
          r = [];

      for (e in t) {
        ("constructor" != e || !n && Ie.call(t, e)) && r.push(e);
      }

      t = r;
    } else {
      if (e = [], null != t) for (n in Object(t)) {
        e.push(n);
      }
      t = e;
    }
    return t;
  }

  function qt(t) {
    return null == t ? [] : j(t, Wt(t));
  }

  function Kt(t) {
    return function () {
      return t;
    };
  }

  function Ht(t) {
    return t;
  }

  function Jt(t) {
    return G(typeof t == "function" ? t : B(t, 1));
  }

  function Qt(t) {
    return At(t) ? h(St(t)) : Q(t);
  }

  function Xt() {
    return [];
  }

  function Yt() {
    return false;
  }

  var Zt,
      te = 1 / 0,
      ee = NaN,
      ne = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      re = /^\w*$/,
      oe = /^\./,
      ue = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,
      ce = /^\s+|\s+$/g,
      ie = /\\(\\)?/g,
      ae = /\w*$/,
      fe = /^[-+]0x[0-9a-f]+$/i,
      le = /^0b[01]+$/i,
      se = /^\[object .+?Constructor\]$/,
      be = /^0o[0-7]+$/i,
      he = /^(?:0|[1-9]\d*)$/,
      pe = {};
  pe["[object Float32Array]"] = pe["[object Float64Array]"] = pe["[object Int8Array]"] = pe["[object Int16Array]"] = pe["[object Int32Array]"] = pe["[object Uint8Array]"] = pe["[object Uint8ClampedArray]"] = pe["[object Uint16Array]"] = pe["[object Uint32Array]"] = true, pe["[object Arguments]"] = pe["[object Array]"] = pe["[object ArrayBuffer]"] = pe["[object Boolean]"] = pe["[object DataView]"] = pe["[object Date]"] = pe["[object Error]"] = pe["[object Function]"] = pe["[object Map]"] = pe["[object Number]"] = pe["[object Object]"] = pe["[object RegExp]"] = pe["[object Set]"] = pe["[object String]"] = pe["[object WeakMap]"] = false;
  var ye = {};
  ye["[object Arguments]"] = ye["[object Array]"] = ye["[object ArrayBuffer]"] = ye["[object DataView]"] = ye["[object Boolean]"] = ye["[object Date]"] = ye["[object Float32Array]"] = ye["[object Float64Array]"] = ye["[object Int8Array]"] = ye["[object Int16Array]"] = ye["[object Int32Array]"] = ye["[object Map]"] = ye["[object Number]"] = ye["[object Object]"] = ye["[object RegExp]"] = ye["[object Set]"] = ye["[object String]"] = ye["[object Symbol]"] = ye["[object Uint8Array]"] = ye["[object Uint8ClampedArray]"] = ye["[object Uint16Array]"] = ye["[object Uint32Array]"] = true, ye["[object Error]"] = ye["[object Function]"] = ye["[object WeakMap]"] = false;

  var je,
      ve = parseInt,
      ge = (typeof global === "undefined" ? "undefined" : _typeof(global)) == "object" && global && global.Object === Object && global,
      _e = (typeof self === "undefined" ? "undefined" : _typeof(self)) == "object" && self && self.Object === Object && self,
      de = ge || _e || Function("return this")(),
      Ae = (typeof exports === "undefined" ? "undefined" : _typeof(exports)) == "object" && exports && !exports.nodeType && exports,
      me = Ae && (typeof module === "undefined" ? "undefined" : _typeof(module)) == "object" && module && !module.nodeType && module,
      we = me && me.exports === Ae,
      Oe = we && ge.process;

  t: {
    try {
      je = Oe && Oe.binding && Oe.binding("util");
      break t;
    } catch (t) {}

    je = void 0;
  }

  var Se = je && je.isTypedArray,
      ke = Array.prototype,
      ze = Object.prototype,
      xe = de["__core-js_shared__"],
      Fe = Function.prototype.toString,
      Ie = ze.hasOwnProperty,
      Ee = function () {
    var t = /[^.]+$/.exec(xe && xe.keys && xe.keys.IE_PROTO || "");
    return t ? "Symbol(src)_1." + t : "";
  }(),
      $e = ze.toString,
      Be = RegExp("^" + Fe.call(Ie).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"),
      Me = we ? de.Buffer : Zt,
      Ue = de.Symbol,
      De = de.Uint8Array,
      Le = Me ? Me.f : Zt,
      Pe = g(Object.getPrototypeOf),
      Ne = Object.create,
      Ve = ze.propertyIsEnumerable,
      Ce = ke.splice,
      Re = Ue ? Ue.isConcatSpreadable : Zt,
      Te = Ue ? Ue.toStringTag : Zt,
      We = function () {
    try {
      var t = yt(Object, "defineProperty");
      return t({}, "", {}), t;
    } catch (t) {}
  }(),
      Ge = Object.getOwnPropertySymbols,
      qe = Me ? Me.isBuffer : Zt,
      Ke = g(Object.keys),
      He = Math.max,
      Je = Math.min,
      Qe = Date.now,
      Xe = yt(de, "DataView"),
      Ye = yt(de, "Map"),
      Ze = yt(de, "Promise"),
      tn = yt(de, "Set"),
      en = yt(de, "WeakMap"),
      nn = yt(Object, "create"),
      rn = kt(Xe),
      on = kt(Ye),
      un = kt(Ze),
      cn = kt(tn),
      an = kt(en),
      fn = Ue ? Ue.prototype : Zt,
      ln = fn ? fn.valueOf : Zt,
      sn = fn ? fn.toString : Zt,
      bn = function () {
    function t() {}

    return function (e) {
      return Mt(e) ? Ne ? Ne(e) : (t.prototype = e, e = new t(), t.prototype = Zt, e) : {};
    };
  }();

  m.prototype.clear = function () {
    this.__data__ = nn ? nn(null) : {}, this.size = 0;
  }, m.prototype.delete = function (t) {
    return t = this.has(t) && delete this.__data__[t], this.size -= t ? 1 : 0, t;
  }, m.prototype.get = function (t) {
    var e = this.__data__;
    return nn ? (t = e[t], "__lodash_hash_undefined__" === t ? Zt : t) : Ie.call(e, t) ? e[t] : Zt;
  }, m.prototype.has = function (t) {
    var e = this.__data__;
    return nn ? e[t] !== Zt : Ie.call(e, t);
  }, m.prototype.set = function (t, e) {
    var n = this.__data__;
    return this.size += this.has(t) ? 0 : 1, n[t] = nn && e === Zt ? "__lodash_hash_undefined__" : e, this;
  }, w.prototype.clear = function () {
    this.__data__ = [], this.size = 0;
  }, w.prototype.delete = function (t) {
    var e = this.__data__;
    return t = F(e, t), !(0 > t) && (t == e.length - 1 ? e.pop() : Ce.call(e, t, 1), --this.size, true);
  }, w.prototype.get = function (t) {
    var e = this.__data__;
    return t = F(e, t), 0 > t ? Zt : e[t][1];
  }, w.prototype.has = function (t) {
    return -1 < F(this.__data__, t);
  }, w.prototype.set = function (t, e) {
    var n = this.__data__,
        r = F(n, t);
    return 0 > r ? (++this.size, n.push([t, e])) : n[r][1] = e, this;
  }, O.prototype.clear = function () {
    this.size = 0, this.__data__ = {
      hash: new m(),
      map: new (Ye || w)(),
      string: new m()
    };
  }, O.prototype.delete = function (t) {
    return t = ht(this, t).delete(t), this.size -= t ? 1 : 0, t;
  }, O.prototype.get = function (t) {
    return ht(this, t).get(t);
  }, O.prototype.has = function (t) {
    return ht(this, t).has(t);
  }, O.prototype.set = function (t, e) {
    var n = ht(this, t),
        r = n.size;
    return n.set(t, e), this.size += n.size == r ? 0 : 1, this;
  }, S.prototype.add = S.prototype.push = function (t) {
    return this.__data__.set(t, "__lodash_hash_undefined__"), this;
  }, S.prototype.has = function (t) {
    return this.__data__.has(t);
  }, k.prototype.clear = function () {
    this.__data__ = new w(), this.size = 0;
  }, k.prototype.delete = function (t) {
    var e = this.__data__;
    return t = e.delete(t), this.size = e.size, t;
  }, k.prototype.get = function (t) {
    return this.__data__.get(t);
  }, k.prototype.has = function (t) {
    return this.__data__.has(t);
  }, k.prototype.set = function (t, e) {
    var n = this.__data__;

    if (n instanceof w) {
      var r = n.__data__;
      if (!Ye || 199 > r.length) return r.push([t, e]), this.size = ++n.size, this;
      n = this.__data__ = new O(r);
    }

    return n.set(t, e), this.size = n.size, this;
  };

  var hn = function (t, e) {
    return function (n, r) {
      if (null == n) return n;
      if (!It(n)) return t(n, r);

      for (var o = n.length, u = e ? o : -1, c = Object(n); (e ? u-- : ++u < o) && false !== r(c[u], u, c);) {
        ;
      }

      return n;
    };
  }(L),
      pn = function (t) {
    return function (e, n, r) {
      var o = -1,
          u = Object(e);
      r = r(e);

      for (var c = r.length; c--;) {
        var i = r[t ? c : ++o];
        if (false === n(u[i], i, u)) break;
      }

      return e;
    };
  }(),
      yn = We ? function (t, e) {
    return We(t, "toString", {
      configurable: true,
      enumerable: false,
      value: Kt(e),
      writable: true
    });
  } : Ht,
      jn = Ge ? function (t) {
    return null == t ? [] : (t = Object(t), u(Ge(t), function (e) {
      return Ve.call(t, e);
    }));
  } : Xt,
      vn = Ge ? function (t) {
    for (var e = []; t;) {
      a(e, jn(t)), t = Pe(t);
    }

    return e;
  } : Xt,
      gn = V;

  (Xe && "[object DataView]" != gn(new Xe(new ArrayBuffer(1))) || Ye && "[object Map]" != gn(new Ye()) || Ze && "[object Promise]" != gn(Ze.resolve()) || tn && "[object Set]" != gn(new tn()) || en && "[object WeakMap]" != gn(new en())) && (gn = function gn(t) {
    var e = V(t);
    if (t = (t = "[object Object]" == e ? t.constructor : Zt) ? kt(t) : "") switch (t) {
      case rn:
        return "[object DataView]";

      case on:
        return "[object Map]";

      case un:
        return "[object Promise]";

      case cn:
        return "[object Set]";

      case an:
        return "[object WeakMap]";
    }
    return e;
  });

  var _n = function (t) {
    var e = 0,
        n = 0;
    return function () {
      var r = Qe(),
          o = 16 - (r - n);

      if (n = r, 0 < o) {
        if (800 <= ++e) return arguments[0];
      } else e = 0;

      return t.apply(Zt, arguments);
    };
  }(yn),
      dn = function (t) {
    t = xt(t, function (t) {
      return 500 === e.size && e.clear(), t;
    });
    var e = t.cache;
    return t;
  }(function (t) {
    var e = [];
    return oe.test(t) && e.push(""), t.replace(ue, function (t, n, r, o) {
      e.push(r ? o.replace(ie, "$1") : n || t);
    }), e;
  }),
      An = X(function (t) {
    var e = i(t, tt);

    if (e.length && e[0] === t[0]) {
      t = e[0].length;

      for (var n = e.length, r = n, o = Array(n), u = 1 / 0, a = []; r--;) {
        var f = e[r],
            u = Je(f.length, u);
        o[r] = 120 <= t && 120 <= f.length ? new S(r && f) : Zt;
      }

      var f = e[0],
          l = -1,
          s = o[0];

      t: for (; ++l < t && a.length < u;) {
        var b = f[l],
            h = b,
            b = 0 !== b ? b : 0;

        if (s ? !s.has(h) : !c(a, h)) {
          for (r = n; --r;) {
            var p = o[r];
            if (p ? !p.has(h) : !c(e[r], h)) continue t;
          }

          s && s.push(h), a.push(b);
        }
      }

      e = a;
    } else e = [];

    return e;
  }),
      mn = X(function (t, e) {
    if (null == t) return [];
    var n = e.length;
    return 1 < n && dt(t, e[0], e[1]) ? e = [] : 2 < n && dt(e[0], e[1], e[2]) && (e = [e[0]]), J(t, D(e, 1), []);
  });

  xt.Cache = O;
  var wn = C(function () {
    return arguments;
  }()) ? C : function (t) {
    return Ut(t) && Ie.call(t, "callee") && !Ve.call(t, "callee");
  },
      On = Array.isArray,
      Sn = qe || Yt,
      kn = Se ? y(Se) : W;
  A.constant = Kt, A.filter = function (t, e) {
    return (On(t) ? u : U)(t, bt(e, 3));
  }, A.flatten = function (t) {
    return (null == t ? 0 : t.length) ? D(t, 1) : [];
  }, A.intersection = An, A.iteratee = Jt, A.keys = Wt, A.keysIn = Gt, A.map = function (t, e) {
    return (On(t) ? i : q)(t, bt(e, 3));
  }, A.mapKeys = function (t, e) {
    var n = {};
    return e = bt(e, 3), L(t, function (t, r, o) {
      $(n, e(t, r, o), t);
    }), n;
  }, A.mapValues = function (t, e) {
    var n = {};
    return e = bt(e, 3), L(t, function (t, r, o) {
      $(n, r, e(t, r, o));
    }), n;
  }, A.memoize = xt, A.orderBy = function (t, e, n, r) {
    return null == t ? [] : (On(e) || (e = null == e ? [] : [e]), n = r ? Zt : n, On(n) || (n = null == n ? [] : [n]), J(t, e, n));
  }, A.property = Qt, A.sortBy = mn, A.transform = function (t, e, n) {
    var o = On(t),
        u = o || Sn(t) || kn(t);

    if (e = bt(e, 4), null == n) {
      var c = t && t.constructor;
      n = u ? o ? new c() : [] : Mt(t) && $t(c) ? bn(Pe(t)) : {};
    }

    return (u ? r : L)(t, function (t, r, o) {
      return e(n, t, r, o);
    }), n;
  }, A.values = qt, A.clone = function (t) {
    return B(t, 4);
  }, A.eq = Ft, A.every = function (t, e, n) {
    var r = On(t) ? o : M;
    return n && dt(t, e, n) && (e = Zt), r(t, bt(e, 3));
  }, A.forEach = zt, A.get = Rt, A.hasIn = Tt, A.identity = Ht, A.includes = function (t, e, n, r) {
    return t = It(t) ? t : qt(t), n = n && !r ? Nt(n) : 0, r = t.length, 0 > n && (n = He(r + n, 0)), Dt(t) ? n <= r && -1 < t.indexOf(e, n) : !!r && -1 < (e === e ? d(t, e, n) : s(t, b, n));
  }, A.isArguments = wn, A.isArray = On, A.isArrayLike = It, A.isArrayLikeObject = Et, A.isBuffer = Sn, A.isFunction = $t, A.isLength = Bt, A.isObject = Mt, A.isObjectLike = Ut, A.isString = Dt, A.isSymbol = Lt, A.isTypedArray = kn, A.stubArray = Xt, A.stubFalse = Yt, A.some = function (t, e, n) {
    var r = On(t) ? l : Y;
    return n && dt(t, e, n) && (e = Zt), r(t, bt(e, 3));
  }, A.toFinite = Pt, A.toInteger = Nt, A.toNumber = Vt, A.toString = Ct, A.each = zt, A.VERSION = "4.17.4", typeof define == "function" && _typeof(define.amd) == "object" && define.amd ? (de._ = A, define(function () {
    return A;
  })) : me ? ((me.exports = A)._ = A, Ae._ = A) : de._ = A;
}).call(void 0);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});
