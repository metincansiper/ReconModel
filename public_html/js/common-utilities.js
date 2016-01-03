//This file includes the common utilities of more than one script
var commonUtilities = {
  truncateText: function (text, length) {
    return text.substring(0, length - 1) + "..";
  },
  cyStyle: [
    {
      selector: 'node',
      css: {
        'content': function (ele) {
          return commonUtilities.truncateText(ele._private.data.name, 5);
        },
        'text-valign': 'center',
        'text-halign': 'center'
      }
    },
    {
      selector: 'node[sbclass="species"]',
      css: {
        'background-color': 'yellow'
      }
    },
    {
      selector: 'node[sbclass="reaction"]',
      css: {
        'shape': 'rectangle',
        'background-color': 'white',
        'border-width': '3px',
        'border-color': 'blue',
        'color': 'blue'
      }
    },
    {
      selector: 'node[sbclass="compartment"]',
      css: {
        'padding-top': '10px',
        'padding-left': '10px',
        'padding-bottom': '10px',
        'padding-right': '10px',
        'text-valign': 'top',
        'text-halign': 'center',
        'font-size': '300px',
        'background-color': 'white',
        'border-width': '10px',
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
  ]
};


