//////////////// Handle infinite scrolling ///////////////////////////////////
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function(mutations, observer) {
    // fired when a mutation occurs
    runCALM();
});

chrome.runtime.onMessage.addListener(getAmiStats);

function getAmiStats(userUrl, sender, sendResponse){
    // console.log(userUrl);
    var userId = userUrl.split('.com/').pop().split('&')[0];
    // console.log(userId);
    // Start file download.
    var dwnldTime = new Date().toLocaleString().replaceAll(',','').replaceAll('/','_').replaceAll(' ','_').replaceAll(':','_');
    // console.log(dwnldTime);
    var amiStats = userId+'_'+numTweets+'twts_'+dwnldTime+'.txt';
    download(amiStats,dwnlData);
    var userTweets = 'tweets_for_'+amiStats;
    download(userTweets,tweets_dwnld);
}

function chartLocation(){
    var tweetButtonExists = !!document.querySelector("[data-testid='SideNav_NewTweet_Button']");
    var logInCheck = !!document.querySelector("[data-testid='signup']");
    // var tweetButtonExists = document.body.contains("[data-testid='SideNav_NewTweet_Button']");
    // console.log(tweetButtonExists);
    // console.log(logInCheck);

    if (tweetButtonExists ==true){
      var chartLoc = document.querySelector("[data-testid='SideNav_NewTweet_Button']");
    }
    else{
      var chartLoc = document.querySelector("[href='/settings']");
    }
    // return console.log(chartLoc);
    return chartLoc;
}

// thanks carlos https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

// alert('You are using AMI to show you the affect breakdown of your twitter feed!');
// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  childList: true
  //...
});
//////////////////////////////////////////////////////////////////////////////
var dwnlData =[];
var tweets_dwnld = [];
// Both engines score every tweet; tweetSentiment[itemId] = { afinn: affect, sentistrength: affect|null }
var tweetSentiment = {};
var skipped = new Set();
// var skipped = ();
var numTweets = 0; // total distinct tweets seen, regardless of engine (used for the download filename)
var createdPieChart = false;
var createdBarPlot = false;
var createdHrzBarPlot = false;

// Running HAN/LAN/NEU/LAP/HAP + total tallies, kept separately per engine so
// switching the dropdown never mixes one tool's counts into the other's.
var counts = {
  afinn: { han: 0, hap: 0, lan: 0, lap: 0, neu: 0, numTweets: 0 },
  sentistrength: { han: 0, hap: 0, lan: 0, lap: 0, neu: 0, numTweets: 0 }
};

// Which engine's counts/borders are currently displayed. Both engines score
// every tweet in the background regardless of this value - it only picks
// which tool's numbers show in the chart and which classification paints
// tweet borders.
var engine = 'afinn';
var isProcessingSentiStrength = false;
chrome.storage.local.get(['engine'], function(res) {
  if (res && res.engine) engine = res.engine;
});
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area === 'local' && changes.engine) {
    engine = changes.engine.newValue;
    refreshDisplayForEngine();
  }
});

//////////////// Function to do the task /////////////////////////////////////
function applyAffectToTweet(item, affect) {
  if (affect.HAN) {
    // High Arousal Negative: remove it from the feed entirely instead of
    // just bordering it, per the "filter it out" use case.
    item.remove();
    return;
  }
  var nullSentiment = true;
  if (affect.HAP) { item.style.border = "thick solid yellow"; nullSentiment = false; }
  if (affect.LAN) { item.style.border = "thick solid blue"; nullSentiment = false; }
  if (affect.LAP) { item.style.border = "thick solid green"; nullSentiment = false; }
  if (affect.NEU) { item.style.border = "thick solid gray"; nullSentiment = false; }
  if (nullSentiment) {
    // want to see cases where tweets were found but not outlined
    console.log('Found null sentiment', item);
    item.style.border = "thick solid pink";
  }
}

// Tallies a classification under engineKey's counts, paints the tweet's
// border only if engineKey is the one currently displayed, and always
// refreshes the chart (cheap canvas redraw) so the visible engine's numbers
// stay live no matter which engine just produced a result.
function recordClassification(engineKey, item, itemId, affect) {
  var c = counts[engineKey];
  if (affect.HAN) { c.han += 1; }
  if (affect.HAP) { c.hap += 1; }
  if (affect.LAN) { c.lan += 1; }
  if (affect.LAP) { c.lap += 1; }
  if (affect.NEU) { c.neu += 1; }
  c.numTweets += 1;

  if (engineKey === engine) {
    applyAffectToTweet(item, affect);
  }
  updateChart();
}

function updateChart() {
  var c = counts[engine];
  // flip the order make positive on the right for horizontal
  var data = [ [ "😠", c.han ],[ "🙁", c.lan ],[ "😐", c.neu ],[ "🙂", c.lap ],[ "😄", c.hap ] ];
  dwnlData = [ [ "HAN", c.han ],[ "LAN", c.lan ],[ "NEU", c.neu ],[ "LAP", c.lap ],[ "HAP", c.hap ]];
  var colors = [ "red" ,"blue","lightgrey","green","yellow" ];
  drawHrzBarPlot( data, colors );
}

// Called when the dropdown switches engines: repaints every visible tweet's
// border from its cached classification for the newly selected engine (a
// tweet SentiStrength hasn't scored yet just keeps its current border until
// that result arrives), and redraws the chart with that engine's tallies.
function refreshDisplayForEngine() {
  var items = document.querySelectorAll("[data-testid='tweet']");
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var itemId = item.querySelector('time')?.parentElement.href;
    if (!itemId) continue;
    var entry = tweetSentiment[itemId];
    if (entry && entry[engine]) {
      applyAffectToTweet(item, entry[engine]);
    }
  }
  updateChart();
}

// Classification for the SentiStrength engine, kept separate from the AFINN
// engine's classifyAffect(). Mirrors AffectFilter/AffectFilterServer/logic.py's
// parse() exactly, on SentiStrength's own raw scale (positive 1-5, negative
// -1 to -5; neutral baseline is pos=1/neg=-1, not 0/0).
function classifySentiStrengthAffect(positive, negative) {
  var affect = {
    HAP: false,
    LAP: false,
    HAN: false,
    LAN: false,
    NEU: false,
    positive: positive,
    negative: negative
  };

  if (positive === 1 && negative === -1) {
    affect.NEU = true;
  } else {
    if (positive > 1 && positive < 3) { affect.LAP = true; }
    if (positive >= 3) { affect.HAP = true; }
    if (negative < -1 && negative > -3) { affect.LAN = true; }
    if (negative <= -3) { affect.HAN = true; }
  }

  return affect;
}

function sentiStrengthCategoryLabel(affect) {
  var labels = [];
  if (affect.HAP) labels.push('HAP');
  if (affect.LAP) labels.push('LAP');
  if (affect.HAN) labels.push('HAN');
  if (affect.LAN) labels.push('LAN');
  if (affect.NEU) labels.push('NEU');
  return labels.length ? labels.join('+') : 'NONE';
}

function getSentimentsSentiStrength(texts) {
  return new Promise(function(resolve, reject) {
    chrome.runtime.sendMessage({ type: 'AMI_ANALYZE_SENTISTRENGTH', texts: texts }, function(response) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response || !response.ok) {
        reject(new Error((response && response.error) || 'Unknown error from background'));
        return;
      }
      resolve(response.results.map(function(r) { return classifySentiStrengthAffect(r.positive, r.negative); }));
    });
  });
}

async function runCALM() {
    var items = document.querySelectorAll("[data-testid='tweet']");
    var needsSentiStrength = []; // { item, itemId, itemText } still missing a SentiStrength result

    for (var i = 0; i < items.length; i++) {   // for each item box
        var item = items[i];
        var itemText = item.querySelector("[data-testid='tweetText']")?.innerText;
        var itemId = item.querySelector('time')?.parentElement.href;
        if (!itemId || !itemText) {
          if (!skipped.has(item)) {
            // avoiding spam of the same tweets over and over
            skipped.add(item);
          }
          continue
        }

        var entry = tweetSentiment[itemId];
        if (!entry) {
          // first time we've seen this tweet: score it with AFINN right away
          // (synchronous, no network) and queue it for SentiStrength too.
          numTweets += 1;
          tweets_dwnld+='--------------------------------------------';
          tweets_dwnld+=itemText;
          tweets_dwnld+='++++++++++++++++++++++++++++++++++++++++++++';

          var afinnAffect = getSentiment(itemText);
          entry = { afinn: afinnAffect, sentistrength: null };
          tweetSentiment[itemId] = entry;
          recordClassification('afinn', item, itemId, afinnAffect);
          needsSentiStrength.push({ item: item, itemId: itemId, itemText: itemText });
        } else {
          // already seen: redraw the border from whichever engine is
          // currently displayed (React can re-render the node)
          var affect = entry[engine];
          if (affect) applyAffectToTweet(item, affect);
          if (entry.sentistrength === null) {
            needsSentiStrength.push({ item: item, itemId: itemId, itemText: itemText });
          }
        }
    }

    if (needsSentiStrength.length === 0 || isProcessingSentiStrength) return; // a batch is already in flight; catch these next pass

    isProcessingSentiStrength = true;
    try {
      var affects = await getSentimentsSentiStrength(needsSentiStrength.map(function(t) { return t.itemText; }));
      for (var j = 0; j < needsSentiStrength.length; j++) {
        var t = needsSentiStrength[j];
        var affect = affects[j];
        console.log('[SentiStrength] ' + sentiStrengthCategoryLabel(affect) + ' (pos=' + affect.positive + ', neg=' + affect.negative + ') ' + JSON.stringify(t.itemText));
        tweetSentiment[t.itemId].sentistrength = affect;
        recordClassification('sentistrength', t.item, t.itemId, affect);
      }
    } catch (e) {
      console.error('SentiStrength request failed for this batch, will retry next pass:', e);
    } finally {
      isProcessingSentiStrength = false;
    }
}
//////////////////////////////////////////////////////////////////////////////

// function drawPieChart( data, colors, title ){

function drawPieChart( data, colors){

    if (!createdPieChart) {
      var tweetButton = chartLocation();
      // var tweetButton = document.querySelector("[data-testid='SideNav_NewTweet_Button']");

      // var box = tweetButton.closest('div').createElement("div");

      var box = document.createElement("div");
      // box.style.position = "fixed";
      // box.style.border = "1px solid rgb(0,0,0)";
      // box.style.backgroundColor = "#e5e4e2";
      box.id = 'box_chart_id';

      var pieChart = document.createElement("canvas");
      // pieChart.style.position = "fixed";
      pieChart.style.width = "400px";
      pieChart.style.height = "250px";
      pieChart.style.marginLeft = "20px";
      pieChart.style.marginTop = "20px";
      // pieChart.id = 'pieChartId';
      pieChart.setAttribute("id", "pieChartId");

      // box.innerHTML += "Affect Breakdown" + "<br>" + [numTweets + " Tweets"] + "<br>" + ["HAN : " + han] + "<br>" + ["LAN : " + lan] + "<br>" + ["HAP : " + hap] + "<br>" + ["LAP : " + lap] + "<br>" + ["NEU : " + neu];
      var boxTitle = document.createElement("h3");
      boxTitle.id = 'box_chart_title';
      // boxTitle.style.textAlign = 'center';
      box.appendChild(boxTitle);
      box.style.top = "150px";
      box.style.marginLeft = "10px";
      box.style.marginTop = "10px";
      box.style.width = "210px";
      box.style.height = "250px";
      box.style.textAlign = 'center';
      box.style.borderColor = "#1da1f2";


      tweetButton.parentElement.appendChild(box);

      // document.body.appendChild(pieChart); // adds the canvas to the body element
      document.getElementById('box_chart_id').appendChild(pieChart);
      // tweetButton.appendChild(pieChart);


      createdPieChart = true;
    }
    document.getElementById('box_chart_title').innerHTML = `Affect Mix Index (n=${numTweets})`;
    // document.getElementById('box_chart_title').innerHTML = title+${numTweets}+"Tweets";

    // var context = canvas.getContext( "2d" );
    var canvas = document.getElementById("pieChartId");
    var context = canvas.getContext('2d');
    // clearing canvas to redraw
    context.clearRect(0, 0, canvas.width, canvas.height);

    // var colors = [ "yellow", "green", "grey", "blue", "red" ];

    // var colors = [ "#FAE442", "#8BD448", "grey", "#2AA8F2", "#FF6355" ];


    // get length of data array
    var dataLength = data.length;
    // declare variable to store the total of all values
    var total = 0;

    // calculate total
    for( var i = 0; i < dataLength; i++ ){
        // add data value to total
        total += data[ i ][ 1 ];
    }

    // declare X and Y coordinates of the mid-point and radius
    var x = 50;
    var y = 50;
    var radius = 50;

    // declare starting point (right of circle)
    var startingPoint = 0;

    for( var i = 0; i < dataLength; i++ ){
    // for( var i = 1;){
        // calculate percent of total for current value
        var percent = data[ i ][ 1 ] * 100 / total;

        // calculate end point using the percentage (2 is the final point for the chart)
        var endPoint = startingPoint + ( 2 / 100 * percent );


        // draw chart segment for current element
        context.beginPath();
        // select corresponding color
        context.fillStyle = colors[ i ];
        context.moveTo( x, y );
        context.arc( x, y, radius, startingPoint * Math.PI, endPoint * Math.PI );
        context.fill();

        // // starting point for next element
        // // used for the ami piechart
        startingPoint = endPoint;


        // used for the ami piechart
        // draw labels for each element
        // context.rect( 110, 20 * i +2, 20, 18 );
        context.rect( 110, 20 * i +2, 20, 18 );
        context.fill();
        context.fillStyle = "black";
        context.font="bold 14px arial";
        // context.fillText( data[ i ][ 0 ] + "  " + data[ i ][ 1 ], 111, 20 * i + 17 );
        context.fillText( data[ i ][ 0 ] + "  (" + data[ i ][ 1 ] + ")", 112, 20 * i + 17 );


    }
}
// create working version of the barplot 
// using the one below to create a horizontal version of the barplot
function drawBarPlot( data, colors){
  var tweetButton = chartLocation();
  // var tweetButton = document.querySelector("[data-testid='SideNav_NewTweet_Button']");

    if (!createdBarPlot) {
      var box = document.createElement("div");
      // box.style.position = "fixed";
      // box.style.border = "1px solid rgb(0,0,0)";
      // box.style.backgroundColor = "#e5e4e2";
      box.id = 'box_chart_id';

      var pieChart = document.createElement("canvas");
      // pieChart.style.position = "fixed";
      pieChart.style.width = "400px";
      pieChart.style.height = "250px";
      // pieChart.style.marginLeft = "20px";
      // pieChart.style.marginTop = "20px";
      // pieChart.id = 'pieChartId';
      pieChart.setAttribute("id", "pieChartId");

      // box.innerHTML += "Affect Breakdown" + "<br>" + [numTweets + " Tweets"] + "<br>" + ["HAN : " + han] + "<br>" + ["LAN : " + lan] + "<br>" + ["HAP : " + hap] + "<br>" + ["LAP : " + lap] + "<br>" + ["NEU : " + neu];
      var boxTitle = document.createElement("h3");
      boxTitle.id = 'box_chart_title';
      // boxTitle.style.textAlign = 'center';
      box.appendChild(boxTitle);
      box.style.top = "150px";
      // box.style.marginLeft = "10px";
      // box.style.marginTop = "10px";
      box.style.width = "225px";
      box.style.height = "310px";
      box.style.textAlign = 'center';
      // box.style.borderColor = "#1da1f2";
      // box.style.border = "thick solid #1da1f2"
      // document.body.appendChild(box);
      tweetButton.parentElement.appendChild(box);

      // document.body.appendChild(pieChart); // adds the canvas to the body element
      document.getElementById('box_chart_id').appendChild(pieChart);

      createdBarPlot = true;
    }
    document.getElementById('box_chart_title').innerHTML = `Affect Mix Index (n=${numTweets})`;
    // document.getElementById('box_chart_title').innerHTML = title+${numTweets}+"Tweets";

    // var context = canvas.getContext( "2d" );
    var canvas = document.getElementById("pieChartId");
    var context = canvas.getContext('2d');
    // clearing canvas to redraw
    context.clearRect(0, 0, canvas.width, canvas.height);


    // get length of data array
    var dataLength = data.length;
    // declare variable to store the total of all values
    var total = 0;

    var maxWidth = 25;
    var maxHeight = 100;

    // calculate total
    for( var i = 0; i < dataLength; i++ ){
        // add data value to total
        total += data[ i ][ 1 ];
    }

    // declare starting point (right of circle)
    var startingPoint = 5;

    for( var i = 0; i < dataLength; i++ ){
        // calculate percent of total for current value
        var percent = data[ i ][ 1 ] / total;


        // fill the barplot
        context.beginPath();
        context.fillStyle = colors[ i ];
        context.rect(69, startingPoint, maxWidth, canvas.height*percent);
        // context.rect( 110, 20 * i +2, 20, 18 );
        context.fill();
        
        // draw the emojis--they show up at the midpoint of each bar
        var botmE = startingPoint+canvas.height*percent;
        var topE= startingPoint;
        context.beginPath();
        context.fillStyle = "black";
        context.font="bold 14px arial";
        // note that to get the emoji to show up in the middle you need the midpoint of each ami box
        // you get that by taking the startingPoint (topE) and then adding that to the bottom of the ami category box
        // which is startingPoint+canvas.height*percent and then dividing that by 2 
        // the whole equation is this ((topE + ((botmE)))/2)
        // we add the 6 at the end bc from the midpoint it draws the bottom of the emoji so when we add 6 we are lowering the emoji slightly
        // to align midpoint and mid point of emoji
        context.fillText( data[ i ][ 0 ] + "  " + Math.round(percent*100) +"%", 95, ((topE + ((botmE)))/2)+6);
        
        // // starting point for next bar is the end of the last
        startingPoint = startingPoint + (canvas.height*percent);
    }
}

function drawHrzBarPlot( data, colors){
  var tweetButton = chartLocation();
  // var tweetButton = document.querySelector("[data-testid='SideNav_NewTweet_Button']");

    if (!createdHrzBarPlot) {
      var box = document.createElement("div");
      // box.style.position = "fixed";
      // box.style.border = "1px solid rgb(0,0,0)";
      // box.style.backgroundColor = "#e5e4e2";
      box.id = 'box_chart_id';

      var pieChart = document.createElement("canvas");
      // pieChart.style.position = "fixed";
      // pieChart.style.width = "400px";
      pieChart.style.width = "225px";
      pieChart.style.height = "125px";
      // pieChart.style.marginLeft = "5px";
      // pieChart.style.marginTop = "5px";
      // pieChart.id = 'pieChartId';
      pieChart.setAttribute("id", "pieChartId");

      // box.innerHTML += "Affect Breakdown" + "<br>" + [numTweets + " Tweets"] + "<br>" + ["HAN : " + han] + "<br>" + ["LAN : " + lan] + "<br>" + ["HAP : " + hap] + "<br>" + ["LAP : " + lap] + "<br>" + ["NEU : " + neu];
      var boxTitle = document.createElement("h3");
      boxTitle.id = 'box_chart_title';
      box.appendChild(boxTitle);
      box.style.top = "150px";
      // box.style.marginLeft = "1px";
      // box.style.marginTop = "1px";
      box.style.width = "230px";
      box.style.height = "250px";
      box.style.textAlign = 'center';
      // document.body.appendChild(box);
      tweetButton.parentElement.appendChild(box);

      // document.body.appendChild(pieChart); // adds the canvas to the body element
      document.getElementById('box_chart_id').appendChild(pieChart);

      var engineSelect = document.createElement('select');
      engineSelect.id = 'ami_engine_select';
      var afinnOption = document.createElement('option');
      afinnOption.value = 'afinn';
      afinnOption.textContent = 'AFINN (local)';
      var sentiStrengthOption = document.createElement('option');
      sentiStrengthOption.value = 'sentistrength';
      sentiStrengthOption.textContent = 'SentiStrength (local server)';
      engineSelect.appendChild(afinnOption);
      engineSelect.appendChild(sentiStrengthOption);
      engineSelect.value = engine;
      engineSelect.onchange = function() {
        engine = engineSelect.value;
        chrome.storage.local.set({ engine: engine });
        refreshDisplayForEngine();
      };
      box.appendChild(engineSelect);

      createdHrzBarPlot = true;
    }
    var engineLabel = engine === 'sentistrength' ? 'SentiStrength' : 'AFINN';
    document.getElementById('box_chart_title').innerHTML = `Affect Mix Index — ${engineLabel} (n=${counts[engine].numTweets})`;
    // document.getElementById('box_chart_title').innerHTML = title+${numTweets}+"Tweets";

    // var context = canvas.getContext( "2d" );
    var canvas = document.getElementById("pieChartId");
    var context = canvas.getContext('2d');
    // clearing canvas to redraw
    context.clearRect(0, 0, canvas.width, canvas.height);


    // get length of data array
    var dataLength = data.length;
    // declare variable to store the total of all values
    var total = 0;

    // var maxWidth = 200;
    // var maxWidth = 225;
    var maxWidth = canvas.width;
    var maxHeight = 25;

    // calculate total
    for( var i = 0; i < dataLength; i++ ){
        // add data value to total
        total += data[ i ][ 1 ];
    }

    // declare starting point (right of circle)
    var startingPoint = 0;

    for( var i = 0; i < dataLength; i++ ){
        // calculate percent of total for current value
        var percent = data[ i ][ 1 ] / total;


        // fill the barplot
        context.beginPath();
        context.fillStyle = colors[ i ];
        context.rect(startingPoint, 0, maxWidth*percent, maxHeight);
        context.fill();
        
        // draw the emojis--they show up at the midpoint of each bar
        var botmE = startingPoint+maxWidth*percent;

        var topE= startingPoint;
        context.beginPath();
        context.fillStyle = "black";
        context.font="bold 14px arial";
        // note that to get the emoji to show up in the middle you need the midpoint of each ami box
        // you get that by taking the startingPoint (topE) and then adding that to the bottom of the ami category box
        // which is startingPoint+canvas.height*percent and then dividing that by 2 
        // the whole equation is this ((topE + ((botmE)))/2)
        // we add the 10 at the end bc from the midpoint it draws the bottom of the emoji so when we add 10 we are lowering the emoji slightly
        // to align midpoint and mid point of emoji
        context.fillText( data[ i ][ 0 ],((topE + ((botmE)))/2)-10,40);
        context.fillText( Math.round(percent*100) +"%",((topE + ((botmE)))/2)-10,55);
        
        // // starting point for next bar is the end of the last
        startingPoint = startingPoint + (maxWidth*percent);
    }
}
//////////////////////////////////////////////////////////////////////////////

function classifyAffect(positive, negative) {
    var affect = {
        HAP: false,
        LAP: false,
        HAN: false,
        LAN: false,
        NEU: false,
        positive: positive,
        negative: negative
    };

    if (positive == 0 && negative == 0) {
        affect.NEU = true;
    }else if(positive ==  negative){
        if(negative >= 3){
            affect.HAN = true;
        }else{
            affect.LAN = true;
        }
    }else {
        if (positive > 0 && positive <= 2 && negative < positive) {
            affect.LAP = true;
        }else if (positive >= 3 && negative < positive) {
            affect.HAP = true;
        }
        if (negative > 0 && negative <= 1 && positive < negative) {
            affect.LAN = true;
        }else if (negative >= 2 && positive < negative) {
            affect.HAN = true;
        }
    }
    return affect;
}

function getSentiment(itemText) {
    if (!itemText || itemText.length === 0) {
        return classifyAffect(0, 0);
    }
    var sentiment = Sentimood.prototype.analyze(itemText);
    return classifyAffect(sentiment.positive.score, sentiment.negative.score);
}
//////////////////////////////////////////////////////////////////////////////

