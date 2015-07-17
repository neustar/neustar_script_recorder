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
Editor.WebmetricsScriptsView = function() {
    this.name = "WebmetricsScripts";
    this.view = document.getElementById("WebmetricsScriptsView");
};

Editor.WebmetricsScriptsView.prototype = new Editor.InfoView;

function addScriptToTable(element, index, array) {
    var view = document.getElementById("WebmetricsScriptsView");

    var tr = view.contentDocument.getElementById(element.id);
    if (! tr) {
      tr = view.contentDocument.createElement('tr');
      tr.id = element.id;
      var odd_or_even = index % 2;
      if (odd_or_even == 0) {
        tr.className = "even";
      } else {
        tr.className = "odd";        
      }

      // name
      var td_name = view.contentDocument.createElement('td');
      td_name.className = "name";
      td_name.appendChild(view.contentDocument.createTextNode(element.name));
      tr.appendChild(td_name);

      // validation status
      var td_status = view.contentDocument.createElement('td');
      // alert(element.validationState);
      td_status.className = "status " + element.validationState.toLowerCase();
      td_status.appendChild(view.contentDocument.createTextNode(element.validationState));
      tr.appendChild(td_status);
    
      // revalidate
      var td_revalidate = view.contentDocument.createElement('td');
      td_revalidate.className = "revalidate";
      var td_revalidate_a = view.contentDocument.createElement('a');
      td_revalidate_a.href = "#";
      td_revalidate_a.onclick = function() {
                                  var uploader = new ScriptUploader();
                                  var uri = uploader.build_validate_url(element.id);
                                  
                                  var xmlHttp = new XMLHttpRequest();
                                  xmlHttp.open("PUT", uri);
                                  
                                  function ajaxTimeout() {
                                      xmlHttp.abort();
                                      window.setCursor('auto');
                                      window.alert("Delete confirmation timed out");
                                  }              
                                  var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 15000);
                                  
                                  xmlHttp.onreadystatechange = function() {
                                      if (xmlHttp.readyState == 4) {
                                          window.clearTimeout(xmlHttpTimeout);
                                          var response_json = xmlHttp.responseText;
                                          var response = JSON.parse(response_json);
                                          if (xmlHttp.status == 200) {
                                              window.clearTimeout(xmlHttpTimeout);
                                              window.editor.infoPanel.WebmetricsScriptsView.updateStatus(element.id, response.data.validationState);
                                              window.setCursor('auto');
                                          }
                                      }
                                  };
                                  window.setCursor('wait');
                                  xmlHttp.send();
                                };
      td_revalidate_a.appendChild(view.contentDocument.createTextNode("Revalidate"));
      td_revalidate.appendChild(td_revalidate_a);
      if (element.validationState == "VALIDATING") {
        td_revalidate_a.hidden = true;
      }
      tr.appendChild(td_revalidate);    
      
      // delete
      var td_delete = view.contentDocument.createElement('td');
      td_delete.className = "delete";
      var td_delete_a = view.contentDocument.createElement('a');
      td_delete_a.href = "#";
      td_delete_a.onclick = function() {
          var params = {};
          window.openDialog("chrome://script_recorder/content/view/deletedialog.xul", "", "chrome, dialog, modal, resizable=yes", params).focus();
          if (params.out) {
              var uploader = new ScriptUploader();
              var uri = uploader.build_delete_url(element.id);
              
              var xmlHttp = new XMLHttpRequest();
              xmlHttp.open("DELETE", uri);

              function ajaxTimeout() {
                  xmlHttp.abort();
                  window.setCursor('auto');
                  window.alert("Delete confirmation timed out");
              }              
              var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 15000);
              
              xmlHttp.onreadystatechange = function() {
                  if (xmlHttp.readyState == 4) {
                      window.clearTimeout(xmlHttpTimeout);
                      var response_json = xmlHttp.responseText;
                      if (xmlHttp.status == 200) {
                          window.clearTimeout(xmlHttpTimeout);
                          window.editor.infoPanel.WebmetricsScriptsView.remove(element.id);
                          window.setCursor('auto');
                      }
                  }
              };
              window.setCursor('wait');
              xmlHttp.send();

          } else {}
      };
      td_delete_a.appendChild(view.contentDocument.createTextNode("Delete"));
      td_delete.appendChild(td_delete_a);
      tr.appendChild(td_delete);    
    
      // load
      var output = '';
      for (property in element) {
        output += property + ': ' + element[property]+'; ';
      }
      // alert(output);
      
      var td_load = view.contentDocument.createElement('td');
      td_load.className = "delete";
      if (element.availableFormats && element.availableFormats.contains("HTML")) {
        var td_load_a = view.contentDocument.createElement('a');
        td_load_a.href = "#";
        td_load_a.onclick = function() {
                                    var uploader = new ScriptUploader();
                                    var uri = uploader.build_load_url(element.id);

                                    var xmlHttp = new XMLHttpRequest();
                                    xmlHttp.open("GET", uri);

                                    function ajaxTimeout() {
                                        xmlHttp.abort();
                                        window.setCursor('auto');
                                        window.alert("Fetch of script timed out");
                                    }              
                                    var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 15000);

                                    xmlHttp.onreadystatechange = function() {
                                        if (xmlHttp.readyState == 4) {
                                            window.clearTimeout(xmlHttpTimeout);
                                            var response_json = xmlHttp.responseText;
                                            var response = JSON.parse(response_json);
                                            if (xmlHttp.status == 200) {
                                                window.clearTimeout(xmlHttpTimeout);
                                                
                                                var testCase = new TestCase();
                                                uploader.getHTMLFormatter().getFormatter().parse(testCase, response.data.script.scriptBody);
                                                testCase.recordModifiedInCommands();
                                                testCase.title = response.data.script.name;
                                                uploader.editor.app.setTestCase(testCase);
                                                uploader.editor.suiteTreeView.currentTestCase.title = response.data.script.name;
                                                
                                                window.setCursor('auto');
                                            }
                                        }
                                    };
                                    window.setCursor('wait');
                                    xmlHttp.send();
                                  };
        td_load_a.appendChild(view.contentDocument.createTextNode("Load"));
        td_load.appendChild(td_load_a);
      }
      tr.appendChild(td_load);
          
      view.contentDocument.getElementById("webmetrics-tbody").appendChild(tr);
    } else {
      var s = tr.querySelector(".status");
      s.className = "status " + element.validationState.toLowerCase();
      s.firstChild.data = element.validationState;
      var ra = tr.getElementsByClassName("revalidate")[0].getElementsByTagName("a");
      // alert(ra);
      if (element.validationState == "VALIDATING") {
        ra.hidden = true;
      } else {
        ra.hidden = false;
      }
    }
}

function removeScriptToTable(id) {
  
}

Editor.WebmetricsScriptsView.prototype.show = function() {

    Editor.InfoView.prototype.show.call(this);

    var uploader = new ScriptUploader();
    var uri = uploader.build_get_scripts_url();
    
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", uri);

    var xmlHttpTimeout = window.setTimeout(ajaxTimeout, 15000);
    function ajaxTimeout() {
       xmlHttp.abort();
       window.alert("Retrieval of scripts timed out");
    }

    window.setCursor('wait');
    xmlHttp.send();

    xmlHttp.onreadystatechange = function() {
       if (xmlHttp.readyState == 4) {
         var response_json = xmlHttp.responseText;
         if (xmlHttp.status == 200) {
           window.clearTimeout(xmlHttpTimeout);
           var all_scripts = JSON.parse(response_json);
           window.setCursor('auto');

           var html_scripts = new Array();

           if (all_scripts.data.total > 0) {
             for (var i = 0; i < all_scripts.data.items.length; i++){
               if (all_scripts.data.items[i].availableFormats.indexOf("HTML") != -1) {
                 html_scripts.push(all_scripts.data.items[i]);
               }
             }
             if (html_scripts.length > 0) {
               html_scripts.forEach(addScriptToTable);
             } else {
               noScriptsOnServer();
             }
           } else {
             noScriptsOnServer();
           }
         }
       }
    };
};

function noScriptsOnServer() {
  var view = document.getElementById("WebmetricsScriptsView");
  var tr = view.contentDocument.createElement('tr');
  var td = view.contentDocument.createElement('td');
  td.setAttribute("colspan", 3);
  td.appendChild(view.contentDocument.createTextNode("There are current no scripts associated with your account"));
  tr.appendChild(td);
  view.contentDocument.getElementById("webmetrics-tbody").appendChild(tr);
}

Editor.WebmetricsScriptsView.prototype.remove = function(id) {
  var view = document.getElementById("WebmetricsScriptsView");
  var tbody = view.contentDocument.getElementById("webmetrics-tbody");
  var tr = view.contentDocument.getElementById(id);
  tbody.removeChild(tr);
};

Editor.WebmetricsScriptsView.prototype.updateStatus = function(id, status) {
  var view = document.getElementById("WebmetricsScriptsView");
  var tbody = view.contentDocument.getElementById("webmetrics-tbody");
  var tr = view.contentDocument.getElementById(id);
  var td = tr.getElementsByClassName("status")[0].firstChild;
  td.data = status;
  if (status == "VALIDATING") {
      tr.querySelector(".revalidate a").hidden = true;
  } else {
      tr.querySelector(".revalidate a").hidden = false;
  }
};
