/*
 * Neustar JS
 */

var subScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
subScriptLoader.loadSubScript('chrome://selenium-ide/content/formats/remoteControl.js', this);
subScriptLoader.loadSubScript('chrome://script_recorder/content/formats/callSelenium.js', this);
subScriptLoader.loadSubScript('chrome://script_recorder/content/formats/equals.js', this);
subScriptLoader.loadSubScript('chrome://script_recorder/content/formats/notEquals.js', this);
subScriptLoader.loadSubScript('chrome://script_recorder/content/formats/regexpMatch.js', this);
subScriptLoader.loadSubScript('chrome://script_recorder/content/formats/string.js', this);

this.name = "neustar-js";

// what the format's emitted name will be
function testMethodName(testName) {
  return "";
}

function assertTrue(expression) {
  // expression is a CallSelenium object
  return options.receiver + ".assert" + expression.toString().substring("selenium.".length).capitalize() + ";";
}

function assertFalse(expression) {
  // expression is a CallSelenium object
  return options.receiver + ".assertNot" + expression.toString().substring("selenium.".length).capitalize() + ";";
}

// get* commands
function assertOrVerify(info) {
  if (info.command.command.match(/^assert/)) {
    if (info.def.negative) {
      return assertFalse(info.call);
    } else {
      return assertTrue(info.call);
    }
  } else {
    if (info.def.negative) {
      return verifyFalse(info.call);
    } else {
      return verifyTrue(info.call);
    }
  }
}

// is* commands
function verifyTrue(expression) {
  return options.receiver + ".verify" + expression.toString().substring("selenium.".length).capitalize() + ";";
}

function verifyFalse(expression) {
  return options.receiver + ".verifyNot" + expression.toString().substring("selenium.".length).capitalize() + ";";
}

function store(info) {
  var line = 'var ';

  if (info.command.value) {
    line += info.command.value;
  } else {
    line += info.command.target;
  }
  line += ' = ';

  if (info.def.isAccessor) {
    line += options.receiver + '.';
    if (info.def.name.match(/^is/)) {
      line += 'is';
    } else {
      line += 'get';
    }
  }

  if (info.command.command.match(/^store$/)) {
    line += info.command.target;
  } else {
    line += info.command.command.substring("store".length);
    line += "(";
    if (info.command.value) {
      line += string(info.command.target);
    }
    line += ')';
  }
  line += ';';
  return line;
}

function waitFor(info) {
  var line = options.receiver + "." + info.command.command + "(";
  if (info.command.target) {
    line += string(info.command.target);
  }
  if (info.command.value) {
    line += ", " + string(info.command.value);
  }
  line += ");";
  return line;
}

function assertOrVerifyFailure(line, isAssert) {
  var message = '"expected failure"';
  var failStatement = isAssert ? "Assert.Fail(" + message + ");" : 
    "verificationErrors.Append(" + message + ");";
  return "try\n" +
    "{\n" +
    line + "\n" +
    failStatement + "\n" +
    "}\n" +
    "catch (Exception) {}\n";
}

function pause(milliseconds) {
  return "test.pause(" + parseInt(milliseconds, 10) + ");";
}

function echo(message) {
  return "test.log(" + xlateArgument(message) + ");";
}

function statement(expression) {
  return expression.toString() + ';';
}

function array(value) {
  var str = 'new String[] {';
  for (var i = 0; i < value.length; i++) {
    str += string(value[i]);
    if (i < value.length - 1) str += ", ";
  }
  str += '}';
  return str;
}

function nonBreakingSpace() {
    return "\"\\u00a0\"";
}

function setIndent(i) {
  this.lastIndent = indents(i);
}

function formatTransactions(command) {
  var line = '';
  
  if (command.command.match(/^begin.*/)) {
      line = line + options.tx + ' = ';
  }
  line = line + 'test.' + command.command + '();';
  return line;
};

function formatSteps(command) {
  var line = '';
  
  if (command.command.match(/^begin.*/)) {
    line = options.step + " = test." + command.command + '(';
    line = line + '"' + command.target + '"';
    if (command.value) {
      line = line + ", " + command.value;
    }
  } else {
    line = 'test.' + command.command + '(';
  }
  return line + ");";
};

formatCommand = function(command) {
  var info = new CommandInformation(command);
  var line = null;

  setIndent(2);
  if (command.type == 'command') {
    var def = command.getDefinition();
    if (def && def.isAccessor) {
      line = formatAccessor(info);
    } else if (this.pause && 'pause' == command.command) {
      line = pause(command.target);
    } else if (this.echo && 'echo' == command.command) {
      line = echo(command.target);
    } else if ('store' == command.command) {
      line = store(info);
    } else if (this.set && command.command.match(/^set/)) {
        line = set(command.command, command.target);
    } else if (command.command.match(/^.*Transaction$/)) {
      // beginTransaction(), endTransaction()
      setIndent(0);
      return formatTransactions(command);
    } else if (command.command.match(/^.*Step$/)) {
      // beginStep(name), endStep()
      setIndent(1);
      return formatSteps(command);
    } else if (def) {
      if (def.name.match(/^(assert|verify)(Error|Failure)OnNext$/)) {
        this.assertOrVerifyFailureOnNext = true;
        this.assertFailureOnNext = def.name.match(/^assert/);
        this.verifyFailureOnNext = def.name.match(/^verify/);
      } else {
        var call = new CallSelenium(def.name);
        if ("open" == def.name) {
            if (command.target.match(/(\$\{\w+\}{1})/)) {
                var matches = command.target.match(/(\$\{\w+\}{1})/);
                if (matches) {
                  var stored = command.target.match(/\$\{(\w+)\}{1}/)[1];
                  call.args.push(stored);
                }
            } else if (! command.target.match(/^\w+:\/\//)) {
              call.args.push('baseUrl + "' + command.target + '"');
            } else {
              // full url
              call.args.push(xlateArgument(command.target));
            }
        } else {
            for (var i = 0; i < def.params.length; i++) {
                call.args.push(xlateArgument(command.getParameterAt(i)));
            }
        }
        line = statement(call, command);
      }
    } else {
      this.log.info("unknown command: <" + command.command + ">");
      // TODO
      var call = new CallSelenium(command.command);
      if ((command.target != null && command.target.length > 0)
        || (command.value != null && command.value.length > 0)) {
        call.args.push(string(command.target));
        if (command.value != null && command.value.length > 0) {
          call.args.push(string(command.value));
        }
      }
      line = formatComment(new Comment(statement(call)));
    }
  }
  if (line && this.assertOrVerifyFailureOnNext) {
    line = assertOrVerifyFailure(line, this.assertFailureOnNext);
    this.assertOrVerifyFailureOnNext = false;
    this.assertFailureOnNext = false;
    this.verifyFailureOnNext = false;
  }
  return line;
};

function formatAccessor(info) {
  for (var i = 0; i <= info.def.params.length; i++) {
    info.call.args.push(xlateArgument(info.command.getParameterAt(i)));
  }
  var extraArg = info.command.getParameterAt(info.def.params.length);
  if (info.def.name.match(/^is/)) { // isXXX
    if (info.command.command.match(/^assert/) || (this.assertOrVerifyFailureOnNext && info.command.command.match(/^verify/))) {
      line = (info.def.negative ? assertFalse : assertTrue)(info.call);
    } else if (info.command.command.match(/^verify/)) {
      line = (info.def.negative ? verifyFalse : verifyTrue)(info.call);
    } else if (info.command.command.match(/^store/)) {
      addDeclaredVar(extraArg);
      line = store(info);
    } else if (info.command.command.match(/^waitFor/)) {
      if (info.def.negative) {
        info.call.invert();
      }
      line = waitFor(info);
    }
  } else { // getXXX
    if (info.command.command.match(/^(verify|assert)/)) {
      line = assertOrVerify(info);
    } else if (info.command.command.match(/^store/)) {
      addDeclaredVar(extraArg);
      line = store(info);
    } else if (info.command.command.match(/^waitFor/)) {
      var eq = seleniumEquals(info.def.returnType, extraArg, info.call);
      if (info.def.negative) {
        info.call = info.call.invert();
      }
      line = waitFor(info);
    }
  }
  return line;
}

function formatComment(comment) {
  return comment.comment.replace(/.+/mg, function(str) {
      return "// " + str;
    });
}

function CommandInformation(command) {
  // backward compatibility
  this.command = command;
  
  // for(var prop in command) {
  //   this[prop] = command[prop];
  // }
  
  var def = command.getDefinition();
  if (def) {
    // backward compatibility
    this.def = def;
    
    // for(var prop in def) {
    //   this[prop] = def[prop];
    // }
    
    var call = new CallSelenium(def); 
    this.call = call;
    this.call.commandString = command.command;
    
    // for(var prop in call) {
    //   this[prop] = call[prop];
    // }
    
  }
}

function defaultExtension() {
  return this.options.defaultExtension;
}

this.options = {
  receiver: "selenium",
  tx: "tx",
  step: "step",
  rcHost: "localhost",
  rcPort: "4444",
  environment: "*chrome",
  namespace: "SeleniumTests",
  indent: '2',
  initialIndents: '0',
  footer: '',
  defaultExtension: "js"
};

var se_prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.selenium-ide.");

this.options["header"] =
  'var webDriver = test.openBrowser();\n' +
  'var selenium = webDriver.getSelenium();\n' +
  '\n' +
  'var timeout = ' + se_prefs.getCharPref("timeout") + ';\n' +
  'selenium.setTimeout(timeout);\n' +
  '\n' +
  'var baseUrl = "${baseURL}";\n' +
  '\n';

this.configForm =
  '<description>Variable for Neustar transactions</description>' +
  '<textbox id="options_tx" />' +
  '<description>Variable for Neustar steps</description>' +
  '<textbox id="options_step" />';