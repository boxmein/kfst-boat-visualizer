import React, { PureComponent } from 'react';
import * as THREE from 'three';
import { BufferGeometry } from 'three';
import { runInThisContext } from 'vm';

const BOAT_CANVAS_WIDTH = 800;
const BOAT_CANVAS_HEIGHT = 800;

const MAX_POINTS = 500;

interface IBoatCanvasProps {
    lastLocation?: {
        phi: number;
        sp_x?: number;
        sp_y?: number;
        x: number;
        y: number;
    };
    points?: {
        x: number;
        y: number;
    }[];
}

/**
 * BoatCanvas is responsible for drawing the boat and its history track on a WebGL canvas.
 */
export class BoatCanvas extends PureComponent<IBoatCanvasProps> {

    /** Holds A HTML element to put the webgl canvas into. */
    ref: Element | null = null;
    /** Holds a three.js canvas renderer */
    renderer: THREE.Renderer | null = null;
    /** Holds the camera used to render this boat canvas */
    camera: THREE.Camera | null = null;
    /** Holds the Scene that will be rendered */
    scene: THREE.Scene | null = null;
    /** Holds the point cloud */
    points: THREE.Points | null = null;
    /** Holds the boat */
    boat: THREE.Mesh | null = null;

    constructor(props: IBoatCanvasProps) {
        super(props);
        // Set up Three.js objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, BOAT_CANVAS_WIDTH / BOAT_CANVAS_HEIGHT, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();

        // Set the canvas size
        this.renderer.setSize(BOAT_CANVAS_WIDTH, BOAT_CANVAS_HEIGHT);

        // Bind event handlers
        this.animate = this.animate.bind(this);
    }

    /**
     * Calls WebGL render and loops forever.
     * Called every animation frame.
     */
    animate() {
        if (!this.renderer || !this.scene || !this.camera) {
            return;
        }
        this.renderer.render(this.scene, this.camera)
        window.requestAnimationFrame(this.animate);
    }

    /**
     * Takes a list of points as an argument and updates the point cloud to match.
     * This is a performance sensitive function - it could be called tens of times 
     * per second.
     * @param points An array of points to place in the point cloud
     */
    updatePoints(points: { x: number; y: number }[]): void {
        if (!this.points || !points || points.length === 0) {
            return;
        }
        const geometry = this.points.geometry as BufferGeometry;
        
        // Since the Geometry uses a fixed-size Float32Array we need to tell it how many
        // elements from the array's start to render
        const renderedPoints = Math.min(500, points.length);
        geometry.setDrawRange(0, renderedPoints);

        // Fill up the Float32Array with the points
        // The float32array is structured like this: 
        // [ x, y, z, x, y, z, x, y, z, ... ]
        const positions = geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < renderedPoints; i += 1) {
            const { x, y } = points[i];
            // Map (x,y) points to (x,z) surface
            positions[i] = x;
            positions[i + 1] = 0;
            positions[i + 2] = y;
        }

        // Mark the object as dirty
        (geometry.attributes.position as any).needsUpdate = true;
    }

    /**
     * Update the camera to look at the last position.
     * @param lastPosition the position to make the camera look at
     */
    updateCamera(lastPosition: { x: number; y: number }): void {
        if (!this.camera) {
            return;
        }
        // Map (x, y) positions to (x,z) surface
        this.camera.position.set(lastPosition.x, 20, lastPosition.y);
        // this.camera.lookAt(lastPosition.x, 0, lastPosition.y);
    }

    updateBoat(lastPosition: { x: number, y: number }): void {
        if (!this.boat) {
            return;
        }
        this.boat.position.set(lastPosition.x, 0, lastPosition.y);
    }

    /**
     * Renders the HTML element that this 3D renderer will be plopped into
     */
    render() {
        return <div ref={(ref) => this.ref = ref} />;
    }

    /**
     * When the component has been placed onscreen, wires up everything.
     */
    componentDidMount(): void {
        if (!this.ref || !this.renderer || !this.scene || !this.camera) {
            return;
        }
        this.ref.appendChild(this.renderer.domElement);

        // Set up the point cloud to render history points

        const pointArray = new Float32Array(MAX_POINTS * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(pointArray, 3));

        this.points = new THREE.Points(geometry);
        this.scene.add(this.points);

        // Set up the camera
        this.camera.position.y = 100;
        this.camera.lookAt(0, 0, 0);

        // Set up the boat
        const boat = new THREE.BoxGeometry( 1, 1, 1 );
        const boatMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        this.boat = new THREE.Mesh( boat, boatMaterial );
        this.scene.add(this.boat);
 
        // Set up a grid
        const grid = new THREE.GridHelper(1000, 1000);
        this.scene.add(grid);

        // Set up x-y-z axis lines
        const axes = new THREE.AxesHelper(1000);
        this.scene.add(axes);

        // Start the animate loop
        window.requestAnimationFrame(this.animate);
        console.log('[BoatCanvas] Ready');
    }

    componentDidUpdate(prevProps: IBoatCanvasProps): void {
        // If the points array has changed, update the point cloud to match
        if (this.props.points && this.props.points !== prevProps.points) {
            this.updatePoints(this.props.points);
        }

        // If the last location has changed, update the point cloud to match
        if (this.props.lastLocation && this.props.lastLocation !== prevProps.lastLocation) {
            this.updateCamera(this.props.lastLocation);
            this.updateBoat(this.props.lastLocation);
        }
    }
}
