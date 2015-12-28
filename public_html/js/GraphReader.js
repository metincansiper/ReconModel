function loadXMLDoc(filename) {
  if (window.XMLHttpRequest) {
    xhttp = new XMLHttpRequest();
  }
  else {
    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xhttp.open("GET", filename, false);
  xhttp.send();
  return xhttp.responseXML;
}
;

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
    saveAs(blob, "network.json");
    console.log(text);
  }, 10000);

}

var cytoscapeJsGraph = {};
var speciesIdToCompartmentIdMap = {};
function truncateText(text, length) {
  return text.substring(0, length - 1) + "..";
}

$(document).ready(function () {

  var xmlObject = loadXMLDoc("examples/GetReconGraphData.xml");
  var cytoscapeJsNodes = [];
  var cytoscapeJsEdges = [];
  cytoscapeJsGraph.nodes = cytoscapeJsNodes;
  cytoscapeJsGraph.edges = cytoscapeJsEdges;
  
  //Search in compartents
  $(xmlObject).find("Compartments").children('Compartment').each(function () {
    var compartmentId = $(this).attr('ID');
    cytoscapeJsNodes.push({
      data: {
        id: compartmentId,
        name: ""
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
});

//Create the cy network and perform to perform the layout and save the final positions
$(function () { // on dom ready
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
      //Define the layout oprions
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
});

