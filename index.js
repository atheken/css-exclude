var css = require('css');
var fs = require('fs');
var _ = require('lodash');

function selectorForRule(rule) {
  var selectors = ""

  var sels = _.sortBy(rule.selectors, function(n) {
    return n;
  });

  _.forEach(sels, function(s) {
    selectors += s + ', ';
  });

  selectors = selectors.replace(/[,\s]+$/, '');

  return selectors;
}

function cssDeclarationString(declaration) {
  return declaration.property + ' : ' + declaration.value;
}

function flattenedRules(rules) {
  var retval = {};
  retval.rules = {};

  _.forEach(rules, function(r) {
    if (r.type == "rule") {
      var selector = selectorForRule(r);
      retval.rules[selector] = retval.rules[selector] || {};
      var obj = retval.rules[selector];
      obj.declarations = obj.declarations || []
      _.forEach(r.declarations, function(d) {
        obj.declarations.push(cssDeclarationString(d));
      });
      obj.declarations = _.uniq(obj.declarations);
    }
  });

  return retval;
}

function notContained(leftRules, rightRules, firstName, secondName) {
  var result = "";

  var leftKeys = _.keys(leftRules.rules);
  var rightKeys = _.keys(rightRules.rules);

  result += '/* Selectors in ' + firstName + ', not in ' + secondName + '.*/\n';

  _.forEach(_.difference(leftKeys, rightKeys), function(key) {
    result += key + ' {\n';

    _.forEach(leftRules.rules[key].declarations, function(d) {
      result += '\t' + d + '\n';
    });
    result += '}\n\n';
  });

  return result;
}

function flattedRulesDiff(leftRules, rightRules, outputSide) {
  var result = "";
  if (outputSide !== "right") {
    result += notContained(leftRules, rightRules, "left", "right");
  }
  if (outputSide !== "left") {
    result += notContained(rightRules, leftRules, "right", "left");
  }

  var sharedKeys = _.intersection(_.keys(leftRules.rules), _.keys(rightRules.rules));

  result += '/*\n  Selectors that are in both files but\n  (may) have "conflicting" declarations.\n*/\n';

  _.forEach(sharedKeys, function(key) {
    var leftDec = _.difference(leftRules.rules[key].declarations, rightRules.rules[key].declarations);
    var rightDec = _.difference(rightRules.rules[key].declarations, leftRules.rules[key].declarations);

    if (outputSide === "left" && leftDec.length > 0) {
      result += key + ' {\n';
      if (leftDec.length > 0) {
        _.forEach(leftDec, function(dec) {
          result += '\t' + dec + ';\n'
        });
      }
      result += '}\n';
    } else if (outputSide === "right" && rightDec.length > 0) {
      result += key + ' {\n';
      if (rightDec.length > 0) {
        _.forEach(rightDec, function(dec) {
          result += '\t' + dec + ';\n'
        });
      }
      result += '}\n';
    } else if (leftDec.length > 0 || rightDec.length > 0) {

      result += key + ' {\n';

      if (leftDec.length > 0) {
        result += '\t/* Missing from right: */\n';
        _.forEach(leftDec, function(dec) {
          result += '\t' + dec + ';\n'
        });
      }

      if (rightDec.length > 0) {
        result += '\t/* Missing from left: */\n';
        _.forEach(rightDec, function(dec) {
          result += '\t' + dec + ';\n'
        });
      }
      result += '}\n';
    }

  });

  return result;
}

module.exports = function(file1, file2, outputSide) {
  var left = css.parse(file1);
  var right = css.parse(file2);

  var leftFlat = flattenedRules(left.stylesheet.rules);
  var rightFlat = flattenedRules(right.stylesheet.rules);

  return flattedRulesDiff(leftFlat, rightFlat, outputSide);
}