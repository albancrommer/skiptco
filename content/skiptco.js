// Script wide settings and vars
var DEBUG = true,                           // Basic switch
    bind_class          ="tco-bind",        // class tagging observed DOM elements
    anchor_class        = "tco-ham-proof",  // class for tagging modified anchors
    anchor_class_nomark = "tco-ham-nomark", // class for tagging anchors with no mark
    skiptcoAgent,                           // the agent called by document events 
    doc;                                    // singleton for the document

// Main function
function main(debug,mutations){

    debug = debug || ".";
    _debug(debug);
    _debugMutations(mutations);
    // Defines the injected class name
    var cls = anchor_class,
        el, // element
        efc, // element first child
        ham, // the GOOD link
        i, // iterator
        list =  doc.querySelectorAll("a.twitter-timeline-link"), // Elements list
        text // Element text content (some links have no data attribute)
        ;
        
    for( i=0;i<list.length;i++ ){
        el = list[i]
        parent = el.parentNode;
        if(el.classList.contains("."+cls)){
            continue;
        }
        // Builds ham, either with data attribute or current anchor text
        text = el.textContent.trim();
        ham = el.getAttribute("data-expanded-url") || text != "" ? text : "#";
//        _debug("main i:"+i+" el:"+el+" href:"+el.getAttribute("href")+" ham:"+ham)
        el.href = ham;
        el.target = "_blank";
        // Adds no class for certain objects (thumbnails)
        efc = el.firstElementChild;
        if( undefined !== efc && null != efc){
            if( efc.classList.contains("summary-thumbnail")){
                continue;
            }
        }
        el.classList.add(cls);
    }

}

// listens on body changes to keep Observers alive 
function observeProxy( options ){
   
    var observer;       
    // Inits the observers
    observeInit(options);
    // instances an observer for body changes
    observer = new MutationObserver(function(mutations) {
        observeInit(options);
    });
    // sets the body observer: only attrributes
    observer.observe(doc.body, {childList: true, attributes:true});        
}

// Inits the DOM bindings
function observeInit( options ){
//    _debug("observeInit")
    var i;
    for (i=0; i<options.length;i++){
        doObserve( options[i], false, options[i]);
    }
}

// Binds main() to Dom changes
function doObserve ( target, config, debug_string ){
    var cls = bind_class,
        observer,
        DOMtarget = doc.querySelector(target);
    // skips if element marked
    if (DOMtarget.classList.contains(cls)) {
        _debug( "x doObserve not running on "+target+": tagged, skipping")
        return;
    }else{
        _debug("doObserve runs on "+target)
    }
    main(target)
    // adds marker class to target
    DOMtarget.classList.add(cls);
    // creates an observer instance
    observer = new MutationObserver(function(mutations) {
        main(debug_string, mutations); 
    });
    // configures the observer
    config = config || {  childList: true, attributes:true };
    // instanciates the observer for target
    observer.observe(DOMtarget, config);
}

// Provides poor-man console.log alternative
function _debug (){
    var a = arguments, 
        d = "_dbg", 
        i = 0, 
        l = arguments.length, 
        m = "" 
    // Skips if deactivated
    if (!DEBUG) { return; }
    // Skips if no args
    if (0===l) { return }
    // Creates a DOM node for content
    for (i=0; i<l; i++) { m+=a[i]+" " }
    // Logs
    d = new Date();
    m = d.getSeconds() +":"+d.getMilliseconds()+ " " + m;
    Application.console.log( m);
}

// Provides mutations (ie. DOM changes events) tracker
function _debugMutations (mutations){
    var m = [":"];
    // Skips if no args
    if (!DEBUG||!mutations||! mutations.length) { return; }
    // Builds list of mutations types        
    mutations.forEach(function(mutation) {
        m.push(mutation.type);
    });    
    // Debugs string
    _debug(m);
}    

//Defines the agent
skiptcoAgent = {
    init: function() {
        // Binds the agent to page load
        gBrowser.addEventListener("load", skiptcoAgent.onPageLoad, true );
        // Binds the agent to tab switch
        gBrowser.tabContainer.addEventListener("TabSelect", skiptcoAgent.onPageLoad, false);
    },    
    onPageLoad: function(aEvent) {
        var styleElement;
        // Retrieves the active tab document
        doc = gBrowser.contentDocument
        // Skips non twitter pages
        if( ! ( /twitter.com/.test(doc.location.href) )  ){return;}
        // Running
        _debug("documentURI OK "+doc.documentURI)
        // Adds style to page
        style = doc.createElement("style")
        style.innerHTML = '.tco-ham-proof:before{ content: "↷";}'
        doc.body.appendChild(style)
        // Binds to click
        doc.body.addEventListener("click",function(){main("run on click")},false)
        // Binds main function to DOM changes
        observeProxy([".stream-items","#profile_popup"]);
  }
};

// Binds the script to the global window
window.addEventListener("load", function load(event){
    skiptcoAgent.init();  
    window.removeEventListener("load", load, false); //remove listener, no longer needed
},false);