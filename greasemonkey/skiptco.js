// ==UserScript==
// @name Skiptco
// @namespace https://github.com/albancrommer/skiptco
// @description Replaces Twitter t.co redirection by original links
// @version %VERSION%
// @author openuserjsalbancrommer.com
// @match https://twitter.com/*
// @match https://tweetdeck.twitter.com/*	
// @license GPL v3
// @updateURL https://openuserjs.org/meta/openuserjsalbancrommer.com/Skiptco.meta.js
// @icon http://www.crommer.net/skiptco/icon-small.png
// @run-at document-end
// @homepageURL https://github.com/albancrommer/skiptco
// ==/UserScript==

(function(){

    // Script wide settings and vars
    var DEBUG               = false,                         
        agent               = {},
        bind_class          = "tco-bind",       // class tagging observed DOM elements
        anchor_class        = "tco-ham-proof",  // class for tagging modified anchors
        anchor_class_nomark = "tco-ham-nomark", // class for tagging anchors with no mark
        doc;                                    // singleton for the document


    /**
     * Provides poor-man console.log alternative
     * @returns {undefined}
     */
    function _debug (){
        var a = arguments, 
            d = "_dbg", 
            i = 0, 
            l = arguments.length, 
            m = ""
            ;
        // Skips if deactivated
        if (!DEBUG) { return; }
        // Skips if no args
        if (0===l) { return; }
        // Logs
        for (i=0; i<l; i++) { m+=a[i]+" "; }
        d = new Date();
        m = d.getSeconds() +":"+d.getMilliseconds()+ " " + m;
        console.log( m);
    }


    /**
     * Defines the agent template
     * 
     * @param {type} observedItemList
     * @returns {skiptcoAgent.instance}
     */
    skiptcoAgent = function (observedItemList){
        
        /**
         * The actual agent
         * 
         */
        var instance = {
        
            /**
             * Performs DOM binding to the agent
             * 
             * @returns {undefined}
             */
            init: function() {
                
                // Retrieves the active tab document
                doc = window.document;

                // Adds style to page
                var style = doc.createElement("style");
                style.innerHTML = '.tco-ham-proof:before{ content: "↷";}';
                doc.body.appendChild(style);

                // Binds to click
                doc.body.addEventListener("click",function(){agent.run();},false);

                MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

                var observer = new MutationObserver(function(mutations, observer) {
                    agent.run();
                });

                observer.observe(doc, {
                  subtree: true,
                  attributes: true
                });

            },                
            /**
             * 
             * @param {type} selector
             * @returns {undefined}
             */
            patchURL: function ( selector ){
                // Defines the injected class name
                var cls     = anchor_class,
                el,                                 // element
                efc,                                // element first child
                ham,                                // the Good Link
                i,                                  // iterator
                list    =  doc.querySelectorAll(selector), // Elements list
                r       = /(http\S*)/,                  // Regular Expression for links cleaning
                rr,                                 // Regular Expression result
                text                                // Element text content (some links have no data attribute)
                ;

                for (i = 0; i<list.length;i++ ){
                    el      = list[i]
                    if(el.classList.contains(cls)){
                        continue;
                    }
                    // Builds ham, either with data attribute or current anchor text
                    text    = el.textContent.trim();
                    ham     = text ;
                    if( el.hasAttribute("data-full-url") ) {
                        ham =  el.getAttribute("data-full-url") ;
                    }else if( el.hasAttribute("data-expanded-url" ) ) {
                        ham = el.getAttribute("data-expanded-url")
                    }
                    // It should not replace some internal links
                    if( ham[0] === "@" ){
                        continue;
                    }
                    rr      = r.exec(ham);
                    _debug("before : ham= "+ham+" text="+text)
                    _debug("rr before: "+rr)
                    ham     = ( null !== rr ) ? rr[1]:"http://"+ham        
                    _debug("ham after: "+ham)
                    // Adds no class for certain objects (thumbnails)
                    efc     = el.firstElementChild;
                    if( undefined !== efc && null !== efc){
                        if( efc.classList.contains("summary-thumbnail")){
                            continue;
                        }
                    }
                    el.href = ham;
                    el.target = "_blank";
                    el.classList.add(cls);
                }
            },
             closest : function(el, selector, stopSelector) {
			  var retval = null;
			  while (el) {
				if (el.matches(selector)) {
				  retval = el;
				  break
				} else if (stopSelector && el.matches(stopSelector)) {
				  break
				}
				el = el.parentElement;
			  }
			  return retval;
			},
			/**
			 * Patches twitter cards
			 */
            patchCards : function(){
				var cards = document.getElementsByClassName('card2')
				for ( var i = 0; i < cards.length; i++ ){ 
					
					// It should skip if the item has been tagged
					var card = cards[i] 
					if( card.classList.contains(anchor_class)){
						continue;
					}
					// It should find the iframe
					var iframe = card.getElementsByTagName("iframe")[0]
					// IT should skip if no iframe found
					if( ! iframe ){
						break;
					}
					// It should find the iframe document
					var doc = iframe.contentWindow.document;
					if( ! doc ) {
						continue;
					}

					// It should find the ham link 
					var cardParent = this.closest(card,".tweet");
					var hamList = cardParent.querySelectorAll('[data-expanded-url]');
					if( 0 === hamList.length ){
						continue;
					}
					var ham_link = hamList[0].attributes["data-expanded-url"].value;

					// IT should find the links in the iframe document
					var aList = doc.getElementsByTagName("a")
					if( ! aList.length ){
						continue;
					}
					
					// It should tag the card as done once the iframe document links are found
					card.classList.add(anchor_class);

					// It should send a message to the iframe
					for ( var i = 0; i < aList.length ; i ++){
						var el = aList[i];
						el.href=ham_link;
					}

				}

			}
        };
        return instance;

    };

    // Instanciates tweeter agent
    var twitterAgent = new skiptcoAgent([".stream-items","#profile_popup"]);

    /**
     * $(".promoted-account").hide()
     * $(".promoted-trend").hide()
     */
    twitterAgent.hidePromotedElements =     function (){
        var el = doc.querySelectorAll("[class*='promoted']"),
            i;
        if( ! el.length ){
            _debug("nothing to hide!");
            return;
        }
        for (i=0; i<el.length; i++){
            el[i].parentNode.removeChild(el[i]);
        }
        _debug("Hiding!");

    };
    
    
    
    /**
     *
     */
    twitterAgent.run = function (){

        this.patchURL("a.twitter-timeline-link");
        this.patchCards();
        
        // Skips promoted elements in a not so efficient way
        // @TODO: Make it efficient : ie add specific mutation listener 
        setTimeout( function(){ agent.hidePromotedElements() } ,2000);
    };
    

    // Tweetdeck agent
    var tweetdeckAgent = new skiptcoAgent([".js-app-content",".js-modal-content"]);

    /**
     * 
     */
    tweetdeckAgent.run = function(){
        this.patchURL("a.url-ext");
    };

	// GreaseMonkey style : execute immediately
	if( /.*tweetdeck.*/.test(document.location.origin) ){
		agent = tweetdeckAgent;            
	}else{
		agent = twitterAgent;
	}
	// Run the agent, who will bind itself to various elements
	agent.init();      
	agent.run();

    
})();
