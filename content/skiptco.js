(function () {

    // Script wide settings and vars
    var DEBUG = true,
            bind_class = "tco-bind", // class tagging observed DOM elements
            anchor_class = "tco-ham-proof", // class for tagging modified anchors
            anchor_class_nomark = "tco-ham-nomark", // class for tagging anchors with no mark
            skiptcoAgent, // the agent called by document events 
            doc;                                    // singleton for the document

// listens on body changes to keep Observers alive 
    function observeProxy(tabAgent) {

        var observer;
// instances an observer for body changes
        observer = new MutationObserver(function (mutations) {
            tabAgent.run();
        });
        // sets the body observer: only attrributes
        observer.observe(doc.body, {childList: true, attributes: true,subtree:true});
    }

// Provides poor-man console.log alternative
    function _debug() {
        var a = arguments,
                d = "_dbg",
                i = 0,
                l = arguments.length,
                m = ""
        // Skips if deactivated
        if (!DEBUG) {
            return;
        }
        // Skips if no args
        if (0 === l) {
            return
        }
        // Creates a DOM node for content
        for (i = 0; i < l; i++) {
            m += a[i] + " "
        }
        // Logs
        d = new Date();
        m = d.getSeconds() + ":" + d.getMilliseconds() + " " + m;
        Application.console.log(m);
    }
    
//Defines the agent
    skiptcoAgent = {
    };


    /**
     * Defines the agent template
     * 
     * @param {type} observedItemList
     * @returns {skiptcoAgent.instance}
     */
    skiptcoAgent = function (observedItemList) {

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
            init: function () {
                // Binds the agent to page load
                gBrowser.addEventListener("load", skiptcoAgent.onPageLoad, true);
                // Binds the agent to tab switch
                gBrowser.tabContainer.addEventListener("TabSelect", skiptcoAgent.onPageLoad, false);
            },
            onPageLoad: function (aEvent) {
                var styleElement, 
                    tabAgent;
                // Retrieves the active tab document
                doc = gBrowser.contentDocument
                // Skips non twitter pages
                if( /tweetdeck.twitter.com/.test(doc.location.href)) {
                    tabAgent = tweetdeckAgent;
                }else if (/twitter.com/.test(doc.location.href)) {
                    tabAgent = twitterAgent;
                }else{
                    return;
                }
                // Running
                _debug("documentURI OK " + doc.documentURI)
                // Adds style to page
                style = doc.createElement("style")
                style.innerHTML = '.tco-ham-proof:before{ content: "↷";}'
                doc.body.appendChild(style)
                // Binds to click
                doc.body.addEventListener("click", function () {
                    main("run on click")
                }, false)
                // Binds main function to DOM changes
                observeProxy(tabAgent);
            },
            /**
             * 
             * @param {type} selector
             * @returns {undefined}
             */
            patchURL: function (selector) {
                // Defines the injected class name
                var cls = anchor_class,
                        el, // element
                        efc, // element first child
                        ham, // the Good Link
                        i, // iterator
                        list = doc.querySelectorAll(selector), // Elements list
                        r = /(http\S*)/, // Regular Expression for links cleaning
                        rr, // Regular Expression result
                        text                                // Element text content (some links have no data attribute)
                        ;
                for (i = 0; i < list.length; i++) {
                    el = list[i]
                    if (el.classList.contains(cls)) {
                        continue;
                    }
                    // Builds ham, either with data attribute or current anchor text
                    text = el.textContent.trim();
                    ham = text;
                    if (el.hasAttribute("data-full-url")) {
                        ham = el.getAttribute("data-full-url");
                    } else if (el.hasAttribute("data-expanded-url")) {
                        ham = el.getAttribute("data-expanded-url")
                    }
                    rr = r.exec(ham);
                    _debug("before : ham= " + ham + " text=" + text)
                    _debug("rr before: " + rr)
                    ham = (null !== rr) ? rr[1] : "http://" + ham
                    _debug("ham after: " + ham)
                    // Adds no class for certain objects (thumbnails)
                    efc = el.firstElementChild;
                    if (undefined !== efc && null !== efc) {
                        if (efc.classList.contains("summary-thumbnail")) {
                            continue;
                        }
                    }
                    el.href = ham;
                    el.target = "_blank";
                    el.classList.add(cls);
                }
            }
        };
        return instance;
    };
    // Instanciates tweeter agent
    var twitterAgent = new skiptcoAgent([".stream-items", "#profile_popup"]);
    /**
     * $(".promoted-account").hide()
     * $(".promoted-trend").hide()
     */
    twitterAgent.hidePromotedElements = function () {
        var el = doc.querySelectorAll("[class*='promoted']"),
                i;
        if (!el.length) {
            _debug("nothing to hide!");
            return;
        }
        for (i = 0; i < el.length; i++) {
            el[i].parentNode.removeChild(el[i]);
        }
        _debug("Hiding!");

    };

    /**
     *
     */
    twitterAgent.run = function () {

        this.patchURL("a.twitter-timeline-link");
        // Skips promoted elements in a not so efficient way
        // @TODO: Make it efficient : ie add specific mutation listener 
        setTimeout(function () {
            agent.hidePromotedElements()
        }, 2000);
    };


    // Tweetdeck agent
    var tweetdeckAgent = new skiptcoAgent([".js-app-content", ".js-modal-content"]);

    // Default Agent
    var defaultAgent = new skiptcoAgent();


// Binds the script to the global window
    window.addEventListener("load", function load(event) {
        defaultAgent.init();
        window.removeEventListener("load", load, false); //remove listener, no longer needed
    }, true);
})()
