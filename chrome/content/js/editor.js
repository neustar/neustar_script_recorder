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
StandaloneEditor.prototype.updateTitle = function() {
  var title;
  var testCase = this.getTestCase();
  if (testCase && testCase.file) {
    title = testCase.file.leafName + " - " + Editor.getString('selenium-ide.name') + " " + Editor.getString('selenium-ide.version');
  } else if (testCase.title) {
    title = testCase.title + " - " + Editor.getString('selenium-ide.name') + " " + Editor.getString('selenium-ide.version');
  } else {
    title = Editor.getString('selenium-ide.name') + " " + Editor.getString('selenium-ide.version');
  }
  
  if (testCase && testCase.modified) {
    title += " *";
  }
  
  document.title = title;
};