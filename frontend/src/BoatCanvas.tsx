import React, { PureComponent } from 'react';
import * as THREE from 'three';
import { BufferGeometry } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const BOAT_CANVAS_WIDTH = 800;
const BOAT_CANVAS_HEIGHT = 800;

const MAX_POINTS = 500;

const CAMERA_Y = 30;

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
    renderer: THREE.WebGLRenderer | null = null;
    /** Holds the camera used to render this boat canvas */
    camera: THREE.Camera | null = null;
    /** Holds the Scene that will be rendered */
    scene: THREE.Scene | null = null;
    /** Holds the point cloud */
    points: THREE.Points | null = null;
    /** Holds the boat */
    boat: THREE.Object3D | null = null;
    /** Holds the desired location */
    desiredLocation: THREE.Object3D | null = null;

    desiredLine: THREE.Line | null = null;
    controls: OrbitControls | null = null;

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

    deg2rad(deg: number): number {
        return (deg / 360.) * 2 * Math.PI;
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
    updatePoints(lastPosition: { x: number, y: number }, points: { x: number; y: number }[]): void {
        if (!lastPosition || !this.points || !points || points.length === 0) {
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

        // Place points relative to origin (origin will be boat)
        for (let i = 0; i < renderedPoints; i += 3) {
            const { x, y } = points[i];
            // Map (x,y) points to (x,z) surface
            positions[i] = x; // x - lastPosition.x if using relative position
            positions[i + 1] = 0;
            positions[i + 2] = y; // y - lastPosition.y if using relative position
        }

        // REL: Set origin to boat
        // this.points.position.set(lastPosition.x, 0, lastPosition.y);

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
        this.camera.position.set(lastPosition.x, CAMERA_Y, lastPosition.y);
        // this.controls.update();
    }

    updateBoat(lastPosition: { x: number, y: number, phi: number }): void {
        if (!this.boat) {
            return;
        }
        this.boat.position.set(lastPosition.x, 0, lastPosition.y);
        this.boat.rotation.set(0,  (Math.PI / 2.) - this.deg2rad(lastPosition.phi), 0);
    }
    
    updateDesiredLocation(x: number, y: number): void {
        if (!this.desiredLocation) {
            return;
        }
        this.desiredLocation.position.set(x, 0, y);
    }

    updateDesiredLine(lastPosition: { x: number, y: number, sp_x?: number, sp_y?: number }): void {
        if (!this.desiredLine) {
            return;
        }

        const geometry = this.desiredLine.geometry as BufferGeometry;
        const positions = geometry.attributes.position.array as Float32Array;

        positions[3 * 0 + 0] = lastPosition.x;
        positions[3 * 0 + 2] = lastPosition.y;
        if (lastPosition.sp_x && lastPosition.sp_y) {
            positions[3 * 1 + 0] = lastPosition.sp_x;
            positions[3 * 1 + 2] = lastPosition.sp_y;
        }

        (geometry.attributes.position as any).needsUpdate = true;
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

        // Configure the renderer
        this.renderer.gammaOutput = true;
        this.renderer.gammaFactor = 2.2;

        // Set up the camera
        this.camera.position.y = CAMERA_Y;
        this.camera.lookAt(0, 0, 0);

        // Set up the point cloud to render history points
        {
            const pointArray = new Float32Array(MAX_POINTS * 3);
            const geometry = new THREE.BufferGeometry();
            geometry.addAttribute("position", new THREE.BufferAttribute(pointArray, 3));

            this.points = new THREE.Points(geometry);
            this.points.frustumCulled = false;
            this.scene.add(this.points);
        }

        // Set up the boat

        // Start loading boat 3D model
        const loader = new GLTFLoader();
        loader.load('/boat/scene.gltf', (gltf) => {
            console.log('Boat loaded', gltf);
            if (typeof this === 'object' && this.scene) {
                gltf.scene.scale.set(0.01, 0.01, 0.01);
                this.boat = gltf.scene;
                this.scene.add(this.boat);
            }
        }, undefined, (error) => {
            console.error(error);
        });

        // Set up the ground - an ocean
        {
            const ground = new THREE.PlaneGeometry(10000, 10000);
            const groundTexture = new THREE.TextureLoader().load('/water.jpg', (texture) => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set( 0, 0 );
                texture.repeat.set( 1000, 1000 );
            });
            const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture, side: THREE.BackSide });
            const groundMesh = new THREE.Mesh(ground, groundMaterial);
            groundMesh.position.set(0, -1, 0);
            groundMesh.rotation.set(Math.PI / 2, 0, 0);
            this.scene.add(groundMesh);
        }

        // Set up lighting
        {
            // Ambient 
            this.scene.add(new THREE.AmbientLight(0xA0A0A7, 0.5));
        }
        {
            // Directional
            const directionalLight = new THREE.DirectionalLight(0xfffffa, 2);
            directionalLight.position.set(250, 200, 250);
            // directionalLight.castShadow = true;
            directionalLight.target.position.set(1, 0, 0);
            this.scene.add(directionalLight);
        }

        // Set up the "desired location"
        {
            const desiredLocation = new THREE.BoxGeometry( 1, 1, 1 );
            const desiredLocationMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
            this.desiredLocation = new THREE.Mesh( desiredLocation, desiredLocationMaterial );
            this.scene.add(this.desiredLocation);    
        }
        
        // Set up x-y-z axis lines
        {
            const axes = new THREE.AxesHelper(1000);
            this.scene.add(axes);
        }

        // Set up a line between desired point and boat
        {
            const desiredLinePoints = new Float32Array(2 * 3);
            const desiredLineGeometry = new THREE.BufferGeometry();
            desiredLineGeometry.addAttribute("position", new THREE.BufferAttribute(desiredLinePoints, 3));
            this.desiredLine = new THREE.Line(desiredLineGeometry);
            this.desiredLine.frustumCulled = false;
            this.scene.add(this.desiredLine);
        }

        // Set up orbit controls
        {
            this.controls = new OrbitControls(this.camera);
            this.controls.enabled = false;
            this.controls.enableZoom = true;
            this.controls.enablePan = true;
            this.controls.enableKeys = true;
        }

        // Start the animate loop
        window.requestAnimationFrame(this.animate);
        console.log('[BoatCanvas] Ready');
    }

    componentDidUpdate(prevProps: IBoatCanvasProps): void {
        // If the points array has changed, update the point cloud to match
        const lastLocation = this.props.lastLocation;
        if (lastLocation && this.props.points && this.props.points !== prevProps.points) {
            this.updatePoints(lastLocation, this.props.points);
        }

        // If the last location has changed, update the point cloud to match
        if (this.props.lastLocation && this.props.lastLocation !== prevProps.lastLocation) {
            this.updateCamera(this.props.lastLocation);
            this.updateBoat(this.props.lastLocation);

            this.updateDesiredLine(this.props.lastLocation);

            if (this.props.lastLocation.sp_x && this.props.lastLocation.sp_y) {
                this.updateDesiredLocation(this.props.lastLocation.sp_x, this.props.lastLocation.sp_y);
            }
        }
    }
}
