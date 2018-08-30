
/**
 * Pdf Tools Web Viewer Module
 * @public
 * @module pdfwebviewer\PdfWebViewer
 */

/**
 * Loading of the scripts
 */
[
  window.PDFTOOLS_WEBVIEWER_BASEURL+'pdfwebviewer/promise-7.0.4.min.js',
  window.PDFTOOLS_WEBVIEWER_BASEURL+'pdfwebviewer/pdfwebviewer.nocache.js'
].forEach(function(src) {
  var script = document.createElement('script');
  script.src = src;
  document.head.appendChild(script);
});

// GWT promise
var gwt = new Promise(function(resolve, reject) {
    if (window.onGwtReady == undefined) {
        window.onGwtReady = resolve;
    } else {
        resolve();
    }
});
/**
 * Create a new viewer
 * @memberof module:pdfwebviewer\PdfWebViewer
 * @function
 * @param {string} viewerContainer - The name of the HTML element in which to fill the viewer
 * @returns {Promise<PdfWebViewer | string>} A promise returning the PdfWebViewer object.
 */
function PdfWebViewer_create(viewerContainer)
{
    return Promise.all([gwt]).then(function () {
        return new Promise(function(resolve, reject) { console.log("initializing");resolve(new PdfWebViewer(viewerContainer)); console.log("initialized");});
    });
}

/**
 * @constructs PdfWebViewer
 * @memberof module:pdfwebviewer\PdfWebViewer
 * @param viewerContainer - The name of the HTML element in which to fill the viewer.
 * @see {@link PdfWebViewer_create} to receive an instance as a promise.
 */
function PdfWebViewer(viewerContainer)
{
    //holder of the dispatchcallback that is hidden in the eventBus, but must be accesible from PdfWebViewer
    var callbackHolder = {};
    callbackHolder.dispatchEvent = function(event, argument) {console.log("tried to call dispatchEvent ", event, argument);};
    // eventHandler hides all internal callback functions from customer
    var viewer = this;
    var eventHandler = new function() {
        var that = this;
        this.onOpenCompleted = function(message)
        {
            if(message == undefined)
                that.openResolve();
            else
                that.openReject(message);
        };

        this.onCloseCompleted = function(message)
        {
            if(message == undefined)
                that.closeResolve();
            else
                that.closeReject(message);
        };
        this.onSaveCompleted = function(message, buffer)
        {
            if(message == undefined)
                that.saveResolve(buffer);
            else
                that.saveReject(message);
        }
        this.onSearchCompleted = function(pageIn, indexIn, mapIn)
        {
            if(that.searchReject == null)
                return;
            if(mapIn == null)
                that.searchReject("No result found");
            else
            {
                var result =
                {
                    page : pageIn,
                    index : indexIn,
                    map : mapIn
                };
                that.searchResolve(result);
            }
            that.searchReject = null;
            that.searchResolve = null;
        }
        
        this.getAnnotResolveMap =  new Map();
        this.getAnnotRejectMap =  new Map();

        this.onGetAnnotationsCompleted = function(page, annotMap)
        {
            console.log("TESTTEST calling onGetAnnotationsCompleted");
            var res = that.getAnnotResolveMap.get(page);
            var rej = that.getAnnotRejectMap.get(page);
            if(res == null || rej == null || res.length <= 0 || rej.length <= 0)
            {
                console.log("TESTTEST FAILED res=", res, " rej=", rej);
                return;
            }
            console.log("TESTTEST res=", res, " rej=", rej);
            if(annotMap != null)
            {
                res.shift()(annotMap);
            }
            else
            {
                rej.shift()("No Annotations found on page " + page);
            }
        }
        
        var vfirstPage = 0;
        var vlastPage = 0;
        this.onVisiblePageRangeChanged = function(firstPage, lastPage)
        {
            if(vfirstPage != firstPage)
            {
                vfirstPage = firstPage;
                callbackHolder.dispatchEvent("firstVisiblePage", firstPage);
            }
            if(vlastPage != lastPage)
            {
                vlastPage = lastPage;
                callbackHolder.dispatchEvent("lastVisiblePage", lastPage);
            }
        }
        this.onZoomCompleted = function(zoomFactor)
        {
            callbackHolder.dispatchEvent("zoom", zoomFactor);
        }
        this.onFitModeChanged = function(mode)
        {
            callbackHolder.dispatchEvent("fitMode", mode);
        }
        this.onPageLayoutMode = function(mode)
        {
            callbackHolder.dispatchEvent("pageLayoutMode", mode);
        }
        this.onRotationChanged = function(rotation)
        {
            callbackHolder.dispatchEvent("rotation", rotation);
        }
        this.onLicenseEvaluated = function(reason)
        {
            if(reason == "")
                that.licenseResolve();
            else
                that.licenseReject(reason);
        }

        this.onStampImageValidated = function(validated)
        {
            if (validated)
                that.addStampResolve();
            else
                that.addStampReject();
        }

        this.onBusyStateChanged = function(isBusy)
        {
            callbackHolder.dispatchEvent("busyState", isBusy)
        }

        this.onSelectedItemsChanged = function(items)
        {
            callbackHolder.dispatchEvent("selectedItems", items)
        }

        this.onError = function(errorMessage)
        {
            callbackHolder.dispatchEvent("onError", errorMessage);
        }

        this.onAnnotationCreated = function(annotation)
        {
            callbackHolder.dispatchEvent("onAnnotationCreated", annotation);
        }
    }

    /**
     * @constructs EventBus
     * @memberof module:pdfwebviewer\PdfWebViewer
     */
    var eventBusConstructor = function(callbackHolder) 
    {
        var callbackHolder = callbackHolder
        var listeners = new Map();
        
        /**
         * Add a new listener to a events
         * @param {string} eventName - The name of the event to listen to.
         * @param {callback} callback - The callback listener that will listen to the event.
         */
        this.addEventListener = function(eventName, callback)
        {
            if (listeners.has(eventName)) {
                listeners.get(eventName).push(callback);
            } else {
                var array = [callback];
                listeners.set(eventName, array);
            }
        }
        
        /**
         * Remove a listener from a event
         * @param {string} eventName - The name of the event that the listener listens to.
         * @param {callback} callback - The callback that should be removed from the listener.
         */
        this.removeEventListener = function(eventName, callback)
        {
            if(listeners.has(eventName))
            {
                var eventListeners = listeners.get(eventName);
                eventListeners = eventListeners.filter(callbackInArray => callbackInArray != callback);
                if (eventListeners.size != 0) {
                    listeners.set(eventName, eventListeners);
                }
                else
                {
                    listeners.delete(eventName);
                }
            }
        }
        
        /**
         * Callbacks for eventhandler 
         */
        callbackHolder.dispatchEvent = function(eventName, args)
        {
            if(listeners.has(eventName))
            {
                var eventListeners = listeners.get(eventName);
                console.log("dispatching ", eventName, args);
                for (var i = 0; i < eventListeners.length; i++) { 
                    eventListeners[i](args);
                }
            }
        }
        
        return this;
    }
    
    /**
     * @property {EventBus} eventbus - The bus dispatching all events regarding the viewer
     */
    this.eventBus = new eventBusConstructor(callbackHolder);
    
    /**
     * @event firstVisiblePage
     * @param {number} pageNo - The pagenumber of the first visible page in the viewport.
     */
    /**
     * @event lastVisiblePage
     * @param {number} pageNo - The pagenumber of the last visible page in the viewport.
     */
    /**
     * @event rotation
     * @param {number} rotation - The rotation in degrees that is currently being applied to all pages.
     */
    /**
     * @event zoom
     * @param {number} zoomFactor - The new zoomFactor as a fraction of the original size of the Document.
     */
    /**
     * @event fitMode
     * @param {number} fitMode - The fitMode that is currently used to fit the viewport to pages. Possible values are given in {@link PdfWebViewer.PdfFitMode}.
     */
    /**
     * @event pageLayoutMode
     * @param {number} pageLayoutMode - The pageLayoutMode that is currently used arrange pages. Possible values are given in {@link PdfWebViewer.PdfPageLayoutMode}.
     */
    /**
     * @event busyState
     * @param {boolean} busyState - When the viewer is busy rendering pages the event fires true. As soon as the viewer has finished rendering it fires false {@link PdfWebViewer.PdfPageLayoutMode}.
     */
    /**
     * @event selectedItems
     * @param {items} selectedItems - List of the selected items on the viewport.
     */
    /**
     * @event onError
     * @param {errorMessage} errorMessage - Something went wrong, please check the error message for more information
     */


    var instance = new PdfTools.PdfWebViewerAPI(eventHandler, viewerContainer);
    
    
    /**
     * Open a new PDF file.
     * Automatically closes the currently opened file.
     * @param {Uint8Array} buffer - A buffer holding the pdf in memory.
     * @param {string} [password] - The password needed to decrypt the pdf.
     * @returns {Promise<void | string>} A promise returning void if resolved or returning an error message if rejected.
     */
    this.open = function(buffer, password)
    {
        checkType(buffer, "object", "open");
        checkType(password, "string", "open");
        
        return new Promise(function(resolve, reject)
        {
            eventHandler.openResolve = resolve;
            eventHandler.openReject = reject;
            instance.open(buffer, password);
        });
    };

    /** 
     * Open an PDF file with a FDF file.
     * Associate a PDF file with an FDF file to open a merged
     * file of both where the annotations defined in the FDF file
     * are now contained in the PDF file.
     * Automatically closes the currently opened file.
     * @param {Uint8Array} pdfBuffer - A buffer holding the pdf in memory.
     * @param {Uint8Array} fdfBuffer - A buffer holding the fdf in memory.
     * @returns {Promise<void | string>} A promise returning void if resolved or returning an error message if rejected.
     */
    this.openFDF = function(pdfBuffer, fdfBuffer, password)
    {
        checkType(pdfBuffer, "object", "openFDF");
        checkType(fdfBuffer, "object", "openFDF");
        checkType(password, "string", "openFDF");
        
        return new Promise(function(resolve, reject)
        {
            eventHandler.openResolve = resolve;
            eventHandler.openReject = reject;
            instance.openFDF(pdfBuffer, fdfBuffer, password);
        });
    };

    /**
     * Open a pdf file with a blob.
     * Automatically closes the currently opened file
     * @param {Blob} blob - Blob of the file
     * @param {string} [password] - The password needed to decrypt the pdf.
     * @returns {Promise<void | string>} A promise returning void if resolved or returning an error message if rejected.
     */
    this.openBlob = function(blob, password)
    {
        checkType(blob, "object", "openBlob");
        checkType(password, "string", "openBlob");

        return new Promise(function(resolve, reject)
        {
            eventHandler.openResolve = resolve;
            eventHandler.openReject = reject;
            instance.openBlob(blob, password);
        });
    }
    
    
    /**
     * closes currently opened PDF file
     * @returns {Promise<void | string>} A promise returning nothing if resolved and a error message if rejected.
     */
    this.close = function()
    { 
        return new Promise(function(resolve, reject)
        {
            eventHandler.closeResolve = resolve;
            eventHandler.closeReject = reject;
            instance.close();
        });
    };
    
    /**
     * @param {boolean} show - Whether annotations are shown or not.
     */
    this.showAnnotations = function(show)
    {
        checkType(show, "boolean", "showAnnotations");
        instance.showAnnotations(show);
    }

    /**
     * @param {boolean} show - Show or hide the thumbnail view
     */
    this.showThumbnails = function(show)
    {
        checkType(show, "boolean", "showThumbnails");
        instance.showThumbnails(show);
    }

    /**
     * Save File to
     * @returns {Promise<Uint8Array | string>} A promise returning a memory buffer containing the saved file if resolved or a error message if rejected. 
     */
    this.saveFile = function(asFdf)
    {
        checkType(asFdf, "boolean", "saveFile");
        return new Promise(function(resolve, reject)
        {
            eventHandler.saveResolve = resolve;
            eventHandler.saveReject = reject;
            instance.saveFile(asFdf);
        });
    };
    
    /**
     * @returns {number} pageCount - The number of pages the currently opened file has in total.
     */
    this.getPageCount = function()
    {
        return instance.getPageCount();
    }
    
    /**
     * @returns {number} pageNo - The topmost page shown in the viewport at this moment.
     */
    this.getPageNo = function()
    {
        return instance.getPageNo();
    }
    
    /**
     * @param {number} pageNo - The page that the viewport should show.
     */
    this.setPageNo = function(value)
    {
        checkType(value, "number", "setPageNo");
        instance.setPageNo(value);
    }
    
    /**
     * @returns {number} rotation - The currently used additional rotation of all pages.
     */
    this.getRotation = function()
    {
        return instance.getRotation();
    }

    /**
     * @param {number} rotation - Set a rotation which is applied on all pages (cumulative with the natural rotation embedded in the pdf).
     */
    this.setRotation = function(value)
    {
        checkType(value, "number", "setRotation");
        instance.setRotation(value);
    }
    
    /**
     * @returns {number} zoom - Get additional applied zoom.
     */
    this.getZoom = function()
    {
        return instance.getZoom();
    }
    
    /**
     * @param {number} zoom - Set an additional zoomfactor as a percentage of its original size.
     */
    this.setZoom = function(value)
    {
        checkType(value, "number", "setZoom");
        instance.setZoom(value);
    }
    
    /**
     * @returns {boolean} isOpen - Whether a file is opened by the viewer. A file counts as open as soon as opening it has completed successfully until closing it has started.
     */
    this.isOpen = function()
    {
        return instance.getIsOpen();
    }
    
    /**
     * @param {PdfPageLayoutMode}  mode - The Mode that should be used to arrange the pages on the canvas.
     */
    this.setPageLayoutMode = function(mode) { instance.setPageLayoutMode(mode);};
    
    /**
     * @returns {PdfPageLayoutMode} The mode that is currently used for arranging pages on the canvas.
     */
    this.getPageLayoutMode = function() {return instance.getPageLayoutMode();};
    
    
    /**
     * @param {PdfFitMode} mode - The Mode that should be used for fitting the viewport to the visible pages.
     */
    this.setFitMode = function(mode) {instance.setFitMode(mode);};
    
    /**
     * @returns {PdfFitMode} The Mode that is currently used for fitting the viewport to the visible pages.
     */
    this.getFitMode = function() {return instance.getFitMode();};
    
    /**
     * @param {number} borderSize - The Size of the border in between pages in pixels at 100% zoom.
     */
    this.setBorderSize = function(borderSize) { instance.setBorderSize(borderSize);};

    /** 
     * @returns {number} The Size of the border in between pages in pixels at 100% zoom.
     */
    this.getBorderSize = function() { return instance.getBorderSize();};

    this.setMouseMode = function(mode) { instance.setMouseMode(mode); };

    /**
     * Setting the default properties for annotations. Properties that can be set are:
     * color : color of the annotation
     * originalAuthor : author of the annotation
     * borderWidth : line thickness of the annotation (if applicable)
     * richText : richtext of the annotation (only for freetext)
     * fontColor : font color of the annotation (only for freetext)
     * content : content of the annotation
     *
     * Example parameter:
     * annotationDefaults = { color : "#ff00ff", borderWidth : 2.0 }
     */
    this.setAnnotationDefaults = function(annotationDefaults) { instance.setAnnotationDefaults(annotationDefaults); }
    
    /**
     * Suspend drawing for all actions until {@link PdfWebViewer#resumeDrawing|resumeDrawing} is called.
     */
    this.suspendDrawing = function() { instance.suspendDrawing();};
    
    /**
     * Resume drawing if currently suspended by {@link PdfWebViewer#suspendDrawing|suspendDrawing}.
     * Note that previously given commands that have not yet been executed will still not trigger separate render updates.
     * However once all commands before the resumeDrawing call have been executed a single render update will be made. 
     */
    this.resumeDrawing = function() { instance.resumeDrawing();};
    

    /**
     * Change the rendering mode. Enabling fast rendering reduces the rendering quality but yields faster
     * rendering. Disabling fast rendering increases rendering quality at the cost of rendering speed.
     * @param {number} mode:   -1: default behaviour. Enables optimisations for IE11
                            0: fast rendering disabled. NOT recommended for IE11
                            1: enable fast rendering (at the cost of rendering quality)
     */
    this.setRenderingMode = function(mode) 
    { 
        checkType(mode, "number", "setRenderingMode");
        instance.setRenderingMode(mode);
    }

    /**
     * Set whether when opening a new PDF file the in the file embedded preferences for the startup viewport are ignored ( First shown page, fitmode etc.).
     * @param {boolean} ignore - whether the embedded preferences get ignored
     */
    this.setIgnoringPreferences = function(ignore) {instance.setIgnoringPreferences(ignore);};
    
    /**
     * Get whether embedded preferences in the pdf file are ignored when opening a new file or not.
     * @returns {boolean} whether embedded preferences get ignored
     */
    this.getIgnoringPreferences = function() {instance.getIgnoringPreferences();};
    
    /**
     * @returns {string} the product version of the 3-Heights(TM) PDF Web Viewer
     */
    this.getProductVersion = function() {
        return instance.getProductVersion();
    }

    /**
     * @param {int} id - get the item with id.
     * @returns {object} the item (e.g. annotations). Please check the manual for more information about items and their fields.
     */
    this.getItem = function (id) {
        return instance.getItem(id);
    }

    /**
     * @returns {Array<object>} a list of selected items (e.g. annotations) on the viewport. Please check the manual for more information about items and their fields.
     */
    this.getSelectedItem = function() {
        return instance.getSelectedItem();
    }

    /**
     * Select an item (e.g. an annotation) on the viewport. Currently selected items will be deselected.
     * @param {object} item - The item to be selected.
     */
    this.setSelectedItem = function(item) {
        return instance.setSelectedItem(item);
    }

    /**
     * Update the editable fields of an item (e.g. an annotation). Please check the manual for more information about items and their fields.
     * @param {object} item - The item to be updated.
     */
    this.updateItem = function(item) {
        return instance.updateItem(item);
    }

    /**
     * Delete an item (e.g. an annotation). Please check the manual for more information about items.
     * @param {object} item - The item to be deleted.
     */
    this.deleteItem = function (item) {
        return instance.deleteItem(item);
    }
    
    /**
     * @param {string} [name] - Name that shows up in the context menu
     * @param {Uint8Array} [image] - Image of the desired stamp, has to be unique. If two stamps with the same name are added,
     *                               the latter will overwrite the previous one.
     * @param {boolean} [addToContextMenu] - Set to true if you want the stamp to show up in the context menu
     */
    this.addImageStampTemplate = function(name, image, addToContextMenu) 
    {
        return new Promise(function(resolve, reject)
        {
            eventHandler.addStampResolve = resolve;
            eventHandler.addStampReject = reject;
            instance.addImageStampTemplate(name, image, addToContextMenu);
        });
    };

    /**
     * Used to check if there are unsaved changes in the document. If the promise returns a resolve, the document
     * is considered as saved even if the array buffer with the saved document is discarded. If the saving
     * failed, the document is considered to contain unchanged saves.
     *
     **/
    this.hasChanges = function()
    {
        return instance.hasChanges();
    }
    
    /**
     * @typedef {Object} Rectangle
     * @property {number} x - x coordinate of the top left corner
     * @property {number} y - y coordinate of the top left corner
     * @property {number} w - width of the rectangle
     * @property {number} h - height of the rectangle
     */
    
    /**
     * @typedef {Object} SearchResult - a Object hold all parameters of the result of a search.
     * @property {number} page - the page that the searchResult was found on (If result spans multiple pages, the first page is returned).
     * @property {number} index - the index in the found page where the searchResult has been found.
     * @property {Map<number, Array<Rectangle>>} rectangles - a map which maps each pagenumber that results were found on to a list of {@link Rectangle}s where part of the searchResult resides.   
     */
    
    /**
     * @param {string} toSearch - String that should be searched for
     * @param {number} startPage - Page on which search is started
     * @param {number} startIndex - Index within page at which search is started
     * @returns {Promise<SearchResult| string>} A promise returning a {@link SearchResult} if resolved or returning an error message if rejected.
     * @see {@link configureSearcher} to configure how the given string toSearch is interpreted.
     */
    this.search = function(toSearch, startPage, startIndex) 
    {
        return new Promise(function(resolve, reject)
        {
            if(eventHandler.searchReject != null)
                eventHandler.searchReject("Search aborted due to new search request");
            eventHandler.searchResolve = resolve;
            eventHandler.searchReject = reject;
            checkType(toSearch, "string", "search");
            checkType(startPage, "number", "search");
            checkType(startIndex, "number", "search");
            instance.search(toSearch, startPage, startIndex);
        });
    };
    
    /**
     * 
     * @param {boolean} matchCase - Configure whether search should consider casing when searching.
     * @param {boolean} wrap - Configure whether search should wrap around when searching.
     * @param {boolean} previous - Configure whether search should search in content backwards (default, false) or forwards (true) when searching.
     * @param {boolean} useRegex - Configure whether search should interpret provided string as regular expression when searching.
     */
    this.configureSearcher = function(matchCase, wrap, previous, useRegex)
    {
        instance.configureSearcher(matchCase, wrap, previous, useRegex);
    };
    
    /**
     * @param {boolean} enable - Enable or disable showing scrollbars.
     * Unimplemented
     */
    this.enableScrollbars = function(enable)
    {
        instance.enableScrollbars(enable);
    }
    
    this.setLicenseKey = function(license)
    {
        checkType(license, "string", "setLicenseKey");
        
        return new Promise(function(resolve, reject)
        {
            eventHandler.licenseResolve = resolve;
            eventHandler.licenseReject = reject;
            instance.setLicense(license);
        });
    }
    
    //TODO maybe directly use element instead of name?
    this.setThumbnailContainer = function(thumbnailContainerName)
    {
        instance.setThumbnailContainer(thumbnailContainerName);
    }

    /**
     * Select the input mode of the viewer. Available modes are listed under {@link InputMode}. The options are used for stamps to describe which stamp
     * should be used. It can be either one of the image stamps that have been set with set with addImageStampTemplate or it could be one of the default stamps.
     *
     * Default stamps:
     *       "SBApproved"
     *       "SBNotApproved"
     *       "SBDraft"
     *       "SBFinal"
     *       "SBCompleted"
     *       "SBConfidential"
     *       "SBForPublicRelease"
     *       "SBNotForPublicRelease"
     *       "SBForComment"
     *       "SBVoid"
     *       "SBPreliminaryResults"
     *       "SBInformationOnly"
     *
     * The stamp text will respect the locale if available, otherwise defaulting to english.
     */
    this.setInputMode = function(mode, option)
    {
        checkType(mode, "number", "setInputMode");
        instance.setInputMode(mode, option);
    }

    /**
     * Disable/Enable the context menu
     * @param {boolean} disable - pass true if context menu should be disabled. set false to enable it
     */
    this.disableContextMenu = function(disable)
    {
        checkType(disable, "boolean", "disableContextMenu")
        instance.disableContextMenu(disable);
    }
    
    /**
     * Check if context menu is enabled or disabled
     * @returns {boolean} true if the context menu is disabled, false otherwise.
     */
    this.isContextMenuDisabled = function()
    {
        return instance.isContextMenuDisabled();
    }

    /**
     * @typedef {Object} AnnotDefaultsObject
     * @property {Annotation} annotation - the annotation that is to be created filled with default attributes
     */
        
    /**
     * @typedef {Object} AnnotCreateAllowedObject
     * @property {String} annotType - type of annotation the user wants to create
     * @property {number} page - the page the annotation will be created on
     */

    /**
     * @typedef {Object} AnnotEditAllowedObject
     * @property {Annotation} annotation - the annotation on which the user asks for permission to edit
     */
    /**
     * @typedef {Object} AnnotEditFieldAllowedObject
     * @property {Annotation} annotation - the annotation on which the user asks for permission to edit a field
     * @property {String} field - the field that the user wants to edit //TODO list known fields
     */
        
    /**
     * @typedef {Object} Annotation
     * @property {PdfItemType} itemType - The type of the annotation
     * @property {Date} lastModified - The most recent date that this annotation was modified (unimplemented)
     * @property {number} page - the page that this annotation is on
     * @property {String} color - color of annotation given as hex
     * @property {String} originalAuthor - the author that created this annotation originally
     * @property {Object} rect - bounding rectangle of the annotation
     *                           rect.x: x coordinate on the viewport
     *                           rect.y: y position on the viewport
     *                           rect.w: width of the rectangle
     *                           rect.h: height of the rectangle
     * @property {Object} popup: Popup annotation that is associated with the annotation.
     *                           popup.isOpen: Set to true or false to open/close popup (via updateItem)
     *                                
     */
        
    /*********
     * enums *
     *********/

    this.InputMode = 
    {
        DEFAULT :         PdfTools.PdfWebViewerAPI.InputMode.DEFAULT(), 
        TOUCH_SELECT:     PdfTools.PdfWebViewerAPI.InputMode.TOUCH_SELECT(), 
        PLACE_STICKY:     PdfTools.PdfWebViewerAPI.InputMode.PLACE_STICKY(), 
        CREATE_HIGHLIGHT: PdfTools.PdfWebViewerAPI.InputMode.CREATE_HIGHLIGHT(), 
        CREATE_UNDERLINE: PdfTools.PdfWebViewerAPI.InputMode.CREATE_UNDERLINE(), 
        CREATE_SQUIGGLY:  PdfTools.PdfWebViewerAPI.InputMode.CREATE_SQUIGGLY(),   
        CREATE_STRIKE_OUT: PdfTools.PdfWebViewerAPI.InputMode.CREATE_STRIKE_OUT(), 
        PLACE_FREE_TEXT:  PdfTools.PdfWebViewerAPI.InputMode.PLACE_FREE_TEXT(),
        START_INK:        PdfTools.PdfWebViewerAPI.InputMode.START_INK(),
        FINISH_INK:       PdfTools.PdfWebViewerAPI.InputMode.FINISH_INK(),
        PLACE_STAMP:      PdfTools.PdfWebViewerAPI.InputMode.PLACE_STAMP()
    };
        
    /**
     * PdfPageLayoutMode - a type holding all possible PageLayoutModes
     * @type {PdfPageLayoutModeType} 
     * @property {number} PdfPageLayoutMode.None - Default
     * @property {number} PdfPageLayoutMode.OneColumn - Display pages in one continuous column
     * @property {number} PdfPageLayoutMode.SinglePage - Display only a single page at a time
     * @property {number} PdfPageLayoutMode.TwoColumnLeft - Display two columns of pages, with the first page on the left
     * @property {number} PdfPageLayoutMode.TwoColumnRight - Display two columns of pages, with the first page on the right
     * @property {number} PdfPageLayoutMode.TwoPageLeft - Display two pages next to each other, with the first page on the left
     * @property {number} PdfPageLayoutMode.TwoPageRight - Display two pages next to each other, with the first page on the right
     */
    this.PdfPageLayoutMode = 
    {
        None :           PdfTools.PdfWebViewerAPI.PdfPageLayoutMode.None(),
        OneColumn :      PdfTools.PdfWebViewerAPI.PdfPageLayoutMode.OneColumn(),
        SinglePage :     PdfTools.PdfWebViewerAPI.PdfPageLayoutMode.SinglePage(),
        TwoColumnLeft :  PdfTools.PdfWebViewerAPI.PdfPageLayoutMode.TwoColumnLeft(),
        TwoColumnRight : PdfTools.PdfWebViewerAPI.PdfPageLayoutMode.TwoColumnRight(),
        TwoPageLeft :    PdfTools.PdfWebViewerAPI.PdfPageLayoutMode.TwoPageLeft(),
        TwoPageRight :   PdfTools.PdfWebViewerAPI.PdfPageLayoutMode.TwoPageRight()
    };
        
    /**
        * PdfFitMode - a type holding all possible FitModes
        * @type {object}
        * @property {number} PdfFitMode.ActualSize - Show actual size of pages
        * @property {number} PdfFitMode.FitWidth - Resize pages to fit page width to viewer width
        * @property {number} PdfFitMode.FitPage - Resize pages to fit an entire page in viewer
        */
    this.PdfFitMode = 
    {
        ActualSize : PdfTools.PdfWebViewerAPI.PdfFitMode.ActualSize(),
        FitWidth :   PdfTools.PdfWebViewerAPI.PdfFitMode.FitWidth(),
        FitPage :    PdfTools.PdfWebViewerAPI.PdfFitMode.FitPage()
    }
        
    /**
     * PdfItemType - A type holding all possible types of Annotations that can be created
     * @type {object}
     * @property {number} PdfItemType.UNKNOWN
     * @property {number} PdfItemType.TEXT
     * @property {number} PdfItemType.LINK
     * @property {number} PdfItemType.FREE_TEXT
     * @property {number} PdfItemType.LINE
     * @property {number} PdfItemType.SQUARE
     * @property {number} PdfItemType.CIRCLE
     * @property {number} PdfItemType.POLYGON
     * @property {number} PdfItemType.POLY_LINE
     * @property {number} PdfItemType.HIGHLIGHT
     * @property {number} PdfItemType.UNDERLINE
     * @property {number} PdfItemType.SQUIGGLY
     * @property {number} PdfItemType.STRIKE_OUT
     * @property {number} PdfItemType.STAMP
     * @property {number} PdfItemType.CARET
     * @property {number} PdfItemType.INK
     * @property {number} PdfItemType.POPUP
     * @property {number} PdfItemType.FILE_ATTACHMENT
     * @property {number} PdfItemType.SOUND
     * @property {number} PdfItemType.MOVIE
     * @property {number} PdfItemType.WIDGET
     * @property {number} PdfItemType.SCREEN
     * @property {number} PdfItemType.PRINTER_MARK
     * @property {number} PdfItemType.TRAP_NET
     * @property {number} PdfItemType.WATERMARK
     * @property {number} PdfItemType.THREED
     * @property {number} PdfItemType.SELECTED_TEXT
     */
    this.PdfItemType = 
    {
        /*    Annotation types                                                           */
        UNKNOWN                      : PdfTools.PdfWebViewerAPI.PdfItemType.UNKNOWN(),
        TEXT                         : PdfTools.PdfWebViewerAPI.PdfItemType.TEXT(),
        LINK                         : PdfTools.PdfWebViewerAPI.PdfItemType.LINK(),
        FREE_TEXT                    : PdfTools.PdfWebViewerAPI.PdfItemType.FREE_TEXT(),
        LINE                         : PdfTools.PdfWebViewerAPI.PdfItemType.LINE(),
        SQUARE                       : PdfTools.PdfWebViewerAPI.PdfItemType.SQUARE(),
        CIRCLE                       : PdfTools.PdfWebViewerAPI.PdfItemType.CIRCLE(),
        POLYGON                      : PdfTools.PdfWebViewerAPI.PdfItemType.POLYGON(),
        POLY_LINE                    : PdfTools.PdfWebViewerAPI.PdfItemType.POLY_LINE(),
        HIGHLIGHT                    : PdfTools.PdfWebViewerAPI.PdfItemType.HIGHLIGHT(),
        UNDERLINE                    : PdfTools.PdfWebViewerAPI.PdfItemType.UNDERLINE(),
        SQUIGGLY                     : PdfTools.PdfWebViewerAPI.PdfItemType.SQUIGGLY(),
        STRIKE_OUT                   : PdfTools.PdfWebViewerAPI.PdfItemType.STRIKE_OUT(),
        STAMP                        : PdfTools.PdfWebViewerAPI.PdfItemType.STAMP(),
        CARET                        : PdfTools.PdfWebViewerAPI.PdfItemType.CARET(),
        INK                          : PdfTools.PdfWebViewerAPI.PdfItemType.INK(),
        POPUP                        : PdfTools.PdfWebViewerAPI.PdfItemType.POPUP(),
        FILE_ATTACHMENT              : PdfTools.PdfWebViewerAPI.PdfItemType.FILE_ATTACHMENT(),
        SOUND                        : PdfTools.PdfWebViewerAPI.PdfItemType.SOUND(),
        MOVIE                        : PdfTools.PdfWebViewerAPI.PdfItemType.MOVIE(),
        WIDGET                       : PdfTools.PdfWebViewerAPI.PdfItemType.WIDGET(),
        SCREEN                       : PdfTools.PdfWebViewerAPI.PdfItemType.SCREEN(),
        PRINTER_MARK                 : PdfTools.PdfWebViewerAPI.PdfItemType.PRINTER_MARK(),
        TRAP_NET                     : PdfTools.PdfWebViewerAPI.PdfItemType.TRAP_NET(),
        WATERMARK                    : PdfTools.PdfWebViewerAPI.PdfItemType.WATERMARK(),
        THREED                       : PdfTools.PdfWebViewerAPI.PdfItemType.THREED(),
        /*      Other types                                                 */
        SELECTED_TEXT                : PdfTools.PdfWebViewerAPI.PdfItemType.SELECTED_TEXT()
    }

    this.PdfAnnotationFieldType = 
    {
        CONTENT: PdfTools.PdfWebViewerAPI.PdfAnnotField.CONTENT()
    }

    /**
     * Helper methods
     **/
    var checkType = function(object, typeName, methodName)
    {
        if(object == null || typeof (object) === typeName) {
            return;
        } else {
            throw new TypeError("Method " + methodName + "requires argument of type '" + typeName + "' but is '" + typeof (object) + "'");
        }
    }

    return this;
}