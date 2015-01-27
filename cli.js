#!/usr/bin/env node

var fs = require('fs');
var _ = require('lodash');

var cssmerger = require('./index.js');

var side = process.argv[4] || "both";
fs.readFile(process.argv[2], 'utf8', function readFile1(err, file1) {
  if (!err) {
    fs.readFile(process.argv[3], 'utf8', function readFile2(err, file2) {

      _.forEach(cssmerger.merger(file1, file2), function(r) {
        process.stdout.write(r.toString());
      });

    });
  } else {
    console.log(err);
  }
});