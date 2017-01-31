import { Coord } from "liefs-coordinates";
import { Item } from "liefs-item";

export class Container {
    static get(label: string) {
        if (label in Container.containers) return Container.containers[label];
        return undefined;
    }

    static push(container: Container): Container {
        Container.containers[container.label] = container;
        return container;
    }

    static fixed(container: Container, width: number, height: number): number {
        const NOTDEFINED: number = -999;
        let fixed: number = 0;
        let newSize: number = NOTDEFINED;
        for (let eachItem of container.items) {
            if (!(eachItem.size)) eachItem.size = new Coord;
            if (eachItem.start.slice(-2) === "px") newSize = parseInt(eachItem.start.slice(0, -2));
            if (newSize !== NOTDEFINED) {
                fixed = fixed + newSize;
                eachItem.size.width = (container.direction) ? newSize : width - container.margin * 2;
                eachItem.size.height = (container.direction) ? height - container.margin * 2 : newSize;
                newSize = NOTDEFINED;
            }
        }
        return fixed;
    }

    static percent(container: Container, width: number, height: number, fixed: number): void {
        let max = (container.direction) ? width : height;
        let pixelsLeftForPercent: number = (max - fixed - container.margin * (container.items.length + 1));
        let newPercent: number;
        for (let eachItem of container.items) {
            eachItem.lastDirection = container.direction;
            if ((typeof eachItem.start === "string") && eachItem.start.slice(-1) === "%") {
                newPercent = parseInt(eachItem.start.slice(0, -1));
                eachItem.size.width = (container.direction) ? parseInt((pixelsLeftForPercent * (newPercent / 100)).toFixed(0))
                    : width - container.margin * 2;
                eachItem.size.height = (container.direction) ? height - container.margin * 2
                    : parseInt((pixelsLeftForPercent * (newPercent / 100)).toFixed(0));
            }
        }
    }

    static fill(container: Container, xOffset: number = 0, yOffset: number = 0): void {
        let margin: number = container.margin;
        let sum: number = margin;
        for (let eachItem of container.items) {
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
    }

    static updateRecursive(width: number, height: number, container: Container, xOffset: number = 0, yOffset: number = 0, includeParents: boolean = false): { [index: string]: Coord } {
        let returnObject: { [index: string]: Coord } = {};
        Container.percent(container, width, height, Container.fixed(container, width, height));
        Container.fill(container, xOffset, yOffset);
        for (let thisItem of container.items) {
            let width = thisItem.size.width + container.margin * 2;
            let height = thisItem.size.height + container.margin * 2;
            let x = thisItem.size.x - container.margin;
            let y = thisItem.size.y - container.margin;
            if ("is_a_container" in thisItem && (thisItem["is_a_container"])) {
                if (includeParents) returnObject[thisItem.label] = thisItem.size;
                let temp = Container.updateRecursive(width, height, thisItem.container, x, y);
                for (let attrname in temp) returnObject[attrname] = temp[attrname];
            }
            returnObject[thisItem.label] = thisItem.size;
        }
        return returnObject;
    }

    static debug = true;
    static containers: { [index: string]: Container; } = {};
    static marginDefault: number = 4;
    static suspectedRoot: Container;
    static lastDefined: Container;
    static root() {return (Container.suspectedRoot)
                    ? Container.suspectedRoot : Container.lastDefined; }

    label: string;
    margin: number;
    direction: boolean;
    items: Item[] = [];
    lastUpdate: { [index: string]: Coord };

    constructor(label: string, trueIsHor: boolean, items: Item[], margin: number = Container.marginDefault) {
        this.label = label; this.direction = trueIsHor; this.items = items; this.margin = margin;
        Container.containers[label] = Container.lastDefined = this;
        this.itemsCheck();
    }

    itemsCheck() {
        let totalPercent: number = 0;
        for (let eachItem of this.items)
            if (eachItem.start.slice(-1) === "%")
                totalPercent += parseInt(eachItem.start.slice(0, -1));
        if (totalPercent !== 100) liefsError.badArgs(this.label + " to total 100%", " a total of " + totalPercent.toString() + "%", "Container.itemsCheck()");
    }

    update(width: number, height: number, xOffset: number = 0, yOffset: number = 0, includeParents: boolean = false): { [index: string]: Coord } {
        this.lastUpdate = Container.updateRecursive(width, height, this, xOffset, yOffset, includeParents);
        return this.lastUpdate;
    }
}

export let containers = Container.containers;
export let getContainer = Container.get;
