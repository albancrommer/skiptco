
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Restartless.
 *
 * The Initial Developer of the Original Code is The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Edward Lee <edilee@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;



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


/**
 * Apply a callback to each open and new browser windows.
 *
 * @usage watchWindows(callback): Apply a callback to each browser window.
 * @param [function] callback: 1-parameter function that gets a browser window.
 */
function watchWindows(callback) {
  // Wrap the callback in a function that ignores failures
  function watcher(window) {
    try {
      // Now that the window has loaded, only handle browser windows
      let {documentElement} = window.document;
      if (documentElement.getAttribute("windowtype") == "navigator:browser")
        callback(window);
    }
    catch(ex) {}
  }

  // Wait for the window to finish loading before running the callback
  function runOnLoad(window) {
    // Listen for one load event before checking the window type
    window.addEventListener("load", function runOnce() {
      window.removeEventListener("load", runOnce, false);
      watcher(window);
    }, false);
  }

  // Add functionality to existing windows
  let windows = Services.wm.getEnumerator(null);
  while (windows.hasMoreElements()) {
    // Only run the watcher immediately if the window is completely loaded
    let window = windows.getNext();
    if (window.document.readyState == "complete")
      watcher(window);
    // Wait for the window to load before continuing
    else
      runOnLoad(window);
  }

  // Watch for new browser windows opening then wait for it to load
  function windowWatcher(subject, topic) {
    if (topic == "domwindowopened")
      runOnLoad(subject);
  }
  Services.ww.registerNotification(windowWatcher);

  // Make sure to stop watching for windows if we're unloading
  unload(function() Services.ww.unregisterNotification(windowWatcher));
}

/**
 * Save callbacks to run when unloading. Optionally scope the callback to a
 * container, e.g., window. Provide a way to run all the callbacks.
 *
 * @usage unload(): Run all callbacks and release them.
 *
 * @usage unload(callback): Add a callback to run on unload.
 * @param [function] callback: 0-parameter function to call on unload.
 * @return [function]: A 0-parameter function that undoes adding the callback.
 *
 * @usage unload(callback, container) Add a scoped callback to run on unload.
 * @param [function] callback: 0-parameter function to call on unload.
 * @param [node] container: Remove the callback when this container unloads.
 * @return [function]: A 0-parameter function that undoes adding the callback.
 */
function unload(callback, container) {
  // Initialize the array of unloaders on the first usage
  let unloaders = unload.unloaders;
  if (unloaders == null)
    unloaders = unload.unloaders = [];

  // Calling with no arguments runs all the unloader callbacks
  if (callback == null) {
    unloaders.slice().forEach(function(unloader) unloader());
    unloaders.length = 0;
    return;
  }

  // The callback is bound to the lifetime of the container if we have one
  if (container != null) {
    // Remove the unloader when the container unloads
    container.addEventListener("unload", removeUnloader, false);

    // Wrap the callback to additionally remove the unload listener
    let origCallback = callback;
    callback = function() {
      container.removeEventListener("unload", removeUnloader, false);
      origCallback();
    }
  }

  // Wrap the callback in a function that ignores failures
  function unloader() {
    try {
      callback();
    }
    catch(ex) {}
  }
  unloaders.push(unloader);

  // Provide a way to remove the unloader
  function removeUnloader() {
    let index = unloaders.indexOf(unloader);
    if (index != -1)
      unloaders.splice(index, 1);
  }
  return removeUnloader;
}

/**
 * Shift the window's main browser content down and right a bit
 */
function shiftBrowser(window) {
    
console.log(skiptco)
//  let style = window.gBrowser.style;
//
//  // Save the original margin values to restore them later
//  let origTop = style.marginTop;
//  let origLeft = style.marginLeft;
//
//  // Push the main browser down and right
//  style.marginTop = style.marginLeft = "50px";
//
//  // Restore the original position when the add-on is unloaded
//  unload(function() {
//    style.marginTop = origTop;
//    style.marginLeft = origLeft;
//  }, window);
}

/**
 * Handle the add-on being activated on install/enable
 */
function startup(data, reason) {
    console("startup")
    console.log("twitterAgent",twitterAgent)

  // Shift all open and new browser windows
  watchWindows(shiftBrowser);
}

/**
 * Handle the add-on being deactivated on uninstall/disable
 */
function shutdown(data, reason) {
    console("shutdown")
  // Clean up with unloaders when we're deactivating
  if (reason != APP_SHUTDOWN)
    unload();
}

/**
 * Handle the add-on being installed
 */
function install(data, reason) {
    console("install")
    
}

/**
 * Handle the add-on being uninstalled
 */
function uninstall(data, reason) {
    console("uninstall")
    
}
