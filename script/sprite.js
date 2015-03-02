"use strict";

//Map of every sprite path to an Image of the sprite
var sprites = {	"Villager": null,
				"Infected": null,
				"Explosive": null,
				"Ridiculous_hires_CGDirt_seriously_this_is_just_silly": null,
			};

//Call this and all the sprites will load eventually
function load_sprites() { //returns function() returns {loaded_sprites: int, max: int}
	//horrifying javascript voodoo to make this work
	var head = document.getElementsByTagName('head')[0];
	var sprites_loaded = 0;
	var max_sprites = 0;
	for (var path in sprites) {
		max_sprites++;
		var img = new Image();
		img.src = "resource/" + path + ".png";
		img.name = path;
		img.onload = function() {sprites[this.name] = this; sprites_loaded++;};
		head.appendChild(img);
	}
	
	return function() {return {loaded_sprites: sprites_loaded, max: max_sprites};};
};
