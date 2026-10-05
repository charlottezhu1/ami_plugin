window.onload = function(){
    function drawPieChart(data, colors, title){ 
        var canvas = document.getElementById( "test_canvas" ); 
        var context = canvas.getContext( "2d" ); 
       
        var dataLength = data.length; 

        var total = 0; 
 
        for( var i = 0; i < dataLength; i++ ){ 
            total += data[ i ][ 1 ]; 
        } 

        var x = 110; 
        var y = 110; 
        var radius = 100; 
 
        var startingPoint = 0; 
 
        for( var i = 0; i < dataLength; i++ ){ 

            var percent = data[ i ][ 1 ] * 100 / total; 
 
            var endPoint = startingPoint + ( 2 / 100 * percent ); 
            
            context.beginPath(); 
            
            context.fillStyle = colors[ i ]; 
            context.moveTo( x, y ); 
            context.arc( x, y, radius, startingPoint * Math.PI, endPoint * Math.PI );     
            context.fill(); 
 

            startingPoint = endPoint;  

            context.rect( 220, 25 * i, 15, 15 ); 
            context.fill(); 
            context.fillStyle = "black"; 
            context.fillText( data[ i ][ 0 ] + " (" + data[ i ][ 1 ] + ")", 245, 25 * i + 15 ); 
            
        }  
  
        context.font = "20px Arial"; 
        context.textAlign = "center"; 
        context.fillText( title, 100, 225 );  
    }; 
    
//     // if(reached == 50){
//         // var data1 = [ [ "HAN", 20 ], [ "HAP", 20 ], [ "LAN", 20 ], [ "LAP", 20 ], [ "NEU", 20 ] ]; 
//         // var colors = [ "red", "green", "blue", "purple", "orange" ];
//         // drawPieChart(data1, colors, "Test");
//     // }
    var data = [ [ "HAN", 10 ], [ "HAP", 10 ], [ "LAN", 10 ], [ "LAP", 10 ], [ "NEU", 10 ] ]; 
    var colors = [ "red", "green", "blue", "purple", "orange" ];
    drawPieChart(data, colors, "Test");

//     // var data = [ [ "HAN", 0 ], [ "HAP", 0 ], [ "LAN", 0 ], [ "LAP", 0 ], [ "NEU", 0 ] ]; 
//     // var colors = [ "red", "green", "blue", "purple", "orange" ];
//     // drawPieChart(data, colors, "0 Hours");
    
//     // var data1 = [ [ "HAN", han1 ], [ "HAP", hap1], [ "LAN", lan1 ], [ "LAP", lap1 ], [ "NEU", neu1 ] ]; 
//     // var data2 = [ [ "HAN", 12 ], [ "HAP", 8 ], [ "LAN", 6 ], [ "LAP", 3 ], [ "NEU", 9 ]  ]; 
//     // var data3 = [ [ "HAN", 32 ], [ "HAP", 7 ], [ "LAN", 9 ], [ "LAP", 12 ], [ "NEU", 10 ]  ]; 
//     // var data4 = [ [ "HAN", 6 ], [ "HAP", 23 ], [ "LAN", 5 ], [ "LAP", 14 ], [ "NEU", 24 ]  ]; 
//     // var colors = [ "red", "green", "blue", "purple", "orange" ];

//     // var button1 = document.getElementById("button1");
//     // var button2 = document.getElementById("button2");
//     // var button3 = document.getElementById("button3");
//     // var button4 = document.getElementById("button4");

//     // var canvas = document.getElementById( "test_canvas" ); 
//     // var context = canvas.getContext( "2d" );

//     // button1.onclick = function(){
//     //     context.clearRect(0, 0, canvas.width, canvas.height);
//     //     drawPieChart(data1, colors, "24 Hours")
//     // }
//     // button2.onclick = function(){
//     //     context.clearRect(0, 0, canvas.width, canvas.height);
//     //     drawPieChart(data2, colors, "48 Hours")
//     // }
//     // button3.onclick = function(){
//     //     context.clearRect(0, 0, canvas.width, canvas.height);
//     //     drawPieChart(data3, colors, "72 Hours")
//     // }
//     // button4.onclick = function(){
//     //     context.clearRect(0, 0, canvas.width, canvas.height);
//     //     drawPieChart(data4, colors, "96 Hours")
//     // }
// };



