// ==UserScript==
// @name           TM Training Tracker
// @namespace      *trophymanager.com/players*
// @include        *trophymanager.com/players*
// @version        1
// @grant          none
// @description:en Training tracker for Trophy Manager
// ==/UserScript==

function installFunc(source) {
  // Create a script node holding this  source code.
  var script = document.createElement('script');
  script.setAttribute("type", "application/javascript");
  script.textContent = source;

  // Insert the script node into the page, so it will run
  document.body.appendChild(script);
}

function addCss(cssCode) {
var styleElement = document.createElement("style");
  styleElement.type = "text/css";
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = cssCode;
  } else {
    styleElement.appendChild(document.createTextNode(cssCode));
  }
  document.getElementsByTagName("head")[0].appendChild(styleElement);
}

function loadJS(filename)
{
	var fileref=document.createElement('script');
	fileref.setAttribute("type","text/javascript");
	fileref.setAttribute("src", filename);
	document.getElementsByTagName("head")[0].appendChild(fileref);
}

function clickUpdate()
{

	training = document.getElementById("tmtt_training");
  console.log(arrows);
	training.value = JSON.stringify(arrows);

	players = document.getElementById("tmtt_players");
	players.value = JSON.stringify(players_ar);

    myform = document.getElementById("tmtt_form");
    myform.action = "http://localhost/tmtt/update";
    myform.submit();

}

window.addEventListener('load', function (e)
{
	installFunc( clickAnalyze );
	installFunc( addCss );
	installFunc( loadJS );

	addCss(".tmtt_big { height: 30px; width: 100px; position: fixed; bottom: 0px; left: 10px; z-index: 10; background: rgb(255,0,0,1)}");
	addCss(".tmtt_update { top: 5px; height: 20px; position: relative; width: 60px; float: left; }");
	addCss(".tmtt_update:hover { cursor: pointer; }");

	thisform = document.createElement("form");
	thisform.method = "post";
	thisform.setAttribute("id", "tmtt_form");
	thisform.setAttribute("target", "_blank");

    formdata = document.createElement("training");
	formdata.setAttribute("id", "tmtt_training");
	formdata.setAttribute("type", "hidden");
	formdata.setAttribute("name", "training");

	thisform.appendChild(formdata);

    formdata = document.createElement("players");
	formdata.setAttribute("id", "tmtt_players");
	formdata.setAttribute("type", "hidden");
	formdata.setAttribute("name", "players");

	thisform.appendChild(formdata);

	document.body.appendChild(thisform);

	div = document.createElement("div");
	div.setAttribute("class", "tmtt_big");

	div.innerHTML = '<div class="tmtt_update" onclick="clickUpdate();">Update</div>';
	document.body.appendChild(div);

}, false);
