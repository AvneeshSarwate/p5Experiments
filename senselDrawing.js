var port = new osc.WebSocketPort({
    url: "ws://" + window.location.hostname + ":8086"
});

port.on("message", function (oscMessage) {
    // Configure handlers here
    if (oscMessage.address == "/senselDraw"){
    	pointData = Array.from(oscMessage.args);
    	console.log(pointData);
    } 
});

port.open();


var pointData = [];

function senselSetup(){
	createCanvas(w, h);
}


function sensel(){
	clear();
	for(var i = 1; i < pointData.length; i += 4){
		ellipse(pointData[i+1], pointData[i+2], pointData[i+3], pointData[i+3]);
	}
}
