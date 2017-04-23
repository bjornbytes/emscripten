var LibraryWebVR = {
  $WebVR: {
    initialized: false,
    display: null,
    controllers: [],
    canvas: null,
    render: null,
    renderData: null,
    width: 0,
    height: 0,
    frame: null,
    viewMatrix: null,
    projectionMatrix: null,
    sittingToStandingMatrix: null,

    init: function() {
      if (WebVR.initialized) {
        return;
      }

      WebVR.initialized = true;

      if (!navigator.getVRDisplays) {
        console.log('WebVR is not supported');
        return;
      }

      WebVR.canvas = document.querySelector('#canvas');
      WebVR.width = canvas.width;
      WebVR.height = canvas.height;
      WebVR.frame = new VRFrameData();
      WebVR.viewMatrix = Module._malloc(64);
      WebVR.projectionMatrix = Module._malloc(64);
      WebVR.sittingToStandingMatrix = Module._malloc(64);

      navigator.getVRDisplays().then(function(displays) {
        var display = WebVR.display = displays[0];

        if (!display) {
          console.log('No displays found');
          return;
        }

        var refreshControllers = function() {
          WebVR.controllers = [];
          var controllers = navigator.getGamepads();
          for (var i = 0; i < controllers.length; i++) {
            if (controllers[i] && controllers[i].pose) {
              WebVR.controllers.push(controllers[i]);
            }
          }
        };

        window.addEventListener('gamepadconnected', refreshControllers);
        window.addEventListener('gamepaddisconnected', refreshControllers);
        refreshControllers();

        var render = function() {
          if (display) {
            display.requestAnimationFrame(render);

            display.getFrameData(WebVR.frame);

            if (WebVR.render) {
              Runtime.dynCall('vi', WebVR.render, [WebVR.renderData]);
            }

            if (display.isPresenting) {
              display.submitFrame();
            }
          }
        };

        display.requestAnimationFrame(render);

        window.addEventListener('lovr.entervr', function() {
          display.requestPresent([{ source: canvas }]);
        });
      });

      window.addEventListener('vrdisplaypresentchange', function() {
        if (WebVR.display && WebVR.display.isPresenting) {
          var eyeParams = WebVR.display.getEyeParameters('left');
          canvas.width = WebVR.width = eyeParams.renderWidth * 2;
          canvas.height = WebVR.height = eyeParams.renderHeight;
        }
      });
    }
  },

  emscripten_vr_init: function() {
    WebVR.init();
  },

  emscripten_vr_is_present: function() {
    return WebVR.display && WebVR.display.isConnected;
  },

  emscripten_vr_get_display_name: function() {
    if (!WebVR.display) {
      return 0;
    }

    if (WebVR.displayName) {
      return WebVR.displayName;
    }

    var str = WebVR.display.displayName;
    var len = lengthBytesUTF8(str);

    WebVR.displayName = _malloc(len + 1);
    stringToUTF8(str, WebVR.displayName, len + 1);

    return WebVR.displayName;
  },

  emscripten_vr_get_display_width: function() {
    return WebVR.width;
  },

  emscripten_vr_get_display_height: function() {
    return WebVR.height;
  },

  emscripten_vr_get_display_clip_distance: function(near, far) {
    if (!WebVR.display) {
      Module.setValue(near, 0, 'float');
      Module.setValue(far, 0, 'float');
      return;
    }

    Module.setValue(near, WebVR.display.depthNear, 'float');
    Module.setValue(far, WebVR.display.depthFar, 'float');
  },

  emscripten_vr_set_display_clip_distance: function(near, far) {
    if (WebVR.display) {
      WebVR.display.depthNear = near;
      WebVR.display.depthFar = far;
    }
  },

  emscripten_vr_get_bounds_width: function() {
    var stage = WebVR.display && WebVR.display.stageParameters;
    return stage ? stage.sizeX : 0;
  },

  emscripten_vr_get_bounds_depth: function() {
    var stage = WebVR.display && WebVR.display.stageParameters;
    return stage ? stage.sizeZ : 0;
  },

  emscripten_vr_get_position: function(x, y, z) {
    if (!WebVR.display || !WebVR.frame || !WebVR.frame.pose.position) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    Module.setValue(x, WebVR.frame.pose.position[0], 'float');
    Module.setValue(y, WebVR.frame.pose.position[1], 'float');
    Module.setValue(z, WebVR.frame.pose.position[2], 'float');
  },

  emscripten_vr_get_eye_offset: function(eye, x, y, z) {
    if (!WebVR.display) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    var eyeParams = WebVR.display.getEyeParameters(eye === 0 ? 'left' : 'right');
    Module.setValue(x, eyeParams.offset[0], 'float');
    Module.setValue(y, eyeParams.offset[1], 'float');
    Module.setValue(z, eyeParams.offset[2], 'float');
  },

  emscripten_vr_get_orientation: function(x, y, z, w) {
    if (!WebVR.display || !WebVR.frame || !WebVR.frame.pose.orientation) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      Module.setValue(w, 0, 'float');
      return;
    }

    Module.setValue(x, WebVR.frame.pose.orientation[0], 'float');
    Module.setValue(y, WebVR.frame.pose.orientation[1], 'float');
    Module.setValue(z, WebVR.frame.pose.orientation[2], 'float');
    Module.setValue(w, WebVR.frame.pose.orientation[3], 'float');
  },

  emscripten_vr_get_velocity: function(x, y, z) {
    if (!WebVR.display || !WebVR.frame || !WebVR.frame.pose.linearVelocity) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    Module.setValue(x, WebVR.frame.pose.linearVelocity[0], 'float');
    Module.setValue(y, WebVR.frame.pose.linearVelocity[1], 'float');
    Module.setValue(z, WebVR.frame.pose.linearVelocity[2], 'float');
  },

  emscripten_vr_get_angular_velocity: function(x, y, z) {
    if (!WebVR.display || !WebVR.frame || !WebVR.frame.pose.angularVelocity) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    Module.setValue(x, WebVR.frame.pose.angularVelocity[0], 'float');
    Module.setValue(y, WebVR.frame.pose.angularVelocity[1], 'float');
    Module.setValue(z, WebVR.frame.pose.angularVelocity[2], 'float');
  },

  emscripten_vr_get_controller_count: function() {
    return WebVR.controllers.length;
  },

  emscripten_vr_controller_is_present: function(index) {
    var controller = WebVR.controllers[index];

    if (!controller || !controller.connected) {
      return 0;
    }

    return 1;
  },

  emscripten_vr_get_controller_position: function(index, x, y, z) {
    var controller = WebVR.controllers[index];

    if (!controller || !controller.pose || !controller.pose.position) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      return;
    }

    Module.setValue(x, controller.pose.position[0], 'float');
    Module.setValue(y, controller.pose.position[1], 'float');
    Module.setValue(z, controller.pose.position[2], 'float');
  },

  emscripten_vr_get_controller_orientation: function(index, x, y, z, w) {
    var controller = WebVR.controllers[index];

    if (!controller || !controller.pose || !controller.pose.orientation) {
      Module.setValue(x, 0, 'float');
      Module.setValue(y, 0, 'float');
      Module.setValue(z, 0, 'float');
      Module.setValue(w, 0, 'float');
      return;
    }

    Module.setValue(x, controller.pose.orientation[0], 'float');
    Module.setValue(y, controller.pose.orientation[1], 'float');
    Module.setValue(z, controller.pose.orientation[2], 'float');
    Module.setValue(w, controller.pose.orientation[3], 'float');
  },

  emscripten_vr_controller_get_axis: function(index, axis) {
    var controller = WebVR.controllers[index];

    if (!controller) {
      return 0;
    }

    // Triggered.
    if (axis === -1) {
      return controller.buttons[1].value;
    }

    return controller.axes[axis];
  },

  emscripten_vr_controller_is_down: function(index, button) {
    var controller = WebVR.controllers[index];

    if (!controller) {
      return 0;
    }

    return controller.buttons[button] && controller.buttons[button].pressed;
  },

  emscripten_vr_controller_vibrate: function(index, duration, power) {
    var controller = WebVR.controllers[index];

    if (!controller || !controller.hapticActuators || !controller.hapticActuators[0]) {
      return;
    }

    controller.hapticActuators[0].pulse(power, duration);
  },

  emscripten_vr_set_render_callback: function(callback, data) {
    WebVR.render = callback;
    WebVR.renderData = data;
  },

  emscripten_vr_get_view_matrix: function(eye) {
    if (!WebVR.frame) {
      return 0;
    }

    HEAPF32.set(eye === 0 ? WebVR.frame.leftViewMatrix : WebVR.frame.rightViewMatrix, WebVR.viewMatrix / 4);

    return WebVR.viewMatrix;
  },

  emscripten_vr_get_projection_matrix: function(eye) {
    if (!WebVR.frame) {
      return 0;
    }

    HEAPF32.set(eye === 0 ? WebVR.frame.leftProjectionMatrix : WebVR.frame.rightProjectionMatrix, WebVR.projectionMatrix / 4);

    return WebVR.projectionMatrix;
  },

  emscripten_vr_get_sitting_to_standing_matrix: function() {
    var stage = WebVR.display && WebVR.display.stageParameters;

    if (!stage || !stage.sittingToStandingTransform) {
      return 0;
    }

    HEAPF32.set(stage.sittingToStandingTransform, WebVR.sittingToStandingMatrix / 4);

    return WebVR.sittingToStandingMatrix;
  }
};

autoAddDeps(LibraryWebVR, '$WebVR');
mergeInto(LibraryManager.library, LibraryWebVR);
