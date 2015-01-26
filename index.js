var css = require('css');
var fs = require('fs');
var _ = require('lodash');

fs.readFile(process.argv[2], 'utf8', function readFile1(err, file1) {
  if (!err) {
    var left = css.parse(file1);
    fs.readFile(process.argv[3], 'utf8', function readFile2(err, file2) {
      var right = css.parse(file2);

      var leftFlat = flattenedRules(left.stylesheet.rules);
      var rightFlat = flattenedRules(right.stylesheet.rules);

      var diffed = flattedRulesDiff(leftFlat, rightFlat);

      process.stdout.write(diffed);
      //console.log(leftFlat.rules);
      //console.log(rightFlat.rules);
    });
  } else {
    console.log(err);
  }
});

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

function flattedRulesDiff(leftRules, rightRules) {
  var result = "";
  result += notContained(leftRules, rightRules, "left", "right");
  result += notContained(rightRules, leftRules, "right", "left");

  result += '/* Selectors that were shared, but contain separate declarations */\n';

  var sharedKeys = _.intersection(_.keys(leftRules.rules), _.keys(rightRules.rules));

  _.forEach(sharedKeys, function(key) {
    var leftDec = _.difference(leftRules.rules[key].declarations, rightRules.rules[key].declarations);
    var rightDec = _.difference(rightRules.rules[key].declarations, leftRules.rules[key].declarations);

    if (leftDec.length > 0 || rightDec.length > 0) {
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

function compareCssRules(rule, rightTree) {

  var rightRules = _.filter(rightTree, function(r) {
    return r.type == 'rule';
  });

  var candidates = _.filter(rightRules, function(element) {
    //if the selectors aren't identical, this is not a "match"
    var xor_test = _.xor(rule.selectors, element.selectors).length === 0;
    return xor_test;
  });

  var ruleSelector = selectorForRule(rule);

  if (candidates.length > 0) {
    var missingProps = []

    var leftProps = _.map(rule.declarations, cssDeclarationString);

    _.forEach(candidates, function(rightRule) {
      var rightProps = _.map(rightRule.declarations, cssDeclarationString);
      var diff = _.difference(leftProps, rightProps);

      missingProps = _.union(missingProps, diff);

    });

    if (missingProps.length > 0) {
      declarations = "";
      _.forEach(missingProps, function(s) {
        declarations += '\t' + s + ';\n';
      });

      process.stdout.write(ruleSelector + '{\n' + declarations + '}\n');
    }
  } else {
    declarations = "";
    _.forEach(rule.declarations, function(s) {
      declarations += '\t' + cssDeclarationString(s) + ';\n';
    });

    process.stdout.write(ruleSelector + '{\n' + declarations + '}\n');
  }
}


//given a node on the left, 
//detect missing elements on the right

function compare(rule, rightTree) {

  switch (rule.type) {
    case "rule":
      compareCssRules(rule, rightTree);
      break;
    case "media":
      break;
    case "keyframes":
      break;
    case "comment":
      //ignore.
      break;
  }
}