var modelIDs = [];
var modelNames = [];
var cytoscapeJsGraph;
var currentModelID;

function truncateText(text, length) {
  return text.substring(0, length - 1) + "..";
}

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
//      cy.layout({
//        name: 'preset'
//      });
    },
    done: function () {
    },
    style: [
      {
        selector: 'node',
        css: {
          'content': function (ele) {
            return truncateText(ele._private.data.name, 5);
          },
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': 'yellow'
        }
      },
      {
        selector: 'node[sbclass="reactant"]',
        css: {
          'shape': 'rectangle',
          'background-color': 'white',
          'border-width': '3px',
          'border-color': 'blue',
          'color': 'blue'
        }
      },
      {
        selector: '$node > node',
        css: {
          'padding-top': '10px',
          'padding-left': '10px',
          'padding-bottom': '10px',
          'padding-right': '10px',
          'text-valign': 'top',
          'text-halign': 'center',
          'font-size': '300px',
          'background-color': 'white',
          'border-width': '3px',
          'border-color': 'black',
          'content': 'data(name)'
        }
      },
      {
        selector: 'edge',
        css: {
//          'curve-style': 'haystack',
          'target-arrow-shape': 'triangle'
        }
      },
      {
        selector: 'edge[sbclass="two sided"]',
        css: {
          'target-arrow-shape': 'triangle',
          'source-arrow-shape': 'triangle'
        }
      },
      {
        selector: ':selected',
        css: {
          'background-color': 'black',
          'line-color': 'black',
          'target-arrow-color': 'black',
          'source-arrow-color': 'black'
        }
      }
    ],
    elements: cytoscapeJsGraph,
    layout: {
      name: 'preset'
    }
  });
};

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
      }
    }
  });
};

var getFilePath = function (fileName) {
  return "cy_jsons/" + fileName + ".json";
};

var loadJSON = function (filename) {
  var path = getFilePath(filename);
  var text;
  text = readTextFile(path);
  cytoscapeJsGraph = eval("(" + text + ")");
};

var getModelSelector = function (modelId) {
  return modelId + "_selector";
};

var getModelIdBySelector = function (selector) {
  return selector.replace('_selector', '');
};

var fillModelSelectors = function () {
  var length = modelIDs.length;
  var content;
  content = "<button id='export-to-sbml'>Export to Sbml</button><br>";
  $("#model-selectors").append(content);
  for (var i = 0; i < length; i++) {
    var modelId = modelIDs[i];
    var modelName = modelNames[i];
    var modelSelector = getModelSelector(modelId);
    content = "<a href='#' class='model-selector' id='" + modelSelector + "'>" + modelName + "</a><br>";
    $("#model-selectors").append(content);
  }

  $("#export-to-sbml").click(function (e) {
    var sbmlText = convertToSBML(currentModelID);

    var blob = new Blob([sbmlText], {
      type: "text/plain;charset=utf-8;",
    });

    var sbmlFileName = currentModelID + ".sbml";

    saveAs(blob, sbmlFileName);
  });

  $(".model-selector").click(function (e) {
    var selectorId = $(this).attr('id');
    var modelId = getModelIdBySelector(selectorId);
    currentModelID = modelId;
    loadJSON(modelId);
    initCyInstance();
  });
};


$(document).ready(function () {
  getModelIDAndNames();
  fillModelSelectors();
  currentModelID = modelIDs[0];
  loadJSON(modelIDs[0]);
  initCyInstance();
});