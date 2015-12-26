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

  $(xmlObject).find("Compartments").children('Compartment').each(function () {
    var compartmentId = $(this).attr('ID');
    cytoscapeJsNodes.push({
      data: {
        id: compartmentId,
        name: ""
      }
//      ,
//      locked: true
    });

    $(this).children("SpeciesAll").each(function () {
      $(this).children("Species").each(function () {
        var speciesId = $(this).attr('ID');
        var speciesName = $(this).attr('Name');

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

  $(xmlObject).find("Reactions").children('Reaction').each(function () {
    var reactionId = $(this).attr('ID');
    var reactionName = $(this).attr('Name');
    var reversible = $(this).attr('Reversible');
    var compartmentId;

    $(this).children("ReactionSpeciesAll").each(function () {
      $(this).children("ReactionSpecies").each(function () {
        var speciesId = $(this).attr('SpeciesId');
        var roleId = $(this).attr('RoleId');

        if (!compartmentId) {
          if (roleId === 'Reactant') {
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



$(function () { // on dom ready
  document.getElementById('network-container');
  var cy = cytoscape({
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
      cy.elements().css('visibility', 'hidden');

      cy.panzoom({
					// options here...
				});

//      var container = $('#sbgn-network-container');
//      var panProps = ({
//        fitPadding: 10
//      });
//      container.cytoscapePanzoom(panProps);

      console.log(cy.nodes().length);
      console.log(cy.edges().length);

//      cy.nodes('$node > node').ungrabify();
//      cy.edges().unselectify();
    },
    done: function () {
      console.log("done");
      cy.elements().css('visibility', 'visible');
//      var text = JSON.stringify(cy.json());
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
          id: node.id()
        };

        if (node.data("parent") != null) {
          data.parent = node.data("parent");
        }

        if (node.data("sbclass") != null) {
          data.sbclass = node.data("sbclass");
        }

        var position = {
          x: Math.round(node.position("x")),
          y: Math.round(node.position("y"))
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

        edgesData.push(data);
      }

      var text = JSON.stringify(elementsData);
//      cy.elements().remove();
      cy.json(text);

      var blob = new Blob([text], {
        type: "text/plain;charset=utf-8;",
      });
      saveAs(blob, "network.txt");

      console.log(text);
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
    elements: cytoscapeJsGraph,
    layout: {
      name: 'cose',
//      idealEdgeLength: function(){
//        return 50;
//      }
//      gravity: 100
//      padding: 10
    }
  });

//  cy.nodes().grabify();
//  cy.nodes('$node > node').ungrabify();
});

