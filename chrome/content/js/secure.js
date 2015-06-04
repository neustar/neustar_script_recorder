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