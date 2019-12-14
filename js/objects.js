
        var canvas, scene, renderer, camera;

        var raycaster; // A THREE.Raycaster for user mouse input.

        var ground; // A square base on which the cylinders stand.
        var cylinder; // A cylinder that will be cloned to make the visible cylinders.

        var world; // An Object3D that contains all the mesh objects in the scene.
        // Rotation of the scene is done by rotating the world about its
        // y-axis.  (I couldn't rotate the camera about the scene since
        // the Raycaster wouldn't work with a camera that was a child
        // of a rotated object.)

        var ROTATE = 1,
            DRAG = 2,
            ADD = 3,
            DELETE = 4; // Possible mouse actions
        var mouseAction; // currently selected mouse action
        var dragItem; // the cylinder that is being dragged, during a drag operation
        var intersects; //the objects intersected

        var targetForDragging; // An invisible object that is used as the target for raycasting while
        // dragging a cylinder.  I use it to find the new location of the
        // cylinder.  I tried using the ground for this purpose, but to get
        // the motion right, I needed a target that is at the same height
        // above the ground as the point where the user clicked the cylinder.

        function render() {
            renderer.render(scene, camera);
        }

        function createWorld() {
            scene = new THREE.Scene();
            renderer.setClearColor(0x333333);
            camera = new THREE.PerspectiveCamera(27, canvas.width / canvas.height, 10, 100);
            camera.position.z = 60;
            camera.position.y = 30;
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            camera.add(new THREE.PointLight(0xffffff, 0.7)); // point light at camera position
            scene.add(camera);
            scene.add(new THREE.DirectionalLight(0xffffff, 0.5)); // light shining from above.

            world = new THREE.Object3D();
            scene.add(world);

            ground = new THREE.Mesh(
                new THREE.BoxGeometry(40, 1, 40),
                new THREE.MeshLambertMaterial({
                    color: "#cc8800"
                })
            );
            ground.position.y = -0.5; // top of base lies in the plane y = -5;
            world.add(ground);

            targetForDragging = new THREE.Mesh(
                new THREE.BoxGeometry(100, 0.01, 100),
                new THREE.MeshBasicMaterial()
            );
            targetForDragging.material.visible = false;

            //targetForDragging.material.transparent = true;  // This was used for debugging
            //targetForDragging.material.opacity = 0.1;
            //world.add(targetForDragging);

            cylinder = new THREE.Mesh(
                new THREE.CylinderGeometry(2.5, 2, 6, 18, 32),
                new THREE.MeshLambertMaterial({
                    color: " #ffffff"
                })
            );
            cylinder.position.y = 3; // places base at y = 0;

            // addCylinder(10, 10);
            // addCylinder(0, 15);
            // addCylinder(-15, -7);
            // addCylinder(-8, 5);
            // addCylinder(5, -12);

        }

        function addCylinder(x, z) {
            var obj = cylinder.clone();
            obj.position.x = x;
            obj.position.z = z;
            world.add(obj);
        }

        function doMouseDown(x, y) {
            if (mouseAction == ROTATE) {
                return true;
            }
            if (targetForDragging.parent == world) {
                world.remove(targetForDragging); // I don't want to check for hits on targetForDragging
            }
            var a = 2 * x / canvas.width - 1;
            var b = 1 - 2 * y / canvas.height;
            raycaster.setFromCamera(new THREE.Vector2(a, b), camera);
            intersects = raycaster.intersectObjects(world.children); // no need for recusion since all objects are top-level
            if (intersects.length == 0) {
                return false;
            }
            var item = intersects[0];
            var objectHit = item.object;
            switch (mouseAction) {
                case DRAG:
                    if (objectHit == ground) {
                        return false;
                    } else {
                        dragItem = objectHit;
                        world.add(targetForDragging);
                        targetForDragging.position.set(0, item.point.y, 0);
                        render();
                        return true;
                    }
                case ADD:
                    if (objectHit == ground) {
                        var locationX = item.point.x; // Gives the point of intersection in world coords
                        var locationZ = item.point.z;
                        var coords = new THREE.Vector3(locationX, 0, locationZ);
                        world.worldToLocal(coords); // to add cylider in correct position, neew local coords for the world object
                        addCylinder(coords.x, coords.z);
                        render();
                    }
                    return false;
                default: // DELETE
                    if (objectHit != ground) {
                        world.remove(objectHit);
                        render();
                    }
                    return false;
            }
        }

        function doMouseMove(x, y, evt, prevX, prevY) {
            if (mouseAction == ROTATE) {
                var dx = x - prevX;
                world.rotateY(dx / 200);
                render();
            } else { // drag
                var a = 2 * x / canvas.width - 1;
                var b = 1 - 2 * y / canvas.height;
                raycaster.setFromCamera(new THREE.Vector2(a, b), camera);
                intersects = raycaster.intersectObject(targetForDragging);
                if (intersects.length == 0) {
                    return;
                }
                var locationX = intersects[0].point.x;
                var locationZ = intersects[0].point.z;
                var coords = new THREE.Vector3(locationX, 0, locationZ);
                world.worldToLocal(coords);
                a = Math.min(19, Math.max(-19, coords.x)); // clamp coords to the range -19 to 19, so object stays on ground
                b = Math.min(19, Math.max(-19, coords.z));
                dragItem.position.set(a, 3, b);
                render();
            }
        }


        function doJoyStickMove(x, y, evt, prevX, prevY) {
            if (mouseAction == ROTATE) {
                var dx = x - prevX;
                world.rotateY(dx / 200);
                render();
            } else { // drag
                //var a = 2*x/canvas.width - 1;
                //var b = 1 - 2*y/canvas.height;
                //raycaster.setFromCamera( new THREE.Vector2(a,b), camera );
                //var intersects = raycaster.intersectObject( targetForDragging ); 
                //if (intersects.length == 0) {
                //  return;
                //}
                var locationX = intersects[0].point.x;
                var locationZ = intersects[0].point.z;
                var coords = new THREE.Vector3(locationX, 0, locationZ);
                world.worldToLocal(coords);
                a = Math.min(19, Math.max(-19, coords.x)); // clamp coords to the range -19 to 19, so object stays on ground
                b = Math.min(19, Math.max(-19, coords.z));
                dragItem.position.set(a + x, 3, b + y);
                render();
            }
        }



        function doChangeMouseAction() {
            if (document.getElementById("mouseRotate").checked) {
                mouseAction = ROTATE;
            } else if (document.getElementById("mouseDrag").checked) {
                mouseAction = DRAG;
            } else if (document.getElementById("mouseAdd").checked) {
                mouseAction = ADD;
            } else {
                mouseAction = DELETE;
            }
        }

        function init() {
            try {
                canvas = document.getElementById("maincanvas");
                renderer = new THREE.WebGLRenderer({
                    canvas: canvas,
                    antialias: true
                });
            } catch (e) {
                document.getElementById("canvas-holder").innerHTML = "<p><b>Sorry, an error occurred:<br>" +
                    e + "</b></p>";
                return;
            }
            document.getElementById("mouseDrag").checked = true;
            mouseAction = DRAG;
            document.getElementById("mouseRotate").onchange = doChangeMouseAction;
            document.getElementById("mouseDrag").onchange = doChangeMouseAction;
            document.getElementById("mouseAdd").onchange = doChangeMouseAction;
            document.getElementById("mouseDelete").onchange = doChangeMouseAction;
            createWorld();
            setUpMouseHander(canvas, doMouseDown, doMouseMove);
            setUpTouchHander(canvas, doMouseDown, doMouseMove);
            raycaster = new THREE.Raycaster();
            render();
        }
