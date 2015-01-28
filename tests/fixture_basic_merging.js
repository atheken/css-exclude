var mocha = require('mocha');
var assert = require('assert');
var fs = require('fs');
var cssmerge = require('../index.js');

describe('merger', function() {
  it('produces missing rules', function() {
    var file1 = fs.readFileSync(__dirname + '/first-sheet.css', {
      encoding: 'utf8'
    });
    var file2 = fs.readFileSync(__dirname + '/second-sheet.css', {
      encoding: 'utf8'
    });
    var firstMinusSecond = fs.readFileSync(__dirname + '/first-excluding-second.css', {
      encoding: 'utf8'
    });

    var result = cssmerge.exclude(file1, file2).toString()
    assert.equal(firstMinusSecond.replace(/\s+/g, ''), result.replace(/\s+/g, ''));
  });
});