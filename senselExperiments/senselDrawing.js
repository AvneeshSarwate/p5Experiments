var port = new osc.WebSocketPort({
    url: "ws://" + window.location.hostname + ":8086"
});

port.on("message", function (oscMessage) {
    // Configure handlers here
    if (oscMessage.address == "/senselDraw"){
    	pointData = Array.from(oscMessage.args);
    	//console.log(pointData);
    } 
});

port.open();


var pointData = [0];

function senselSetup(){
	createCanvas(w, h);
	frameRate(120);
}

function sinColorDeviation(originalColor, deviationScale=50, sinSpeed=1){
	var time = Date.now();
	var transformColor = (col, i) => col + sin(time*sinSpeed*i)*deviationScale;
	return originalColor.map(transformColor);
}

w = 1280;
h = 720;
var senselW = 230;
var senselH = 128;
var senselF = 1600; 
var drawXscale = w / senselW; 
var drawYscale = h / senselH; 
var pointScale = 300 / senselF;

var curveCounter = 0;
var activeTouches = new Set();
var curveTracker = {}; //keeps track of the curves that are drawn via id
var touchToCurve = {}; //maps active touches to the curves they are associated with
//touchData is of form [numTouches, touchId_k, k_x, k_y, k_force ...]  repeating for numTouches
function formatTouchData(touchData){ //map touchIndices to their data (which is[x, y, force])
	var data = {};
	for(var i = 1; i < touchData.length; i += 4){
		data[touchData[i]] = touchData.slice(i+1, i+4);
	}
	return data;
}
//if new touchIDs come in, those are new touches

var rand = Math.random();

function sensel(){
	//clear();
	// for(var i = 1; i < pointData.length; i += 4){
	// 	ellipse(pointData[i+1] * drawXscale, pointData[i+2] * drawYscale, pointData[i+3] * pointScale, pointData[i+3] * pointScale);
	// }

	var frameTouchData = formatTouchData(pointData);
	var frameTouches = new Set(Object.keys(frameTouchData));
	var newTouches = frameTouches.difference(activeTouches);
	var deadTouches = activeTouches.difference(frameTouches);
	var continuingTouches = activeTouches.intersection(frameTouches);

	activeTouches = new Set(Array.from(activeTouches.values()).filter(el => !deadTouches.has(el))); //remove dead touches from active
	
	//console.log(frameTouches, newTouches, activeTouches, deadTouches);
	
	newTouches.forEach(function(touchId) { //add start point of draw curve for new touches
		touchToCurve[touchId] = curveCounter;
		curveTracker[curveCounter] = [[frameTouchData[touchId]], [random(255), random(255), random(255)]];//list of points in curve and color
		//console.log(touchId, curveCounter);
		curveCounter++;
	});
	activeTouches.difference(newTouches).forEach(function(touchId){//draw the newest curve segment for each active touch
		var curveId = touchToCurve[touchId];
		var curvePoints = curveTracker[curveId][0];
		var newPoint = frameTouchData[touchId];
		var lastPoint = curvePoints[curvePoints.length-1];
		var curveColor = curveTracker[curveId][1];
		curvePoints.push(newPoint);

		var newColor = sinColorDeviation(curveColor, 100, 1/100);
		stroke(newColor[0], newColor[1], newColor[2]);
		strokeWeight(newPoint[2]/senselF * 150);
		if(true || curvePoints.length < 4) {
			line(lastPoint[0] * drawXscale, lastPoint[1] * drawYscale, newPoint[0] * drawXscale, newPoint[1] * drawYscale);
		} else {
			beginShape();
			for(var i = 0; i < 4; i++){
				var p = curvePoints[(curvePoints.length-1)-i];
				curveVertex(p[0] * drawXscale, p[1] * drawYscale);
			}
			endShape();
		}
	});

	activeTouches = activeTouches.union(newTouches);
}






/*

*/