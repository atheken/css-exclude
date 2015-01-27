#!/usr/bin/env node

var fs = require('fs');

var merger = require('./index.js');

var side = process.argv[4] || "both";

fs.readFile(process.argv[2], 'utf8', function readFile1(err, file1) {
  if (!err) {
    fs.readFile(process.argv[3], 'utf8', function readFile2(err, file2) {
      process.stdout.write(merger(file1, file2, side));
    });
  } else {
    console.log(err);
  }
});