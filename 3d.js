import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'

async function load3dFile(container, file, fileType) {
	const scene = new THREE.Scene()
	scene.background = new THREE.Color().setHex(0xffffff)
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // soft white light
	ambientLight.position.set(20, 20, 20)
	scene.add(ambientLight)

	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	)
	camera.position.z = 10
	camera.position.y = 25
	const pointLight = new THREE.PointLight(0xffffff, 0.6)
	camera.add(pointLight)

	const renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true
	})
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth / 2, window.innerHeight / 2)
	container.appendChild(renderer.domElement)

	const controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true
	controls.autoRotate = true

	const material = new THREE.MeshPhysicalMaterial({
		color: 0xffffff,
		metalness: 0.1,
		roughness: 0.9,
		transparent: false,
		transmission: 1.0,
		clearcoat: 1.0,
		clearcoatRoughness: 0.25
	})

	const loader = fileType === 'stl' ? new STLLoader() : new OBJLoader()
	const loadFile = () =>
		new Promise((res, rej) =>
			loader.load(
				file,
				function (geometry) {
					container.classList.remove('loading-3d')
					if (fileType === 'stl') {
						const mesh = new THREE.Mesh(geometry, material)
						scene.add(mesh)
						res(mesh)
					} else {
						geometry.children[0].material = material
						scene.add(geometry)
						res(geometry)
					}
				},
				undefined,
				(error) => {
					console.log(error)
					rej(error)
				}
			)
		)

	function render() {
		renderer.render(scene, camera)
	}

	function animate() {
		requestAnimationFrame(animate)
		controls.update()
		render()
	}

	// https://discourse.threejs.org/t/camera-zoom-to-fit-object/936/3
	const fitCameraToObject = function (camera, object, offset, controls) {
		offset = offset || 1.25

		const boundingBox = new THREE.Box3()

		// get bounding box of object - this will be used to setup controls and camera
		boundingBox.setFromObject(object)

		let center = new THREE.Vector3()
		center = boundingBox.getCenter(center)
		if (container.id.includes('reach')) {
			center.y = center.y - 6
		}
		let size = new THREE.Vector3()
		size = boundingBox.getSize(size)

		// get the max side of the bounding box (fits to width OR height as needed )
		const maxDim = Math.max(size.x, size.y, size.z) + 1
		const fov = camera.fov * (Math.PI / 180)
		let cameraZ = Math.abs((maxDim / 4) * Math.tan(fov * 2))

		cameraZ *= offset // zoom out a little so that objects don't fill the screen

		if (container.id.includes('cyborg')) {
			camera.position.z = cameraZ * 16
		} else if (container.id.includes('heart')) {
			camera.position.z = cameraZ * 40
		} else if (container.id.includes('reach')) {
			camera.position.z = cameraZ * (42 / cameraZ)
		}

		const minZ = boundingBox.min.z
		const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ

		camera.far = cameraToFarEdge * 3
		camera.updateProjectionMatrix()

		if (controls) {
			// set camera to rotate around center of loaded object
			controls.target = center

			// prevent camera from zooming out far enough to create far plane cutoff
			if (container.id.includes('cyborg')) {
				controls.maxDistance = cameraToFarEdge * 2
			} else if (container.id.includes('heart')) {
				controls.maxDistance = cameraToFarEdge * 2
			} else if (container.id.includes('reach')) {
				controls.maxDistance = cameraToFarEdge * 1.4
			}

			controls.saveState()
		} else {
			camera.lookAt(center)
		}
	}

	const obj = await loadFile()
	fitCameraToObject(camera, obj, 1, controls)
	animate()
}

async function loadAllFiles() {
	return await Promise.all([
		load3dFile(
			document.getElementById('cyborg'),
			'https://ray-tao.s3.us-east-1.amazonaws.com/cyborg.stl',
			'stl'
		),
		load3dFile(
			document.getElementById('reach-drown'),
			'https://ray-tao.s3.us-east-1.amazonaws.com/reachdrown.stl',
			'stl'
		),
		load3dFile(
			document.getElementById('synthetic-heart'),
			'https://ray-tao.s3.us-east-1.amazonaws.com/syntheticheart.obj',
			'obj'
		)
	])
}

document.addEventListener('DOMContentLoaded', (event) => {
	document.getElementById('loading-screen').style.display = 'grid'
	document.body.classList.add('disable-scrolling')
	loadAllFiles().then(() => {
		document.getElementById('loading-screen').style.opacity = 0
		document.getElementById('loading-screen').style.visibility = 'hidden'
		document.getElementById('loading-screen').style.position = 'absolute'
		document.body.classList.remove('disable-scrolling')
	}).catch((err) => {
		console.error(err)
		document.getElementById('loading-screen').style.opacity = 0
		document.getElementById('loading-screen').style.visibility = 'hidden'
		document.getElementById('loading-screen').style.position = 'absolute'
		document.body.classList.remove('disable-scrolling')
	})
})
