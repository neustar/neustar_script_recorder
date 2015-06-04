// Called once when the dialog displays
function onLoad() {
  
}

// Called once if and only if the user clicks OK
function onOK() {
  window.arguments[0].out = true;
  return true;
}