evgui = {};

evgui.messages_el = document.getElementById('events');

nodes = {};

nodes.get_root_node = function() {
    root_node = {
            "adjacencies": [],
            "data": {
                "$color": "#ff5500",
                "$type": "circle",
                "$dim": 100
            },
            "id": "rabbit",
            "name": "RabbitMQ"
        };
    return root_node;
}
nodes.nodes = [];
nodes.nodes.push(nodes.get_root_node());

nodes.create_node_json = function (node_id, node_name, node_to, node_type) {
    
    var nodetype = "circle";
    nodetype = (node_type == 'crawler' ? 'circle': nodetype);
    nodetype = (node_type == 'processor' ? 'square' : nodetype);
    
    var nodecolor = "#333333";//957b00
    nodecolor = (node_type == 'crawler' ? '#001eae' : nodecolor);
    nodecolor = (node_type == 'processor' ? '#ce008d' : nodecolor);
    
    var newnode = {
                    "adjacencies": [
                        {
                            "nodeTo": node_to,
                            "nodeFrom": node_id,
                            "data": {
                                "$color": "#155b97"
                            }
                        }
                    ],
                    "data": {
                        "$color": nodecolor,
                        "$type": nodetype,
                        "$dim": 30
                    },
                    "id": node_id,
                    "name": node_name
                };
    //console.log(newnode);
    return newnode;
};

nodes.generate = function (crawlers_sum, processors_sum) {
    for (var i=0; i<crawlers_sum; i++) {
        node_id = "crawler" + i;
        node_name = "crawler" + i;
        node_to = "rabbit";
        node_type = "crawler";
        nodes.nodes.push(nodes.create_node_json(node_id, node_name, node_to, node_type));
    };
    for (var i=0; i<processors_sum; i++) {
        node_id = "proc" + i;
        node_name = "proc" + i;
        node_to = "rabbit";
        node_type = "processor";
        nodes.nodes.push(nodes.create_node_json(node_id, node_name, node_to, node_type));
    };
};

nodes.remove_node = function (viz, node_id) {
    viz.op.removeNode(node_id, {  
        type: 'fade:con',  
        duration: 1500  
    });
};

nodes.add_node = function (viz, node_id, node_name, node_to, node_type, remove_timeout) {
    var newnode_json = [];
    newnode_json.push(nodes.get_root_node());
    newnode_json.push(nodes.create_node_json(node_id, node_name, node_to, node_type));
    viz.op.sum(newnode_json, {  
        type: 'fade:con',  
        duration: 1000  
    });
};



//------------------------------------------------------------------------------

var labelType, useGradients, nativeTextSupport, animate;

(function() {
    var ua = navigator.userAgent,
        iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
        typeOfCanvas = typeof HTMLCanvasElement,
        nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
        textSupport = nativeCanvasSupport 
            && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
    //I'm setting this based on the fact that ExCanvas provides text support for IE
    //and that as of today iPhone/iPad current text support is lame
    labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
    nativeTextSupport = labelType == 'Native';
    useGradients = nativeCanvasSupport;
    animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
    elem: false,
    write: function(text){
        if (!this.elem) 
            this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
    }
};


nodes.init = function (){
    
    // init ForceDirected
    fd = new $jit.ForceDirected({
        //id of the visualization container
        injectInto: 'infovis',
        //Enable zooming and panning
        //by scrolling and DnD
        Navigation: {
            enable: true,
            //Enable panning events only if we're dragging the empty
            //canvas (and not a node).
            panning: 'avoid nodes',
            zooming: 10 //zoom speed. higher is more sensible
        },
        // Change node and edge styles such as
        // color and width.
        // These properties are also set per node
        // with dollar prefixed data-properties in the
        // JSON structure.
        Node: {
            overridable: true
        },
        Edge: {
            overridable: true,
            color: '#23A4FF',
            lineWidth: 4.0
        },
        //Native canvas text styling
        Label: {
            type: labelType, //Native or HTML
            size: 22,
            style: 'bold'
        },
        //Add Tips
        Tips: {
            enable: true,
            onShow: function(tip, node) {
                //count connections
                var count = 0;
                node.eachAdjacency(function() { count++; });
                //display node info in tooltip
                tip.innerHTML = "<div class=\"tip-title\">" + node.name + "</div>"
                    + "<div class=\"tip-text\"><b>connections:</b> " + count + "</div>";
            }
        },
        // Add node events
        Events: {
            enable: true,
            type: 'Native',
            //Change cursor style when hovering a node
            onMouseEnter: function() {
                fd.canvas.getElement().style.cursor = 'move';
            },
            onMouseLeave: function() {
                fd.canvas.getElement().style.cursor = '';
            },
            //Update node positions when dragged
            onDragMove: function(node, eventInfo, e) {
                var pos = eventInfo.getPos();
                node.pos.setc(pos.x, pos.y);
                fd.plot();
            },
            //Implement the same handler for touchscreens
            onTouchMove: function(node, eventInfo, e) {
                $jit.util.event.stop(e); //stop default touchmove event
                this.onDragMove(node, eventInfo, e);
            },
            //Add also a click handler to nodes
            onClick: function(node) {
                if(!node) return;
                // Build the right column relations list.
                // This is done by traversing the clicked node connections.
                var html = "<h4>" + node.name + "</h4><b> connections:</b><ul><li>",
                    list = [];
                node.eachAdjacency(function(adj){
                    list.push(adj.nodeTo.name);
                });
                //append connections information
                $jit.id('inner-details').innerHTML = html + list.join("</li><li>") + "</li></ul>";
            }
        },
        //Number of iterations for the FD algorithm
        iterations: 20,
        //Edge length
        levelDistance: 200,
        // Add text to the labels. This method is only triggered
        // on label creation and only for DOM labels (not native canvas ones).
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            var style = domElement.style;
            style.fontSize = "1em";
            style.color = "#fff";
            style.background = "#555500";
        },
        // Change node styles when DOM labels are placed
        // or moved.
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            var left = parseInt(style.left);
            var top = parseInt(style.top);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + 'px';
            style.top = (top + 10) + 'px';
            style.display = '';
        }
    });
    // load JSON data.
    fd.loadJSON(nodes.nodes);
    // compute positions incrementally and animate.
    cdata = {
        iter: 40,
        property: 'end',
        onStep: function(perc){
            Log.write(perc + '% loaded...');
        },
        onComplete: function(){
            Log.write('done');
            fd.animate({
                modes: ['linear'],
                transition: $jit.Trans.Elastic.easeOut,
                duration: 0
            });
        }
    };
    fd.computeIncremental(cdata);
    // end
};