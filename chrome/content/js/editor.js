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