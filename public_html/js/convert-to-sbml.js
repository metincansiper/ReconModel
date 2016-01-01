var convertToSBML = function (modelID) {
  var compartments = cy.nodes('$node > node');
  var reactions = cy.nodes('[sbclass="reactant"]');
  var species = cy.nodes().nonorphans('[^sbgnclass]');

  var sbmlText = "";
  sbmlText = sbmlText + '<?xml version="1.0" encoding="UTF-8"?>\n';
  sbmlText = sbmlText + '<sbml xmlns="http://www.sbml.org/sbml/level2" level="2" version="1">\n';
  sbmlText = sbmlText + '<model id="' + modelID + '">\n';

  //Add compartments data
  sbmlText = sbmlText + '<listOfCompartments>\n';

  for (var i = 0; i < compartments.length; i++) {
    var compartment = compartments[i];
    sbmlText = sbmlText + '<compartment id="' + compartment.id()
            + '" outside="' + compartment.data('name') + '"/>\n';
  }

  sbmlText = sbmlText + '</listOfCompartments>\n';

  //Add species data
  sbmlText = sbmlText + '<listOfSpecies>\n';

  for (var i = 0; i < species.length; i++) {
    var currentSpecies = species[i];
    sbmlText = sbmlText + '<species id="' + currentSpecies.id()
            + '" compartment="' + currentSpecies.data('parent') + '"/>\n';
  }

  sbmlText = sbmlText + '</listOfSpecies>\n';

  //Add reactions data
  sbmlText = sbmlText + '<listOfReactions>';

  for (var i = 0; i < reactions.length; i++) {
    var reaction = reactions[i];
    var connectedEdges = reaction.connectedEdges();

    //If the reaction is the target of the edge then the other side of the edge 
    //is an reactant of this reaction
    var reactantEdges = connectedEdges.filter(function (i, ele) {
      if (ele.data('target') == reaction.id()) {
        return true;
      }

      return false;
    });

    //If the reaction is the source of the edge then the other side of the edge 
    //is a product of this reaction
    var productEdges = connectedEdges.filter(function (i, ele) {
      if (ele.data('source') == reaction.id()) {
        return true;
      }

      return false;
    });


    sbmlText = sbmlText + '<reaction id="' + reaction.id()
            + '" name="' + reaction.data('name') + '">\n';

    //Add notes data
    sbmlText = sbmlText + '<notes>\n';
    //TODO fill here with notes
    sbmlText = sbmlText + '</notes>\n';

    //Add reactants data
    sbmlText = sbmlText + '<listOfReactants>\n';
    
    //Add reactants data
    for(var j = 0; j < reactantEdges.length; j++){
      var reactantEdge = reactantEdges[j];
      sbmlText = sbmlText + '<speciesReference species="' + reactantEdge.data('source')
              + '"/>';
    }
    
    //Add products data
    for(var j = 0; j < productEdges.length; j++){
      var productEdge = productEdges[j];
      sbmlText = sbmlText + '<speciesReference species="' + productEdge.data('target')
              + '"/>';
    }
    
    sbmlText = sbmlText + '</listOfReactants>\n';

    sbmlText = sbmlText + '</reaction>\n';
  }

  sbmlText = sbmlText + '</listOfReactions>';
  return sbmlText;
};


