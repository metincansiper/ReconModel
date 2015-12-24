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
        id: compartmentId
      },
      locked: true
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
        
        if(roleId === 'Reactant'){
          sourceId = speciesId;
          targetId = reactionId;
        }
        else{
          sourceId = reactionId;
          targetId = speciesId;
        }
        
        cytoscapeJsEdges.push({
          data: {
            source: sourceId,
            target: targetId
          }
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
    textureOnViewport: true,
    "background-repeat": "no-repeat",
    "background-clip": "none",
    
    style: [
      {
        selector: 'node',
        css: {
          'content': 'data(name)',
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
          'curve-style': 'haystack'
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
      name: 'cose'
    }
  });
  
  console.log(cy.nodes().length);
  console.log(cy.edges().length);
});

