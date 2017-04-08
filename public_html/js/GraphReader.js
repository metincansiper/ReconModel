//List of model ids to be handled
var modelIDs = [];
//Index of current model
var currentModelIndex = 0;
//Number of models
var numberOfModels;

//Fill the model id's map
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
  //Previously we need a little time out because Cytoscape.js calls the stop function 
  //when the layout stops but before the final positions are set.
  //However, this bug must be solved and I removed that timeout. TODO check if there is a problem
  //with this before running this script.
//  setTimeout(function () {
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
      //create node data
      var data = {
        id: node.id(),
        name: node.data('name'),
        sbmlId: node.data('sbmlId')
      };
      
      if (node.data("parent") != null) {
        data.parent = node.data("parent");
      }

      if (node.data("sbclass") != null) {
        data.sbclass = node.data("sbclass");
      }
      
      if(node.data("sbclass") == 'reaction'){
        data.reversible = node.data('reversible');
        data.kineticLawId = node.data('kineticLawId');
        data.fast = node.data('fast');
      }
      else if(node.data("sbclass") == 'species'){
        data.typeId = node.data('typeId');
        data.initialAmount = node.data('initialAmount');
        data.initialConcentration = node.data('initialConcentration');
        data.substanceUnitsId = node.data('substanceUnitsId');
        data.hasOnlySubstanceUnits = node.data('hasOnlySubstanceUnits');
        data.boundaryCondition = node.data('boundaryCondition');
        data.charge = node.data('charge');
        data.constant = node.data('constant');
        data.isCommon = node.data('isCommon');
      }
      else if(node.data("sbclass") == 'compartment'){
        data.size = node.data('size');
        data.spatialDimensions = node.data('spatialDimensions');
        data.typeId = node.data('typeId');
      }

      //define node position
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
        id: edge.data("id"),
        source: edge.data("source"),
        target: edge.data("target"),
        stoichiometry: edge.data("stoichiometry")
      };
      
      if (edge.data("sbclass") != null) {
        data.sbclass = edge.data("sbclass");
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
//  }, 70000);

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
    var parentId = $(this).attr('Outside');
    var compartmentSBMLId = $(this).attr('sbmlID');
    var compartmentSize = $(this).attr('Size');
    var compartmentSpatialDimensions = $(this).attr('SpatialDimensions');
    var compartmentConstant = $(this).attr('Constant');
    var compartmentTypeId = $(this).attr('CompartmentTypeId');

    var compartmentData = {
      id: compartmentId,
      name: compartmentName,
      sbclass: 'compartment',
      sbmlId: compartmentSBMLId,
      size: compartmentSize,
      spatialDimensions: compartmentSpatialDimensions,
      typeId: compartmentTypeId
    };

    if (parentId != "00000000-0000-0000-0000-000000000000") {
      compartmentData.parent = parentId;
    }

    cytoscapeJsNodes.push({
      data: compartmentData
    });

    //Search in species of that compartment
    $(this).children("SpeciesAll").each(function () {
      $(this).children("Species").each(function () {
        var speciesId = $(this).attr('ID');
        var speciesName = $(this).attr('Name');
        var speciesSBMLId = $(this).attr('sbmlID');
        var speciesTypeId = $(this).attr('SpeciesTypeId');
        var speciesInitialAmount = $(this).attr('InitialAmount');
        var speciesInitialConcentration = $(this).attr('InitialConcentration');
        var speciesSubstanceUnitsId = $(this).attr('SubstanceUnitsId');
        var speciesHasOnlySubstanceUnits = $(this).attr('HasOnlySubstanceUnits');
        var speciesBoundaryCondition = $(this).attr('BoundaryCondition');
        var speciesCharge = $(this).attr('Charge');
        var speciesConstant = $(this).attr('Constant');
        var speciesIsCommon = $(this).attr('IsCommon');
        //Mark the compartment of that species
        speciesIdToCompartmentIdMap[speciesId] = compartmentId;
        cytoscapeJsNodes.push({
          data: {
            id: speciesId,
            parent: compartmentId,
            name: speciesName,
            sbclass: 'species',
            sbmlId: speciesSBMLId,
            typeId: speciesTypeId,
            initialAmount: speciesInitialAmount,
            initialConcentration: speciesInitialConcentration,
            substanceUnitsId: speciesSubstanceUnitsId,
            hasOnlySubstanceUnits: speciesHasOnlySubstanceUnits,
            boundaryCondition: speciesBoundaryCondition,
            charge: speciesCharge,
            constant: speciesConstant,
            isCommon: speciesIsCommon
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
    var reactionSBMLId = $(this).attr('sbmlId');
    var reactionKineticLawId = $(this).attr('KineticLawId');
    var reactionFast = $(this).attr('Fast');
    var compartmentId;

    //Get edge data by reaction species
    $(this).children("ReactionSpeciesAll").each(function () {
      $(this).children("ReactionSpecies").each(function () {
        var speciesId = $(this).attr('SpeciesId');
        var roleId = $(this).attr('RoleId');
        var edgeId = $(this).attr('ID');
        var stoichiometry = $(this).attr('Stoichiometry');
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
          id: edgeId,
          source: sourceId,
          target: targetId,
          stoichiometry: stoichiometry
        };
        
        if (reversible === 'True') {
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
        sbclass: 'reaction',
        parent: compartmentId,
        name: reactionName,
        reversible: reversible,
        sbmlId: reactionSBMLId,
        kineticLawId: reactionKineticLawId,
        fast: reactionFast
      }
    });
  });

  return cytoscapeJsGraph;
};

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
    style: commonUtilities.cyStyle,
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