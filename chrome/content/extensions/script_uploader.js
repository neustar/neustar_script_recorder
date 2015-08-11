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
var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
loader.loadSubScript("chrome://script_recorder/content/third_party/Crypto-JS/2.5.3-crypto-md5.js", this);
loader.loadSubScript("chrome://script_recorder/content/third_party/parseUri/parseUri-1.2.2.js", this);
// loader.loadSubScript("chrome://selenium-ide/content/tools.js", this);
loader.loadSubScript("chrome://script_recorder/content/js/log.js", this);

var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.selenium-ide.webmetrics.");
var api_host = prefs.getCharPref("api_url");

function uuid()
{
   var chars = '0123456789abcdef'.split('');

   var uuid = [], rnd = Math.random, r;
   uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
   uuid[14] = '4'; // version 4

   for (var i = 0; i < 36; i++)
   {
      if (!uuid[i])
      {
         r = 0 | rnd()*16;

         uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
      }
   }
   return uuid.join('');
}

function ScriptUploader() {
    this.editor = window.editor;
    // this.view = document.getElementById("script_recorderView");
    // this.viewDoc = this.view.contentDocument;
    // this.msgElement = this.viewDoc.getElementById("msg");
    this.secretkey = retrieveWebMetricsSecretKey();
    this.publickey = retrieveWebMetricsPublicKey();
    
    this.logger = new Log("ScriptUploader");
}

/**
* The main public interface
*/
ScriptUploader.prototype.registerCommandInspector = function (inspector, pattern) {
    //Send a null pattern or skip the pattern argument to receive all commands
    if (!pattern) {
        pattern = ".";
    }
    this.commandInspectors.push({ 'inspector': inspector, 'pattern': new RegExp(pattern), 'results': new Array() });
};

function getSig(secret_key, method, uri, params) {
  var data;
  
  var uri_bits = parseUri(uri);
  data = method + '\n' + uri_bits.host + '\n' + uri_bits.directory + '\n' + params;
  return window.btoa(Crypto.HMAC(Crypto.SHA1, data, secret_key, {asString: true}));
}

ScriptUploader.prototype.generateSignature = function(publickey, secretkey) {
  var d = new Date();
  var s = Math.floor(d.getTime() / 1000);
  return Crypto.MD5(publickey + secretkey + s);
};

var xmlHttp;

function requestHandler(request) {
    var xmlHttp = request;
    var handler = new function() {
        if (xmlHttp.readyState != 4) {
            return;
        }
        parseResult(xmlHttp.responseText);
    };
}

function parseResult(su_instance, xml) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString("<blah></blah>", "text/xml");
    xmlDoc = parser.parseFromString(xml, "text/xml");
    var rsp = xmlDoc.getElementsByTagName("rsp")[0];
    var rsp_stat = rsp.attributes.getNamedItem("stat").value;
    su_instance.addMessage("Response status = " + rsp_stat);
    if (rsp_stat != "ok") {
        su_instance.addMessage("WebService call failed");
        return;
    }
    var services = xmlDoc.getElementsByTagName("service");
    if (services.length == 0) {
        su_instance.addMessage("0 Services returned");
        return;
    }
    for (var i = 0; i < services.length; i++) {
        var name = services[i].getElementsByTagName("name")[0];
        var id = services[i].getElementsByTagName("id")[0];
        su_instance.addMessage(name.textContent + " (" + id.textContent + ")");
    }
}

ScriptUploader.prototype.messageCount = 0;
ScriptUploader.prototype.addMessage = function (message) {
    var div = this.viewDoc.createElement('div');
    div.id = "msg" + this.messageCount++;
    div.className = "msg";
    div.innerHTML = message;
    this.viewDoc.body.appendChild(div);
};

ScriptUploader.prototype.upload = function () {
  var logger = new Log('Upload');
  
  var username = this.secretkey;
  var api_key = this.publickey;

  if (typeof username == "undefined" || username.length == 0 ||
      typeof api_key == "undefined" || api_key.length == 0) {
    window.open('chrome://script_recorder/content/view/options.xul','Options', 'chrome=yes,modal=yes,centerscreen=yes');
  }

  var method = "POST";
  
  // get the script
  var tco = this.editor.app.getTestCase();
  var htmlFormat = this.getHTMLFormatter().getFormatter();
  
  var scriptAsHTML = htmlFormat.format(tco);
  
  var uri = api_host + "/script/1.0";
  
  var payload = {
      "scriptBody": scriptAsHTML,
      "validationBypassed": "true",
      "name": tco.getTitle(),
      "format": "HTML"
  };

  if (scriptAsHTML.indexOf("neustar id") != -1) {
    var whence = scriptAsHTML.search(/"[\d\w]{32}"/g);
    payload["id"] = scriptAsHTML.substring(whence + 1, whence + 33);
    method = "PUT";
    uri += "/" + payload["id"];
  }
  uri += "?apikey=" + this.publickey + '&sig=' + this.generateSignature(this.publickey, this.secretkey);
  var payload_json = JSON.stringify(payload);
  
  logger.log(logger.DEBUG, "POST " + uri);
  logger.log(logger.DEBUG, payload_json);

  var xmlHttp = new XMLHttpRequest();
  
  xmlHttp.open(method, uri);
  xmlHttp.setRequestHeader("Content-type", "application/json");
  // window.alert(payload);
  
  var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 15000);
  function ajaxTimeout() {
     xmlHttp.abort();
     window.alert("Upload timed out");
  }

  xmlHttp.onreadystatechange = function() {
     if (xmlHttp.readyState == 4) {
        window.clearTimeout(xmlHttpTimeout);
        logger.log(logger.DEBUG, 'status is ' + xmlHttp.status);
        var response_json = xmlHttp.responseText;
        switch (xmlHttp.status) {
          case 200:     // ok
            response = JSON.parse(response_json);
            var actualName=response.data.script.name;
            var proposedName=tco.getTitle();
            if(!(proposedName==actualName)){
                window.alert("Script name exists.Name changed to "+ actualName+".");
            }else{
                window.alert("Upload successful!");
            }
            return response.data.script.id;
          case 422:    // parse error
          case 500:
            response = JSON.parse(response_json);
            // alert(response_json);
            window.alert("Upload failed; " + response.errors[0].message);
            return new Boolean(false);
          default:
            window.alert("Upload failed!");
            return new Boolean(false);    
        }
     }
  };
  xmlHttp.send(payload_json);
};

ScriptUploader.prototype.build_credentials_check_url = function(publickey, secretkey) {
  var uri = api_host + "/load/1.0/echo/credentials_check?apikey=" + publickey + '&sig=' + this.generateSignature(publickey, secretkey);
  this.logger.log(this.logger.DEBUG, 'uri is ' + uri);
  return uri;
};

ScriptUploader.prototype.getHTMLFormatter = function () {
    var formats = this.editor.app.getFormats().formats;
    for (var i = 0; i < formats.length; i++) {
        if (formats[i].name.toLowerCase().indexOf('html') >= 0) {
            return formats[i];
        }
    }
    return null;
};

ScriptUploader.prototype.build_get_scripts_url = function() {
  var uri = api_host + "/script/1.0/?preferredFormat=HTML&apikey=" + this.publickey + '&sig=' + this.generateSignature(this.publickey, this.secretkey);
  this.logger.log(this.logger.DEBUG, 'uri is ' + uri);
  return uri;
};

ScriptUploader.prototype.build_validate_url = function(id) {
  var uri = api_host + "/script/1.0/" + id + "/validate?apikey=" + this.publickey + '&sig=' + this.generateSignature(this.publickey, this.secretkey);
  this.logger.log(this.logger.DEBUG, 'uri is ' + uri);
  return uri;
};

ScriptUploader.prototype.build_delete_url = function(id) {
  var uri = api_host + "/script/1.0/" + id + "?apikey=" + this.publickey + '&sig=' + this.generateSignature(this.publickey, this.secretkey);
  this.logger.log(this.logger.DEBUG, 'uri is ' + uri);
  return uri;
};

ScriptUploader.prototype.build_load_url = function(id) {
  var uri = api_host + "/script/1.0/" + id + "?preferredFormat=HTML&apikey=" + this.publickey + '&sig=' + this.generateSignature(this.publickey, this.secretkey);;
  this.logger.log(this.logger.DEBUG, 'uri is ' + uri);
  return uri;
};
