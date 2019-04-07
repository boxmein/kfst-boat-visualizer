import * as THREE from 'three';

import React, {PureComponent} from 'react';

interface IBoatCanvasProps{

}

export class BoatCanvas extends PureComponent <IBoatCanvasProps>{
    ref:Element|null = null;
    renderer:THREE.Renderer|null = null;
    camera:THREE.Camera|null = null;
    scene:THREE.Scene|null = null;
    animate(){
        if(!this.renderer||!this.scene||!this.camera){
            return;
        }
        this.renderer.render(this.scene, this.camera)
        window.requestAnimationFrame(this.animate);
    }

    constructor(props:IBoatCanvasProps) {
        super(props);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(800, 800);

        this.animate= this.animate.bind(this);
    }

    render() {

        return <div ref={(ref) => this.ref = ref}>

        </div>
    }

    componentDidMount(): void {
        if (!this.ref||!this.renderer||!this.scene||!this.camera) {
            return;
        }
    this.ref.appendChild(this.renderer.domElement);
        const pointList=[
            0,0,0,
            0,0,1,
            0,0,2,
            0,0,3,
            0,0,4,
            0,0,5,
        ];

        const geometry=new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.Float32BufferAttribute(pointList, 3));

        const points= new THREE.Points(geometry);
        this.scene.add(points);
        this.camera.position.y=10;
        this.camera.lookAt(0,0,0);
        window.requestAnimationFrame(this.animate);
    }
}
