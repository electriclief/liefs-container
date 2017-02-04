import { isUniqueSelector} from "liefs-lib";
import { Coord } from "liefs-coordinates";
import { Item } from "liefs-item";

export class Container {
  static of(item: Item) {
    for (let eachKey of Object.keys(Container.containers))
      if (Container.containers[eachKey].items.indexOf(item) > -1)
        return Container.containers[eachKey];
    console.log("Container of Error: Containers");
    console.log(Container.containers);
    console.log(item);
    return undefined;
  }
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
            if (eachItem.current.slice(-2) === "px") newSize = parseInt(eachItem.current.slice(0, -2));
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
            if ((typeof eachItem.current === "string") && eachItem.current.slice(-1) === "%") {
                newPercent = parseInt(eachItem.current.slice(0, -1));
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
            if ("container" in thisItem && (thisItem["container"])) {
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
    el: Element;
    selector = () => { return "#" + this.label; };

    constructor(label: string, trueIsHor: boolean, items: Item[], margin: number = Container.marginDefault) {
        console.log("Defined Container" + label);
        this.label = label; this.direction = trueIsHor; this.items = items; this.margin = margin;
        Container.containers[label] = Container.lastDefined = this;
        this.itemsCheck();
        if (isUniqueSelector(this.selector())) this.el = document.querySelectorAll(this.selector())[0];
    }

    itemsCheck() {
        let totalPercent: number = 0;
        for (let eachItem of this.items)
            if (eachItem.start.slice(-1) === "%") totalPercent += parseInt(eachItem.start.slice(0, -1));
            else if ((eachItem.start.slice(-2) === "px") && eachItem.dragBar) {
                console.log("before");
                console.log(eachItem.dragBar.el.className);
                eachItem.dragBar.el.className = this.direction ? "Hdragbar" : "Vdragbar";
                console.log("after");
                console.log(eachItem.dragBar.el.className);
              }
        if (totalPercent !== 100) liefsError.badArgs(this.label + " to total 100%", " a total of " + totalPercent.toString() + "%", "Container.itemsCheck()");
    }

    update(width: number, height: number, xOffset: number = 0, yOffset: number = 0, includeParents: boolean = false): void /*{ [index: string]: Coord }*/ {
        this.lastUpdate = Container.updateRecursive(width, height, this, xOffset, yOffset, includeParents);
    }
    itemByLabel(label: string): Item {
      for (let item of this.items)
        if (item.label === label) return item;
          else if (item.container && item.container.itemByLabel(label)) return item.container.itemByLabel(label);
      return undefined;
    }
}

export let containers = Container.containers;
export let getContainer = Container.get;
