"use strict";

//for load testing
//dont you dare use this in the final build
function debug_sleep(ms) {
	var timestamp = window.performance.now();
	while (window.performance.now()-timestamp < ms);
}