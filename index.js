"use strict";
var Container = (function () {
    function Container(label, trueIsHor, items, margin) {
        if (margin === void 0) { margin = Container.marginDefault; }
        this.items = [];
        this.label = label;
        this.direction = trueIsHor;
        this.items = items;
        this.margin = margin;
        Container.containers[label] = this;
        this.itemsCheck();
    }
    Container.get = function (label) {
        if (label in Container.containers)
            return Container.containers[label];
        return undefined;
    };
    Container.push = function (container) {
        Container.containers[container.label] = container;
        return container;
    };
    Container.fixed = function (container, width, height) {
        var NOTDEFINED = -999;
        var fixed = 0;
        var newSize = NOTDEFINED;
        for (var _i = 0, _a = container.items; _i < _a.length; _i++) {
            var eachItem = _a[_i];
            if (eachItem.start.slice(-2) === "px")
                newSize = parseInt(eachItem.start.slice(0, -2));
            if (newSize !== NOTDEFINED) {
                fixed = fixed + newSize;
                eachItem.size.width = (container.direction) ? newSize : width - container.margin * 2;
                eachItem.size.height = (container.direction) ? height - container.margin * 2 : newSize;
                newSize = NOTDEFINED;
            }
        }
        return fixed;
    };
    Container.percent = function (container, width, height, fixed) {
        var max = (container.direction) ? width : height;
        var pixelsLeftForPercent = (max - fixed - container.margin * (container.items.length + 1));
        var newPercent;
        for (var _i = 0, _a = container.items; _i < _a.length; _i++) {
            var eachItem = _a[_i];
            eachItem.lastDirection = container.direction;
            if ((typeof eachItem.start === "string") && eachItem.start.slice(-1) === "%") {
                newPercent = parseInt(eachItem.start.slice(0, -1));
                eachItem.size.width = (container.direction) ? parseInt((pixelsLeftForPercent * (newPercent / 100)).toFixed(0))
                    : width - container.margin * 2;
                eachItem.size.height = (container.direction) ? height - container.margin * 2
                    : parseInt((pixelsLeftForPercent * (newPercent / 100)).toFixed(0));
            }
        }
    };
    Container.fill = function (container, xOffset, yOffset) {
        if (xOffset === void 0) { xOffset = 0; }
        if (yOffset === void 0) { yOffset = 0; }
        var margin = container.margin;
        var sum = margin;
        for (var _i = 0, _a = container.items; _i < _a.length; _i++) {
            var eachItem = _a[_i];
            if (container.direction) {
                eachItem.size.x = xOffset + sum;
                sum = sum + eachItem.size.width + margin;
                eachItem.size.y = yOffset + margin;
            }
            else {
                eachItem.size.x = xOffset + margin;
                eachItem.size.y = yOffset + sum;
                sum = sum + eachItem.size.height + margin;
            }
        }
    };
    Container.updateRecursive = function (width, height, container, xOffset, yOffset, includeParents) {
        if (xOffset === void 0) { xOffset = 0; }
        if (yOffset === void 0) { yOffset = 0; }
        if (includeParents === void 0) { includeParents = false; }
        var returnObject = {};
        Container.percent(container, width, height, Container.fixed(container, width, height));
        Container.fill(container, xOffset, yOffset);
        for (var _i = 0, _a = container.items; _i < _a.length; _i++) {
            var thisItem = _a[_i];
            var width_1 = thisItem.size.width + container.margin * 2;
            var height_1 = thisItem.size.height + container.margin * 2;
            var x = thisItem.size.x - container.margin;
            var y = thisItem.size.y - container.margin;
            if ("is_a_container" in thisItem && (thisItem["is_a_container"])) {
                if (includeParents)
                    returnObject[thisItem.label] = thisItem.size;
                var temp = Container.updateRecursive(width_1, height_1, thisItem.container, x, y);
                for (var attrname in temp)
                    returnObject[attrname] = temp[attrname];
            }
            returnObject[thisItem.label] = thisItem.size;
        }
        return returnObject;
    };
    Container.prototype.itemsCheck = function () {
        var totalPercent = 0;
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var eachItem = _a[_i];
            if (eachItem.start.slice(-1) === "%")
                totalPercent += parseInt(eachItem.start.slice(0, -1));
        }
        if (totalPercent !== 100)
            liefsError.badArgs(this.label + " to total 100%", " a total of " + totalPercent.toString() + "%", "Container.itemsCheck()");
    };
    Container.prototype.update = function (width, height, xOffset, yOffset, includeParents) {
        if (xOffset === void 0) { xOffset = 0; }
        if (yOffset === void 0) { yOffset = 0; }
        if (includeParents === void 0) { includeParents = false; }
        this.lastUpdate = Container.updateRecursive(width, height, this, xOffset, yOffset, includeParents);
        return this.lastUpdate;
    };
    return Container;
}());
Container.debug = true;
Container.containers = {};
Container.marginDefault = 4;
exports.Container = Container;
exports.containers = Container.containers;
exports.getContainer = Container.get;
