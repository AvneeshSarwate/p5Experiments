var canvasX = 1280;
var canvasY = 720;
var showTree = true;
var cos = Math.cos;
var sin = Math.sin;
var textureVid;


function setup() {
  createCanvas(canvasX, canvasY);
  //textureVid = createVideo('PurpleStarfield.mov');
  //textureVid.hide();
}


function draw(){
    clear();
    drawFace(mouseX, mouseY);
    drawHouse(100, 100, mouseX/canvasX*255, 255 - mouseY/canvasY*255, (mouseX/canvasX)/(mouseY/canvasY)*255);
    if(showTree) {
        drawTree(500, 500);
    }
}


function drawFace(xCenter, yCenter){ 
    //draw the head
    ellipseMode(RADIUS); 
    fill(255); 
    ellipse(xCenter, yCenter, 55, 55);

    //draw the eyes
    fill(0);
    ellipse(xCenter-20, yCenter-20, 5, 5);
    fill(0);
    ellipse(xCenter+20, yCenter-20, 5, 5);

    //draw the mouth
    arc(xCenter, yCenter+15, 20, 20, -0.3, PI+0.3);
}


function drawHouse(xPos, yPos, r, g, b){
    //draw the building
    fill(r, g , b);
    var squareLen = 55;
    rect(xPos, yPos, squareLen, squareLen);

    //draw the roof
    fill(r, g , b);
    var triSide = squareLen * 1.5;
    var roofOverlap = 15;
    triangle(xPos + squareLen/2 - triSide/2, yPos + roofOverlap, 
        xPos + squareLen/2 + triSide/2, yPos + roofOverlap, 
        xPos + squareLen/2, yPos - triSide/2*Math.sqrt(2) * 0.7 + roofOverlap);
}


function drawTree(xPos, yPos){
    //draw tree trunk
    var trunkThickness = 50;
    var treeHeight = 200;
    fill('brown');
    rect(xPos, yPos, trunkThickness, treeHeight);

    //set branch and leaf parameters
    var branchLen = 180;
    var branchStart = [xPos + trunkThickness/2, yPos+treeHeight/10];
    var branchThickness = 20;
    var leafRadius = 55;

    //draw branches and leaves
    for(var i = PI/8; i < PI; i += PI/8){
        //draw branch
        drawBranch(branchStart[0], branchStart[1], branchStart[0]-cos(i)*branchLen, branchStart[1]-sin(i)*branchLen, branchThickness, 'brown', i);
        
        //draw leaves
        fill('green');
        ellipse(branchStart[0]-cos(i)*branchLen, branchStart[1]-sin(i)*branchLen, leafRadius, leafRadius);
    }
};

// x1, y1 define the starting point of the centerline of the branch
// x2, y2 define the ending point of the centerline of the branch
// thickness is how thick the branch is
// color is the color of the branch
/* angle is the angle the branch line makes. Technically I should be able to calculate this
from the x1, y1, x2, y2, but I keep messing it up. I have the explicit angle available
when I call this function anyway, so I decided to directly pass the angle as a parameter*/
//debug is a flag for printing values to see where I was messing up
function drawBranch(x1, y1, x2, y2, thickness, color, angle, debug){    
    var hypotnuse = ((y2-y1)**2 + (x2-x1)**2)**(1/2); //no longer used since I'm not manually calculating the angle
    var slopeAngle = angle; //Math.asin((y2-y1)/hypotnuse);

    //the perpendicular angle to the line - we need this to help define the branch rectangle around the
    //branch centerline
    var perpSlope =  slopeAngle - Math.PI/2; 
    

    if(debug){
        console.log(x1+cos(perpSlope)*thickness/2, y1+sin(perpSlope)*thickness/2);
        console.log(x1-cos(perpSlope)*thickness/2, y1-sin(perpSlope)*thickness/2);
        console.log(x2-cos(perpSlope)*thickness/2, y2-sin(perpSlope)*thickness/2);
        console.log(x2+cos(perpSlope)*thickness/2, y2+sin(perpSlope)*thickness/2);
    } else {
        fill(color);
        beginShape();
        vertex(x1+cos(perpSlope)*thickness/2, y1+sin(perpSlope)*thickness/2);
        vertex(x1-cos(perpSlope)*thickness/2, y1-sin(perpSlope)*thickness/2);
        vertex(x2-cos(perpSlope)*thickness/2, y2-sin(perpSlope)*thickness/2);
        vertex(x2+cos(perpSlope)*thickness/2, y2+sin(perpSlope)*thickness/2);
        endShape(CLOSE);
    }
    
}


function keyReleased() {
    if(key == ' ') showTree = !showTree;
}

//debug called outside the draw loop so I don't print to the console at framerate
drawBranch(500, 500, 470, 450, 10, 'brown', Math.PI/4, true);



