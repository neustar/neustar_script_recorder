// Copyright 2000 - 2015 NeuStar, Inc.All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
function CallSelenium(definition, args) {
  if (definition instanceof CommandDefinition) {
    this.message = definition.name;
    if (definition.isAccessor) {
      this["isAccessor"] = definition.isAccessor;
    }
  } else {
    this.message = definition;
  }
  if (args) {
    this.args = args;
  } else {
    this.args = [];
  }
}

CallSelenium.prototype.toString = function() {
  var result = '';

  if (options.receiver) {
    result += options.receiver + '.';
  }
  if (this.commandString) {
    if (this.commandString.match(/^(assert|verify)/)) {
      if (this.message.match(/^is.*$/)) {
        result += this.message.substring(2);
      } else if (this.message.match(/^get.*$/)) {
        result += this.message.substring(3);
      }
    } else if (this.commandString.match(/^store/)) {
      result += this.message;
    }
  } else {
    result += this.message;
  }
  
  result += '(';
  for (var i = 0; i < this.args.length; i++) {
    // this will work for things like 'link=${foo}' but wont for 'link=flying ${foo}'
    var matches = this.args[i].match(/(\$\{\w+\}{1})/);
    if (matches) {
      var before = this.args[i].match(/^(.*=){1}/)[1];
      var after = this.args[i].match(/\$\{(\w+)\}{1}/)[1];
      result += before + '" + ' + after;
    } else {
      result += this.args[i];
    }

    if (i < this.args.length - 1) {
      result += ', ';
    }
  }
  result += ')';
  return result;
};