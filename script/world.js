"use strict";

var World = function(width, height) {
	this.w = width;
	this.h = height;
	this.action_queue = []; //elements are arrays of actions to be executed simultaneously
	this.cells = [];
	for (var i = 0; i < width; i++) {
		this.cells[i] = [];
		for (var j = 0; j < height; j++) {
			this.cells[i][j] = null; //elements are (as strings): wall, rock, human, infected, explosive
		}
	}
};
World.prototype.push_actions = function(actions) { //takes an array
	this.action_queue.push(actions);
};
World.prototype.push_action_back = function(action) {
	if (this.action_queue.length == 0) this.push_actions([]);
	this.action_queue[this.action_queue.length-1].push(action);
};

//THIS SHIT NEEDS TO GO BEFORE RELEASE
//var test_loc = {x: 0, y: 0};

World.prototype.screen_to_world = function(mouse, x, y, scale, yaw, pitch) { //mouse = {x: num, y: num}
	var result = {x: mouse.x, y: mouse.y};
	result.x -= x;
	result.y -= y;
	result.x /= scale;
	result.y /= scale;
	
	var scale_amount = Math.cos(pitch);
	result.y /= scale_amount;
	
	result = {	x: result.x*Math.cos(-yaw)-result.y*Math.sin(-yaw),
				y: result.x*Math.sin(-yaw)+result.y*Math.cos(-yaw)};
				
	result.x += this.w/2;
	result.y += this.h/2;
	//console.log(result);
	return result;
};
World.prototype.handle_input = function(start, end) { //start, end = {x: num, y: num}
	//ignore it if there's still actions in the queue- player cant do actions while previous turn isnt over
	if (this.action_queue.length == 0) {
		//get cell contents at start
		var cell_pos = {x: Math.floor(start.x), y: Math.floor(start.y)};
		if (cell_pos.x < 0 || cell_pos.x >= this.w || cell_pos.y < 0 || cell_pos.y >= this.h) return;
		var actor = this.cells[cell_pos.x][cell_pos.y];
		
		//ignore if the actor is unmovable
		if (actor == null || actor == "wall" || actor == "rock") return;
		
		//queue an action to move it to end (via left, right, up, down)
		//make sure end is actually valid though
		var end_pos = {x: Math.floor(end.x), y: Math.floor(end.y)};
		if (end_pos.x < 0 || end_pos.x >= this.w || end_pos.y < 0 || end_pos.y >= this.h) return;
		
		//ignore if the space is occupied (and not staying in place)
		actor = this.cells[end_pos.x][end_pos.y];
		if (actor != null && (cell_pos.x != end_pos.x || cell_pos.y != end_pos.y)) return;
		
		var dir = null;
		if (end_pos.x == cell_pos.x && end_pos.y == cell_pos.y) {
			dir = "wait";
		} else if (end_pos.x == cell_pos.x) {
			if (end_pos.y == cell_pos.y+1) dir = "down";
			else if (end_pos.y == cell_pos.y-1) dir = "up";
		} else if (end_pos.y == cell_pos.y) {
			if (end_pos.x == cell_pos.x+1) dir = "right";
			else if (end_pos.x == cell_pos.x-1) dir = "left";
		}
		
		if (dir != null) {
			this.action_queue.push([new Action(cell_pos.x, cell_pos.y, dir)]);
		}
	}
};
World.prototype.draw = function(ctx, x, y, scale, yaw, pitch) { //x, y are center, yaw, pitch are radians, 0 pitch = top-down
	while (yaw > Math.PI*2) yaw -= Math.PI*2;
	while (yaw < 0) yaw += Math.PI*2;
	
	//pre-sprite test code
	ctx.strokeStyle = "#000000";
	ctx.save();
	ctx.translate(x, y);
	
	var scale_amount = Math.cos(pitch);
	ctx.scale(1, scale_amount);
	
	ctx.rotate(yaw);
	
	ctx.beginPath();
	for (var i = 0; i <= this.w; i++) {
		for (var j = 0; j <= this.h; j++) {
			//testing crap
			ctx.moveTo(scale*(i-(this.w/2)), scale*(j-(this.h/2)));
			if (i != this.w) ctx.lineTo(scale*(i+1-(this.w/2)), scale*(j-(this.h/2)));
			ctx.moveTo(scale*(i-(this.w/2)), scale*(j-(this.h/2)));
			if (j != this.h) ctx.lineTo(scale*(i-(this.w/2)), scale*(j+1-(this.h/2)));
			
			/*if (i != this.w && j != this.h && i == Math.floor(test_loc.x) && j == Math.floor(test_loc.y)) {
				ctx.moveTo(scale*(i-(this.w/2)), scale*(j-(this.h/2)));
				ctx.lineTo(scale*(i+1-(this.w/2)), scale*(j+1-(this.h/2)));
			}*/
			//ctx.moveTo(scale*(test_loc.x-.5-(this.w/2)), scale*(test_loc.y+.5-(this.h/2)));
			//ctx.lineTo(scale*(test_loc.x+.5-(this.w/2)), scale*(test_loc.y-.5-(this.h/2)));
		}
	}
	ctx.stroke();
	ctx.restore();
	
	
	//Reeks of smell, beware!
	var cx;
	var cy;
	
	var x_start;
	var x_pred;
	var x_inc;
	var y_start;
	var y_pred;
	var y_inc;
	
	var max_x = this.w;
	var max_y = this.h;
	
	if (yaw >= 0 && yaw < Math.PI/2) {
		x_start = function() {cx = 0;};
		x_pred = function() {return cx < max_x;};
		x_inc = function() {cx++;};
		y_start = function() {cy = 0;};
		y_pred = function() {return cy < max_y;};
		y_inc = function() {cy++;};
	} else if (yaw >= Math.PI/2 && yaw < Math.PI) {
		x_start = function() {cx = 0;};
		x_pred = function() {return cx < max_x;};
		x_inc = function() {cx++;};
		y_start = function() {cy = max_y-1;};
		y_pred = function() {return cy >= 0;};
		y_inc = function() {cy--;};
	} else if (yaw >= Math.PI && yaw < 3*Math.PI/2) {
		x_start = function() {cx = max_x-1;};
		x_pred = function() {return cx >= 0;};
		x_inc = function() {cx--;};
		y_start = function() {cy = max_y-1;};
		y_pred = function() {return cy >= 0;};
		y_inc = function() {cy--;};
	} else {
		x_start = function() {cx = max_x-1;};
		x_pred = function() {return cx >= 0;};
		x_inc = function() {cx--;};
		y_start = function() {cy = 0;};
		y_pred = function() {return cy < max_y;};
		y_inc = function() {cy++;};
	}
	
	for (x_start(); x_pred(); x_inc()) {
		for (y_start(); y_pred(); y_inc()) {
			var i = cx;
			var j = cy;
			var t_pos = {	x: scale*(i+.5-(this.w/2)),
							y: scale*(j+.5-(this.h/2))};
			t_pos = {	x: t_pos.x*Math.cos(yaw)-t_pos.y*Math.sin(yaw),
						y: t_pos.x*Math.sin(yaw)+t_pos.y*Math.cos(yaw)};
			t_pos.y *= scale_amount;
			t_pos.x += x; t_pos.y += y + (.5*scale - 8)*scale_amount;
			
			switch (this.cells[i][j]) {
			case "human":
				ctx.drawImage(sprites["Villager"], 0, 0, 40, 40, t_pos.x-20, t_pos.y-40, 40, 40);
				break;
			case "infected":
				ctx.drawImage(sprites["Infected"], 0, 0, 40, 40, t_pos.x-20, t_pos.y-40, 40, 40);
				break;
			case "explosive":
				ctx.drawImage(sprites["Explosive"], 0, 0, 40, 40, t_pos.x-20, t_pos.y-40, 40, 40);
				break;
			case null:
				break;
			default:
				//if (Math.floor(test_loc.x) == i && Math.floor(test_loc.y) == j) {
				//	ctx.fillStyle = "#00FF00";
				//} else {
					ctx.fillStyle = "#FF0000";
				//}
				ctx.fillRect(t_pos.x-scale*.25, t_pos.y-scale, scale*.5, scale);
				ctx.strokeStyle = "#000000";
				ctx.beginPath();
				ctx.moveTo(t_pos.x-scale*.25, t_pos.y-scale);
				ctx.lineTo(t_pos.x+scale*.25, t_pos.y);
				ctx.moveTo(t_pos.x+scale*.25, t_pos.y-scale);
				ctx.lineTo(t_pos.x-scale*.25, t_pos.y);
				
				ctx.stroke();
			}
		}
	}
};
//Actions are (as strings): left, right, up, down, wait, splode, infect
var Action = function(x, y, action) {
	this.x = x;
	this.y = y;
	this.action = action;
};
World.prototype.advance_state = function() {
	//pop front of action queue, push relevant actions onto action queue, update cells
	//remember: action queue is a 2d array- actions[x][y] means an action that takes place x turns from now. All actions with the same y happen simultaneously.
	//PRECONDITION: there should be no conflicts between actions with the same y. Seriously this shouldn't happen, and we can make sure of that.
	
	if (this.action_queue.length > 0) {
		var actions = this.action_queue.shift();
		for (var i in actions) {
			var action = actions[i];
			//console.log(action);
			switch (action.action) {
			case "left":
				var npos = this.move({x: action.x, y: action.y}, {x: -1, y: 0});
				this.advance_infection(npos);
				break;
			case "right":
				var npos = this.move({x: action.x, y: action.y}, {x: 1, y: 0});
				this.advance_infection(npos);
				break;
			case "up":
				var npos = this.move({x: action.x, y: action.y}, {x: 0, y: -1});
				this.advance_infection(npos);
				break;
			case "down":
				var npos = this.move({x: action.x, y: action.y}, {x: 0, y: 1});
				this.advance_infection(npos);
				break;
			case "wait":
				var npos = {x: action.x, y: action.y};
				this.advance_infection(npos);
				break;
			case "splosion":
				var adj = [	{x: action.x-1, y: action.y},
							{x: action.x+1, y: action.y},
							{x: action.x, y: action.y-1},
							{x: action.x, y: action.y+1},
							];
				for (var j in adj) {
					//console.log(adj[j]);
					if (adj[j].x >= 0 && adj[j].x < this.w && adj[j].y >= 0 && adj[j].y < this.h) {
						this.advance_infection(adj[j], true);
					}
				}
				break;
			default:
				console.log("Action \"" + action.action + "\" not yet supported");
			}
		}
	}
};
World.prototype.move = function(pos, vec) { //no error checking
	var npos = {x: pos.x + vec.x, y: pos.y + vec.y};
	this.cells[npos.x][npos.y] = this.cells[pos.x][pos.y];
	this.cells[pos.x][pos.y] = null;
	return npos;
};
World.prototype.advance_infection = function(pos, force) { //also no (positional) error checking
	if (force === undefined) force = false;
	var current = this.cells[pos.x][pos.y];
	var next = "error";
	switch (current) {
	case "human":
		if (force) next = "infected";
		else next = "human";
		break;
	case "infected":
		next = "explosive";
		break;
	case "explosive":
		next = null;
		this.push_action_back(new Action(pos.x, pos.y, "splosion"));
		break;
	default:
		next = current;
	}
	this.cells[pos.x][pos.y] = next;
};
