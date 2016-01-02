//variables
//List of model id's to be handled
var modelIDs = [];
//List of model names to be handled
var modelNames = [];
//List of sbml id's to be handled
var sbmlIDs = [];
//Cytoscape.js graph to be loaded
var cytoscapeJsGraph;
//Index of current model
var currentIndex;

//functions
//simply reads from a text file
function readTextFile(file)
{
  var text;
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", file, false);
  rawFile.onreadystatechange = function ()
  {
    if (rawFile.readyState === 4)
    {
      if (rawFile.status === 200 || rawFile.status == 0)
      {
        text = rawFile.responseText;
      }
    }
  };
  rawFile.send(null);
  return text;
}

//Initilizes the cy instance
var initCyInstance = function () {
  cytoscape({
    container: document.getElementById('network-container'),
    hideEdgesOnViewport: true,
    hideLabelsOnViewport: true,
    textureOnViewport: false,
    motionBlur: false,
    "background-repeat": "no-repeat",
    "background-clip": "none",
    ready: function ()
    {
      window.cy = this;
      cy.panzoom({
        // options here...
      });

      console.log(cy.nodes().length);
      console.log(cy.edges().length);
    },
    done: function () {
    },
    style: commonUtilities.cyStyle,
    elements: cytoscapeJsGraph,
    layout: {
      name: 'preset'
    }
  });

  // add a qtip function
  cy.elements().qtip({
    content: function () {
      return this.data('name');
    },
    position: {
      my: 'top center',
      at: 'bottom center'
    },
    style: {
      classes: 'qtip-bootstrap',
      tip: {
        width: 16,
        height: 8
      }
    }
  });
};

//Fill the model id's names and sbml id's
var getModelIDAndNames = function () {
  $.ajax({
    type: "GET",
    url: "models.csv",
    dataType: "text",
    async: false,
    success: function (allText) {
      var allTextLines = allText.split(/\r\n|\n/);

      for (var i = 0; i < allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        modelIDs.push(data[0]);
        modelNames.push(data[1]);
        sbmlIDs.push(data[2]);
      }
    }
  });
};

//create the file path by the filename
var getFilePath = function (fileName) {
  return "cy_jsons/" + fileName + ".json";
};

//Load the specified json file
var loadJSON = function (filename) {
  var path = getFilePath(filename);
  var text;
  text = readTextFile(path);
  cytoscapeJsGraph = eval("(" + text + ")");
};

//create a selector by the modelId
var getModelSelector = function (modelId) {
  return modelId + "_selector";
};

//retrieve the model id by the selector
var getModelIdBySelector = function (selector) {
  return selector.replace('_selector', '');
};

//Append model selectors to the html
var fillSelectorsDiv = function () {
  var length = modelIDs.length;
  var content;
  content = "<button id='export-to-sbml'>Export to Sbml</button><br>";
  $("#bottom-div").append(content);
  
  $("#selected-model-name").text(modelNames[0]);
  
  for (var i = 0; i < length; i++) {
    var modelId = modelIDs[i];
    var modelName = modelNames[i];
    var modelSelector = getModelSelector(modelId);
    content = "<a href='#' class='model-selector' id='" + modelSelector + "'>" + modelName + "</a><br>";
    $("#model-selectors").append(content);
  }

  $("#export-to-sbml").click(function (e) {
    var sbmlText = convertToSBML(sbmlIDs[currentIndex]);

    var blob = new Blob([sbmlText], {
      type: "text/plain;charset=utf-8;",
    });

    var sbmlFileName = modelIDs[currentIndex] + ".sbml";

    saveAs(blob, sbmlFileName);
  });

  //On click change the current model
  $(".model-selector").click(function (e) {
    var selectorId = $(this).attr('id');
    var modelId = getModelIdBySelector(selectorId);
    currentIndex = modelIDs.indexOf(modelId);
    
    $("#selected-model-name").text(modelNames[currentIndex]);
    
    loadJSON(modelId);
    initCyInstance();
  });
};

//On document ready
$(document).ready(function () {
  getModelIDAndNames();
  fillSelectorsDiv();
  currentIndex = 0;
  loadJSON(modelIDs[0]);
  initCyInstance();
});