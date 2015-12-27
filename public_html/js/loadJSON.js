function truncateText(text, length) {
  return text.substring(0, length - 1) + "..";
}
var cytoscapeJsGraph;

$(document).ready(function () {
  var text;
//  $.getJSON("examples/network.json", function (data) {
//    cytoscapeJsGraph = data;
//  });

  function readTextFile(file)
  {
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
    }
    rawFile.send(null);
  }
  readTextFile('examples/newjson.json');
  cytoscapeJsGraph = eval("(" + text + ")");
});



$(function () { // on dom ready
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
      name: 'preset'
    }
  });
});

