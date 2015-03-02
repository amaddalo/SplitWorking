"use strict";

// Used to load on script and call a callback when it's finished
function loadScript(path, callback)
{
	//Adding the script tag to the head as suggested before
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = path;

	script.onload = callback;

	//Fire the loading
	head.appendChild(script);
}

//Loads an array of scripts (in that order), then call final_callback
function loadScripts(urls, final_callback) {
	function build_recursive_bullshit(urls, start, final) {
		if (start >= urls.length) {
			return final;
		} else {
			return function() {
				loadScript(urls[start], build_recursive_bullshit(urls, start+1, final));
			};
		}
	};
	build_recursive_bullshit(urls, 0, final_callback)();
}
function loadingComplete(){
	var theCanvas = document.getElementById("game_canvas");
	var theCtx = theCanvas.getContext("2d");
	
	var game= new Game(theCanvas,theCtx);
	game.mainFunction(theCanvas,theCtx);
}

loadScripts(["script/debug.js", "script/sprite.js", "script/world.js","script/game.js"], loadingComplete);