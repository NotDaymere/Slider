class RoundSlider{
    #initialWrapper = null;
    wrapper = null;
    step = null;
    angle = 0;
    items = [];
    speed = 10;
    coordsRange = {
        xMin: 0,
        xMax: 0,
        yMin: 0,
        yMax: 0
    };
    // Move
    move = false;
    raf = null;
    coordsMove = {
        startX: 0,
        startY: 0,
        inverseX: null,
        inverseY: null
    };

    constructor(items = [], options = {}){
        this.items = Array.from(items).map((element, id) => ({
            id, element, coords: {}
        }));
        this.wrapper = items[0]?.parentElement;
        this.#initialWrapper = this.wrapper.outerHTML;
        this.angle = options.angle || this.angle;
        this.step = 360 / (options.length || items.length);

        if(options.grabCursor){
            this.wrapper.style.cursor = "grab";
        }

        this.initRoundElements();
        this.initHandlers();
    }
    initRoundElements(){
        this.countPosition();

        let xMin, xMax, yMin, yMax;

        this.items.forEach(({coords}) => {
            const {x, y} = coords;

            if(xMin === undefined && xMax === undefined){
                xMin = x; xMax = x;
            }
            if(yMin === undefined && yMax === undefined){
                yMin = y; yMax = y;
            }

            xMin = Math.min(xMin, x);
            xMax = Math.max(xMax, x);
            yMin = Math.min(yMin, y);
            yMax = Math.min(yMax, y);
        });

        const wrapperWidth = Math.abs(xMin) + Math.abs(yMax);
        const wrapperHeight = Math.abs(yMin) + Math.abs(yMax);

        css(this.wrapper, {
            position: 'relative',
            width: wrapperWidth + 'px',
            height: wrapperHeight + 'px'
        });

        this.coordsRange = {
            xMin, xMax, yMin, yMax
        };

        this.paintPosition();
    }
    countPosition(angle){
        const RAD = (Math.PI / 180);
        angle = angle || this.angle;

        for(let {element, coords} of this.items){
            const width = element.offsetWidth;
            const height = element.offsetHeight
            const r = width * 2;
            const left = r * Math.cos(angle * RAD) - (width / 2);
            const top = r * Math.sin(angle * RAD) - (height / 2);

            angle += this.step;

            coords.x = left;
            coords.y = top;
            coords.angle = angle;
        }
    }
    paintPosition(){
        const {xMin, yMin} = this.coordsRange;

        for(let {element, coords} of this.items){
            element.setAttribute("data-angle", (coords.angle - this.step) % 360)
            css(element, {
                position: 'absolute',
                left: coords.x + Math.abs(xMin) + 'px',
                top: coords.y + Math.abs(yMin)  + 'px'
            });
        }
    }    
    initHandlers(){
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
        this.mouseUpHandler = this.mouseUpHandler.bind(this);

        this.wrapper.addEventListener('mousedown', this.mouseDownHandler);
        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('mouseup', this.mouseUpHandler);
    }
    moveTo(angle, slowly = false){
        if(slowly === false){
            this.angle = angle;
        
            this.countPosition();
            this.paintPosition();
    
            return;
        }

        const $this = this;

        function animate(){
            const increase = angle > $this.angle;

            $this.angle = (increase === true)
                ? Math.min($this.angle + 0.5, angle)
                : Math.max($this.angle - 0.5, angle);

            $this.countPosition();
            $this.paintPosition();
            
            if($this.angle !== angle){
                $this.raf = requestAnimationFrame($this.moveTo.bind($this, angle, true));
            } 
        }

        animate();
    }
    mouseMoveHandler(event){
        if(this.move === false){
            return false;
        }

        const {top, left, width, height} = this.wrapper.getBoundingClientRect();
        const elementTop = (document.documentElement.scrollTop || window.pageYOffset) + top;
        const nextInverseX = event.clientY - elementTop > height / 2;
        const nextInverseY = event.clientX - left < width / 2;
        const {inverseX, inverseY} = this.coordsMove;

        if(inverseX !== null && inverseY !== null){
            if(nextInverseX !== inverseX || nextInverseY !== inverseY){
                Object.assign(this.coordsMove, {
                    startX: event.clientX,
                    startY: event.clientY,
                    rotated: this.angle
                });
            }
        }
        
        const x = (event.clientX - this.coordsMove.startX) * (nextInverseX ? -1 : 1);
        const y = (event.clientY - this.coordsMove.startY) * (nextInverseY ? -1 : 1);
        const rotate = this.coordsMove.rotated + ((x + y) / this.speed);

        this.moveTo(rotate);

        Object.assign(this.coordsMove, {
            inverseX: nextInverseX,
            inverseY: nextInverseY,
        });
    }
    mouseDownHandler(event){    
        this.move = true; 

        Object.assign(this.coordsMove, {
            startX: event.clientX,
            startY: event.clientY,
            rotated: this.angle,
        });
    }
    mouseUpHandler(event){
        this.move = false;
        
        const correctRotate = Math.round(this.angle / this.step) * this.step;

        this.moveTo(correctRotate, true);
    }
    destroy(){
        this.wrapper.outerHTML = this.#initialWrapper;
    }
}

function css(el, styles = {}){
    Object.assign(el.style, styles);
}

function clearProps(target, value, extra){
    for(let prop of Object.keys(target)){
        target[prop] = value;
    }
}

const rs = new RoundSlider(document.querySelectorAll(".item"), {
    angle: 0,
    grabCursor: true
});
window.rs = rs;
