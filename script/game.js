"use strict";


var Game = function(canvas,ctx){
	this.canvas=canvas;
	this.ctx=ctx;
}
Game.prototype.drawBorder = function() {
	this.ctx.strokeStyle = "#000000";
	this.ctx.beginPath();
	this.ctx.moveTo(0, 0);
	this.ctx.lineTo(this.canvas.width, 0);
	this.ctx.lineTo(this.canvas.width, this.canvas.height);
	this.ctx.lineTo(0, this.canvas.height);
	this.ctx.lineTo(0, 0);
	this.ctx.stroke();
};

Game.prototype.drawLoadingBar = function( status) {
	var percent = status.loaded_sprites/status.max;
	var height = 16;
	var width = Math.min(this.canvas.width, 256);
	var top = this.canvas.height/2 - height/2;
	var left = this.canvas.width/2 - width/2;
	var center = percent*width;
	
	this.ctx.fillStyle = "#FFFFFF";
	this.ctx.fillRect(left, top, width, height);
	this.ctx.fillStyle = "#000000";
	this.ctx.fillRect(left, top, center, height);
	this.ctx.stokeStyle = "#000000";
	this.ctx.beginPath();
	this.ctx.moveTo(left, top);
	this.ctx.lineTo(left+width, top);
	this.ctx.lineTo(left+width, top+height);
	this.ctx.lineTo(left, top+height);
	this.ctx.lineTo(left, top);
	this.ctx.stroke();
}

Game.prototype.mainFunction= function() {
	//testing code, this crap better not be in our final build
	//who am I kidding most of this will end up in it in some modified form
	// var the_canvas = canvas;
	// var the_ctx = ctx;
	//OH GOD BROWSERS
	this.ctx.imageSmoothingEnabled = false;
	this.ctx.mozImageSmoothingEnabled = false;
	this.ctx.webkitImageSmoothingEnabled = false;
	
	//bad smelly testing shit
	var global_yaw = Math.PI*.25;
	var global_pitch = Math.PI*.3;
	var max_pitch = Math.PI*.49;
	
	var d_yaw = 0;
	var d_pitch = 0;
	
	//still smelly test shit
	//hardcoding a level yeaaaaaa
	var test_world = new World(9, 9);
	test_world.cells[1][0] = "human";
	test_world.cells[1][2] = "explosive";
	test_world.cells[3][1] = "explosive";
	test_world.cells[3][2] = "explosive";
	test_world.cells[4][2] = "explosive";
	test_world.cells[4][3] = "explosive";
	test_world.cells[5][3] = "explosive";
	test_world.cells[5][4] = "explosive";
	test_world.cells[5][5] = "explosive";
	
	//TESTING CODE
	function do_render(state, ms) {
		this.ctx.fillStyle = "#FFFFFF";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		//this.ctx.fillStyle = "#000000";
		//this.ctx.fillText("seconds: " + Math.floor(ms/10)/100, 0, 10);
		
		test_world.draw(this.ctx, this.canvas.width/2, this.canvas.height/2, 48, global_yaw+d_yaw, global_pitch+d_pitch);
	}
	
	var loading = null;
	var get_loadstatus = null;
	
	var last_timestamp = null;
	function step(frame_begin) {
		if (loading == false) { //this is perverse but somehow it turns me on
			if (last_timestamp == null) last_timestamp = frame_begin;
			var state_time = window.performance.now()-last_timestamp;
			
			if (dragging_board) {
				//global_pitch = 0;
				var pitch_scale = Math.cos(global_pitch+d_pitch);
				var abs_dyaw = Math.atan2((mouse_pos.y-this.canvas.height/2)/pitch_scale, mouse_pos.x-this.canvas.width/2);
				d_yaw = abs_dyaw-Math.atan2((drag_pos.y-this.canvas.height/2)/pitch_scale, drag_pos.x-this.canvas.width/2);
				/*var d_dist = 	Math.sqrt(	(mouse_pos.x-the_canvas.width/2)*
											(mouse_pos.x-the_canvas.width/2) + 
											(mouse_pos.y-the_canvas.height/2)*
											(mouse_pos.y-the_canvas.height/2)) -
								Math.sqrt(	(drag_pos.x-the_canvas.width/2)*
											(drag_pos.x-the_canvas.width/2) + 
											(drag_pos.y-the_canvas.height/2)*
											(drag_pos.y-the_canvas.height/2));*/
				/*var abs_dscale = Math.abs((mouse_pos.y-(the_canvas.height/2))/(test_world.h*48/2));
				var init_dscale = Math.abs((drag_pos.y-(the_canvas.height/2))/(test_world.h*48/2));
				var abs_dpitch = Math.acos(Math.min(1, abs_dscale));
				var init_dpitch = Math.acos(Math.min(1, init_dscale));
				d_pitch = Math.sin(abs_dyaw)*(abs_dpitch-init_dpitch);
				//console.log(d_pitch);*/
				if (global_pitch+d_pitch > max_pitch) d_pitch = max_pitch-global_pitch;
				if (global_pitch+d_pitch < 0) d_pitch = -global_pitch;
			}
			
			//this shit depends on world.js, remove (or modify) once we kill all the debug code
			//test_loc = test_world.screen_to_world(mouse_pos, the_canvas.width/2, the_canvas.height/2, 48, global_yaw, global_pitch);
			
			//will need more complex logic here eventually, but for now all state happens instantly
			test_world.advance_state();
			
			do_render(null, state_time);
		} else if (loading == null) {
			loading = true;
			get_loadstatus = load_sprites();
		} else {
			//loooooading bar
			var status = get_loadstatus();
			drawLoadingBar(status);
			if (status.loaded_sprites >= status.max) loading = false;
		}
		
		//render border in software instead of css
		this.drawBorder();
		window.requestAnimationFrame(step);
	}
	
	var mouse_pos = {x: 0, y: 0};
	var drag_pos = null;
	var dragging_board = false;
	this.canvas.onmousemove = function(e) {
		if (e.layerX != undefined) {
			mouse_pos = {x: e.layerX, y: e.layerY};
		} else {
			mouse_pos = {x: e.offsetX, y: e.offsetY};
		}
	};
	this.canvas.onmousedown = function(e) {
		//e.button == 0 -> left mouse button
		this.onmousemove(e);
		if (e.button == 0) {
			if (drag_pos != null) {
				console.log("Something broke! (double drag init)");
			}
			drag_pos = {x: mouse_pos.x, y: mouse_pos.y}; //good god js is horrifying
			
			var world_loc = test_world.screen_to_world(mouse_pos, this.canvas.width/2, this.canvas.height/2, 48, global_yaw, global_pitch);
			if (world_loc.x < 0 || world_loc.x > test_world.w ||
				world_loc.y < 0 || world_loc.y > test_world.h) {
				dragging_board = true;
			}
		}
	};
	this.canvas.onmouseup = function(e) {
		this.onmousemove(e);
		if (e.button == 0) {
			if (drag_pos == null) {
				//this is actually pretty normal
				//console.log("Something broke! (double drag release)");
			} else if (dragging_board == false) {
				//moooore smelly testing code
				test_world.handle_input(test_world.screen_to_world(drag_pos, this.canvas.width/2, this.canvas.height/2, 48, global_yaw, global_pitch),
										test_world.screen_to_world(mouse_pos, this.canvas.width/2, this.canvas.height/2, 48, global_yaw, global_pitch));
			} else {
				global_yaw += d_yaw;
				global_pitch += d_pitch;
				while (global_yaw > Math.PI*2) global_yaw -= Math.PI*2;
				while (global_yaw < 0) global_yaw += Math.PI*2;
				d_yaw = 0;
				d_pitch = 0;
			}
			
			drag_pos = null;
			dragging_board = false;
		}
	};
	this.canvas.onmouseout = function(e) {
		the_canvas.onmouseup(e);
	};
	window.requestAnimationFrame(step);
};