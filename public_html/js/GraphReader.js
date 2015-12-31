//List of model names to be handled
var modelIDs = [];
    //= ["bbd9dba1-ea10-40b8-9df7-69e5d08f9b36"];

//Index of current model
var currentModelIndex = 0;
//Size of model names list
var numberOfModels;
    //= modelIDs.length;

var getModelIDs = function () {
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
      }
      
      numberOfModels = modelIDs.length;
    }
  });
};

var getXML = function (modelID) {
  var result;
  $.ajax({
    type: "POST",
    url: "php/queryGraph.php",
    async: false,
    data: {
      modelID: modelID
    }
  })
      .then(function (content) {
        content = content.replace(/&lt;/g, "<");
        content = content.replace(/&gt;/g, ">");
        content = content.replace('<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><GetReconGraphDataResponse xmlns="http://nashua.cwru.edu/PathwaysService/"><GetReconGraphDataResult><?xml version="1.0" encoding="utf-16"?>', '');
        content = content.replace('</GetReconGraphDataResult></GetReconGraphDataResponse></soap:Body></soap:Envelope>', '')
        content = content.replace('<?xml version="1.0" encoding="utf-8"?>', '');
//        console.log(content);
        result = $.parseXML(content);
      });
  return result;
};

//This function is to save the layout elements data with their final positions in json format
var stop = function () {
  console.log("done");
  //We need a little time out because Cytoscape.js calls the stop function 
  //when the layout stops but before the final positions are set
  setTimeout(function () {
    var nodes = cy.nodes();
    var edges = cy.edges();

    var nodesData = [];
    var edgesData = [];

    //Elements data is the json formatted data to be passed to cytoscape.js instance as elements of the graph
    var elementsData = {
    };
    elementsData.nodes = nodesData;
    elementsData.edges = edgesData;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var data = {
        id: node.id(),
        name: node.data('name')
      };
      if (node.data("parent") != null) {
        data.parent = node.data("parent");
      }

      if (node.data("sbclass") != null) {
        data.sbclass = node.data("sbclass");
      }

      var position = {
        x: node.position("x"),
        y: node.position("y")
      };
      nodesData.push({
        data: data,
        position: position
      });
    }

    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      var data = {
        source: edge.data("source"),
        target: edge.data("target")
      };
      if (edge.data("sbclass") != null) {
        edge.sbclass = edge.data("sbclass");
      }

      edgesData.push({data: data});
    }

    var text = JSON.stringify(elementsData);

    var blob = new Blob([text], {
      type: "text/plain;charset=utf-8;",
    });

    var jsonFileName = modelIDs[currentModelIndex - 1] + ".json";

    saveAs(blob, jsonFileName);
//    console.log(text);
    processCurrentModel();
  }, 10000);

};

var XMLToJSON = function (xmlObject) {
  var cytoscapeJsGraph = {};
  var speciesIdToCompartmentIdMap = {};

  var cytoscapeJsNodes = [];
  var cytoscapeJsEdges = [];
  cytoscapeJsGraph.nodes = cytoscapeJsNodes;
  cytoscapeJsGraph.edges = cytoscapeJsEdges;

  //Search in compartents
  $(xmlObject).find("Compartments").children('Compartment').each(function () {
    var compartmentId = $(this).attr('ID');
    var compartmentName = $(this).attr('Name');
    cytoscapeJsNodes.push({
      data: {
        id: compartmentId,
        name: compartmentName
      }
    });

    //Search in species of that compartment
    $(this).children("SpeciesAll").each(function () {
      $(this).children("Species").each(function () {
        var speciesId = $(this).attr('ID');
        var speciesName = $(this).attr('Name');
        //Mark the compartment of that species
        speciesIdToCompartmentIdMap[speciesId] = compartmentId;
        cytoscapeJsNodes.push({
          data: {
            id: speciesId,
            parent: compartmentId,
            name: speciesName
          }
        });
      });
    });
  });

  //Search in reactions of that compartment
  $(xmlObject).find("Reactions").children('Reaction').each(function () {
    var reactionId = $(this).attr('ID');
    var reactionName = $(this).attr('Name');
    var reversible = $(this).attr('Reversible');
    var compartmentId;

    //Get edge data by reaction species
    $(this).children("ReactionSpeciesAll").each(function () {
      $(this).children("ReactionSpecies").each(function () {
        var speciesId = $(this).attr('SpeciesId');
        var roleId = $(this).attr('RoleId');
        //Reactions are in the same compartment with their input species
        if (!compartmentId) {
          if (roleId === 'Reactant') {
            //Get the compartment of that species
            compartmentId = speciesIdToCompartmentIdMap[speciesId];
          }
        }

        var sourceId;
        var targetId;
        if (roleId === 'Reactant') {
          sourceId = speciesId;
          targetId = reactionId;
        }
        else {
          sourceId = reactionId;
          targetId = speciesId;
        }

        var edgeData = {
          source: sourceId,
          target: targetId
        };
        if (reversible) {
          edgeData.sbclass = "two sided";
        }
        ;
        cytoscapeJsEdges.push({
          data: edgeData
        });
      });
    });
    cytoscapeJsNodes.push({
      data: {
        id: reactionId,
        sbclass: 'reactant',
        parent: compartmentId,
        name: reactionName
      }
    });
  });

  return cytoscapeJsGraph;
};

function truncateText(text, length) {
  return text.substring(0, length - 1) + "..";
}
;

//Create the cy network and perform to perform the layout and save the final positions
var initCyInstance = function (cytoscapeJsGraph) {
  document.getElementById('network-container');
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
      //Define the layout options
      var options = {
        name: 'cose',
        animate: false,
        nestingFactor: 100
      };

      window.cy = this;

      //If there is just one compartment then add some extra options
      if (cy.nodes().orphans().length == 1) {
        options.nodeRepulsion = function (node) {
          return 400000000;
        };

        options.nodeOverlap = 0.01;
      }

      //perform the layout with the specified options
      var layout = cy.makeLayout(options);

      layout.pon('layoutstop').then(function (event) {
        stop();
      });

      layout.run();

      //Enable panzoom
      cy.panzoom({
        // options here...
      });
    },
    style: [
      {
        selector: 'node',
        css: {
          'content': function (ele) {
            return truncateText(ele._private.data.name, 5);
          },
          'text-valign': 'center',
          'text-halign': 'center'
        }
      },
      {
        selector: 'node[sbclass="reactant"]',
        css: {
          'shape': 'rectangle'
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
          'background-color': '#bbb'
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
    //Define the elements of cy graph
    elements: cytoscapeJsGraph,
  });
};

//Processes the current model and mark it as processed
var processCurrentModel = function () {
  //Check if all models are already processed
  if (currentModelIndex == numberOfModels) {
    return;
  }

  console.log("processing the model named as " + modelIDs[currentModelIndex]);

  //Process the current model
//  var path = getPathForModel(modelIDs[currentModelIndex]);
//  var cytoscapeJsGraph = XMLToJSON(path);

  var xmlObject = getXML(modelIDs[currentModelIndex]);
  var cytoscapeJsGraph = XMLToJSON(xmlObject);
  initCyInstance(cytoscapeJsGraph);

  //Mark that the model ise processed
  currentModelIndex = currentModelIndex + 1;
};

$(document).ready(function () {
  getModelIDs();
  
  //If there is no model in the list then return directly
  if (numberOfModels == 0) {
    return;
  }

  //Start with the first model
  processCurrentModel();
});