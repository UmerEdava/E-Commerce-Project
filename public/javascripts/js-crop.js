// Enable strict mode to enforce variable declaration
"use strict";
(function() {
	// A reference to the original Function.prototype.bind
	const bind = Function.prototype.bind;
	// A list that will store the event handlers attached to elements so that they can be detached properly later
	const eventHandlers = new Set();
	// Overrides Function.prototype.bind so that the new Function object returned by it
	// contains a reference to the original Function object on which it was called
	Object.defineProperty(Function.prototype, "bind", {
		"value": function() {
			const result = bind.apply(this, arguments);
			Object.defineProperty(result, "__source__", {
				"value": (this.__source__ || this)
			});
			return result;
		}
	});
	Object.defineProperties(Object.prototype, {
		// Attaches an event handler to an element
		"attachEventHandler": {
			"value": function(type, handler) {
				// Add an object whose properties are the element, the event type, and the event handler to the list of event handlers
				eventHandlers.add({
					"element": this,
					"type": type,
					"handler": handler
				});
				// Attach the event handler
				this.addEventListener(type, handler);
			}
		},
		// Detaches an event handler from an element
		"detachEventHandler": {
			"value": function(type, handler) {
				// Detach the event handler and remove the corresponding entry from the list of event handlers
				let removeHandler = function(value, index, source) {
					let eventHandler = value.handler;
					if((value.element === this) && (value.type === type) && ((eventHandler.__source__ || eventHandler) === (handler.__source__ || handler))) {
						// Detach the event handler
						this.removeEventListener(type, eventHandler);
						// Remove the object containing the element, the event type,
						// and the event handler from the list of event handlers
						eventHandlers.delete(value);
						// Exit the loop
						return true;
					}
					eventHandler = null;
				};
				// Loop through the list of event handlers until the one that should be removed is found
				Array.from(eventHandlers).some(removeHandler.bind(this));
			}
		}
	});
})();
// The singleton jsCrop factory
let jsCrop = (function() {
	return Object.freeze({
		// Returns a jsCrop instance initialised with the specified image and options
		"initialise": function(imageElement, options = {}) {
			// Get the jsCrop instance attached to the image
			let currentInstance = imageElement.jsCropInstance;
			// If there is none then create a new jsCrop instance and return it
			if(!currentInstance) {
				// The internal object that encapsulates the underlying functionality of the jsCrop instance
				let cropper = {
					// Minimum/maximum boundaries of the crop grid
					"minLeft": 0,
					"minTop": 0,
					"maxLeft": 0,
					"maxTop": 0,
					"minWidth": 20,
					"minHeight": 20,
					"maxWidth": 0,
					"maxHeight": 0,
					// The crop grid's properties when the mouse down event was triggered
					"originalWidth": 0,
					"originalHeight": 0,
					"originalLeft": 0,
					"originalTop": 0,
					// The X and Y coordinates of the mouse down event
					"originalMouseX": 0,
					"originalMouseY": 0,
					// The X and Y coordinates of the mouse move event
					"pageX": 0,
					"pageY": 0,
					// The amount the cursor has moved since the mouse was pressed
					"deltaX": 0,
					"deltaY": 0,
					// The new left and top coordinates of the crop grid
					"newLeft": 0,
					"newTop": 0,
					// The new width and height of the crop grid
					"newWidth": 0,
					"newHeight": 0,
					// The element that triggered the mouse down event
					"mouseDownElement": null,
					// Page elements
					"imageToCrop": null,
					"imageOverlay": null,
					"gridHolder": null,
					"grid": null,
					"cropResult": null,
					// The resize handles are stored in an object for easier programmatic access
					"resizers": {
						"topLeft": null,
						"topMid": null,
						"topRight": null,
						"rightMid": null,
						"botRight": null,
						"botMid": null,
						"botLeft": null,
						"leftMid": null
					},
					// References to the image overlay canvas context, the crop result canvas context,
					// the crop grid style, and the crop result canvas style
					// are kept outside the event handlers for optimal performance
					"imageOverlayContext": null,
					"cropResultContext": null,
					"gridHolderStyle": null,
					"cropResultStyle": null,
					// The left, top, right, and bottom coordinates of the source image
					"imageLeft": 0,
					"imageTop": 0,
					"imageRight": 0,
					"imageBottom": 0,
					// Crop grid boundaries
					"gridHolderLeft": 0,
					"gridHolderTop": 0,
					"gridHolderWidth": 0,
					"gridHolderHeight": 0,
					// Toggles the crop state
					"enableCropMode": function(flag) {
						if(flag) {
							// Show the image overlay
							this.imageOverlay.style.removeProperty("opacity");
							// Show the crop grid
							this.gridHolderStyle.visibility = "visible";
							this.gridHolderStyle.opacity = "1";
							// Highlight the selected area
							this.updateCropBackground();
							// Show the crop result
							this.drawCroppedImage();
						}
						else {
							// Hide the crop grid
							this.gridHolderStyle.removeProperty("opacity");
							// Hide the image overlay
							this.imageOverlay.style.opacity = "0";
						}
					},
					// Sets the output canvas
					"setOutputCanvas": function(canvasElement) {
						// Update the output canvas reference
						this.cropResult = canvasElement;
						// Update the output canvas style reference
						this.cropResultStyle = canvasElement.style;
						// Update the output canvas context reference
						this.cropResultContext = canvasElement.getContext("2d");
						// Draw the crop result on to the output canvas
						this.drawCroppedImage();
					},
					// Generates the crop result
					"drawCroppedImage": function() {
						// Get the current position and size of the grid holder
						this.gridHolderLeft = this.gridHolder.offsetLeft;
						this.gridHolderTop = this.gridHolder.offsetTop;
						this.gridHolderWidth = this.gridHolder.offsetWidth;
						this.gridHolderHeight = this.gridHolder.offsetHeight;
						// Set the width and height of the output canvas to the width and height of the
						// selected area and adjust the left, top, and bottom margins so that the position
						// of the output image will match the position of the crop grid relative to the source image
						this.cropResult.width = this.gridHolderWidth;
						this.cropResultStyle.marginLeft = `${this.gridHolderLeft}px`;
						this.cropResult.height = this.gridHolderHeight;
						this.cropResultStyle.marginTop = `${this.gridHolderTop}px`;
						this.cropResultStyle.marginBottom = `${(this.imageToCrop.offsetHeight - (this.gridHolderHeight + this.gridHolderTop))}px`;
						// Clear the output canvas
						this.cropResultContext.clearRect(0, 0, this.gridHolderWidth, this.gridHolderHeight);
						// Draw the cropped image
						this.cropResultContext.drawImage(this.imageToCrop,
							// Source X and Y coordinates are the crop grid's top and left respectively
							this.gridHolderLeft, this.gridHolderTop,
							// Source width and height are the crop grid's width and height respectively
							this.gridHolderWidth, this.gridHolderHeight,
							// The target X and Y coordinates are (0, 0) so that the output image will be
							// drawn at the top left corner of the output canvas; the target width and height
							// are the same as the source width and height respectively
							0, 0, this.gridHolderWidth, this.gridHolderHeight);
					},
					// Downloads the crop result
					"downloadCroppedImage": function() {
						// Create a new anchor element
						let anchorElement = document.createElement("a");
						// Reference to the anchor element style
						let anchorElementStyle = anchorElement.style;
						// Update the crop result
						this.drawCroppedImage();
						// Set the target URL of the anchor element to a data URI pointing to
						// the binary representation of the output image in PNG format
						anchorElement.href = this.cropResult.toDataURL("image/png").replace("image/png", "image/octet-stream");
						// Set the download file name in the format "<source-image-name>-cropped.png"
						anchorElement.download = `${this.imageToCrop.src.match(/^.*[\\\/](.+?)(\.[^.]*$|$)/)[1]}-cropped.png`;
						// Make the anchor element hidden when added to the page
						anchorElementStyle.display = "none";
						anchorElementStyle.visibility = "hidden";
						anchorElementStyle.opacity = 0;
						// Add the anchor element to the page
						document.body.appendChild(anchorElement);
						// Trigger a click on the anchor element to start the file download
						anchorElement.click();
						// Remove the anchor element from the page and remove the object references after the file download
						setTimeout(function() {
							document.body.removeChild(anchorElement);
							anchorElementStyle = null;
							anchorElement = null;
						});
					},
					// Adjusts the boundaries of the crop grid so that it may not spill outside the source image
					"fixGrid": function() {
						// Get the current position and size of the grid holder
						this.gridHolderLeft = this.gridHolder.offsetLeft;
						this.gridHolderTop = this.gridHolder.offsetTop;
						this.gridHolderWidth = this.gridHolder.offsetWidth;
						this.gridHolderHeight = this.gridHolder.offsetHeight;
						// Update the maximum width and maximum height of the grid
						// based on the current position and size of the grid holder
						this.maxWidth = (this.imageToCrop.offsetWidth - this.gridHolderLeft);
						this.maxHeight = (this.imageToCrop.offsetHeight - this.gridHolderTop);
						// If the element being dragged is one of the resizers
						if(this.mouseDownElement !== this.grid) {
							// If the width of the grid holder is more than the maximum width, set its width to the maximum width
							if(this.gridHolderWidth > this.maxWidth)
								this.gridHolderStyle.width = `${this.maxWidth}px`;
							// If the height of the grid holder is more than the maximum height, set its height to the maximum height
							if(this.gridHolderHeight > this.maxHeight)
								this.gridHolderStyle.height = `${this.maxHeight}px`;
							// If the width of the grid holder is less than the minimum width, set its width to the minimum width
							if(this.gridHolderWidth < this.minWidth)
								this.gridHolderStyle.width = `${this.minWidth}px`;
							// If the height of the grid holder is less than the minimum height, set its height to the minimum height
							if(this.gridHolderHeight < this.minHeight)
								this.gridHolderStyle.height = `${this.minHeight}px`;
						}
						// If the element being dragged is the grid
						else {
							// Update the left position of the grid holder so that so its width may not exceed the maximum width
							if(this.gridHolderWidth > this.maxWidth)
								this.gridHolderStyle.left = `${(this.gridHolder.offsetLeft - (this.gridHolderWidth - this.maxWidth))}px`;
							// Update the top position of the grid holder so that so its height may not exceed the maximum height
							if(this.gridHolderHeight > this.maxHeight)
								this.gridHolderStyle.top = `${(this.gridHolder.offsetTop - (this.gridHolderHeight - this.maxHeight))}px`;
						}
					},
					// Updates the image overlay canvas to highlight the selected area of the source image
					"updateCropBackground": function() {
						// Fill the image overlay canvas with the default fill colour (#000000)
						this.imageOverlayContext.fillRect(0, 0, this.imageOverlay.width, this.imageOverlay.height);
						// Make the area bound by the crop grid transparent
						this.imageOverlayContext.clearRect(this.gridHolder.offsetLeft, this.gridHolder.offsetTop, this.gridHolder.offsetWidth, this.gridHolder.offsetHeight);
					},
					// Sets the position and size of the crop grid
					"setCropRegion": function(left, top, width, height) {
						// If the left parameter passed is less than the minimum left, set its value to the minimum left
						if(left < this.minLeft)
							left = this.minLeft;
						// If the top parameter passed is less than the minimum top, set its value to the minimum top
						if(top < this.minTop)
							top = this.minTop;
						// Update the grid holder style
						this.gridHolderStyle.left = `${left}px`;
						this.gridHolderStyle.top = `${top}px`;
						this.gridHolderStyle.width = `${width}px`;
						this.gridHolderStyle.height = `${height}px`;
						// Prevent the crop grid from spilling
						this.fixGrid();
						// Update the highlighted area
						this.updateCropBackground();
						// Update the crop result
						this.drawCroppedImage();
					},
					// Resizes the crop grid when any of the resize handles is dragged
					"resizeGrid": function(event) {
						// Prevent the default action
						event.preventDefault();
						// Get the cursor coordinates
						this.pageX = event.pageX;
						this.pageY = event.pageY;
						// Calculate the amount the cursor has moved since the mouse was pressed
						this.deltaX = (this.pageX - this.originalMouseX);
						this.deltaY = (this.pageY - this.originalMouseY);
						// Calculate the new left and top positions of the crop grid
						this.newLeft = (this.originalLeft + this.deltaX);
						this.newTop = (this.originalTop + this.deltaY);
						// The left and top positions should not go outside the source image boundaries
						if(this.newLeft < this.minLeft) {
							this.newLeft = this.minLeft;
							if(this.mouseDownElement === this.resizers.botLeft || this.mouseDownElement === this.resizers.leftMid || this.mouseDownElement === this.resizers.topLeft)
								this.deltaX = (this.newLeft - this.originalLeft);
						}
						else if(this.newLeft > this.maxLeft)
							this.newLeft = this.maxLeft;
						if(this.newTop < this.minTop) {
							this.newTop = this.minTop;
							if(this.mouseDownElement === this.resizers.topLeft || this.mouseDownElement === this.resizers.topMid || this.mouseDownElement === this.resizers.topRight)
								this.deltaY = (this.newTop - this.originalTop);
						}
						else if(this.newTop > this.maxTop)
							this.newTop = this.maxTop;
						// Initialise the new width and height of the crop grid
						// as the same as the old width and height
						this.newWidth = this.originalWidth;
						this.newHeight = this.originalHeight;
						// Resize the crop grid based on which resize boundary is being dragged
						switch(this.mouseDownElement) {
							// Top left
							case this.resizers.topLeft:
								// Change the top and left positions according to the mouse position
								// and update the width and height so that the right and bottom edges will stay the same
								this.newWidth -= this.deltaX;
								this.newHeight -= this.deltaY;
								if(this.newWidth > this.minWidth) {
									this.gridHolderStyle.left = `${this.newLeft}px`;
									this.gridHolderStyle.width = `${this.newWidth}px`;
								}
								if(this.newHeight > this.minHeight) {
									this.gridHolderStyle.top = `${this.newTop}px`;
									this.gridHolderStyle.height = `${this.newHeight}px`;
								}
								break;
							// Top middle
							case this.resizers.topMid:
								// Change the top position according to the mouse position
								// and update the height so that the bottom edge will stay the same
								this.newHeight -= this.deltaY;
								if(this.newHeight > this.minHeight) {
									this.gridHolderStyle.top = `${this.newTop}px`;
									this.gridHolderStyle.height = `${this.newHeight}px`;
								}
								break;
							// Top right
							case this.resizers.topRight:
								// Change the width and top position according to the mouse position
								// and update the height so that the bottom edge will stay the same
								this.newWidth += this.deltaX;
								this.newHeight -= this.deltaY;
								if(this.newWidth > this.minWidth)
									this.gridHolderStyle.width = `${this.newWidth}px`;
								if(this.newHeight > this.minHeight) {
									this.gridHolderStyle.top = `${this.newTop}px`;
									this.gridHolderStyle.height = `${this.newHeight}px`;
								}
								break;
							// Right middle
							case this.resizers.rightMid:
								// Change the width according to the mouse position
								this.newWidth += this.deltaX;
								if(this.newWidth > this.minWidth)
									this.gridHolderStyle.width = `${this.newWidth}px`;
								break;
							// Bottom right
							case this.resizers.botRight:
								// Change the width and height according to the mouse position
								this.newWidth += this.deltaX;
								this.newHeight += this.deltaY;
								if(this.newWidth > this.minWidth)
									this.gridHolderStyle.width = `${this.newWidth}px`;
								if(this.newHeight > this.minHeight)
									this.gridHolderStyle.height = `${this.newHeight}px`;
								break;
							// Bottom middle
							case this.resizers.botMid:
								// Change the height according to the mouse position
								this.newHeight += this.deltaY;
								if(this.newHeight > this.minHeight)
									this.gridHolderStyle.height = `${this.newHeight}px`;
								break;
							// Bottom left
							case this.resizers.botLeft:
								// Change the height and left position according to the mouse position
								// and update the width so that the right edge will stay the same
								this.newWidth -= this.deltaX;
								this.newHeight += this.deltaY;
								if(this.newWidth > this.minWidth) {
									this.gridHolderStyle.left = `${this.newLeft}px`;
									this.gridHolderStyle.width = `${this.newWidth}px`;
								}
								if(this.newHeight > this.minHeight)
									this.gridHolderStyle.height = `${this.newHeight}px`;
								break;
							// Left middle
							case this.resizers.leftMid:
								// Change the left position according to the mouse position
								// and update the width so that the right edge will stay the same
								this.newWidth -= this.deltaX;
								if(this.newWidth > this.minWidth) {
									this.gridHolderStyle.left = `${this.newLeft}px`;
									this.gridHolderStyle.width = `${this.newWidth}px`;
								}
								break;
							// Crop grid
							case this.grid:
								// Change the left and top positions according to the mouse position
								if((this.newLeft < this.gridHolder.offsetLeft) || (this.gridHolder.offsetWidth < this.maxWidth))
									this.gridHolderStyle.left = `${this.newLeft}px`;
								if((this.newTop < this.gridHolder.offsetTop) || (this.gridHolder.offsetHeight < this.maxHeight))
									this.gridHolderStyle.top = `${this.newTop}px`;
								// If the crop grid hits the left/top/right/bottom boundaries, update
								// the original mouse position and the original left position, so that
								// when the user moves the cursor back, the crop grid won't remain locked
								// until the cursor reaches the position where the mouse was pressed
								if((this.pageX >= this.imageLeft) && (this.pageX <= this.imageRight)) {
									if((this.gridHolder.offsetLeft === this.minLeft) || (this.gridHolder.offsetWidth === this.maxWidth)) {
										this.originalMouseX += this.deltaX;
										this.originalLeft = this.gridHolder.offsetLeft;
									}
								}
								if((this.pageY >= this.imageTop) && (this.pageY <= this.imageBottom)) {
									if((this.gridHolder.offsetTop === this.minTop) || (this.gridHolder.offsetHeight === this.maxHeight)) {
										this.originalMouseY += this.deltaY;
										this.originalTop = this.gridHolder.offsetTop;
									}
								}
								break;
							default:
								break;
						}
						// Prevent the crop grid from spilling
						this.fixGrid();
						// Update the highlighted area
						this.updateCropBackground();
						// Update the crop result
						this.drawCroppedImage();
					},
					// Stops resizing the crop grid when the mouse is released
					"stopResizingGrid": function(event) {
						// Prevent the default action
						event.preventDefault();
						// Stop listening to the mouse up and mouse move event handlers
						// because they are no longer needed once the mouse is released
						document.detachEventHandler("mouseup", this.stopResizingGrid.bind(this));
						document.detachEventHandler("mousemove", this.resizeGrid.bind(this));
						// No mouse down trigger
						this.mouseDownElement = null;
					},
					// Starts resizing the crop grid when the mouse is pressed
					"startResizingGrid": function(event) {
						// Prevent the default action
						event.preventDefault();
						// The crop grid's initial properties
						this.originalWidth = this.gridHolder.offsetWidth;
						this.originalHeight = this.gridHolder.offsetHeight;
						this.originalLeft = this.gridHolder.offsetLeft;
						this.originalTop = this.gridHolder.offsetTop;
						// The X and Y coordinates of the cursor relative to the page
						this.originalMouseX = event.pageX;
						this.originalMouseY = event.pageY;
						// The element that triggered the mouse down event
						this.mouseDownElement = event.currentTarget;
						// Start listening to the mouse move and mouse up events
						// when the mouse is pressed on a resizer element
						document.attachEventHandler("mousemove", this.resizeGrid.bind(this));
						document.attachEventHandler("mouseup", this.stopResizingGrid.bind(this));
					},
					// Hides the crop grid when it is made transparent so that it may no longer respond to events
					"hideGrid": function() {
						if(!this.gridHolderStyle.opacity)
							this.gridHolderStyle.removeProperty("visibility");
					},
					// Restores the page to its former state and release the resources
					"destroy": function() {
						try {
							// The parent element of the source image
							let imageHolder = this.imageToCrop.parentElement;
							// Detach the jsCrop instance from the source image
							delete this.imageToCrop.jsCropInstance;
							// Move the source image back to its original position in the DOM tree
							imageHolder.parentElement.insertBefore(this.imageToCrop, imageHolder);
							// Detach the event handlers
							window.detachEventHandler("unload", this.destroy.bind(this));
							this.gridHolder.detachEventHandler("transitionend", this.hideGrid.bind(this));
							this.grid.detachEventHandler("mousedown", this.startResizingGrid.bind(this));
							Object.entries(this.resizers).forEach(function([key, value]) {
								value.detachEventHandler("mousedown", this.startResizingGrid.bind(this));
							}.bind(this));
							// Remove the style and context references
							this.cropResultStyle = null;
							this.gridHolderStyle = null;
							this.cropResultContext = null;
							this.imageOverlayContext = null;
							// Remove the newly created page elements
							Object.entries(this.resizers).forEach(function([key, value]) {
								value.remove();
							}.bind(this));
							this.grid.remove();
							this.gridHolder.remove();
							this.imageOverlay.remove();
							imageHolder.remove();
							// Remove the page element references
							this.resizers = null;
							this.cropResult = null;
							this.grid = null;
							this.gridHolder = null;
							this.imageOverlay = null;
							this.imageToCrop = null;
							imageHolder = null;
						}
						catch {
							void(0);
						}
					},
					// Initialises the crop grid
					"initialiseGrid": function() {
						// The bounding rectangle of the source image
						let imageToCropClientBoundingRect = this.imageToCrop.getBoundingClientRect();
						// The width and height of the source image
						let imageWidth = this.imageToCrop.offsetWidth;
						let imageHeight = this.imageToCrop.offsetHeight;
						// Get the bounding coordinates of the source image
						this.imageLeft = imageToCropClientBoundingRect.left;
						this.imageTop = imageToCropClientBoundingRect.top;
						this.imageRight = imageToCropClientBoundingRect.right;
						this.imageBottom = imageToCropClientBoundingRect.bottom;
						// Set the width and height of the crop grid to the same as those of the source image
						this.imageOverlay.width = imageWidth;
						this.imageOverlay.height = imageHeight;
						// Initialise the image overlay canvas context and the crop grid style references
						this.imageOverlayContext = this.imageOverlay.getContext("2d");
						this.gridHolderStyle = this.gridHolder.style;
						// Set the initial size of the crop grid as 20 pixels smaller than the source image
						this.gridHolderStyle.top = "20px";
						this.gridHolderStyle.left = "20px";
						this.gridHolderStyle.width = `${(imageWidth - 40)}px`;
						this.gridHolderStyle.height = `${(imageHeight - 40)}px`;
						// Set the maximum width and maximum height of the crop grid to the same as those of the source image
						this.maxWidth = imageWidth;
						this.maxHeight = imageHeight;
						// Set the maximum top and left boundaries of the crop grid
						this.maxLeft = (this.maxWidth - this.minWidth);
						this.maxTop = (this.maxHeight - this.minHeight);
						// Attach event handlers
						Object.entries(this.resizers).forEach(function([key, value]) {
							value.attachEventHandler("mousedown", this.startResizingGrid.bind(this));
						}.bind(this));
						this.grid.attachEventHandler("mousedown", this.startResizingGrid.bind(this));
						this.gridHolder.attachEventHandler("transitionend", this.hideGrid.bind(this));
						// Perform clean-up when the page is unloaded
						window.attachEventHandler("unload", this.destroy.bind(this));
						// Remove the bounding rectangle reference
						imageToCropClientBoundingRect = null;
					}
				};
				// Create and initialise the necessary page elements
				let imageHolder = document.createElement("div");
				let resizerClassNames = ["top-left", "top-mid", "top-right", "right-mid", "bot-right", "bot-mid", "bot-left", "left-mid"];
				let gridTableBody = document.createElement("tbody");
				let addResizer = function(value, index, source) {
					let resizer = document.createElement("div");
					let resizerHandle = document.createElement("div");
					let resizerClassName = `js-crop-resizer js-crop-${value}`;
					resizer.className = resizerClassName;
					resizerHandle.className = `${resizerClassName} js-crop-handle`;
					cropper.resizers[value.replace(/-(.)/g, x => x[1].toUpperCase())] = resizer;
					cropper.gridHolder.appendChild(resizerHandle);
					cropper.gridHolder.appendChild(resizer);
					resizerHandle = null;
					resizer = null;
				};
				// Update the element references
				cropper.imageToCrop = imageElement;
				cropper.imageOverlay = document.createElement("canvas");
				cropper.gridHolder = document.createElement("div");
				cropper.grid = document.createElement("table");
				// Add class names to the elements
				cropper.gridHolder.classList.add("js-crop-grid-holder");
				cropper.grid.classList.add("js-crop-grid");
				imageHolder.classList.add("js-crop-image-holder");
				// Add the elements to the page
				resizerClassNames.forEach(addResizer.bind(this));
				for(let rowLoopIndex = 0; rowLoopIndex <= 2; rowLoopIndex++) {
					let tableRow = document.createElement("tr");
					for(let columnLoopIndex = 0; columnLoopIndex <= 2; columnLoopIndex++)
						tableRow.appendChild(document.createElement("td"));
					gridTableBody.appendChild(tableRow);
					tableRow = null;
				}
				cropper.grid.appendChild(gridTableBody);
				cropper.gridHolder.appendChild(cropper.grid);
				imageElement.parentElement.insertBefore(imageHolder, imageElement);
				imageHolder.appendChild(imageElement);
				imageHolder.appendChild(cropper.imageOverlay);
				imageHolder.appendChild(cropper.gridHolder);
				// Initialise the crop grid
				cropper.initialiseGrid();
				// Apply the settings provided
				cropper.setOutputCanvas(options.outputCanvas || document.createElement("canvas"));
				cropper.enableCropMode(!(options.startInCropMode === false));
				// Remove the element references
				gridTableBody = null;
				resizerClassNames = null;
				imageHolder = null;
				// Create the jsCrop instance
				currentInstance = Object.freeze({
					"enableCropMode": cropper.enableCropMode.bind(cropper),
					"setOutputCanvas": cropper.setOutputCanvas.bind(cropper),
					"drawCroppedImage": cropper.drawCroppedImage.bind(cropper),
					"downloadCroppedImage": cropper.downloadCroppedImage.bind(cropper),
					"setCropRegion": cropper.setCropRegion.bind(cropper),
					"destroy": cropper.destroy.bind(cropper)
				});
				// Attach the jsCrop instance to the image
				Object.defineProperty(imageElement, "jsCropInstance", {
					"value": currentInstance,
					"configurable": true
				});
			}
			// If there is a jsCrop instance attached to the image
			else {
				// Destroy the jsCrop instance
				currentInstance.destroy();
				// Initialise the jsCrop instance with the specified image and options
				currentInstance = this.initialise(imageElement, options);
			}
			// Return the jsCrop instance
			return currentInstance;
		},
		// Returns the jsCrop instance attached to the specified image
		"getCurrentInstance": function(imageElement) {
			// Return the jsCrop instance attached to the image
			return imageElement.jsCropInstance;
		}
	});
})();