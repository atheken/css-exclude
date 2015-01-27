var css = require('css');
var fs = require('fs');
var _ = require('lodash');

function RuleNode() {
  this.children = [];
  this.type = "rule"
};

RuleNode.prototype.toString = function() {
  var retval = "";
  var inner = "";
  _.forEach(this.children, function(c) {
    inner += c.toString();
  });
  if (inner !== "") {
    retval = this.selectors + " {\n" + inner + "}\n";
  }
  return retval;
};

RuleNode.prototype.exclude = function(rightRules) {
  var self = this;
  _.forEach(rightRules, function(r) {
    if (r.type = self.type && r.selectors == self.selectors) {
      var rightStrings = _.map(r.declarations, function(d) {
        return d.toString();
      });

      self.children = _.remove(self.children, function(c) {
        //remove 
        return _.find(rightStrings, function(r) {
          return c.toString() == r;
        });
      });
    }
  });
}

function AtRuleNode() {
  this.children = []
}

AtRuleNode.prototype.toString = function() {
  var retval = '';
  var inner = '';
  _.forEach(this.children, function(c) {
    inner += c.toString();
  });

  if (inner !== '') {
    retval = "@" + this.name + " " + this.selector + " {\n" + inner + "\n}\n";
  }
  return retval;
}

AtRuleNode.prototype.exclude = function(rightRules) {
  var self = this;
  _.forEach(rightRules, function(r) {
    if (self.name == r.name &&
      self.selector == r.selector &&
      self.type == r.type) {
      _.forEach(self.children, function(c) {
        c.exclude(r.children);
      });
    }
  });
}

function DeclarationNode() {
  this.type = "declaration";
};

DeclarationNode.prototype.toString = function() {
  return '\t' + this.name + ' : ' + this.value + ';\n';
}

function convertSheetToNodes(rules) {
  var retval = [];
  _.forEach(rules, function(r) {
    var node = null;
    switch (r.type) {
      case "rule":
      case "keyframe":
        node = new RuleNode();
        node.selectors = selectorForRule(r);
        node.children = convertSheetToNodes(r.declarations);
        break;
      case "media":
        node = new AtRuleNode();
        node.name = "media";
        node.selector = r.media;
        node.children = convertSheetToNodes(r.rules);
        break;
      case "font-face":
        node = new AtRuleNode();
        node.name = "font-face";
        node.selector = '';
        node.children = convertSheetToNodes(r.declarations);
        break;
      case "key-frames":
        node = new AtRuleNode();
        node.name = (node.vendor || '') + "key-frames";
        node.selector = '';
        node.children = convertSheetToNodes(r.keyframes);
        break;
      case "declaration":
        node = new DeclarationNode();
        node.name = r.property;
        node.value = r.value;
        break;
        //import
    }
    if (node !== null) {
      retval.push(node);
    }
  });
  return retval;
}

function selectorForRule(rule) {
  var sels = _.sortBy(rule.selectors || rule.values);
  var selectors = _.reduce(sels, function(r, s) {
    return r += s + ', ';
  }, '');
  return selectors.replace(/[,\s]+$/, '');
}



module.exports = {};
module.exports.RuleNode = RuleNode;
module.exports.AtRuleNode = AtRuleNode;
module.exports.DeclarationNode = DeclarationNode;
module.exports.merger = function(leftFile, rightFile) {

  var left = convertSheetToNodes(css.parse(leftFile).stylesheet.rules);
  var right = convertSheetToNodes(css.parse(rightFile).stylesheet.rules);

  var retval = [];

  _.forEach(left, function(l) {
    l.exclude(right);
    retval.push(l);
  });

  return left;
}