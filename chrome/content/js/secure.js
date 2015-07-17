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
var passwordManager = Components.classes["@mozilla.org/login-manager;1"].
                       getService(Components.interfaces.nsILoginManager);
var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                      Components.interfaces.nsILoginInfo, "init");
 
function storePublicAndSecretKey(public_key, secret_key) {
    var logins = passwordManager.findLogins({}, "chrome://script_recorder", null, 'Public and Secret Key');
 
    var extLoginInfo;
    if (logins.length == 0) {
        extLoginInfo = new nsLoginInfo('chrome://script_recorder',
                               null, 'Public and Secret Key',
                               public_key, secret_key, "", "");
        passwordManager.addLogin(extLoginInfo);
    } else {
        extLoginInfo = new nsLoginInfo('chrome://script_recorder',
                               null, 'Public and Secret Key',
                               public_key, secret_key, "", "");
        passwordManager.modifyLogin(logins[0], extLoginInfo);
    }
}

function retrieveWebMetricsPublicKey() {
    var logins = passwordManager.findLogins({}, "chrome://script_recorder", null, 'Public and Secret Key');
    if (logins.length == 1) {
        return logins[0].username;
    } else {
        return "";
    }
}

function retrieveWebMetricsSecretKey() {
    var logins = passwordManager.findLogins({}, "chrome://script_recorder", null, 'Public and Secret Key');
    if (logins.length == 1) {
        return logins[0].password;
    } else {
        return "";
    }
}